import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const TRAINING_CATEGORY = v.union(
  v.literal("voice"),
  v.literal("business"),
  v.literal("platform"),
  v.literal("contentType"),
  v.literal("section"),
  v.literal("ideaType")
);

export const list = query({
  args: {
    category: v.optional(TRAINING_CATEGORY),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let items = args.category
      ? await ctx.db
          .query("agentTraining")
          .withIndex("by_category", (q) => q.eq("category", args.category!))
          .collect()
      : await ctx.db.query("agentTraining").collect();

    if (args.activeOnly ?? true) {
      items = items.filter((i) => i.active);
    }

    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentTraining")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

export const create = mutation({
  args: {
    category: TRAINING_CATEGORY,
    key: v.string(),
    title: v.string(),
    content: v.string(),
    active: v.optional(v.boolean()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("agentTraining", {
      category: args.category,
      key: args.key,
      title: args.title,
      content: args.content,
      active: args.active ?? true,
      updatedBy: args.updatedBy ?? "sebastian",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("agentTraining"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    active: v.optional(v.boolean()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (rest.title !== undefined) patch.title = rest.title;
    if (rest.content !== undefined) patch.content = rest.content;
    if (rest.active !== undefined) patch.active = rest.active;
    if (rest.updatedBy !== undefined) patch.updatedBy = rest.updatedBy;

    await ctx.db.patch(id, patch);
    return { success: true };
  },
});
