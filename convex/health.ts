import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";

// ─── Health Score Calculation ──────────────────────────────────────────────

const SLEEP_GOAL_HOURS = 7;
const STEPS_GOAL = 3500;
const CALORIES_GOAL = 350;

function calculateSleepScore(hours: number | undefined): number {
  if (!hours) return 0;
  return hours >= SLEEP_GOAL_HOURS ? 50 : Math.round((hours / SLEEP_GOAL_HOURS) * 50);
}

function calculateStepsScore(steps: number | undefined): number {
  if (!steps) return 0;
  return steps >= STEPS_GOAL ? 50 : Math.round((steps / STEPS_GOAL) * 50);
}

function calculateCaloriesScore(calories: number | undefined): number {
  if (!calories) return 0;
  return calories >= CALORIES_GOAL ? 34 : Math.floor((calories / CALORIES_GOAL) * 34);
}

function bestMetricValue(incoming: number | undefined, existing: number | undefined): number | undefined {
  if (typeof incoming !== "number" || !Number.isFinite(incoming)) return existing;
  if (typeof existing !== "number" || !Number.isFinite(existing)) return incoming;
  return Math.max(incoming, existing);
}

function calculateDontDieScore(values: {
  sleepHours?: number;
  steps?: number;
  activeCalories?: number;
}) {
  const sleepScore = calculateSleepScore(values.sleepHours);
  const stepsScore = calculateStepsScore(values.steps);
  const caloriesScore = calculateCaloriesScore(values.activeCalories);
  // Don't Die's daily score appears to be based on sleep + steps only.
  // Example from Corinne's screenshot: 6h03m / 7h sleep + 12.9k / 3.5k steps = 93,
  // even with 0 / 350 active calories. Active calories stay visible but do not
  // reduce the daily score.
  const healthScore = sleepScore + stepsScore;

  return {
    sleepScore,
    stepsScore,
    caloriesScore,
    healthScore,
    isPerfectDay: healthScore >= 100,
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

// Get today's health data
export const getTodayHealth = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const today = new Date().toISOString().split("T")[0];
    return await ctx.db
      .query("dailyHealth")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();
  },
});

// Get health data for a specific date
export const getHealthByDate = query({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, { userId, date }) => {
    return await ctx.db
      .query("dailyHealth")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();
  },
});

// Get the most recent health record on or before a date.
// Useful because wearable data usually lands for yesterday, not today.
export const getLatestHealthOnOrBefore = query({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, { userId, date }) => {
    const records = await ctx.db
      .query("dailyHealth")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return records
      .filter((h) => h.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  },
});

// Get health data for a month (for calendar view)
export const getMonthHealth = query({
  args: { userId: v.id("users"), yearMonth: v.string() }, // YYYY-MM format
  handler: async (ctx, { userId, yearMonth }) => {
    const allHealth = await ctx.db
      .query("dailyHealth")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    return allHealth.filter((h) => h.date.startsWith(yearMonth));
  },
});

// Get current month stats (perfect days count, streak, etc.)
export const getMonthStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Use PST timezone for date calculations
    const now = new Date();
    const pstOffset = -8 * 60; // PST is UTC-8
    const pstTime = new Date(now.getTime() + (pstOffset - now.getTimezoneOffset()) * 60000);
    const yearMonth = `${pstTime.getFullYear()}-${String(pstTime.getMonth() + 1).padStart(2, "0")}`;
    const today = pstTime.toISOString().split("T")[0];

    // Get all health data for this month
    const monthHealth = await ctx.db
      .query("dailyHealth")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const thisMonthData = monthHealth
      .filter((h) => h.date.startsWith(yearMonth))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Count perfect days this month
    const perfectDays = thisMonthData.filter((h) => h.isPerfectDay).length;

    // Calculate current streak
    let streak = 0;
    const sortedByDateDesc = monthHealth
      .filter((h) => h.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const day of sortedByDateDesc) {
      if (day.isPerfectDay) {
        streak++;
      } else {
        break;
      }
    }

    // Get today's health
    const todayHealth = thisMonthData.find((h) => h.date === today);

    // Days in month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    return {
      perfectDays,
      perfectDaysGoal: 15, // Starter goal - adjusted to make the habit achievable first
      streak,
      todayScore: todayHealth?.healthScore ?? 0,
      todaySleep: todayHealth?.sleepHours,
      todaySteps: todayHealth?.steps,
      todayCalories: todayHealth?.activeCalories,
      daysInMonth,
      daysPassed: now.getDate(),
    };
  },
});

// Get user's health goals
export const getHealthGoals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const goals = await ctx.db
      .query("healthGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!goals) {
      return {
        sleepGoalHours: SLEEP_GOAL_HOURS,
        stepsGoal: STEPS_GOAL,
        caloriesGoal: CALORIES_GOAL,
        perfectDaysGoal: 15,
        currentLevel: 1,
      };
    }

    return goals;
  },
});

// Check if Whoop is connected
export const isWhoopConnected = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const tokens = await ctx.db
      .query("whoopTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!tokens) return false;

    // Check if token is expired
    return tokens.expiresAt > Date.now();
  },
});

// Get Whoop tokens for a user (for sync)
export const getWhoopTokens = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("whoopTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Get user by ID (to get clerkId for token refresh)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

// Record daily health data with raw userId string (for syncing to users that exist but CLI can't see)
export const recordDailyHealthRaw = mutation({
  args: {
    userIdStr: v.string(),
    date: v.string(),
    sleepHours: v.optional(v.number()),
    steps: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userIdStr, date, sleepHours, steps } = args;
    const userId = userIdStr as any; // Cast to bypass validation
    
    const { sleepScore, stepsScore, healthScore, isPerfectDay } = calculateDontDieScore({
      sleepHours,
      steps,
    });
    
    const existing = await ctx.db
      .query("dailyHealth")
      .filter((q) => q.and(
        q.eq(q.field("userId"), userId),
        q.eq(q.field("date"), date)
      ))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        sleepHours, sleepScore, steps, stepsScore, healthScore, isPerfectDay,
        manualEntry: true, updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("dailyHealth", {
        userId, date, sleepHours, sleepScore, steps, stepsScore,
        caloriesScore: 0, healthScore, isPerfectDay,
        whoopSynced: false, manualEntry: true,
        createdAt: Date.now(), updatedAt: Date.now(),
      });
    }
  },
});

// Record daily health data (manual entry or Whoop sync)
export const recordDailyHealth = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    sleepHours: v.optional(v.number()),
    steps: v.optional(v.number()),
    activeCalories: v.optional(v.number()),
    weight: v.optional(v.number()),
    whoopSynced: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, date, sleepHours, steps, activeCalories, weight, whoopSynced } = args;

    // Check if record exists for this date
    const existing = await ctx.db
      .query("dailyHealth")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();

    // Health Auto Export often sends partial/incremental payloads. Keep the best known
    // value for each Don't Die metric so a later sparse export never makes the day look worse.
    const finalSleepHours = bestMetricValue(sleepHours, existing?.sleepHours);
    const finalSteps = bestMetricValue(steps, existing?.steps);
    const finalActiveCalories = bestMetricValue(activeCalories, existing?.activeCalories);
    const finalWeight = weight ?? existing?.weight;

    // Don't Die-style score: sleep 50 + steps 50. Active calories stay visible
    // but do not reduce the daily score.
    const calculated = calculateDontDieScore({
      sleepHours: finalSleepHours,
      steps: finalSteps,
      activeCalories: finalActiveCalories,
    });
    const { sleepScore, stepsScore, caloriesScore } = calculated;
    const calculatedHealthScore = calculated.healthScore;
    const healthScore = existing?.manualEntry && existing.healthScore > calculatedHealthScore
      ? existing.healthScore
      : calculatedHealthScore;
    const isPerfectDay = healthScore >= 98;

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        sleepHours: finalSleepHours,
        sleepScore,
        steps: finalSteps,
        stepsScore,
        activeCalories: finalActiveCalories,
        caloriesScore,
        weight: finalWeight,
        healthScore,
        isPerfectDay,
        whoopSynced: whoopSynced ?? existing.whoopSynced,
        whoopSyncedAt: whoopSynced ? Date.now() : existing.whoopSyncedAt,
        manualEntry: !whoopSynced,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new record
      return await ctx.db.insert("dailyHealth", {
        userId,
        date,
        sleepHours: finalSleepHours,
        sleepScore,
        steps: finalSteps,
        stepsScore,
        activeCalories: finalActiveCalories,
        caloriesScore,
        weight: finalWeight,
        healthScore,
        isPerfectDay,
        whoopSynced: whoopSynced ?? false,
        whoopSyncedAt: whoopSynced ? Date.now() : undefined,
        manualEntry: !whoopSynced,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Update health goals manually.
export const upsertHealthGoals = mutation({
  args: {
    userId: v.id("users"),
    sleepGoalHours: v.optional(v.number()),
    stepsGoal: v.optional(v.number()),
    caloriesGoal: v.optional(v.number()),
    perfectDaysGoal: v.optional(v.number()),
    currentLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("healthGoals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const patch = {
      sleepGoalHours: args.sleepGoalHours ?? existing?.sleepGoalHours ?? SLEEP_GOAL_HOURS,
      stepsGoal: args.stepsGoal ?? existing?.stepsGoal ?? STEPS_GOAL,
      caloriesGoal: args.caloriesGoal ?? existing?.caloriesGoal ?? CALORIES_GOAL,
      perfectDaysGoal: args.perfectDaysGoal ?? existing?.perfectDaysGoal ?? 15,
      currentLevel: args.currentLevel ?? existing?.currentLevel ?? 1,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("healthGoals", {
      userId: args.userId,
      ...patch,
      createdAt: now,
    });
  },
});

// Manual Don't Die score override from screenshots/app data.
// Used when Apple Health Auto Export is delayed but Corinne provides confirmed daily totals.
export const upsertDontDieDailyScore = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    healthScore: v.number(),
    sleepHours: v.optional(v.number()),
    steps: v.optional(v.number()),
    activeCalories: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("dailyHealth")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .first();

    const sleepHours = args.sleepHours ?? existing?.sleepHours;
    const steps = args.steps ?? existing?.steps;
    const activeCalories = args.activeCalories ?? existing?.activeCalories;
    const sleepScore = calculateSleepScore(sleepHours);
    const stepsScore = calculateStepsScore(steps);
    const caloriesScore = calculateCaloriesScore(activeCalories);

    const patch = {
      sleepHours,
      sleepScore,
      steps,
      stepsScore,
      activeCalories,
      caloriesScore,
      healthScore: args.healthScore,
      isPerfectDay: args.healthScore >= 98,
      manualEntry: true,
      whoopSynced: existing?.whoopSynced ?? false,
      whoopSyncedAt: existing?.whoopSyncedAt,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("dailyHealth", {
      userId: args.userId,
      date: args.date,
      ...patch,
      createdAt: now,
    });
  },
});

// Update steps manually (since Apple Health integration is later)

// Update steps (accepts either userId or clerkId)
export const updateSteps = mutation({
  args: {
    userId: v.optional(v.id("users")),
    clerkId: v.optional(v.string()),
    date: v.string(),
    steps: v.number(),
  },
  handler: async (ctx, args) => {
    let finalUserId = args.userId;

    // If clerkId provided instead of userId, look up the user
    if (!finalUserId && args.clerkId) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();

      if (!user) {
        throw new Error("User not found");
      }
      finalUserId = user._id;
    }

    if (!finalUserId) {
      throw new Error("Either userId or clerkId is required");
    }

    const existing = await ctx.db
      .query("dailyHealth")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", finalUserId!).eq("date", args.date)
      )
      .first();

    const stepsScore = calculateStepsScore(args.steps);
    const sleepScore = existing?.sleepScore || 0;
    const caloriesScore = existing?.caloriesScore || 0;
    const healthScore = sleepScore + stepsScore;
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        steps: args.steps,
        stepsScore,
        healthScore,
        isPerfectDay: healthScore === 100,
        manualEntry: true,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("dailyHealth", {
        userId: finalUserId!,
        date: args.date,
        steps: args.steps,
        stepsScore,
        sleepHours: 0,
        sleepScore: 0,
        activeCalories: 0,
        caloriesScore: 0,
        healthScore,
        isPerfectDay: healthScore === 100,
        manualEntry: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, steps: args.steps, healthScore };
  },
});

// Store Whoop OAuth tokens
export const storeWhoopTokens = mutation({
  args: {
    clerkId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const scope = args.scope || "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline";

    // Check if token exists for this user
    const existing = await ctx.db
      .query("whoopTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("whoopTokens", {
        userId: user._id,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Disconnect Whoop
export const disconnectWhoop = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const tokens = await ctx.db
      .query("whoopTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (tokens) {
      await ctx.db.delete(tokens._id);
    }

    return { success: true };
  },
});

// Upsert daily health from Health Auto Export API
export const upsertDailyHealth = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    steps: v.number(),
    sleepHours: v.number(),
    activeCalories: v.number(),
    sleepScore: v.number(),
    stepsScore: v.number(),
    caloriesScore: v.number(),
    healthScore: v.number(),
    restingHeartRate: v.optional(v.number()), // Not stored yet, for future
    hrv: v.optional(v.number()), // Not stored yet, for future
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, date } = args;
    const now = Date.now();
    
    // Check if record exists
    const existing = await ctx.db
      .query("dailyHealth")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();

    const finalSleepHours = bestMetricValue(args.sleepHours, existing?.sleepHours);
    const finalSteps = bestMetricValue(args.steps, existing?.steps);
    const finalActiveCalories = bestMetricValue(args.activeCalories, existing?.activeCalories);
    const calculated = calculateDontDieScore({
      sleepHours: finalSleepHours,
      steps: finalSteps,
      activeCalories: finalActiveCalories,
    });
    const { sleepScore, stepsScore, caloriesScore } = calculated;
    const calculatedHealthScore = calculated.healthScore;
    const healthScore = existing?.manualEntry && existing.healthScore > calculatedHealthScore
      ? existing.healthScore
      : calculatedHealthScore;
    const isPerfectDay = healthScore >= 98;
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        steps: finalSteps,
        sleepHours: finalSleepHours,
        activeCalories: finalActiveCalories,
        sleepScore,
        stepsScore,
        caloriesScore,
        healthScore,
        isPerfectDay,
        manualEntry: false,
        whoopSynced: false,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("dailyHealth", {
        userId,
        date,
        steps: finalSteps,
        sleepHours: finalSleepHours,
        activeCalories: finalActiveCalories,
        sleepScore,
        stepsScore,
        caloriesScore,
        healthScore,
        isPerfectDay,
        manualEntry: false,
        whoopSynced: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Recalculate existing rows after scoring-rule changes.
export const recalculateDontDieScores = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("dailyHealth")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let updated = 0;
    for (const row of rows) {
      const calculated = calculateDontDieScore({
        sleepHours: row.sleepHours,
        steps: row.steps,
        activeCalories: row.activeCalories,
      });

      await ctx.db.patch(row._id, {
        sleepScore: calculated.sleepScore,
        stepsScore: calculated.stepsScore,
        caloriesScore: calculated.caloriesScore,
        healthScore: calculated.healthScore,
        isPerfectDay: calculated.isPerfectDay,
        updatedAt: Date.now(),
      });
      updated++;
    }

    return { updated };
  },
});
