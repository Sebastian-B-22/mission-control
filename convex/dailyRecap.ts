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
    return recaps.filter((r) => r.date >= args.startDate && r.date <= args.endDate);
  },
});

// --- Media uploads (Convex file storage) ---

// Client calls this to get a short-lived URL to POST a file to Convex storage.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// After the client uploads to the generated URL (and receives a storageId),
// call this to attach the media URL to the daily recap.
export const addMedia = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Failed to get URL for uploaded file");

    const existing = await ctx.db
      .query("dailyRecap")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .first();

    if (existing) {
      const prev = existing.mediaUrls ?? [];
      // Avoid duplicates if the client retries.
      if (!prev.includes(url)) {
        await ctx.db.patch(existing._id, {
          mediaUrls: [...prev, url],
          updatedAt: Date.now(),
        });
      }
      return url;
    }

    await ctx.db.insert("dailyRecap", {
      userId: args.userId,
      date: args.date,
      notes: "",
      mediaUrls: [url],
      updatedAt: Date.now(),
    });

    return url;
  },
});

export const removeMedia = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyRecap")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .first();

    if (!existing?.mediaUrls?.length) return null;

    await ctx.db.patch(existing._id, {
      mediaUrls: existing.mediaUrls.filter((u) => u !== args.url),
      updatedAt: Date.now(),
    });

    return true;
  },
});
