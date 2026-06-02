import process from "node:process";
import {
  attendeesPath,
  calendarId,
  clientToken,
  operatorUnionId,
  parseArgs,
  printJson,
  requestJson,
  resolveAttendees,
} from "./calendar-common.mjs";

async function main() {
  const args = parseArgs();
  const eventId = args["event-id"] ?? args.event ?? args._?.[0];
  if (!eventId) {
    throw new Error("Missing event id. Use --event-id EVENT_ID.");
  }

  const attendeesToAdd = resolveAttendees(args);
  if (attendeesToAdd.length === 0) {
    throw new Error("Missing attendees. Use --attendee NAME_OR_UNION_ID.");
  }

  const userId = operatorUnionId(args);
  const calId = calendarId(args);
  const result = await requestJson(attendeesPath(userId, calId, eventId), {
    method: "POST",
    headers: { "x-client-token": String(args["client-token"] ?? clientToken()) },
    body: {
      attendeesToAdd,
      pushNotification: args["push-notification"] !== "false",
      chatNotification: args["chat-notification"] === true || args["chat-notification"] === "true",
    },
  });

  printJson({
    ok: true,
    userId,
    calendarId: calId,
    eventId,
    added: attendeesToAdd,
    result,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
