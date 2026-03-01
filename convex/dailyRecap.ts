import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get daily recap notes for a specific date
export const getRecap = query({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const recap = await ctx.db
      .query("dailyRecap")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
    return recap;
  },
});

// Save or update daily recap notes
export const saveRecap = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if recap already exists for this date
    const existing = await ctx.db
      .query("dailyRecap")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        notes: args.notes,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("dailyRecap", {
        userId: args.userId,
        date: args.date,
        notes: args.notes,
        updatedAt: Date.now(),
      });
    }
  },
});

// Get recaps for a date range (useful for weekly/monthly review)
export const getRecapsForRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const recaps = await ctx.db
      .query("dailyRecap")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter by date range
    return recaps.filter(r => r.date >= args.startDate && r.date <= args.endDate);
  },
});
