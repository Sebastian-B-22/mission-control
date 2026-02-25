import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";

// ─── Health Score Calculation ──────────────────────────────────────────────

const SLEEP_GOAL_HOURS = 7;
const STEPS_GOAL = 3500;
const CALORIES_GOAL = 350;

function calculateSleepScore(hours: number | undefined): number {
  if (!hours) return 0;
  return hours >= SLEEP_GOAL_HOURS ? 33 : Math.floor((hours / SLEEP_GOAL_HOURS) * 33);
}

function calculateStepsScore(steps: number | undefined): number {
  if (!steps) return 0;
  return steps >= STEPS_GOAL ? 33 : Math.floor((steps / STEPS_GOAL) * 33);
}

function calculateCaloriesScore(calories: number | undefined): number {
  if (!calories) return 0;
  return calories >= CALORIES_GOAL ? 34 : Math.floor((calories / CALORIES_GOAL) * 34);
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
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const today = now.toISOString().split("T")[0];

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
      perfectDaysGoal: 20, // Will come from healthGoals later
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
        perfectDaysGoal: 20,
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

// ─── Mutations ──────────────────────────────────────────────────────────────

// Record daily health data (manual entry or Whoop sync)
export const recordDailyHealth = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    sleepHours: v.optional(v.number()),
    steps: v.optional(v.number()),
    activeCalories: v.optional(v.number()),
    whoopSynced: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, date, sleepHours, steps, activeCalories, whoopSynced } = args;

    // Calculate scores
    const sleepScore = calculateSleepScore(sleepHours);
    const stepsScore = calculateStepsScore(steps);
    const caloriesScore = calculateCaloriesScore(activeCalories);
    const healthScore = sleepScore + stepsScore + caloriesScore;
    const isPerfectDay = healthScore === 100;

    // Check if record exists for this date
    const existing = await ctx.db
      .query("dailyHealth")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        sleepHours: sleepHours ?? existing.sleepHours,
        sleepScore,
        steps: steps ?? existing.steps,
        stepsScore,
        activeCalories: activeCalories ?? existing.activeCalories,
        caloriesScore,
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
        sleepHours,
        sleepScore,
        steps,
        stepsScore,
        activeCalories,
        caloriesScore,
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

// Update steps manually (since Apple Health integration is later)

// Update steps from iOS Shortcut
export const updateSteps = mutation({
  args: {
    clerkId: v.string(),
    date: v.string(),
    steps: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const existing = await ctx.db
      .query("dailyHealth")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date)
      )
      .first();

    const stepsScore = args.steps >= 3500 ? 33 : Math.round((args.steps / 3500) * 33);
    const sleepScore = existing?.sleepScore || 0;
    const caloriesScore = existing?.caloriesScore || 0;
    const healthScore = sleepScore + stepsScore + caloriesScore;
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
        userId: user._id,
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
