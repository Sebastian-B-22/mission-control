/**
 * Maven Feedback - Convex Functions
 *
 * Tracks feedback when Corinne rejects or edits Maven's content.
 * Helps Maven learn her voice over time.
 */

import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

// ─── Types ────────────────────────────────────────────────────────────────

const FEEDBACK_TYPE = v.union(v.literal("reject"), v.literal("edit"));

const REJECT_REASON = v.union(
  v.literal("too-salesy"),
  v.literal("off-brand"),
  v.literal("wrong-tone"),
  v.literal("factually-wrong"),
  v.literal("custom")
);

// ─── Queries ──────────────────────────────────────────────────────────────

/** Get all feedback, newest first */
export const listAll = query({
  args: {
    feedbackType: v.optional(FEEDBACK_TYPE),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db
      .query("mavenFeedback")
      .order("desc")
      .collect();

    if (args.feedbackType) {
      items = items.filter((i) => i.feedbackType === args.feedbackType);
    }

    if (args.limit) {
      items = items.slice(0, args.limit);
    }

    return items;
  },
});

/** Get feedback for a specific content item */
export const getByContentId = query({
  args: { contentId: v.id("contentPipeline") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mavenFeedback")
      .withIndex("by_content", (q) => q.eq("contentId", args.contentId))
      .collect();
  },
});

/** Get feedback count for summary */
export const getFeedbackStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("mavenFeedback").collect();
    
    const stats = {
      total: all.length,
      rejects: all.filter(f => f.feedbackType === "reject").length,
      edits: all.filter(f => f.feedbackType === "edit").length,
      byReason: {} as Record<string, number>,
      recentPatterns: [] as string[],
    };

    // Count by reason
    for (const item of all) {
      if (item.reason) {
        stats.byReason[item.reason] = (stats.byReason[item.reason] || 0) + 1;
      }
    }

    // Get recent patterns (last 10 items)
    const recent = all.slice(-10);
    const reasonCounts = recent.reduce((acc, item) => {
      if (item.reason) {
        acc[item.reason] = (acc[item.reason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Find patterns (reasons that appear 3+ times in last 10)
    for (const [reason, count] of Object.entries(reasonCounts)) {
      if (count >= 3) {
        stats.recentPatterns.push(reason);
      }
    }

    return stats;
  },
});

/** Check if we should trigger a pattern summary (every 10 feedback items) */
export const shouldSummarize = query({
  args: {},
  handler: async (ctx) => {
    const count = await ctx.db.query("mavenFeedback").collect();
    return count.length > 0 && count.length % 10 === 0;
  },
});

// ─── Internal Query for Summary Generation ────────────────────────────────

export const getRecentFeedbackForSummary = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("mavenFeedback")
      .order("desc")
      .take(args.limit);
    return items;
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

/** Record a rejection */
export const recordReject = mutation({
  args: {
    contentId: v.optional(v.id("contentPipeline")),
    contentTitle: v.string(),
    contentType: v.string(),
    createdBy: v.string(),
    reason: REJECT_REASON,
    customReason: v.optional(v.string()),
    originalContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("mavenFeedback", {
      contentId: args.contentId,
      feedbackType: "reject",
      reason: args.reason,
      customReason: args.customReason,
      originalContent: args.originalContent,
      contentTitle: args.contentTitle,
      contentType: args.contentType,
      createdBy: args.createdBy,
      reviewedBy: "corinne",
      createdAt: Date.now(),
    });
    return id;
  },
});

/** Record an edit (captures original vs final) */
export const recordEdit = mutation({
  args: {
    contentId: v.optional(v.id("contentPipeline")),
    contentTitle: v.string(),
    contentType: v.string(),
    createdBy: v.string(),
    originalContent: v.string(),
    finalContent: v.string(),
  },
  handler: async (ctx, args) => {
    // Only record if content actually changed
    if (args.originalContent === args.finalContent) {
      return null;
    }

    const id = await ctx.db.insert("mavenFeedback", {
      contentId: args.contentId,
      feedbackType: "edit",
      originalContent: args.originalContent,
      finalContent: args.finalContent,
      contentTitle: args.contentTitle,
      contentType: args.contentType,
      createdBy: args.createdBy,
      reviewedBy: "corinne",
      createdAt: Date.now(),
    });
    return id;
  },
});

/** Delete feedback item */
export const deleteFeedback = mutation({
  args: { id: v.id("mavenFeedback") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
