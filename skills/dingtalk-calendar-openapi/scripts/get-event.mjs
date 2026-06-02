import process from "node:process";
import {
  calendarId,
  eventPath,
  operatorUnionId,
  parseArgs,
  printJson,
  requestJson,
} from "./calendar-common.mjs";

async function main() {
  const args = parseArgs();
  const eventId = args["event-id"] ?? args.event ?? args._?.[0];
  if (!eventId) {
    throw new Error("Missing event id. Use get-event.mjs EVENT_ID or --event-id EVENT_ID.");
  }

  const userId = operatorUnionId(args);
  const calId = calendarId(args);
  const event = await requestJson(eventPath(userId, calId, eventId), {
    query: {
      maxAttendees: args["max-attendees"] ?? 100,
    },
  });

  printJson({
    ok: true,
    userId,
    calendarId: calId,
    eventId,
    event,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
