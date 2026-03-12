import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_STEPS = {
  projectsBasics: false,
  pendingNextUp: false,
  overnightInbox: false,
  gatewayConnectivity: false,
  runHealthChecks: false,
};

export const getOrCreate = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("onboardingState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return existing;

    // Convex queries can't write, so return a computed default shape.
    // Client should call ensure() mutation if it needs persistence.
    return {
      _id: null,
      userId: args.userId,
      dismissed: false,
      steps: DEFAULT_STEPS,
      createdAt: 0,
      updatedAt: 0,
    } as any;
  },
});

export const ensure = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("onboardingState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("onboardingState", {
      userId: args.userId,
      dismissed: false,
      steps: DEFAULT_STEPS,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const setStep = mutation({
  args: {
    userId: v.id("users"),
    step: v.union(
      v.literal("projectsBasics"),
      v.literal("pendingNextUp"),
      v.literal("overnightInbox"),
      v.literal("gatewayConnectivity"),
      v.literal("runHealthChecks")
    ),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("onboardingState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (!existing) {
      return await ctx.db.insert("onboardingState", {
        userId: args.userId,
        dismissed: false,
        steps: { ...DEFAULT_STEPS, [args.step]: args.completed },
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(existing._id, {
      steps: { ...existing.steps, [args.step]: args.completed },
      updatedAt: now,
    });

    return existing._id;
  },
});

export const dismiss = mutation({
  args: { userId: v.id("users"), dismissed: v.boolean() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("onboardingState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (!existing) {
      return await ctx.db.insert("onboardingState", {
        userId: args.userId,
        dismissed: args.dismissed,
        steps: DEFAULT_STEPS,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(existing._id, {
      dismissed: args.dismissed,
      updatedAt: now,
    });

    return existing._id;
  },
});

export const reset = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("onboardingState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (!existing) {
      return await ctx.db.insert("onboardingState", {
        userId: args.userId,
        dismissed: false,
        steps: DEFAULT_STEPS,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(existing._id, {
      dismissed: false,
      steps: DEFAULT_STEPS,
      updatedAt: now,
    });

    return existing._id;
  },
});
