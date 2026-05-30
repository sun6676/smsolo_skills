import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { loadEnv } from "./load-env.mjs";

const API_BASE = "https://api.dingtalk.com";
const OAPI_BASE = "https://oapi.dingtalk.com";

loadEnv();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function isPlaceholder(value) {
  return !value || value === "your_union_id" || value === "your_dingtalk_user_id";
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = {};

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    throw new Error(`DingTalk API ${response.status} ${response.statusText}: ${JSON.stringify(body, null, 2)}`);
  }

  return body;
}

async function getOldAccessToken(appKey, appSecret) {
  const url = new URL(`${OAPI_BASE}/gettoken`);
  url.searchParams.set("appkey", appKey);
  url.searchParams.set("appsecret", appSecret);

  const body = await requestJson(url);
  if (body.errcode !== 0 || !body.access_token) {
    throw new Error(`Failed to get DingTalk oapi token: ${JSON.stringify(body)}`);
  }

  return body.access_token;
}

async function listDepartmentUsers(accessToken, deptId) {
  const users = [];
  let cursor = 0;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${OAPI_BASE}/topapi/user/listsimple`);
    url.searchParams.set("access_token", accessToken);

    const body = await requestJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dept_id: deptId,
        cursor,
        size: 100,
        order_field: "modify_desc",
        contain_access_limit: false,
        language: "zh_CN",
      }),
    });

    if (body.errcode !== 0) {
      throw new Error(`Failed to list DingTalk department users: ${JSON.stringify(body)}`);
    }

    const result = body.result ?? {};
    users.push(...(result.list ?? []));
    hasMore = Boolean(result.has_more);
    cursor = Number(result.next_cursor ?? 0);
  }

  return users;
}

async function getUserDetail(accessToken, userId) {
  const url = new URL(`${OAPI_BASE}/topapi/v2/user/get`);
  url.searchParams.set("access_token", accessToken);

  const body = await requestJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userid: userId,
      language: "zh_CN",
    }),
  });

  if (body.errcode !== 0) {
    throw new Error(`Failed to get DingTalk user detail: ${JSON.stringify(body)}`);
  }

  return body.result;
}

async function resolveOperatorId(appKey, appSecret) {
  const configured = optionalEnv("DINGTALK_OPERATOR_ID");
  if (!isPlaceholder(configured)) {
    return configured;
  }

  const oldToken = await getOldAccessToken(appKey, appSecret);
  let userId = optionalEnv("DINGTALK_USER_ID");

  if (isPlaceholder(userId)) {
    const deptId = optionalEnv("DINGTALK_DEPT_ID") ?? "1";
    const userName = optionalEnv("DINGTALK_USER_NAME");
    const users = await listDepartmentUsers(oldToken, deptId);
    const filtered = userName ? users.filter((user) => user.name?.includes(userName)) : users;

    if (filtered.length !== 1 || !filtered[0]?.userid) {
      throw new Error(
        `Cannot auto-resolve operatorId. Found ${filtered.length} candidate users in dept ${deptId}; set DINGTALK_USER_ID or DINGTALK_OPERATOR_ID.`
      );
    }

    userId = filtered[0].userid;
  }

  const user = await getUserDetail(oldToken, userId);
  if (!user?.unionid) {
    throw new Error(`User detail response did not include result.unionid: ${JSON.stringify(user)}`);
  }

  return user.unionid;
}

async function getAccessToken(appKey, appSecret) {
  const body = await requestJson(`${API_BASE}/v1.0/oauth2/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appKey, appSecret }),
  });

  if (!body.accessToken) {
    throw new Error(`DingTalk token response did not include accessToken: ${JSON.stringify(body)}`);
  }

  return body.accessToken;
}

async function getMyWorkspace(accessToken, operatorId) {
  const url = new URL(`${API_BASE}/v2.0/wiki/mineWorkspaces`);
  url.searchParams.set("operatorId", operatorId);

  const body = await requestJson(url, {
    headers: { "x-acs-dingtalk-access-token": accessToken },
  });

  const workspace = body.workspace ?? body.result?.workspace;
  if (!workspace?.workspaceId) {
    throw new Error(`Could not find "我的文档" workspace in response: ${JSON.stringify(body)}`);
  }

  return workspace;
}

async function createDoc(accessToken, workspaceId, operatorId, title) {
  return requestJson(`${API_BASE}/v1.0/doc/workspaces/${encodeURIComponent(workspaceId)}/docs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-acs-dingtalk-access-token": accessToken,
    },
    body: JSON.stringify({
      name: title,
      docType: "DOC",
      operatorId,
    }),
  });
}

async function overwriteDoc(accessToken, docKey, operatorId, markdown) {
  const url = new URL(
    `${API_BASE}/v1.0/doc/suites/documents/${encodeURIComponent(docKey)}/overwriteContent`
  );
  url.searchParams.set("operatorId", operatorId);

  return requestJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-acs-dingtalk-access-token": accessToken,
    },
    body: JSON.stringify({
      operatorId,
      content: markdown,
      contentType: "markdown",
    }),
  });
}

async function readState(stateFile) {
  try {
    return JSON.parse(await readFile(stateFile, "utf8"));
  } catch {
    return {};
  }
}

async function writeState(stateFile, state) {
  await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function usage() {
  console.error("Usage: node sync-dingtalk-doc.mjs <path/to/file.md>");
}

async function main() {
  const docPathArg = process.argv[2];
  if (!docPathArg) {
    usage();
    process.exit(2);
  }

  const docPath = path.resolve(process.cwd(), docPathArg);
  const markdown = await readFile(docPath, "utf8");
  const appKey = requiredEnv("DINGTALK_APP_KEY");
  const appSecret = requiredEnv("DINGTALK_APP_SECRET");
  const operatorId = await resolveOperatorId(appKey, appSecret);
  const accessToken = await getAccessToken(appKey, appSecret);
  const workspaceId = optionalEnv("DINGTALK_WORKSPACE_ID")
    ?? (await getMyWorkspace(accessToken, operatorId)).workspaceId;
  const title = optionalEnv("DINGTALK_DOC_TITLE") ?? path.basename(docPath, path.extname(docPath));
  const stateFile = path.resolve(process.cwd(), optionalEnv("DINGTALK_STATE_FILE") ?? ".dingdingdocx-state.json");
  const state = await readState(stateFile);
  const stateKey = path.normalize(docPath);
  const existing = optionalEnv("DINGTALK_DOC_KEY") ?? state[stateKey]?.docKey;
  let created;
  let docKey = existing;

  if (!docKey) {
    created = await createDoc(accessToken, workspaceId, operatorId, title);
    docKey = created.docKey ?? created.result?.docKey;
    if (!docKey) {
      throw new Error(`Create document response did not include docKey: ${JSON.stringify(created)}`);
    }
  }

  await overwriteDoc(accessToken, docKey, operatorId, markdown);

  state[stateKey] = {
    title,
    workspaceId: created?.workspaceId ?? state[stateKey]?.workspaceId ?? workspaceId,
    nodeId: created?.nodeId ?? state[stateKey]?.nodeId,
    docKey,
    url: created?.url ?? state[stateKey]?.url,
    localPath: docPath,
    updatedAt: new Date().toISOString(),
  };
  await writeState(stateFile, state);

  console.log(JSON.stringify({
    ok: true,
    mode: existing ? "updated" : "created",
    title,
    localPath: docPath,
    workspaceId: state[stateKey].workspaceId,
    nodeId: state[stateKey].nodeId,
    docKey,
    url: state[stateKey].url,
    stateFile,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
