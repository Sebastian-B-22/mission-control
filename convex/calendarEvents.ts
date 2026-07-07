import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listRange = query({
  args: {
    userId: v.id("users"),
    startMs: v.number(),
    endMs: v.number(),
  },
  handler: async (ctx, args) => {
    // Pull this user's events and return any event that overlaps the requested range.
    // Important: events can start before the week and still appear inside it.
    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_start", (q) => q.eq("userId", args.userId))
      .collect();

    return events
      .filter((e) => e.startMs < args.endMs && e.endMs > args.startMs)
      .sort((a, b) => a.startMs - b.startMs);
  },
});

export const syncRange = mutation({
  args: {
    userId: v.id("users"),
    startMs: v.number(),
    endMs: v.number(),
    events: v.array(
      v.object({
        source: v.string(),
        account: v.string(),
        calendarId: v.string(),
        externalId: v.optional(v.string()),
        title: v.string(),
        location: v.optional(v.string()),
        startMs: v.number(),
        endMs: v.number(),
        allDay: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Delete existing events that overlap this range for this user
    const existing = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_start", (q) => q.eq("userId", args.userId))
      .collect();

    for (const e of existing) {
      if (e.startMs < args.endMs && e.endMs > args.startMs) {
        await ctx.db.delete(e._id);
      }
    }

    // Insert new
    for (const e of args.events) {
      await ctx.db.insert("calendarEvents", {
        userId: args.userId,
        ...e,
        updatedAt: now,
      });
    }

    return { inserted: args.events.length, startMs: args.startMs, endMs: args.endMs };
  },
});
