import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const dayOfWeekValidator = v.union(
  v.literal("monday"),
  v.literal("tuesday"),
  v.literal("wednesday"),
  v.literal("thursday"),
  v.literal("friday"),
  v.literal("saturday"),
  v.literal("sunday")
);

export const createScheduleBlock = mutation({
  args: {
    userId: v.id("users"),
    dayOfWeek: dayOfWeekValidator,
    startTime: v.string(),
    endTime: v.string(),
    activity: v.string(),
    notes: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("weeklySchedule", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateScheduleBlock = mutation({
  args: {
    id: v.id("weeklySchedule"),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    activity: v.optional(v.string()),
    notes: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteScheduleBlock = mutation({
  args: { id: v.id("weeklySchedule") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getWeeklySchedule = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("weeklySchedule")
      .withIndex("by_user_and_day", (q) => q.eq("userId", args.userId))
      .collect();

    // Group by day and sort by time
    const schedule: Record<string, any[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    blocks.forEach((block) => {
      schedule[block.dayOfWeek].push(block);
    });

    // Sort each day's blocks by start time
    Object.keys(schedule).forEach((day) => {
      schedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return schedule;
  },
});

export const getScheduleByDay = query({
  args: {
    userId: v.id("users"),
    dayOfWeek: dayOfWeekValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklySchedule")
      .withIndex("by_user_and_day", (q) =>
        q.eq("userId", args.userId).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();
  },
});
