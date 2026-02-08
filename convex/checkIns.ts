import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createCheckIn = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    type: v.union(v.literal("morning"), v.literal("evening")),
    responses: v.object({
      oneThing: v.optional(v.string()),
      excitement: v.optional(v.string()),
      surprise: v.optional(v.string()),
      oneThingDone: v.optional(v.boolean()),
      reflection: v.optional(v.string()),
      appreciated: v.optional(v.string()),
      learned: v.optional(v.string()),
      wins: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Check if check-in already exists for this date and type
    const existing = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .filter((q) => q.eq(q.field("type"), args.type))
      .first();

    if (existing) {
      // Update existing check-in
      await ctx.db.patch(existing._id, {
        responses: args.responses,
        completedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new check-in
    return await ctx.db.insert("dailyCheckIns", {
      ...args,
      completedAt: Date.now(),
    });
  },
});

export const getCheckInByDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
    type: v.union(v.literal("morning"), v.literal("evening")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .filter((q) => q.eq(q.field("type"), args.type))
      .first();
  },
});

export const getRecentCheckIns = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const checkIns = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 30);

    return checkIns;
  },
});
