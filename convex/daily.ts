import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 5 to Thrive
export const saveFiveToThrive = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    tasks: v.array(
      v.object({
        text: v.string(),
        completed: v.boolean(),
        categoryId: v.optional(v.id("rpmCategories")),
        completedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if 5 to Thrive already exists for this date
    const existing = await ctx.db
      .query("fiveToThrive")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tasks: args.tasks,
      });
      return existing._id;
    }

    return await ctx.db.insert("fiveToThrive", {
      userId: args.userId,
      date: args.date,
      tasks: args.tasks,
      createdAt: Date.now(),
    });
  },
});

export const getFiveToThrive = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fiveToThrive")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
  },
});

export const toggleFiveToThriveTask = mutation({
  args: {
    id: v.id("fiveToThrive"),
    taskIndex: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const fiveToThrive = await ctx.db.get(args.id);
    if (!fiveToThrive) {
      throw new Error("5 to Thrive not found");
    }

    const tasks = [...fiveToThrive.tasks];
    tasks[args.taskIndex] = {
      ...tasks[args.taskIndex],
      completed: args.completed,
      completedAt: args.completed ? Date.now() : undefined,
    };

    await ctx.db.patch(args.id, { tasks });
  },
});

// Daily Reflections
export const saveDailyReflection = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    morningExcited: v.optional(v.string()),
    morningSurprise: v.optional(v.string()),
    eveningAppreciated: v.optional(v.string()),
    eveningLearned: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if reflection already exists for this date
    const existing = await ctx.db
      .query("dailyReflections")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    const updates = {
      morningExcited: args.morningExcited,
      morningSurprise: args.morningSurprise,
      eveningAppreciated: args.eveningAppreciated,
      eveningLearned: args.eveningLearned,
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("dailyReflections", {
      userId: args.userId,
      date: args.date,
      ...updates,
      createdAt: Date.now(),
    });
  },
});

export const getDailyReflection = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyReflections")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
  },
});

export const getRecentReflections = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyReflections")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 7);
  },
});
