import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Admin function to manually initialize user data
export const manuallyInitializeUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already initialized
    const existingTeamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingTeamMembers) {
      return { message: "User already initialized" };
    }

    // Initialize team members
    const defaultMembers = [
      { name: "Corinne", role: "Owner/Coach" },
      { name: "Sebastian", role: "AI Assistant" },
      { name: "Allie", role: "Virtual Assistant" },
    ];

    for (const member of defaultMembers) {
      await ctx.db.insert("teamMembers", {
        userId: user._id,
        name: member.name,
        role: member.role,
        active: true,
        createdAt: Date.now(),
      });
    }

    // Initialize habit templates (if not exist)
    const existingHabits = await ctx.db
      .query("habitTemplates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!existingHabits) {
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
          userId: user._id,
          name: habit.name,
          icon: habit.icon,
          active: true,
          order: habit.order,
          createdAt: Date.now(),
        });
      }
    }

    return { message: "User initialized successfully!" };
  },
});

// Query to check user setup
export const checkUserSetup = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { exists: false };
    }

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const habitTemplates = await ctx.db
      .query("habitTemplates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const rpmCategories = await ctx.db
      .query("rpmCategories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      exists: true,
      userId: user._id,
      teamMembersCount: teamMembers.length,
      habitTemplatesCount: habitTemplates.length,
      rpmCategoriesCount: rpmCategories.length,
    };
  },
});
