import process from "node:process";
import {
  calendarId,
  dayRange,
  eventPath,
  operatorUnionId,
  parseArgs,
  printJson,
  requestJson,
} from "./calendar-common.mjs";

async function main() {
  const args = parseArgs();
  const userId = operatorUnionId(args);
  const calId = calendarId(args);
  const { timeMin, timeMax } = dayRange(args);
  const path = args.view === false ? eventPath(userId, calId) : `${eventPath(userId, calId)}view`;
  const body = await requestJson(path, {
    query: {
      timeMin,
      timeMax,
      maxResults: args["max-results"] ?? args.max ?? 100,
      nextToken: args["next-token"],
      showDeleted: args["show-deleted"],
    },
  });

  printJson({
    ok: true,
    userId,
    calendarId: calId,
    timeMin,
    timeMax,
    count: body.events?.length ?? 0,
    nextToken: body.nextToken,
    syncToken: body.syncToken,
    events: body.events ?? [],
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
