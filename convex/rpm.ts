import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createCategory = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("personal"), v.literal("professional")),
    yearlyGoals: v.array(v.string()),
    monthlyFocus: v.array(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rpmCategories", args);
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("rpmCategories"),
    yearlyGoals: v.optional(v.array(v.string())),
    monthlyFocus: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const getCategoriesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rpmCategories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const initializeDefaultCategories = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const personalCategories = [
      "Magnificent Mommy/Homeschooling Hero",
      "Financial Independence & Freedom",
      "Home Haven & Sanctuary",
      "Bangin' Ass Body",
      "Extraordinary Friendships",
      "Phenomenal Relationship",
    ];

    const professionalCategories = [
      "Bad Ass Business Owner",
      "HTA Empire Builder",
      "Staff Empowerment & Kickass Workplace",
      "Marketing & Networking Genius",
      "Operational Systems Guru",
      "Program Innovation & Excellence",
    ];

    let order = 0;

    for (const name of personalCategories) {
      await ctx.db.insert("rpmCategories", {
        userId: args.userId,
        name,
        type: "personal",
        yearlyGoals: [],
        monthlyFocus: [],
        order: order++,
      });
    }

    for (const name of professionalCategories) {
      await ctx.db.insert("rpmCategories", {
        userId: args.userId,
        name,
        type: "professional",
        yearlyGoals: [],
        monthlyFocus: [],
        order: order++,
      });
    }
  },
});
