#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api as missionControlApi } from "../convex/_generated/api.js";
import { api as coachHubApi } from "../../projects/coach-hub/convex/_generated/api.js";

const DEFAULT_MC_URL = "https://harmless-salamander-44.convex.cloud";
const DEFAULT_COACH_HUB_URL = "https://ideal-hummingbird-117.convex.cloud";

function parseArgs(argv) {
  const args = {
    dryRun: true,
    program: undefined,
    region: undefined,
    season: undefined,
    status: "assigned",
    mcUrl: process.env.MISSION_CONTROL_CONVEX_URL || process.env.CONVEX_URL || DEFAULT_MC_URL,
    coachHubUrl: process.env.COACH_HUB_CONVEX_URL || DEFAULT_COACH_HUB_URL,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--apply") args.dryRun = false;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--program") args.program = next, i++;
    else if (arg === "--region") args.region = next, i++;
    else if (arg === "--season") args.season = next, i++;
    else if (arg === "--status") args.status = next, i++;
    else if (arg === "--mc-url") args.mcUrl = next, i++;
    else if (arg === "--coach-hub-url") args.coachHubUrl = next, i++;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Sync assigned Mission Control Spring/PDP enrollments into Coach Hub attendance groups.

Default is DRY RUN. Use --apply to write to Coach Hub.

Usage:
  node scripts/sync-assigned-enrollments-to-coach-hub.mjs [options]

Options:
  --dry-run             Preview only (default)
  --apply               Write players/groups/enrollments into Coach Hub
  --program <value>     spring_league | pdp (default: both)
  --region <value>      agoura | pali
  --season <slug>       Program slug, e.g. spring-agoura-2027
  --status <value>      Default: assigned
  --mc-url <url>        Mission Control Convex URL
  --coach-hub-url <url> Coach Hub Convex URL
`);
}

function titleCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeLocation(region) {
  const normalized = (region || "").toLowerCase();
  if (normalized === "pali") return "Pali";
  return "Agoura";
}

function normalizeDay(practiceDay, assignedGroup = "") {
  const source = `${practiceDay || ""} ${assignedGroup || ""}`.toLowerCase();
  for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday"]) {
    if (source.includes(day) || source.includes(day.slice(0, 3))) return titleCase(day);
  }
  return "Monday";
}

function normalizeDivision(division) {
  if (!division) return "Division TBD";
  const d = String(division).trim().toUpperCase().replace(/^U(\d+)$/, "U$1").replace(/^(\d+)U$/, "U$1");
  return d;
}

function normalizeGender(gender) {
  const g = (gender || "").trim().toLowerCase();
  if (["boy", "boys", "male", "m"].includes(g)) return "Boys";
  if (["girl", "girls", "female", "f"].includes(g)) return "Girls";
  if (["combined", "coed", "co-ed"].includes(g)) return "Combined";
  return undefined;
}

function birthYearFromDob(dob) {
  if (!dob) return undefined;
  const year = Number(String(dob).slice(0, 4));
  return Number.isFinite(year) ? year : undefined;
}

function timeSlotFromAssignment(enrollment) {
  const raw = (enrollment.assignedGroup || "").trim();
  if (!raw) return "Time TBD";

  const timeMatch = raw.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i);
  if (timeMatch) return timeMatch[0].replace(/\s+/g, " ");

  const singleTimeMatch = raw.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i);
  if (singleTimeMatch) return singleTimeMatch[0].replace(/\s+/g, " ");

  // Keep Corinne's assignment label visible in Coach Hub when no formal time exists yet.
  return raw;
}

function toCoachHubImport(enrollment) {
  const childName = `${enrollment.child?.firstName || ""} ${enrollment.child?.lastName || ""}`.trim();
  const parentName = `${enrollment.parent?.firstName || ""} ${enrollment.parent?.lastName || ""}`.trim();
  const birthYear = enrollment.child?.birthYear || birthYearFromDob(enrollment.child?.dob);

  if (!childName) throw new Error(`Enrollment ${enrollment._id} missing child name`);
  if (!parentName) throw new Error(`Enrollment ${enrollment._id} missing parent name`);
  if (!enrollment.parent?.email) throw new Error(`Enrollment ${enrollment._id} missing parent email`);
  if (!birthYear) throw new Error(`Enrollment ${enrollment._id} missing birth year/DOB`);

  return {
    childName,
    birthYear,
    gender: normalizeGender(enrollment.child?.gender),
    parentName,
    parentEmail: enrollment.parent.email.trim().toLowerCase(),
    parentPhone: enrollment.parent.phone,
    location: normalizeLocation(enrollment.region),
    dayOfWeek: normalizeDay(enrollment.practiceDay, enrollment.assignedGroup),
    timeSlot: timeSlotFromAssignment(enrollment),
    divisionBand: normalizeDivision(enrollment.division),
    enrollmentSource: "primary",
  };
}

async function fetchQueue(client, args) {
  const programs = args.program ? [args.program] : ["spring_league", "pdp"];
  const rows = [];
  for (const program of programs) {
    const result = await client.query(missionControlApi.camp.getEnrollmentReviewQueue, {
      program,
      region: args.region,
      season: args.season,
      status: args.status,
    });
    rows.push(...result);
  }
  return rows;
}

async function main() {
  const args = parseArgs(process.argv);
  const mc = new ConvexHttpClient(args.mcUrl);
  const coachHub = new ConvexHttpClient(args.coachHubUrl);

  const queue = await fetchQueue(mc, args);
  const imports = [];
  const skipped = [];

  for (const enrollment of queue) {
    try {
      imports.push({ enrollment, payload: toCoachHubImport(enrollment) });
    } catch (error) {
      skipped.push({ id: enrollment._id, error: error.message });
    }
  }

  console.log(JSON.stringify({
    mode: args.dryRun ? "dry-run" : "apply",
    missionControlUrl: args.mcUrl,
    coachHubUrl: args.coachHubUrl,
    filters: { program: args.program, region: args.region, season: args.season, status: args.status },
    found: queue.length,
    ready: imports.length,
    skipped,
    preview: imports.slice(0, 20).map(({ enrollment, payload }) => ({
      enrollmentId: enrollment._id,
      assignedGroup: enrollment.assignedGroup,
      payload,
    })),
  }, null, 2));

  if (args.dryRun) return;

  let synced = 0;
  const errors = [];
  for (const { enrollment, payload } of imports) {
    try {
      const result = await coachHub.mutation(coachHubApi.players.importPlayerWithEnrollment, payload);
      synced++;
      console.log(`[synced] ${payload.childName} -> ${payload.location} ${payload.dayOfWeek} ${payload.timeSlot} ${payload.divisionBand}`, result);
    } catch (error) {
      errors.push({ enrollmentId: enrollment._id, childName: payload.childName, error: error.message });
      console.error(`[error] ${payload.childName}:`, error.message);
    }
  }

  console.log(JSON.stringify({ synced, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
