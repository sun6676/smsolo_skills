import { existsSync, readFileSync } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./load-env.mjs";

const API_BASE = "https://api.dingtalk.com";
const DEFAULT_TIMEZONE = "Asia/Shanghai";
const DEFAULT_UTC_OFFSET = "+08:00";

loadEnv();

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const withoutPrefix = token.slice(2);
    const equalIndex = withoutPrefix.indexOf("=");
    const key = equalIndex === -1 ? withoutPrefix : withoutPrefix.slice(0, equalIndex);
    let value = equalIndex === -1 ? undefined : withoutPrefix.slice(equalIndex + 1);

    if (value === undefined) {
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        value = next;
        index += 1;
      } else {
        value = true;
      }
    }

    if (args[key] === undefined) {
      args[key] = value;
    } else if (Array.isArray(args[key])) {
      args[key].push(value);
    } else {
      args[key] = [args[key], value];
    }
  }

  return args;
}

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function calendarId(args = {}) {
  return String(args.calendar ?? args["calendar-id"] ?? process.env.DINGTALK_CALENDAR_ID ?? "primary");
}

export function operatorUnionId(args = {}) {
  return String(args.user ?? args["user-id"] ?? args["operator-union-id"] ?? process.env.DINGTALK_OPERATOR_UNION_ID ?? requiredEnv("DINGTALK_OPERATOR_UNION_ID"));
}

export function timeZone(args = {}) {
  return String(args.timezone ?? args["time-zone"] ?? process.env.DINGTALK_DEFAULT_TIMEZONE ?? DEFAULT_TIMEZONE);
}

export async function getAccessToken() {
  const appKey = requiredEnv("DINGTALK_APP_KEY");
  const appSecret = requiredEnv("DINGTALK_APP_SECRET");
  const body = await requestJson("/v1.0/oauth2/accessToken", {
    method: "POST",
    body: { appKey, appSecret },
    auth: false,
  });

  if (!body.accessToken) {
    throw new Error(`DingTalk accessToken response did not include accessToken: ${JSON.stringify(body)}`);
  }

  return body.accessToken;
}

export async function requestJson(apiPath, options = {}) {
  const url = new URL(apiPath, API_BASE);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };
  if (options.auth !== false) {
    headers["x-acs-dingtalk-access-token"] = options.accessToken ?? await getAccessToken();
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
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

export function eventPath(userId, calId, eventId) {
  const base = `/v1.0/calendar/users/${encodeURIComponent(userId)}/calendars/${encodeURIComponent(calId)}/events`;
  return eventId ? `${base}/${encodeURIComponent(eventId)}` : base;
}

export function attendeesPath(userId, calId, eventId) {
  return `${eventPath(userId, calId, eventId)}/attendees`;
}

export function normalizeDateTime(value) {
  if (!value) {
    return value;
  }

  let normalized = String(value).trim().replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    normalized = `${normalized}:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    normalized = `${normalized}${DEFAULT_UTC_OFFSET}`;
  }
  return normalized;
}

export function addMinutes(dateTime, minutes) {
  const start = new Date(normalizeDateTime(dateTime));
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid dateTime: ${dateTime}`);
  }

  return formatDateWithOffset(new Date(start.getTime() + Number(minutes) * 60_000));
}

export function dayRange(args = {}) {
  const start = args.start ?? args["time-min"];
  const end = args.end ?? args["time-max"];
  if (start && end) {
    return { timeMin: normalizeDateTime(start), timeMax: normalizeDateTime(end) };
  }

  const offsetDays = args.tomorrow ? 1 : 0;
  const date = args.date ? String(args.date) : shanghaiDate(offsetDays);
  return {
    timeMin: `${date}T00:00:00${DEFAULT_UTC_OFFSET}`,
    timeMax: `${date}T23:59:59${DEFAULT_UTC_OFFSET}`,
  };
}

export function buildEventBody(args = {}) {
  const summary = args.summary ?? args.title ?? args._?.[0];
  const startValue = args.start ?? args.begin;
  if (!summary) {
    throw new Error("Missing event summary. Use --summary \"会议标题\".");
  }
  if (!startValue) {
    throw new Error("Missing event start time. Use --start 2026-06-02T10:30:00+08:00.");
  }

  const start = normalizeDateTime(startValue);
  const end = normalizeDateTime(args.end ?? args.finish ?? addMinutes(start, args["duration-minutes"] ?? args.duration ?? 60));
  const tz = timeZone(args);
  const body = {
    summary: String(summary),
    start: { dateTime: start, timeZone: tz },
    end: { dateTime: end, timeZone: tz },
    isAllDay: args["all-day"] === true || args.allDay === true,
  };

  if (args.description) {
    body.description = String(args.description);
  }
  if (args.location) {
    body.location = { displayName: String(args.location) };
  }
  if (args["online-meeting"] === true || args.online === true) {
    body.onlineMeetingInfo = { type: "dingtalk" };
  }

  const reminder = args["reminder-minutes"] ?? process.env.DINGTALK_DEFAULT_REMINDER_MINUTES;
  if (reminder !== undefined && reminder !== "") {
    body.reminders = [{ method: "dingtalk", minutes: Number(reminder) }];
  }

  return body;
}

export function loadContacts(args = {}) {
  const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const defaultPath = path.join(skillDir, "contacts.json");
  const contactsPath = args.contacts ?? args["contacts-file"] ?? process.env.DINGTALK_CONTACTS_FILE ?? defaultPath;
  const resolved = path.resolve(String(contactsPath));
  if (!existsSync(resolved)) {
    return { contacts: {}, contactsPath: resolved };
  }

  const contacts = JSON.parse(readFileSync(resolved, "utf8"));
  return { contacts, contactsPath: resolved };
}

export function collectAttendeeValues(args = {}) {
  const values = [];
  for (const key of ["attendee", "attendees", "attendee-id", "attendee-ids"]) {
    const raw = args[key];
    if (raw === undefined || raw === true) {
      continue;
    }
    const list = Array.isArray(raw) ? raw : [raw];
    for (const item of list) {
      values.push(...String(item).split(",").map((value) => value.trim()).filter(Boolean));
    }
  }
  return values;
}

export function resolveAttendees(args = {}) {
  const { contacts, contactsPath } = loadContacts(args);
  const values = collectAttendeeValues(args);
  const unresolvedNames = [];
  const attendees = values.map((value) => {
    const id = contacts[value] ?? value;
    if (!contacts[value] && /[\u3400-\u9fff]/.test(value)) {
      unresolvedNames.push(value);
    }
    return { id: String(id), isOptional: false };
  });

  if (unresolvedNames.length > 0) {
    throw new Error(`联系人未配置 unionId: ${unresolvedNames.join(", ")}. 请在 ${contactsPath} 或 DINGTALK_CONTACTS_FILE 中补充映射。`);
  }

  return attendees;
}

export function clientToken() {
  return crypto.randomUUID();
}

export function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function shanghaiDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const utc = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return utc.toISOString().slice(0, 10);
}

function formatDateWithOffset(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}${DEFAULT_UTC_OFFSET}`;
}
