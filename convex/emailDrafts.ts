/**
 * Email Drafts - Phase 1
 *
 * Simple workflow:
 * draft -> review -> approved -> sent
 *
 * Stores markdown body + lightweight suggestion objects.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const EMAIL_DRAFT_STATUS = v.union(
  v.literal("draft"),
  v.literal("review"),
  v.literal("approved"),
  v.literal("sent")
);

const SUGGESTION_STATUS = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected")
);


export const list = query({
  args: {
    status: v.optional(EMAIL_DRAFT_STATUS),
    tag: v.optional(v.string()),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("emailDrafts").collect();

    if (!args.includeDeleted) items = items.filter((d) => d.deletedAt == null);
    if (args.status) items = items.filter((d) => d.status === args.status);
    if (args.tag) items = items.filter((d) => (d.tags ?? []).includes(args.tag!));

    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getById = query({
  args: { id: v.id("emailDrafts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    bodyMarkdown: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    lastEditedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("emailDrafts", {
      title: args.title,
      bodyMarkdown: args.bodyMarkdown ?? "",
      status: "draft",
      tags: args.tags ?? [],
      suggestions: [],
      createdAt: now,
      updatedAt: now,
      lastEditedBy: args.lastEditedBy ?? "unknown",
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("emailDrafts"),
    title: v.optional(v.string()),
    bodyMarkdown: v.optional(v.string()),
    status: v.optional(EMAIL_DRAFT_STATUS),
    tags: v.optional(v.array(v.string())),
    lastEditedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Email draft not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.bodyMarkdown !== undefined) updates.bodyMarkdown = args.bodyMarkdown;
    if (args.status !== undefined) updates.status = args.status;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.lastEditedBy !== undefined) updates.lastEditedBy = args.lastEditedBy;

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

export const markApproved = mutation({
  args: { id: v.id("emailDrafts"), lastEditedBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Email draft not found");

    await ctx.db.patch(args.id, {
      status: "approved",
      updatedAt: Date.now(),
      lastEditedBy: args.lastEditedBy ?? existing.lastEditedBy,
    });

    return { success: true };
  },
});

// Minimal: suggestions can be created by UI (or stubbed).
export const addSuggestion = mutation({
  args: {
    draftId: v.id("emailDrafts"),
    proposedBodyMarkdown: v.string(),
    author: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Email draft not found");

    const now = Date.now();
    const suggestion = {
      id: `s_${now}_${Math.random().toString(16).slice(2)}`,
      proposedBodyMarkdown: args.proposedBodyMarkdown,
      author: args.author ?? "unknown",
      createdAt: now,
      status: "pending" as const,
    };

    const suggestions = [...(draft.suggestions ?? []), suggestion];

    await ctx.db.patch(args.draftId, {
      suggestions,
      updatedAt: now,
      lastEditedBy: args.author ?? draft.lastEditedBy,
    });

    return { success: true, suggestionId: suggestion.id };
  },
});

export const setSuggestionStatus = mutation({
  args: {
    draftId: v.id("emailDrafts"),
    suggestionId: v.string(),
    status: SUGGESTION_STATUS,
    applyToBody: v.optional(v.boolean()),
    lastEditedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Email draft not found");

    const suggestions = (draft.suggestions ?? []).map((s) =>
      s.id === args.suggestionId ? { ...s, status: args.status } : s
    );

    const matched = (draft.suggestions ?? []).find((s) => s.id === args.suggestionId);
    if (!matched) throw new Error("Suggestion not found");

    const updates: Record<string, unknown> = {
      suggestions,
      updatedAt: Date.now(),
      lastEditedBy: args.lastEditedBy ?? draft.lastEditedBy,
    };

    if (args.status === "accepted" && args.applyToBody) {
      updates.bodyMarkdown = matched.proposedBodyMarkdown;
    }

    await ctx.db.patch(args.draftId, updates);

    return { success: true };
  },
});

export const softDelete = mutation({
  args: { id: v.id("emailDrafts"), deletedBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Email draft not found");

    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
      deletedBy: args.deletedBy ?? "unknown",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const restore = mutation({
  args: { id: v.id("emailDrafts"), restoredBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Email draft not found");

    await ctx.db.patch(args.id, {
      deletedAt: undefined,
      deletedBy: undefined,
      updatedAt: Date.now(),
      lastEditedBy: args.restoredBy ?? existing.lastEditedBy,
    });

    return { success: true };
  },
});
