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

async function main() {
  const appKey = requiredEnv("DINGTALK_APP_KEY");
  const appSecret = requiredEnv("DINGTALK_APP_SECRET");
  const userId = process.argv[2] ?? requiredEnv("DINGTALK_USER_ID");
  const token = await getOldAccessToken(appKey, appSecret);
  const user = await getUserDetail(token, userId);
  const unionId = user?.unionid;

  if (!unionId) {
    throw new Error(`User detail response did not include result.unionid: ${JSON.stringify(user)}`);
  }

  console.log(JSON.stringify({
    ok: true,
    userId: user.userid,
    name: user.name,
    unionId,
    setOperatorIdCommand: `$env:DINGTALK_OPERATOR_ID="${unionId}"`,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
