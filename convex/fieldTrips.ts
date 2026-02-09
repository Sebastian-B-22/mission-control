import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createFieldTrip = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    location: v.string(),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("fieldTrips", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateFieldTrip = mutation({
  args: {
    id: v.id("fieldTrips"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteFieldTrip = mutation({
  args: { id: v.id("fieldTrips") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getFieldTrips = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const trips = await ctx.db
      .query("fieldTrips")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Sort alphabetically by name
    return trips.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const saveMonthlyItinerary = mutation({
  args: {
    userId: v.id("users"),
    month: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("monthlyItinerary")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", args.userId).eq("month", args.month)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("monthlyItinerary", {
      userId: args.userId,
      month: args.month,
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

export const getMonthlyItinerary = query({
  args: {
    userId: v.id("users"),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("monthlyItinerary")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", args.userId).eq("month", args.month)
      )
      .first();
  },
});
