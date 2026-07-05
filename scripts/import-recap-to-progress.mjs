#!/usr/bin/env node
/**
 * Nightly import: Daily Recap -> Homeschool Progress activities
 *
 * Usage:
 *   NEXT_PUBLIC_CONVEX_URL=... MISSION_CONTROL_USER_ID=... node scripts/import-recap-to-progress.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const userId = process.env.MISSION_CONTROL_USER_ID;

if (!convexUrl) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL");
  process.exit(2);
}
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

const client = new ConvexHttpClient(convexUrl);

const res = await client.mutation(api.recapImport.importRecapToProgress, {
  userId,
  date: dateKey,
});

console.log(JSON.stringify({ date: dateKey, ...res }, null, 2));
