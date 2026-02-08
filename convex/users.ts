import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      createdAt: Date.now(),
    });

    // Initialize default data for new user
    await ctx.scheduler.runAfter(0, internal.users.initializeUserData, { userId });

    return userId;
  },
});

export const initializeUserData = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Initialize RPM categories
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

    // Initialize team members
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

    // Initialize habit templates
    const defaultHabits = [
      { name: "Morning light", icon: "☀️", order: 0 },
      { name: "Redlight/meditation", icon: "🧘", order: 1 },
      { name: "Workout before 8am", icon: "💪", order: 2 },
      { name: "Take all supplements", icon: "💊", order: 3 },
      { name: "Ice bath", icon: "🧊", order: 4 },
      { name: "Sauna", icon: "🔥", order: 5 },
      { name: "Screens off by 9:30 pm", icon: "📱", order: 6 },
      { name: "Sleep 7.5 hours", icon: "😴", order: 7 },
    ];

    for (const habit of defaultHabits) {
      await ctx.db.insert("habitTemplates", {
        userId: args.userId,
        name: habit.name,
        icon: habit.icon,
        active: true,
        order: habit.order,
        createdAt: Date.now(),
      });
    }
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});
