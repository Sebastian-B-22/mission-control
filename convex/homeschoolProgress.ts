// Homeschool Progress Tracking - Convex Functions
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Get latest progress for a student across all platforms
 */
export const getStudentProgress = query({
  args: { studentName: v.string() },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("homeschoolProgress")
      .withIndex("by_student", (q) => q.eq("studentName", args.studentName))
      .order("desc")
      .collect();
    
    // Group by platform, keep only latest for each
    const latestByPlatform = new Map<string, typeof progress[0]>();
    for (const p of progress) {
      if (!latestByPlatform.has(p.platform)) {
        latestByPlatform.set(p.platform, p);
      }
    }
    
    return Array.from(latestByPlatform.values());
  },
});

/**
 * Get progress for all students (dashboard view)
 */
export const getAllProgress = query({
  args: {},
  handler: async (ctx) => {
    const progress = await ctx.db
      .query("homeschoolProgress")
      .order("desc")
      .take(100);
    
    // Group by student -> platform
    const byStudent: Record<string, Record<string, typeof progress[0]>> = {};
    
    for (const p of progress) {
      if (!byStudent[p.studentName]) {
        byStudent[p.studentName] = {};
      }
      if (!byStudent[p.studentName][p.platform]) {
        byStudent[p.studentName][p.platform] = p;
      }
    }
    
    return byStudent;
  },
});

/**
 * Get today's completion status for all students
 */
export const getTodayStatus = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const todayStart = new Date(today).getTime();
    
    const progress = await ctx.db
      .query("homeschoolProgress")
      .withIndex("by_scraped_at")
      .filter((q) => q.gte(q.field("scrapedAt"), todayStart))
      .collect();
    
    // Aggregate by student
    const status: Record<string, {
      completed: string[];
      pending: string[];
      lastUpdate: number;
    }> = {
      Anthony: { completed: [], pending: [], lastUpdate: 0 },
      Roma: { completed: [], pending: [], lastUpdate: 0 },
    };
    
    for (const p of progress) {
      const student = status[p.studentName];
      if (student) {
        if (p.todayCompleted) {
          if (!student.completed.includes(p.platform)) {
            student.completed.push(p.platform);
          }
        } else {
          if (!student.pending.includes(p.platform)) {
            student.pending.push(p.platform);
          }
        }
        student.lastUpdate = Math.max(student.lastUpdate, p.scrapedAt);
      }
    }
    
    return status;
  },
});

/**
 * Get weekly summary for a student
 */
export const getWeeklySummary = query({
  args: { studentName: v.string() },
  handler: async (ctx, args) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const progress = await ctx.db
      .query("homeschoolProgress")
      .withIndex("by_student", (q) => q.eq("studentName", args.studentName))
      .filter((q) => q.gte(q.field("scrapedAt"), weekAgo))
      .collect();
    
    // Aggregate by platform
    const summary: Record<string, {
      totalMinutes: number;
      daysActive: number;
      completions: number;
      latestDetails: unknown;
    }> = {};
    
    const daysSeen = new Map<string, Set<string>>();
    
    for (const p of progress) {
      if (!summary[p.platform]) {
        summary[p.platform] = {
          totalMinutes: 0,
          daysActive: 0,
          completions: 0,
          latestDetails: null,
        };
        daysSeen.set(p.platform, new Set());
      }
      
      const day = new Date(p.scrapedAt).toISOString().split("T")[0];
      daysSeen.get(p.platform)!.add(day);
      
      summary[p.platform].totalMinutes = Math.max(
        summary[p.platform].totalMinutes,
        p.weeklyMinutes || 0
      );
      
      if (p.todayCompleted) {
        summary[p.platform].completions++;
      }
      
      if (!summary[p.platform].latestDetails || p.scrapedAt > (summary[p.platform] as any)._lastScrape) {
        summary[p.platform].latestDetails = p.details;
        (summary[p.platform] as any)._lastScrape = p.scrapedAt;
      }
    }
    
    for (const [platform, days] of daysSeen) {
      summary[platform].daysActive = days.size;
    }
    
    return summary;
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Save progress data from scrapers
 */
export const saveProgress = mutation({
  args: {
    studentName: v.string(),
    platform: v.string(),
    lastActivity: v.string(), // ISO string
    todayCompleted: v.boolean(),
    weeklyMinutes: v.number(),
    streak: v.optional(v.number()),
    level: v.optional(v.string()),
    details: v.any(), // Platform-specific data
    scrapedAt: v.string(), // ISO string
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("homeschoolProgress", {
      studentName: args.studentName,
      platform: args.platform,
      lastActivity: new Date(args.lastActivity).getTime(),
      todayCompleted: args.todayCompleted,
      weeklyMinutes: args.weeklyMinutes,
      streak: args.streak,
      level: args.level,
      details: args.details,
      scrapedAt: new Date(args.scrapedAt).getTime(),
    });
    
    return id;
  },
});

/**
 * Manually mark a platform as completed for today
 */
export const markCompleted = mutation({
  args: {
    studentName: v.string(),
    platform: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the latest entry for this student/platform
    const latest = await ctx.db
      .query("homeschoolProgress")
      .withIndex("by_student_platform", (q) => 
        q.eq("studentName", args.studentName).eq("platform", args.platform)
      )
      .order("desc")
      .first();
    
    if (latest) {
      await ctx.db.patch(latest._id, {
        todayCompleted: true,
        lastActivity: Date.now(),
      });
      return latest._id;
    }
    
    // Create new entry if none exists
    return await ctx.db.insert("homeschoolProgress", {
      studentName: args.studentName,
      platform: args.platform,
      lastActivity: Date.now(),
      todayCompleted: true,
      weeklyMinutes: 0,
      details: { manualEntry: true },
      scrapedAt: Date.now(),
    });
  },
});

/**
 * Clean up old progress records (keep last 30 days)
 */
export const cleanupOldRecords = mutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const oldRecords = await ctx.db
      .query("homeschoolProgress")
      .filter((q) => q.lt(q.field("scrapedAt"), thirtyDaysAgo))
      .collect();
    
    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }
    
    return { deleted: oldRecords.length };
  },
});
