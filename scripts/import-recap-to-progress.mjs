#!/usr/bin/env node
/**
 * Nightly import: Daily Recap -> Homeschool Progress activities
 *
 * Usage:
 *   MISSION_CONTROL_CONVEX_TARGET=prod MISSION_CONTROL_USER_ID=... node scripts/import-recap-to-progress.mjs
 */

import { api } from "../convex/_generated/api.js";
import { createConvexHttpClient } from "./convex-target.mjs";

const userId = process.env.MISSION_CONTROL_USER_ID;

if (!userId) {
  console.error("Missing MISSION_CONTROL_USER_ID");
  process.exit(2);
}

const tz = "America/Los_Angeles";
const dateKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: tz,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const client = createConvexHttpClient();

const res = await client.mutation(api.recapImport.importRecapToProgress, {
  userId,
  date: dateKey,
});

console.log(JSON.stringify({ date: dateKey, ...res }, null, 2));
