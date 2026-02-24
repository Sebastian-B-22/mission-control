/**
 * Content Pipeline - Convex Functions
 *
 * Agents drop content drafts here. Corinne reviews and approves.
 *
 * Stages: idea → review → approved → published
 * Types:  x-post | email | blog | landing-page | other
 */

import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// ─── Types ────────────────────────────────────────────────────────────────

const CONTENT_TYPE = v.union(
  v.literal("x-post"),
  v.literal("email"),
  v.literal("blog"),
  v.literal("landing-page"),
  v.literal("other")
);

const CONTENT_STAGE = v.union(
  v.literal("idea"),
  v.literal("review"),
  v.literal("approved"),
  v.literal("published")
);

// ─── Public Queries ────────────────────────────────────────────────────────

/** Get all content, optionally filtered by type */
export const listAll = query({
  args: {
    type: v.optional(CONTENT_TYPE),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("contentPipeline").collect();

    if (args.type) {
      items = items.filter((i) => i.type === args.type);
    }
    if (args.createdBy) {
      items = items.filter((i) => i.createdBy === args.createdBy);
    }

    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/** Get content at a specific stage */
export const listByStage = query({
  args: {
    stage: CONTENT_STAGE,
    type: v.optional(CONTENT_TYPE),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db
      .query("contentPipeline")
      .withIndex("by_stage", (q) => q.eq("stage", args.stage))
      .collect();

    if (args.type) {
      items = items.filter((i) => i.type === args.type);
    }

    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/** Get a single content item */
export const getById = query({
  args: { id: v.id("contentPipeline") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Public Mutations (UI) ─────────────────────────────────────────────────

/** Create a new content item - used by UI and agents */
export const createContent = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: CONTENT_TYPE,
    stage: v.optional(CONTENT_STAGE),
    createdBy: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const initialStage = args.stage ?? "review";
    const id = await ctx.db.insert("contentPipeline", {
      title: args.title,
      content: args.content,
      type: args.type,
      stage: initialStage,
      createdBy: args.createdBy ?? "sebastian",
      assignedTo: args.assignedTo ?? "corinne",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
      verificationStatus: initialStage === "review" ? "pending" : undefined,
    });

    if (initialStage === "review") {
      await ctx.scheduler.runAfter(0, internal.contentVerification.verifyContentAction, { contentId: id });
    }

    return id;
  },
});

/** Move content to a different stage */
export const updateStage = mutation({
  args: {
    id: v.id("contentPipeline"),
    stage: CONTENT_STAGE,
    notes: v.optional(v.string()),
    publishedUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Content item not found");

    const updates: Record<string, unknown> = {
      stage: args.stage,
      updatedAt: Date.now(),
    };
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.publishedUrl !== undefined) updates.publishedUrl = args.publishedUrl;

    await ctx.db.patch(args.id, updates);

    if (args.stage === "review") {
      await ctx.db.patch(args.id, { verificationStatus: "pending", updatedAt: Date.now() });
      await ctx.scheduler.runAfter(0, internal.contentVerification.verifyContentAction, { contentId: args.id });
    }

    return { success: true };
  },
});

/** Edit the content text and/or title */
export const updateContent = mutation({
  args: {
    id: v.id("contentPipeline"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    notes: v.optional(v.string()),
    type: v.optional(CONTENT_TYPE),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Content item not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.type !== undefined) updates.type = args.type;

    await ctx.db.patch(args.id, updates);

    if (item.stage === "review" && (args.content !== undefined || args.type !== undefined)) {
      await ctx.db.patch(args.id, { verificationStatus: "pending", updatedAt: Date.now() });
      await ctx.scheduler.runAfter(0, internal.contentVerification.verifyContentAction, { contentId: args.id });
    }

    return { success: true };
  },
});

/** Delete a content item */
export const deleteContent = mutation({
  args: { id: v.id("contentPipeline") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ─── Internal Versions (called from HTTP actions) ─────────────────────────

/** Internal: Create content - used by HTTP endpoint */
export const createContentInternal = internalMutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: CONTENT_TYPE,
    stage: v.optional(CONTENT_STAGE),
    createdBy: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const initialStage = args.stage ?? "review";
    const id = await ctx.db.insert("contentPipeline", {
      title: args.title,
      content: args.content,
      type: args.type,
      stage: initialStage,
      createdBy: args.createdBy ?? "sebastian",
      assignedTo: args.assignedTo ?? "corinne",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
      verificationStatus: initialStage === "review" ? "pending" : undefined,
    });

    if (initialStage === "review") {
      await ctx.scheduler.runAfter(0, internal.contentVerification.verifyContentAction, { contentId: id });
    }

    return id;
  },
});

/** Internal: Update stage */
export const updateStageInternal = internalMutation({
  args: {
    id: v.id("contentPipeline"),
    stage: CONTENT_STAGE,
    notes: v.optional(v.string()),
    publishedUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Content item not found: " + args.id);

    const updates: Record<string, unknown> = {
      stage: args.stage,
      updatedAt: Date.now(),
    };
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.publishedUrl !== undefined) updates.publishedUrl = args.publishedUrl;

    await ctx.db.patch(args.id, updates);

    if (args.stage === "review") {
      await ctx.db.patch(args.id, { verificationStatus: "pending", updatedAt: Date.now() });
      await ctx.scheduler.runAfter(0, internal.contentVerification.verifyContentAction, { contentId: args.id });
    }

    return { success: true };
  },
});

/** Internal: List all content */
export const listAllInternal = internalQuery({
  args: {
    stage: v.optional(CONTENT_STAGE),
    type: v.optional(CONTENT_TYPE),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("contentPipeline").collect();

    if (args.stage) items = items.filter((i) => i.stage === args.stage);
    if (args.type) items = items.filter((i) => i.type === args.type);
    if (args.createdBy) items = items.filter((i) => i.createdBy === args.createdBy);

    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
