import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByWeek = query({
  args: { userId: v.id("users"), weekOf: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_week", (q) => q.eq("userId", args.userId).eq("weekOf", args.weekOf))
      .collect();

    return goals.sort((a, b) => a.order - b.order);
  },
});

export const add = mutation({
  args: {
    userId: v.id("users"),
    weekOf: v.string(),
    text: v.string(),
    categoryId: v.optional(v.id("rpmCategories")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_week", (q) => q.eq("userId", args.userId).eq("weekOf", args.weekOf))
      .collect();

    const maxOrder = existing.reduce((m, g) => Math.max(m, g.order), -1);

    return await ctx.db.insert("weeklyGoals", {
      userId: args.userId,
      weekOf: args.weekOf,
      text: args.text,
      categoryId: args.categoryId,
      done: false,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const toggleDone = mutation({
  args: { goalId: v.id("weeklyGoals"), done: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, { done: args.done, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { goalId: v.id("weeklyGoals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.goalId);
  },
});
