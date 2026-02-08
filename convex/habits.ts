import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveHabitScores = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    clarity: v.number(),
    productivity: v.number(),
    energy: v.number(),
    influence: v.number(),
    necessity: v.number(),
    courage: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if scores already exist for this date
    const existing = await ctx.db
      .query("habitScores")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Update existing scores
      await ctx.db.patch(existing._id, {
        clarity: args.clarity,
        productivity: args.productivity,
        energy: args.energy,
        influence: args.influence,
        necessity: args.necessity,
        courage: args.courage,
        completedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new scores
    return await ctx.db.insert("habitScores", {
      userId: args.userId,
      date: args.date,
      clarity: args.clarity,
      productivity: args.productivity,
      energy: args.energy,
      influence: args.influence,
      necessity: args.necessity,
      courage: args.courage,
      completedAt: Date.now(),
    });
  },
});

export const getHabitScoresByDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitScores")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
  },
});

export const getHabitScoresRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const allScores = await ctx.db
      .query("habitScores")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return allScores.filter(
      (score) => score.date >= args.startDate && score.date <= args.endDate
    );
  },
});

export const getRecentHabitScores = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("habitScores")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 30);

    return scores;
  },
});
