import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync World Cup match results",
  { minutes: 10 },
  internal.worldCup.syncWorldCupResultsInternal,
  {}
);

export default crons;
