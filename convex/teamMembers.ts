import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTeamMember = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teamMembers", {
      userId: args.userId,
      name: args.name,
      role: args.role,
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const updateTeamMember = mutation({
  args: {
    id: v.id("teamMembers"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const getTeamMembers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

export const initializeDefaultTeamMembers = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const defaultMembers = [
      { name: "Corinne", role: "Owner/Coach" },
      { name: "Sebastian", role: "AI Assistant" },
      { name: "Allie", role: "Virtual Assistant" },
    ];

    for (const member of defaultMembers) {
      await ctx.db.insert("teamMembers", {
        userId: args.userId,
        name: member.name,
        role: member.role,
        active: true,
        createdAt: Date.now(),
      });
    }
  },
});
