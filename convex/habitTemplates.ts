import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createHabitTemplate = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("habitTemplates", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      icon: args.icon,
      active: true,
      order: args.order,
      createdAt: Date.now(),
    });
  },
});

export const updateHabitTemplate = mutation({
  args: {
    id: v.id("habitTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const getHabitTemplates = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitTemplates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("active"), true))
      .order("asc")
      .collect();
  },
});

export const getDailyHabits = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const habits = await ctx.db
      .query("dailyHabits")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();

    // Get template data for each habit
    const habitsWithTemplates = await Promise.all(
      habits.map(async (habit) => {
        const template = await ctx.db.get(habit.habitTemplateId);
        return {
          ...habit,
          template,
        };
      })
    );

    return habitsWithTemplates;
  },
});

export const toggleDailyHabit = mutation({
  args: {
    id: v.id("dailyHabits"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      completed: args.completed,
      completedAt: args.completed ? Date.now() : undefined,
    });
  },
});

export const populateDailyHabits = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if habits already exist for this date
    const existing = await ctx.db
      .query("dailyHabits")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      return { alreadyPopulated: true };
    }

    // Get all active habit templates
    const templates = await ctx.db
      .query("habitTemplates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Create daily habit instances for each template
    for (const template of templates) {
      await ctx.db.insert("dailyHabits", {
        userId: args.userId,
        habitTemplateId: template._id,
        date: args.date,
        completed: false,
      });
    }

    return { created: templates.length };
  },
});

export const initializeDefaultHabitTemplates = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
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
