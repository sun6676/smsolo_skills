import process from "node:process";
import { loadEnv } from "./load-env.mjs";

const OAPI_BASE = "https://oapi.dingtalk.com";

loadEnv();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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
    throw new Error(`DingTalk API ${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
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

async function getUserIdByMobile(accessToken, mobile) {
  const url = new URL(`${OAPI_BASE}/topapi/v2/user/getbymobile`);
  url.searchParams.set("access_token", accessToken);

  const body = await requestJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mobile,
      support_exclusive_account_search: true,
    }),
  });

  if (body.errcode !== 0) {
    throw new Error(`Failed to get userId by mobile: ${JSON.stringify(body)}`);
  }

  return body.result;
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

function pickUserId(result) {
  return result?.userid
    ?? result?.user_id
    ?? result?.open_userid
    ?? result?.exclusive_account_userid_list?.[0]
    ?? result?.exclusiveAccountUseridList?.[0];
}

async function main() {
  const appKey = requiredEnv("DINGTALK_APP_KEY");
  const appSecret = requiredEnv("DINGTALK_APP_SECRET");
  const mobile = process.argv[2] ?? process.env.DINGTALK_MOBILE;
  const deptId = process.env.DINGTALK_DEPT_ID ?? "1";
  const userName = process.env.DINGTALK_USER_NAME;
  const token = await getOldAccessToken(appKey, appSecret);

  if (mobile) {
    const result = await getUserIdByMobile(token, mobile);
    const userId = pickUserId(result);
    if (!userId) {
      throw new Error(`Mobile lookup response did not include a userId: ${JSON.stringify(result)}`);
    }

    console.log(JSON.stringify({
      ok: true,
      source: "mobile",
      mobile,
      userId,
      setUserIdCommand: `$env:DINGTALK_USER_ID="${userId}"`,
    }, null, 2));
    return;
  }

  const users = await listDepartmentUsers(token, deptId);
  const filtered = userName ? users.filter((user) => user.name?.includes(userName)) : users;
  console.log(JSON.stringify({
    ok: true,
    source: "department",
    deptId,
    count: filtered.length,
    users: filtered.map((user) => ({ name: user.name, userId: user.userid })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
