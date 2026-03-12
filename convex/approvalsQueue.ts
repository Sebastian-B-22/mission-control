import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("approvalsQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return pending.length;
  },
});

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const status = args.status ?? "pending";

    const items = await ctx.db
      .query("approvalsQueue")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .take(limit);

    return items;
  },
});

export const enqueueMock = mutation({
  args: {
    title: v.string(),
    details: v.optional(v.string()),
    requestedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("approvalsQueue", {
      title: args.title,
      details: args.details,
      status: "pending",
      requestedBy: args.requestedBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("approvalsQueue"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
