import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ==========================================
// QUARTERS
// ==========================================

export const getQuarters = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("hsQuarters").order("desc").collect();
  },
});

export const getCurrentQuarter = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const quarters = await ctx.db.query("hsQuarters").collect();
    return quarters.find((q) => q.startDate <= today && q.endDate >= today);
  },
});

export const createQuarter = mutation({
  args: {
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    theme: v.string(),
    objectives: v.array(v.string()),
    tripTieIn: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hsQuarters", args);
  },
});

// ==========================================
// MONTHLY FOCUS
// ==========================================

export const getMonthlyFocus = query({
  args: { quarterId: v.optional(v.id("hsQuarters")) },
  handler: async (ctx, args) => {
    if (args.quarterId) {
      return await ctx.db
        .query("hsMonthlyFocus")
        .withIndex("by_quarter", (q) => q.eq("quarterId", args.quarterId!))
        .collect();
    }
    return await ctx.db.query("hsMonthlyFocus").collect();
  },
});

export const createMonthlyFocus = mutation({
  args: {
    quarterId: v.id("hsQuarters"),
    month: v.string(),
    theme: v.string(),
    objectives: v.array(v.string()),
    keyResources: v.array(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hsMonthlyFocus", args);
  },
});

// ==========================================
// RESOURCES
// ==========================================

export const getResources = query({
  args: {
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;
    
    if (args.type) {
      results = await ctx.db
        .query("hsResources")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    } else {
      results = await ctx.db.query("hsResources").collect();
    }

    if (args.category) {
      const cat = args.category.toLowerCase();
      // Match category field OR any subject in subjects array
      return results
        .filter((r) => 
          r.category?.toLowerCase() === cat || 
          r.subjects?.some((s) => s.toLowerCase() === cat || s.toLowerCase().includes(cat))
        )
        .slice(0, args.limit || 100);
    }

    return results.slice(0, args.limit || 100);
  },
});

export const searchResources = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("hsResources")
      .withSearchIndex("search_resources", (q) => q.search("name", args.searchTerm))
      .take(20);
  },
});

export const getResourcesBySubject = query({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("hsResources").collect();
    return all.filter((r) => r.subjects.includes(args.subject));
  },
});

export const createResource = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    subjects: v.array(v.string()),
    ageRange: v.optional(v.string()),
    timeNeeded: v.optional(v.string()),
    location: v.optional(v.string()),
    isDigital: v.boolean(),
    url: v.optional(v.string()),
    series: v.optional(v.string()),
    author: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hsResources", {
      ...args,
      lastUsed: undefined,
      timesUsed: 0,
    });
  },
});

export const bulkCreateResources = mutation({
  args: {
    resources: v.array(
      v.object({
        name: v.string(),
        type: v.string(),
        category: v.string(),
        subcategory: v.optional(v.string()),
        subjects: v.array(v.string()),
        ageRange: v.optional(v.string()),
        timeNeeded: v.optional(v.string()),
        location: v.optional(v.string()),
        isDigital: v.boolean(),
        url: v.optional(v.string()),
        series: v.optional(v.string()),
        author: v.optional(v.string()),
        notes: v.optional(v.string()),
        tags: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const resource of args.resources) {
      const id = await ctx.db.insert("hsResources", {
        ...resource,
        lastUsed: undefined,
        timesUsed: 0,
      });
      ids.push(id);
    }
    return ids;
  },
});

export const markResourceUsed = mutation({
  args: { resourceId: v.id("hsResources") },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.resourceId);
    if (resource) {
      await ctx.db.patch(args.resourceId, {
        lastUsed: Date.now(),
        timesUsed: (resource.timesUsed || 0) + 1,
      });
    }
  },
});

export const updateResource = mutation({
  args: {
    resourceId: v.id("hsResources"),
    updates: v.object({
      name: v.optional(v.string()),
      type: v.optional(v.string()),
      category: v.optional(v.string()),
      subjects: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      location: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.resourceId);
    if (resource) {
      await ctx.db.patch(args.resourceId, args.updates);
    }
    return args.resourceId;
  },
});

export const deleteResource = mutation({
  args: { resourceId: v.id("hsResources") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.resourceId);
    return args.resourceId;
  },
});

// ==========================================
// WEEKLY TEMPLATE
// ==========================================

export const getWeeklyTemplate = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("hsWeeklyTemplate")
      .withIndex("by_day")
      .collect();
  },
});

export const getDayTemplate = query({
  args: { dayOfWeek: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("hsWeeklyTemplate")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", args.dayOfWeek))
      .first();
  },
});

export const upsertDayTemplate = mutation({
  args: {
    dayOfWeek: v.number(),
    dayName: v.string(),
    blocks: v.array(
      v.object({
        id: v.string(),
        startTime: v.string(),
        endTime: v.string(),
        subject: v.string(),
        defaultActivity: v.string(),
        isDigital: v.boolean(),
        notes: v.optional(v.string()),
        color: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hsWeeklyTemplate")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", args.dayOfWeek))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        dayName: args.dayName,
        blocks: args.blocks,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("hsWeeklyTemplate", args);
    }
  },
});

// ==========================================
// DAILY SCHEDULE
// ==========================================

export const getTodaySchedule = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    return await ctx.db
      .query("hsDailySchedule")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();
  },
});

export const getScheduleForDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("hsDailySchedule")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
  },
});

export const getWeekSchedule = query({
  args: { weekStart: v.string() }, // Monday of the week
  handler: async (ctx, args) => {
    const startDate = new Date(args.weekStart);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const schedules = await Promise.all(
      dates.map((date) =>
        ctx.db
          .query("hsDailySchedule")
          .withIndex("by_date", (q) => q.eq("date", date))
          .first()
      )
    );

    return dates.map((date, i) => ({
      date,
      schedule: schedules[i],
    }));
  },
});

export const createDailySchedule = mutation({
  args: {
    date: v.string(),
    dayOfWeek: v.number(),
    quarterId: v.optional(v.id("hsQuarters")),
    monthlyFocusId: v.optional(v.id("hsMonthlyFocus")),
    blocks: v.array(
      v.object({
        id: v.string(),
        startTime: v.string(),
        endTime: v.string(),
        subject: v.string(),
        activity: v.string(),
        resourceIds: v.optional(v.array(v.string())),
        resourceNames: v.optional(v.array(v.string())),
        notes: v.optional(v.string()),
        color: v.optional(v.string()),
        completed: v.optional(v.boolean()),
        completedAt: v.optional(v.string()),
        completionNotes: v.optional(v.string()),
        skipped: v.optional(v.boolean()),
        skipReason: v.optional(v.string()),
      })
    ),
    overallNotes: v.optional(v.string()),
    isHoliday: v.optional(v.boolean()),
    holidayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if schedule already exists for this date
    const existing = await ctx.db
      .query("hsDailySchedule")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    // Transform args to match schema types
    const scheduleData = {
      date: args.date,
      dayOfWeek: args.dayOfWeek,
      blocks: args.blocks.map((b) => ({
        ...b,
        resourceIds: b.resourceIds as any,
        completedAt: b.completedAt ? parseInt(b.completedAt) : undefined,
      })),
      notes: args.overallNotes,
    };

    if (existing) {
      await ctx.db.patch(existing._id, scheduleData as any);
      return existing._id;
    }

    return await ctx.db.insert("hsDailySchedule", scheduleData as any);
  },
});

export const generateDailyFromTemplate = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const dateObj = new Date(args.date);
    const dayOfWeek = dateObj.getDay();

    // Get template for this day
    const template = await ctx.db
      .query("hsWeeklyTemplate")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", dayOfWeek))
      .first();

    if (!template) {
      return null;
    }

    // Convert template blocks to daily blocks
    const blocks = template.blocks.map((b) => ({
      id: b.id,
      startTime: b.startTime,
      endTime: b.endTime,
      subject: b.subject,
      activity: b.defaultActivity,
      notes: b.notes,
      color: b.color,
      completed: false,
    }));

    return await ctx.db.insert("hsDailySchedule", {
      date: args.date,
      dayOfWeek,
      blocks,
    });
  },
});

// ==========================================
// COMPLETIONS
// ==========================================

export const markBlockComplete = mutation({
  args: {
    date: v.string(),
    blockId: v.string(),
    completed: v.boolean(),
    notes: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db
      .query("hsDailySchedule")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (!schedule) return null;

    const updatedBlocks = schedule.blocks.map((block) => {
      if (block.id === args.blockId) {
        return {
          ...block,
          completed: args.completed,
          completedAt: args.completed ? Date.now() : undefined,
        };
      }
      return block;
    });

    await ctx.db.patch(schedule._id, { blocks: updatedBlocks as any });

    // Also log to completions table
    const block = schedule.blocks.find((b) => b.id === args.blockId);
    if (block && args.completed) {
      await ctx.db.insert("hsCompletions", {
        date: args.date,
        blockId: args.blockId,
        subject: block.subject,
        activity: block.activity,
        completedAt: Date.now(),
      } as any);
    }

    return schedule._id;
  },
});

export const skipBlock = mutation({
  args: {
    date: v.string(),
    blockId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db
      .query("hsDailySchedule")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (!schedule) return null;

    const updatedBlocks = schedule.blocks.map((block) => {
      if (block.id === args.blockId) {
        return {
          ...block,
          skipped: true,
          skipReason: args.reason,
        };
      }
      return block;
    });

    await ctx.db.patch(schedule._id, { blocks: updatedBlocks });
    return schedule._id;
  },
});

export const getCompletionStats = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const completions = await ctx.db.query("hsCompletions").collect();

    const filtered = completions.filter(
      (c) => c.date >= args.startDate && c.date <= args.endDate
    );

    // Group by subject
    const bySubject: Record<string, number> = {};
    filtered.forEach((c) => {
      bySubject[c.subject] = (bySubject[c.subject] || 0) + 1;
    });

    return {
      total: filtered.length,
      bySubject,
      completions: filtered,
    };
  },
});

// ==========================================
// MORNING BRIEF HELPER
// ==========================================

export const getMorningBriefHomeschool = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const schedule = await ctx.db
      .query("hsDailySchedule")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (!schedule) {
      return {
        hasSchedule: false,
        message: "No homeschool schedule set for today",
      };
    }

    if ((schedule as any).isHoliday) {
      return {
        hasSchedule: true,
        isHoliday: true,
        message: `Holiday: ${(schedule as any).holidayName || "Day off"}`,
      };
    }

    const pendingBlocks = schedule.blocks.filter(
      (b) => !b.completed && !b.skipped
    );
    const completedBlocks = schedule.blocks.filter((b) => b.completed);

    return {
      hasSchedule: true,
      totalBlocks: schedule.blocks.length,
      completedCount: completedBlocks.length,
      pendingCount: pendingBlocks.length,
      blocks: schedule.blocks.map((b) => ({
        time: `${b.startTime}-${b.endTime}`,
        subject: b.subject,
        activity: b.activity,
        resources: b.resourceNames || [],
        completed: b.completed || false,
        skipped: b.skipped || false,
      })),
      summary: pendingBlocks
        .map((b) => `${b.startTime}: ${b.subject} (${b.activity})`)
        .join(", "),
    };
  },
});

// ==========================================
// SUGGESTIONS
// ==========================================

export const suggestResources = query({
  args: {
    subject: v.string(),
    excludeRecentlyUsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("hsResources").collect();

    let filtered = all.filter((r) =>
      r.subjects.some((s) => s.toLowerCase().includes(args.subject.toLowerCase()))
    );

    if (args.excludeRecentlyUsed) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.getTime();

      filtered = filtered.filter((r) => !r.lastUsed || r.lastUsed < cutoff);
    }

    // Sort by least recently used
    filtered.sort((a, b) => {
      if (!a.lastUsed) return -1;
      if (!b.lastUsed) return 1;
      return a.lastUsed - b.lastUsed;
    });

    return filtered.slice(0, 10);
  },
});

export const getForgottenResources = query({
  args: { daysSinceUsed: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.daysSinceUsed || 60;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.getTime();

    const all = await ctx.db.query("hsResources").collect();

    return all.filter((r) => !r.lastUsed || r.lastUsed < cutoff);
  },
});
