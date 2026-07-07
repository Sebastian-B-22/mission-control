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

function normalizeGoalText(text: string) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

export const listCarryOverCandidates = query({
  args: {
    userId: v.id("users"),
    fromWeekOf: v.string(),
    toWeekOf: v.string(),
  },
  handler: async (ctx, args) => {
    const [previousGoals, currentGoals] = await Promise.all([
      ctx.db
        .query("weeklyGoals")
        .withIndex("by_user_week", (q) =>
          q.eq("userId", args.userId).eq("weekOf", args.fromWeekOf)
        )
        .collect(),
      ctx.db
        .query("weeklyGoals")
        .withIndex("by_user_week", (q) =>
          q.eq("userId", args.userId).eq("weekOf", args.toWeekOf)
        )
        .collect(),
    ]);

    const currentText = new Set(currentGoals.map((goal) => normalizeGoalText(goal.text)));

    return previousGoals
      .filter((goal) => !goal.done && !currentText.has(normalizeGoalText(goal.text)))
      .sort((a, b) => a.order - b.order);
  },
});

export const add = mutation({
  args: {
    userId: v.id("users"),
    weekOf: v.string(),
    text: v.string(),
    categoryId: v.optional(v.id("rpmCategories")),
    scheduledDay: v.optional(v.number()), // 0=Mon, 1=Tue, ... 6=Sun
    important: v.optional(v.boolean()),
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
      scheduledDay: args.scheduledDay,
      important: args.important ?? false,
      done: false,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const carryOverUnchecked = mutation({
  args: {
    userId: v.id("users"),
    fromWeekOf: v.string(),
    toWeekOf: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.fromWeekOf === args.toWeekOf) {
      return { copied: 0 };
    }

    const [previousGoals, currentGoals] = await Promise.all([
      ctx.db
        .query("weeklyGoals")
        .withIndex("by_user_week", (q) =>
          q.eq("userId", args.userId).eq("weekOf", args.fromWeekOf)
        )
        .collect(),
      ctx.db
        .query("weeklyGoals")
        .withIndex("by_user_week", (q) =>
          q.eq("userId", args.userId).eq("weekOf", args.toWeekOf)
        )
        .collect(),
    ]);

    const currentText = new Set(currentGoals.map((goal) => normalizeGoalText(goal.text)));
    const candidates = previousGoals
      .filter((goal) => !goal.done && !currentText.has(normalizeGoalText(goal.text)))
      .sort((a, b) => a.order - b.order);

    if (candidates.length === 0) {
      return { copied: 0 };
    }

    const now = Date.now();
    const maxOrder = currentGoals.reduce((m, goal) => Math.max(m, goal.order), -1);

    await Promise.all(
      candidates.map((goal, index) =>
        ctx.db.insert("weeklyGoals", {
          userId: args.userId,
          weekOf: args.toWeekOf,
          text: goal.text,
          categoryId: goal.categoryId,
          scheduledDay: goal.scheduledDay,
          important: goal.important ?? false,
          done: false,
          order: maxOrder + index + 1,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return { copied: candidates.length };
  },
});

export const setScheduledDay = mutation({
  args: { 
    goalId: v.id("weeklyGoals"), 
    scheduledDay: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, { 
      scheduledDay: args.scheduledDay ?? undefined, 
      updatedAt: Date.now() 
    });
  },
});

export const updateGoalCategory = mutation({
  args: {
    goalId: v.id("weeklyGoals"),
    categoryId: v.union(v.id("rpmCategories"), v.null()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, {
      categoryId: args.categoryId ?? undefined,
      updatedAt: Date.now(),
    });
  },
});

export const reorderGoals = mutation({
  args: {
    orderedGoalIds: v.array(v.id("weeklyGoals")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.orderedGoalIds.map((goalId, index) =>
        ctx.db.patch(goalId, { order: index, updatedAt: Date.now() })
      )
    );
  },
});

export const toggleDone = mutation({
  args: { goalId: v.id("weeklyGoals"), done: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, { done: args.done, updatedAt: Date.now() });
  },
});

export const toggleImportant = mutation({
  args: { goalId: v.id("weeklyGoals"), important: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, { important: args.important, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { goalId: v.id("weeklyGoals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.goalId);
  },
});
