import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// API key for Health Auto Export app
const HEALTH_EXPORT_API_KEY = process.env.HEALTH_EXPORT_API_KEY || "hae-corinne-2026";

// Health Auto Export sends data in this format:
// { data: { metrics: [{ name: "step_count", units: "steps", data: [{ qty, date }] }] } }

interface HealthMetric {
  name: string;
  units: string;
  data: Array<{
    qty?: number;
    date?: string;
    totalSleep?: number;
    asleep?: number;
    inBed?: number;
    sleepStart?: string;
    sleepEnd?: string;
  }>;
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

export async function POST(request: Request) {
  try {
    // Check API key
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

    // Process metrics by date
    const dataByDate: Record<string, { steps?: number; sleepHours?: number; activeCalories?: number; weight?: number }> = {};

    for (const metric of payload.data.metrics) {
      const metricName = metric.name.toLowerCase();
      
      for (const entry of metric.data) {
        // Extract date (YYYY-MM-DD format)
        let dateStr: string | undefined;
        if (entry.date) {
          dateStr = entry.date.split(" ")[0]; // "2026-02-25 10:00:00 -0800" -> "2026-02-25"
        }
        if (!dateStr) continue;

        if (!dataByDate[dateStr]) {
          dataByDate[dateStr] = {};
        }

        // Map metric names to our fields
        if (metricName === "step_count" || metricName === "steps") {
          const currentSteps = dataByDate[dateStr].steps || 0;
          dataByDate[dateStr].steps = currentSteps + (entry.qty || 0);
        } else if (metricName === "sleep_analysis" || metricName === "sleep") {
          // Sleep data - totalSleep is in minutes
          if (entry.totalSleep) {
            dataByDate[dateStr].sleepHours = Math.round((entry.totalSleep / 60) * 10) / 10;
          } else if (entry.asleep) {
            dataByDate[dateStr].sleepHours = Math.round((entry.asleep / 60) * 10) / 10;
          }
        } else if (metricName === "active_energy" || metricName === "active_energy_burned") {
          const currentCals = dataByDate[dateStr].activeCalories || 0;
          // Convert kJ to kcal if needed
          let calories = entry.qty || 0;
          if (metric.units.toLowerCase().includes("kj")) {
            calories = calories / 4.184;
          }
          dataByDate[dateStr].activeCalories = Math.round(currentCals + calories);
        } else if (metricName === "weight" || metricName === "body_mass") {
          // Weight - use most recent reading for the day
          let weight = entry.qty || 0;
          // Convert kg to lbs if needed (store in lbs)
          if (metric.units.toLowerCase() === "kg") {
            weight = weight * 2.20462;
          }
          dataByDate[dateStr].weight = Math.round(weight * 10) / 10;
        }
      }
    }

    // Also check workouts for active energy
    if (payload.data.workouts) {
      for (const workout of payload.data.workouts) {
        if (workout.activeEnergyBurned) {
          const dateStr = workout.start.split(" ")[0];
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
    }

    // Store each day's data
    // Get Corinne's Clerk ID from environment variable
    const CORINNE_CLERK_ID = process.env.CORINNE_CLERK_ID;
    if (!CORINNE_CLERK_ID) {
      console.error("CORINNE_CLERK_ID not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const results = [];
    for (const [date, data] of Object.entries(dataByDate)) {
      try {
        // Get user from Clerk ID
        const user = await convex.query(api.users.getUserByClerkId, { clerkId: CORINNE_CLERK_ID });
        if (!user) {
          console.error("User not found for Clerk ID:", CORINNE_CLERK_ID);
          continue;
        }

        // Get existing data to preserve Whoop data
        const existingHealth = await convex.query(api.health.getHealthByDate, {
          userId: user._id,
          date,
        });

        // Record the health data
        await convex.mutation(api.health.recordDailyHealth, {
          userId: user._id,
          date,
          sleepHours: data.sleepHours ?? existingHealth?.sleepHours,
          steps: data.steps ?? existingHealth?.steps,
          activeCalories: data.activeCalories ?? existingHealth?.activeCalories,
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
      { status: 500 }
    );
  }
}

// GET endpoint to test the connection
export async function GET(request: Request) {
  const apiKey = new URL(request.url).searchParams.get("key");
  
  if (apiKey !== HEALTH_EXPORT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return NextResponse.json({
    status: "ok",
    message: "Health Auto Export API is ready",
    supportedMetrics: ["step_count", "sleep_analysis", "active_energy", "weight", "body_mass"],
  });
}
