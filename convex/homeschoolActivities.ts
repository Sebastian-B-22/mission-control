import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Activity categories and their activities
export const ACTIVITY_CONFIG = {
  academics: {
    label: "Academics (Auto-tracked)",
    activities: ["Math Academy", "Membean", "Rosetta Stone"],
    icon: "📚",
    autoTracked: true,
  },
  writing: {
    label: "Writing",
    activities: ["Writing with Skill"],
    icon: "✍️",
  },
  history: {
    label: "History",
    activities: ["Tuttle Twins", "Story of the World"],
    icon: "🌍",
  },
  math: {
    label: "Math (Supplemental)",
    activities: ["Wonder Math"],
    icon: "🔢",
  },
  literature: {
    label: "Literature",
    activities: ["Shakespeare", "Read Aloud", "Reading"],
    icon: "📖",
  },
  science: {
    label: "Science",
    activities: ["Experiment", "Nature", "Other"],
    icon: "🧪",
  },
  art: {
    label: "Art",
    activities: ["Drawing", "Painting", "Craft", "Other"],
    icon: "🎨",
  },
  music: {
    label: "Music",
    activities: ["Piano", "Singing", "Listening", "Other"],
    icon: "🎵",
  },
  "life-skills": {
    label: "Life Skills",
    activities: ["Cooking", "Organization", "Money Management", "Other"],
    icon: "🛠️",
  },
  pe: {
    label: "PE",
    activities: [
      "Soccer",
      "Jiu-jitsu",
      "Boxing",
      "Ninja Academy",
      "Rock Climbing",
      "Indoor Skydiving",
      "Sprinting Program",
      "Juggling",
      "Drawing",
      "Other PE",
    ],
    icon: "🏃",
  },
};

// Get activities for a specific date
export const getActivitiesByDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("homeschoolActivities")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();
  },
});

// Get activities for a date range (for weekly view)
export const getActivitiesForWeek = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("homeschoolActivities")
      .withIndex("by_user_date")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    return activities;
  },
});

// Get weekly summary
export const getWeeklySummary = query({
  args: {
    userId: v.id("users"),
    weekOf: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("homeschoolWeeklySummary")
      .withIndex("by_user_week", (q) =>
        q.eq("userId", args.userId).eq("weekOf", args.weekOf)
      )
      .collect();
  },
});

// Log an activity
export const logActivity = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    student: v.string(),
    category: v.string(),
    activity: v.string(),
    completed: v.boolean(),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("homeschoolActivities", {
      userId: args.userId,
      date: args.date,
      student: args.student,
      category: args.category,
      activity: args.activity,
      completed: args.completed,
      durationMinutes: args.durationMinutes,
      notes: args.notes,
      mediaUrl: args.mediaUrl,
      createdAt: Date.now(),
    });
  },
});

// Toggle activity completion
export const toggleActivity = mutation({
  args: {
    id: v.id("homeschoolActivities"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { completed: args.completed });
  },
});

// Update activity (for adding notes, duration, media)
export const updateActivity = mutation({
  args: {
    id: v.id("homeschoolActivities"),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete activity
export const deleteActivity = mutation({
  args: { id: v.id("homeschoolActivities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Quick log - add completed activity in one call
export const quickLog = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    student: v.string(),
    category: v.string(),
    activity: v.string(),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("homeschoolActivities", {
      userId: args.userId,
      date: args.date,
      student: args.student,
      category: args.category,
      activity: args.activity,
      completed: true,
      durationMinutes: args.durationMinutes,
      createdAt: Date.now(),
    });
  },
});

// Get stats for dashboard
export const getDashboardStats = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Get today's activities
    const todayActivities = await ctx.db
      .query("homeschoolActivities")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();

    // Get week start (Monday)
    const today = new Date(args.date);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const weekStart = monday.toISOString().split("T")[0];

    // Get this week's activities
    const weekActivities = await ctx.db
      .query("homeschoolActivities")
      .withIndex("by_user_date")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.gte(q.field("date"), weekStart),
          q.lte(q.field("date"), args.date)
        )
      )
      .collect();

    // Calculate stats
    const todayCompleted = todayActivities.filter((a) => a.completed).length;
    const todayTotal = todayActivities.length;
    const weekCompleted = weekActivities.filter((a) => a.completed).length;
    const weekMinutes = weekActivities.reduce(
      (sum, a) => sum + (a.durationMinutes || 0),
      0
    );

    // Group by category for week
    const byCategory: Record<string, number> = {};
    for (const a of weekActivities) {
      if (a.completed) {
        byCategory[a.category] = (byCategory[a.category] || 0) + 1;
      }
    }

    // Group by student for today
    const byStudent: Record<string, { completed: number; total: number }> = {
      anthony: { completed: 0, total: 0 },
      roma: { completed: 0, total: 0 },
    };

    for (const a of todayActivities) {
      if (a.student === "both") {
        byStudent.anthony.total++;
        byStudent.roma.total++;
        if (a.completed) {
          byStudent.anthony.completed++;
          byStudent.roma.completed++;
        }
      } else if (byStudent[a.student]) {
        byStudent[a.student].total++;
        if (a.completed) {
          byStudent[a.student].completed++;
        }
      }
    }

    return {
      today: {
        completed: todayCompleted,
        total: todayTotal,
        activities: todayActivities,
      },
      week: {
        completed: weekCompleted,
        minutes: weekMinutes,
        byCategory,
      },
      byStudent,
    };
  },
});
