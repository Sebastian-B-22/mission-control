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
        responseStatus: v.optional(v.union(
          v.literal("accepted"),
          v.literal("declined"),
          v.literal("tentative"),
          v.literal("needsAction")
        )),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Delete synced events that overlap this range for this user. Manual Daily
    // entries use the same read path, but should survive Google sync refreshes.
    const existing = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_start", (q) => q.eq("userId", args.userId))
      .collect();

    for (const e of existing) {
      if (e.source !== "manual" && e.startMs < args.endMs && e.endMs > args.startMs) {
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

export const createManualEvent = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    location: v.optional(v.string()),
    startMs: v.number(),
    endMs: v.number(),
    allDay: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("calendarEvents", {
      userId: args.userId,
      source: "manual",
      account: "mission-control",
      calendarId: "daily-manual",
      externalId: `manual:${args.userId}:${now}`,
      title: args.title.trim(),
      location: args.location?.trim() || undefined,
      startMs: args.startMs,
      endMs: args.endMs,
      allDay: args.allDay,
      responseStatus: "accepted",
      updatedAt: now,
    });
  },
});

export const deleteManualEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.source !== "manual") {
      throw new Error("Only manual calendar entries can be deleted here.");
    }

    await ctx.db.delete(args.eventId);
    return { deleted: true };
  },
});

// Admin cleanup for orphaned events from wrong userId
export const cleanupOrphanedEvents = mutation({
  args: {
    orphanedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const orphaned = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_start", (q) => q.eq("userId", args.orphanedUserId))
      .collect();

    for (const e of orphaned) {
      await ctx.db.delete(e._id);
    }

    return { deleted: orphaned.length };
  },
});
