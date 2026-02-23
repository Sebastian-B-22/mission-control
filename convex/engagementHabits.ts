/**
 * Engagement Habits - Convex Functions
 *
 * Tracks daily engagement activities like comments, posts, and interactions.
 * Helps Corinne build consistent engagement habits.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────

const ACTIVITY_TYPE = v.union(
  v.literal("comment"),
  v.literal("post"),
  v.literal("reply"),
  v.literal("like"),
  v.literal("share")
);

// ─── Helpers ──────────────────────────────────────────────────────────────

function getTodayPST(): string {
  const now = new Date();
  const pstDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const year = pstDate.getFullYear();
  const month = String(pstDate.getMonth() + 1).padStart(2, "0");
  const day = String(pstDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekDatesPST(): string[] {
  const now = new Date();
  const pstDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const dayOfWeek = pstDate.getDay(); // 0 = Sunday
  const dates: string[] = [];
  
  // Get dates from Sunday to today
  for (let i = 0; i <= dayOfWeek; i++) {
    const d = new Date(pstDate);
    d.setDate(d.getDate() - (dayOfWeek - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
}

// ─── Queries ──────────────────────────────────────────────────────────────

/** Get today's activities for a user */
export const getTodayActivities = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayPST();
    return await ctx.db
      .query("engagementActivities")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", today)
      )
      .collect();
  },
});

/** Get activities for a date range */
export const getActivitiesByDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("engagementActivities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return activities.filter(
      (a) => a.date >= args.startDate && a.date <= args.endDate
    );
  },
});

/** Get user's engagement settings */
export const getSettings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("engagementSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Return defaults if no settings exist
    return settings ?? {
      dailyGoalMin: 3,
      dailyGoalMax: 5,
      trackingEnabled: true,
    };
  },
});

/** Get engagement stats for the dashboard */
export const getEngagementStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayPST();
    const weekDates = getWeekDatesPST();

    // Get all user activities
    const allActivities = await ctx.db
      .query("engagementActivities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get settings
    const settings = await ctx.db
      .query("engagementSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const dailyGoalMin = settings?.dailyGoalMin ?? 3;
    const dailyGoalMax = settings?.dailyGoalMax ?? 5;

    // Calculate today's count
    const todayCount = allActivities.filter((a) => a.date === today).length;

    // Calculate days active this week
    const activeDaysThisWeek = new Set(
      allActivities
        .filter((a) => weekDates.includes(a.date) && a.date <= today)
        .map((a) => a.date)
    ).size;

    // Calculate current streak
    let streak = 0;
    const sortedDates = [...new Set(allActivities.map((a) => a.date))].sort().reverse();
    
    // Start checking from today or yesterday if today has no activity
    let checkDate = today;
    const todayHasActivity = sortedDates[0] === today;
    
    if (!todayHasActivity && sortedDates.length > 0) {
      // Check if yesterday had activity (streak can continue from yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      
      if (sortedDates[0] === yesterdayStr) {
        checkDate = yesterdayStr;
      } else {
        // No streak
        streak = 0;
        checkDate = "";
      }
    }

    if (checkDate) {
      for (const date of sortedDates) {
        if (date === checkDate) {
          streak++;
          // Move to previous day
          const d = new Date(checkDate + "T12:00:00");
          d.setDate(d.getDate() - 1);
          checkDate = d.toISOString().split("T")[0];
        } else if (date < checkDate) {
          // Streak broken
          break;
        }
      }
    }

    // Count by type (all time)
    const byType = allActivities.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Week totals by day
    const weekTotals = weekDates.map((date) => ({
      date,
      count: allActivities.filter((a) => a.date === date).length,
      metGoal: allActivities.filter((a) => a.date === date).length >= dailyGoalMin,
    }));

    return {
      todayCount,
      dailyGoalMin,
      dailyGoalMax,
      streak,
      activeDaysThisWeek,
      totalEngagements: allActivities.length,
      byType,
      weekTotals,
      todayMadeGoal: todayCount >= dailyGoalMin,
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

/** Log an engagement activity */
export const logActivity = mutation({
  args: {
    userId: v.id("users"),
    type: ACTIVITY_TYPE,
    platform: v.string(),
    notes: v.optional(v.string()),
    date: v.optional(v.string()), // Optional, defaults to today PST
  },
  handler: async (ctx, args) => {
    const date = args.date || getTodayPST();
    
    const id = await ctx.db.insert("engagementActivities", {
      userId: args.userId,
      date,
      type: args.type,
      platform: args.platform,
      notes: args.notes,
      createdAt: Date.now(),
    });
    return id;
  },
});

/** Quick log multiple activities at once (e.g., "3 comments on X") */
export const logMultipleActivities = mutation({
  args: {
    userId: v.id("users"),
    type: ACTIVITY_TYPE,
    platform: v.string(),
    count: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = getTodayPST();
    const ids: Id<"engagementActivities">[] = [];

    for (let i = 0; i < args.count; i++) {
      const id = await ctx.db.insert("engagementActivities", {
        userId: args.userId,
        date,
        type: args.type,
        platform: args.platform,
        notes: args.notes,
        createdAt: Date.now(),
      });
      ids.push(id);
    }

    return ids;
  },
});

/** Delete an activity */
export const deleteActivity = mutation({
  args: { id: v.id("engagementActivities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/** Update engagement settings */
export const updateSettings = mutation({
  args: {
    userId: v.id("users"),
    dailyGoalMin: v.optional(v.number()),
    dailyGoalMax: v.optional(v.number()),
    trackingEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("engagementSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.dailyGoalMin !== undefined && { dailyGoalMin: args.dailyGoalMin }),
        ...(args.dailyGoalMax !== undefined && { dailyGoalMax: args.dailyGoalMax }),
        ...(args.trackingEnabled !== undefined && { trackingEnabled: args.trackingEnabled }),
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("engagementSettings", {
        userId: args.userId,
        dailyGoalMin: args.dailyGoalMin ?? 3,
        dailyGoalMax: args.dailyGoalMax ?? 5,
        trackingEnabled: args.trackingEnabled ?? true,
        updatedAt: Date.now(),
      });
      return id;
    }
  },
});
