import process from "node:process";
import {
  buildEventBody,
  calendarId,
  clientToken,
  eventPath,
  operatorUnionId,
  parseArgs,
  printJson,
  requestJson,
  resolveAttendees,
} from "./calendar-common.mjs";

async function main() {
  const args = parseArgs();
  const userId = operatorUnionId(args);
  const calId = calendarId(args);
  const body = buildEventBody(args);
  const attendees = resolveAttendees(args);
  if (attendees.length > 0) {
    body.attendees = attendees;
  }

  const event = await requestJson(eventPath(userId, calId), {
    method: "POST",
    headers: { "x-client-token": String(args["client-token"] ?? clientToken()) },
    body,
  });

  printJson({
    ok: true,
    userId,
    calendarId: calId,
    eventId: event.id,
    event,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
