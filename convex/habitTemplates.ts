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

export const getHabitAccountability = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dayCount = args.days ?? 7;
    const end = new Date(`${args.date}T00:00:00`);
    const start = new Date(end);
    start.setDate(start.getDate() - dayCount + 1);
    const startKey = start.toISOString().slice(0, 10);

    const habits = await ctx.db
      .query("dailyHabits")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId))
      .collect();

    const templates = await ctx.db
      .query("habitTemplates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const templateById = new Map(templates.map((template) => [template._id, template]));

    const windowHabits = habits.filter((habit) => habit.date >= startKey && habit.date <= args.date);
    const todayHabits = windowHabits.filter((habit) => habit.date === args.date);
    const completedToday = todayHabits.filter((habit) => habit.completed).length;

    const byTemplate = new Map<string, { name: string; completed: number; total: number }>();
    for (const habit of windowHabits) {
      const template = templateById.get(habit.habitTemplateId);
      if (!template) continue;
      const key = String(habit.habitTemplateId);
      const current = byTemplate.get(key) || { name: template.name, completed: 0, total: 0 };
      current.total += 1;
      if (habit.completed) current.completed += 1;
      byTemplate.set(key, current);
    }

    const weakSpots = Array.from(byTemplate.values())
      .filter((item) => item.total > 0 && item.completed < item.total)
      .sort((a, b) => (a.completed / a.total) - (b.completed / b.total))
      .slice(0, 3);

    return {
      dayCount,
      today: {
        completed: completedToday,
        total: todayHabits.length,
      },
      weakSpots,
    };
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

export const setDailyHabitWorkoutTypes = mutation({
  args: {
    id: v.id("dailyHabits"),
    workoutTypes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const completed = args.workoutTypes.length > 0;

    await ctx.db.patch(args.id, {
      workoutTypes: args.workoutTypes,
      completed,
      completedAt: completed ? Date.now() : undefined,
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
      { name: "Sleep 7.5 hours", icon: "😴", order: 0 },
      { name: "Morning light", icon: "☀️", order: 1 },
      { name: "Redlight/meditation", icon: "🧘", order: 2 },
      { name: "Rebounder and vibration plate", icon: "🦶", order: 3 },
      { name: "Breath work", icon: "🌬️", order: 4 },
      { name: "Ice bath", icon: "🧊", order: 5 },
      { name: "Workout", icon: "💪", order: 6 },
      { name: "Take all supplements", icon: "💊", order: 7 },
      { name: "Eat a salad", icon: "🥗", order: 8 },
      { name: "Sauna", icon: "🔥", order: 9 },
      { name: "Screens off by 9:30 pm", icon: "📱", order: 10 },
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
