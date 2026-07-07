import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listRatingsForRange = query({
  args: {
    userId: v.id("users"),
    startMs: v.number(),
    endMs: v.number(),
  },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("timeBlockRatings")
      .withIndex("by_user_start", (q) => q.eq("userId", args.userId))
      .collect();

    return ratings
      .filter((rating) => rating.startMs < args.endMs && rating.endMs > args.startMs)
      .sort((a, b) => a.startMs - b.startMs);
  },
});

export const upsertRating = mutation({
  args: {
    userId: v.id("users"),
    eventKey: v.string(),
    title: v.string(),
    startMs: v.number(),
    endMs: v.number(),
    categoryId: v.optional(v.id("rpmCategories")),
    categoryName: v.optional(v.string()),
    quality: v.optional(v.number()),
    energy: v.optional(v.union(v.literal("draining"), v.literal("neutral"), v.literal("energizing"))),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("timeBlockRatings")
      .withIndex("by_user_event", (q) => q.eq("userId", args.userId).eq("eventKey", args.eventKey))
      .first();

    const now = Date.now();
    const updates = {
      title: args.title,
      startMs: args.startMs,
      endMs: args.endMs,
      categoryId: args.categoryId,
      categoryName: args.categoryName,
      quality: args.quality,
      energy: args.energy,
      note: args.note?.trim() || undefined,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("timeBlockRatings", {
      userId: args.userId,
      eventKey: args.eventKey,
      ...updates,
      createdAt: now,
    });
  },
});
