import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const Owner = v.string();
const Status = v.union(v.literal("open"), v.literal("blocked"), v.literal("done"));
const Source = v.union(v.literal("huddle"), v.literal("telegram"), v.literal("manual"));

export const list = query({
  args: {
    owner: v.optional(Owner),
    tag: v.optional(v.string()),
    includeDone: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const includeDone = args.includeDone ?? false;
    const limit = args.limit ?? 100;

    // Prefer index when owner filter present.
    const base = args.owner
      ? ctx.db
          .query("pendingItems")
          .withIndex("by_owner", (q) => q.eq("owner", args.owner!))
      : ctx.db.query("pendingItems");

    let items = await base.order("desc").take(limit * 2);

    if (!includeDone) {
      items = items.filter((i) => i.status !== "done");
    }
    if (args.tag) {
      const tag = args.tag.toLowerCase();
      items = items.filter((i) => (i.tags || []).some((t) => String(t).toLowerCase() === tag));
    }

    // Sort by updatedAt desc (Convex order() doesn't support non-index fields reliably)
    items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return items.slice(0, limit);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    details: v.optional(v.string()),
    owner: v.optional(Owner),
    status: v.optional(Status),
    source: v.optional(Source),
    dueAt: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("pendingItems", {
      title: args.title.trim(),
      details: args.details?.trim(),
      owner: (args.owner?.trim() || "unassigned").toLowerCase(),
      status: args.status ?? "open",
      source: args.source ?? "manual",
      dueAt: args.dueAt,
      tags: (args.tags ?? []).map((t) => String(t).trim()).filter(Boolean),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("pendingItems"),
    status: Status,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("pendingItems"),
    title: v.optional(v.string()),
    details: v.optional(v.string()),
    owner: v.optional(Owner),
    dueAt: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (rest.title !== undefined) patch.title = rest.title.trim();
    if (rest.details !== undefined) patch.details = rest.details?.trim();
    if (rest.owner !== undefined) patch.owner = rest.owner.trim().toLowerCase();
    if (rest.dueAt !== undefined) patch.dueAt = rest.dueAt;
    if (rest.tags !== undefined) {
      patch.tags = rest.tags.map((t) => String(t).trim()).filter(Boolean);
    }

    await ctx.db.patch(id, patch);
  },
});
