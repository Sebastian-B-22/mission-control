import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    path: v.string(),
    content: v.string(),
    updatedAt: v.optional(v.number()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updatedAt = args.updatedAt ?? now;

    const existing = await ctx.db
      .query("memorySnapshots")
      .withIndex("by_user_path", (q) => q.eq("userId", args.userId).eq("path", args.path))
      .first();

    if (!existing) {
      return await ctx.db.insert("memorySnapshots", {
        userId: args.userId,
        path: args.path,
        content: args.content,
        updatedAt,
        createdAt: now,
        source: args.source,
      });
    }

    await ctx.db.patch(existing._id, {
      content: args.content,
      updatedAt,
      source: args.source,
    });

    return existing._id;
  },
});

export const listAllPaths = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 2000;

    const items = await ctx.db
      .query("memorySnapshots")
      .withIndex("by_user_updated", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return items.map((i) => ({ path: i.path, updatedAt: i.updatedAt }));
  },
});

export const getFile = query({
  args: { userId: v.id("users"), path: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("memorySnapshots")
      .withIndex("by_user_path", (q) => q.eq("userId", args.userId).eq("path", args.path))
      .first();

    if (!existing) return null;

    return {
      path: existing.path,
      content: existing.content,
      updatedAt: existing.updatedAt,
      source: existing.source,
    };
  },
});
