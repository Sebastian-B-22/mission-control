import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// API key for Health Auto Export app
const HEALTH_EXPORT_API_KEY = process.env.HEALTH_EXPORT_API_KEY || "hae-corinne-2026";

interface HealthMetricEntry {
  qty?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  totalSleep?: number;
  asleep?: number;
  inBed?: number;
  sleepStart?: string;
  sleepEnd?: string;
}

interface HealthMetric {
  name: string;
  units: string;
  data: HealthMetricEntry[];
}

interface HealthAutoExportPayload {
  data: {
    metrics?: HealthMetric[];
    workouts?: Array<{
      name: string;
      start: string;
      end: string;
      activeEnergyBurned?: { qty: number; units: string };
    }>;
  };
}

type DailyHealthImport = {
  steps?: number;
  sleepHours?: number;
  activeCalories?: number;
  weight?: number;
};

function normalizeMetricName(name: string | undefined): string {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractDateKey(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (!value) continue;
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  return undefined;
}

function metricKind(metricName: string): "steps" | "sleep" | "calories" | "weight" | null {
  const normalized = normalizeMetricName(metricName);

  if (["stepcount", "steps", "hkquantitytypeidentifierstepcount"].includes(normalized)) {
    return "steps";
  }

  if (["sleepanalysis", "sleep", "hkcategorytypeidentifiersleepanalysis"].includes(normalized)) {
    return "sleep";
  }

  if (["activeenergy", "activeenergyburned", "hkquantitytypeidentifieractiveenergyburned"].includes(normalized)) {
    return "calories";
  }

  if (["weight", "bodymass", "hkquantitytypeidentifierbodymass"].includes(normalized)) {
    return "weight";
  }

  return null;
}

function toSleepHours(entry: HealthMetricEntry, units: string | undefined): number | undefined {
  const normalizedUnits = (units || "").toLowerCase();
  let value = entry.totalSleep ?? entry.asleep;

  if (typeof value !== "number" && entry.sleepStart && entry.sleepEnd) {
    const start = new Date(entry.sleepStart).getTime();
    const end = new Date(entry.sleepEnd).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return Math.round((((end - start) / 3600000) * 10)) / 10;
    }
  }

  if (typeof value !== "number") {
    return undefined;
  }

  if (normalizedUnits.includes("hr") || normalizedUnits.includes("hour")) {
    return Math.round(value * 10) / 10;
  }

  if (normalizedUnits.includes("sec")) {
    return Math.round((value / 3600) * 10) / 10;
  }

  if (normalizedUnits.includes("min")) {
    return Math.round((value / 60) * 10) / 10;
  }

  // Health export payloads are usually minutes when not explicit.
  if (value > 24) {
    return Math.round((value / 60) * 10) / 10;
  }

  return Math.round(value * 10) / 10;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const apiKey = authHeader?.replace("Bearer ", "") ||
      request.headers.get("X-API-Key") ||
      new URL(request.url).searchParams.get("key");

    if (apiKey !== HEALTH_EXPORT_API_KEY) {
      console.error("Invalid API key for Health Auto Export");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: HealthAutoExportPayload = await request.json();
    console.log("Health Auto Export payload received:", JSON.stringify(payload, null, 2).slice(0, 500));

    if (!payload.data?.metrics) {
      return NextResponse.json({ error: "No metrics data" }, { status: 400 });
    }

    const dataByDate: Record<string, DailyHealthImport> = {};

    for (const metric of payload.data.metrics) {
      const kind = metricKind(metric.name);
      if (!kind) continue;

      for (const entry of metric.data) {
        const dateStr = extractDateKey(entry.date, entry.endDate, entry.startDate, entry.sleepEnd, entry.sleepStart);
        if (!dateStr) continue;

        if (!dataByDate[dateStr]) {
          dataByDate[dateStr] = {};
        }

        if (kind === "steps") {
          const currentSteps = dataByDate[dateStr].steps || 0;
          dataByDate[dateStr].steps = currentSteps + (entry.qty || 0);
          continue;
        }

        if (kind === "sleep") {
          const sleepHours = toSleepHours(entry, metric.units);
          if (typeof sleepHours === "number") {
            dataByDate[dateStr].sleepHours = Math.max(dataByDate[dateStr].sleepHours || 0, sleepHours);
          }
          continue;
        }

        if (kind === "calories") {
          const currentCals = dataByDate[dateStr].activeCalories || 0;
          let calories = entry.qty || 0;
          if ((metric.units || "").toLowerCase().includes("kj")) {
            calories = calories / 4.184;
          }
          dataByDate[dateStr].activeCalories = Math.round(currentCals + calories);
          continue;
        }

        if (kind === "weight") {
          let weight = entry.qty || 0;
          if ((metric.units || "").toLowerCase() === "kg") {
            weight = weight * 2.20462;
          }
          dataByDate[dateStr].weight = Math.round(weight * 10) / 10;
        }
      }
    }

    if (payload.data.workouts) {
      for (const workout of payload.data.workouts) {
        if (!workout.activeEnergyBurned) continue;

        const dateStr = extractDateKey(workout.start, workout.end);
        if (!dateStr) continue;

        if (!dataByDate[dateStr]) {
          dataByDate[dateStr] = {};
        }

        let calories = workout.activeEnergyBurned.qty;
        if (workout.activeEnergyBurned.units.toLowerCase().includes("kj")) {
          calories = calories / 4.184;
        }

        dataByDate[dateStr].activeCalories = (dataByDate[dateStr].activeCalories || 0) + Math.round(calories);
      }
    }

    const CORINNE_CLERK_ID = process.env.CORINNE_CLERK_ID;
    if (!CORINNE_CLERK_ID) {
      console.error("CORINNE_CLERK_ID not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const user = await convex.query(api.users.getUserByClerkId, { clerkId: CORINNE_CLERK_ID });
    if (!user) {
      console.error("User not found for Clerk ID:", CORINNE_CLERK_ID);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const results = [];
    for (const [date, data] of Object.entries(dataByDate)) {
      try {
        const existingHealth = await convex.query(api.health.getHealthByDate, {
          userId: user._id,
          date,
        });

        const finalSteps = Math.max(data.steps ?? 0, existingHealth?.steps ?? 0);
        const finalCalories = Math.max(data.activeCalories ?? 0, existingHealth?.activeCalories ?? 0);

        await convex.mutation(api.health.recordDailyHealth, {
          userId: user._id,
          date,
          sleepHours: data.sleepHours ?? existingHealth?.sleepHours,
          steps: finalSteps || undefined,
          activeCalories: finalCalories || undefined,
          weight: data.weight ?? existingHealth?.weight,
          whoopSynced: existingHealth?.whoopSynced || false,
        });

        results.push({ date, ...data, status: "saved" });
      } catch (err) {
        console.error(`Error saving health data for ${date}:`, err);
        results.push({ date, ...data, status: "error", error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      processed: Object.keys(dataByDate).length,
      results,
    });
  } catch (error) {
    console.error("Health Auto Export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const apiKey = new URL(request.url).searchParams.get("key");

  if (apiKey !== HEALTH_EXPORT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "ok",
    message: "Health Auto Export API is ready",
    supportedMetrics: [
      "step_count",
      "stepCount",
      "HKQuantityTypeIdentifierStepCount",
      "sleep_analysis",
      "sleepAnalysis",
      "HKCategoryTypeIdentifierSleepAnalysis",
      "active_energy",
      "activeEnergyBurned",
      "HKQuantityTypeIdentifierActiveEnergyBurned",
      "weight",
      "body_mass",
      "bodyMass",
      "HKQuantityTypeIdentifierBodyMass",
    ],
  });
}
