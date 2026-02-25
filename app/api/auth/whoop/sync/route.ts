import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper to refresh tokens if needed
async function getValidTokens(userId: Id<"users">) {
  const tokens = await convex.query(api.health.getWhoopTokens, { userId });
  
  if (!tokens) {
    throw new Error("No Whoop tokens found");
  }

  // Check if expired (with 5 minute buffer)
  if (tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
    // Refresh the token
    const refreshResponse = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
        client_id: process.env.WHOOP_CLIENT_ID!,
        client_secret: process.env.WHOOP_CLIENT_SECRET!,
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error("Failed to refresh Whoop token");
    }

    const newTokens = await refreshResponse.json();

    // Store new tokens
    await convex.mutation(api.health.storeWhoopTokens, {
      userId,
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresIn: newTokens.expires_in,
      scope: newTokens.scope,
    });

    return newTokens.access_token;
  }

  return tokens.accessToken;
}

// Fetch sleep data from Whoop
async function fetchSleepData(accessToken: string, startDate: string, endDate: string) {
  const response = await fetch(
    `${WHOOP_API_BASE}/activity/sleep?start=${startDate}T00:00:00.000Z&end=${endDate}T23:59:59.999Z`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    console.error("Failed to fetch sleep data:", await response.text());
    return [];
  }

  const data = await response.json();
  return data.records || [];
}

// Fetch workout data from Whoop (for active calories)
async function fetchWorkoutData(accessToken: string, startDate: string, endDate: string) {
  const response = await fetch(
    `${WHOOP_API_BASE}/activity/workout?start=${startDate}T00:00:00.000Z&end=${endDate}T23:59:59.999Z`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    console.error("Failed to fetch workout data:", await response.text());
    return [];
  }

  const data = await response.json();
  return data.records || [];
}

// Fetch cycle data (daily strain, includes calories)
async function fetchCycleData(accessToken: string, startDate: string, endDate: string) {
  const response = await fetch(
    `${WHOOP_API_BASE}/cycle?start=${startDate}T00:00:00.000Z&end=${endDate}T23:59:59.999Z`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    console.error("Failed to fetch cycle data:", await response.text());
    return [];
  }

  const data = await response.json();
  return data.records || [];
}

export async function POST(request: Request) {
  try {
    const { userId, date } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Default to today if no date provided
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Get valid access token
    const accessToken = await getValidTokens(userId as Id<"users">);

    // Fetch data for the target date
    const [sleepData, cycleData] = await Promise.all([
      fetchSleepData(accessToken, targetDate, targetDate),
      fetchCycleData(accessToken, targetDate, targetDate),
    ]);

    // Process sleep data
    let sleepHours: number | undefined;
    if (sleepData.length > 0) {
      // Get the most recent sleep record for this day
      const sleepRecord = sleepData[0];
      const sleepMs = sleepRecord.score?.stage_summary?.total_in_bed_time_milli || 0;
      sleepHours = Math.round((sleepMs / (1000 * 60 * 60)) * 10) / 10; // Convert to hours with 1 decimal
    }

    // Process cycle data for calories
    let activeCalories: number | undefined;
    if (cycleData.length > 0) {
      const cycleRecord = cycleData[0];
      activeCalories = Math.round(cycleRecord.score?.kilojoule || 0) / 4.184; // Convert kJ to kcal
      activeCalories = Math.round(activeCalories);
    }

    // Get existing record to preserve steps (manual entry)
    const existingHealth = await convex.query(api.health.getHealthByDate, {
      userId: userId as Id<"users">,
      date: targetDate,
    });

    // Record the health data
    await convex.mutation(api.health.recordDailyHealth, {
      userId: userId as Id<"users">,
      date: targetDate,
      sleepHours,
      steps: existingHealth?.steps, // Preserve manual steps entry
      activeCalories,
      whoopSynced: true,
    });

    return NextResponse.json({
      success: true,
      date: targetDate,
      sleepHours,
      activeCalories,
      stepsPreserved: existingHealth?.steps,
    });
  } catch (error) {
    console.error("Whoop sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

// Sync multiple days (for initial sync or catch-up)
export async function PUT(request: Request) {
  try {
    const { userId, days = 7 } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const accessToken = await getValidTokens(userId as Id<"users">);

    // Calculate date range
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Fetch all data
    const [sleepData, cycleData] = await Promise.all([
      fetchSleepData(accessToken, startDate, endDate),
      fetchCycleData(accessToken, startDate, endDate),
    ]);

    // Group by date
    const dataByDate: Record<string, { sleepHours?: number; activeCalories?: number }> = {};

    // Process sleep data
    for (const sleep of sleepData) {
      const date = sleep.start?.split("T")[0];
      if (date) {
        const sleepMs = sleep.score?.stage_summary?.total_in_bed_time_milli || 0;
        const hours = Math.round((sleepMs / (1000 * 60 * 60)) * 10) / 10;
        dataByDate[date] = { ...dataByDate[date], sleepHours: hours };
      }
    }

    // Process cycle data
    for (const cycle of cycleData) {
      const date = cycle.start?.split("T")[0];
      if (date) {
        const kj = cycle.score?.kilojoule || 0;
        const calories = Math.round(kj / 4.184);
        dataByDate[date] = { ...dataByDate[date], activeCalories: calories };
      }
    }

    // Store each day
    const results = [];
    for (const [date, data] of Object.entries(dataByDate)) {
      const existingHealth = await convex.query(api.health.getHealthByDate, {
        userId: userId as Id<"users">,
        date,
      });

      await convex.mutation(api.health.recordDailyHealth, {
        userId: userId as Id<"users">,
        date,
        sleepHours: data.sleepHours,
        steps: existingHealth?.steps,
        activeCalories: data.activeCalories,
        whoopSynced: true,
      });

      results.push({ date, ...data });
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      results,
    });
  } catch (error) {
    console.error("Whoop bulk sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk sync failed" },
      { status: 500 }
    );
  }
}
