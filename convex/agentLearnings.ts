import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SCOPE_TYPE = v.union(
  v.literal("global"),
  v.literal("business"),
  v.literal("platform"),
  v.literal("contentType"),
  v.literal("agent"),
  v.literal("section")
);

const LEARNING_STATUS = v.union(
  v.literal("proposed"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("archived")
);

const SOURCE_TYPE = v.union(
  v.literal("content_edit"),
  v.literal("content_reject"),
  v.literal("manual"),
  v.literal("agent_observation")
);

export const list = query({
  args: {
    status: v.optional(LEARNING_STATUS),
    scopeType: v.optional(SCOPE_TYPE),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items = args.status
      ? await ctx.db
          .query("agentLearnings")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("agentLearnings").collect();

    if (args.scopeType) {
      items = items.filter((i) => i.scopeType === args.scopeType);
    }

    items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return items.slice(0, args.limit ?? 100);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    learning: v.string(),
    scopeType: SCOPE_TYPE,
    scopeKey: v.optional(v.string()),
    proposedBy: v.optional(v.string()),
    status: v.optional(LEARNING_STATUS),
    sourceType: SOURCE_TYPE,
    sourceContentId: v.optional(v.id("contentPipeline")),
    confidence: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentLearnings", {
      title: args.title,
      learning: args.learning,
      scopeType: args.scopeType,
      scopeKey: args.scopeKey,
      proposedBy: args.proposedBy ?? "sebastian",
      status: args.status ?? "proposed",
      sourceType: args.sourceType,
      sourceContentId: args.sourceContentId,
      confidence: args.confidence,
      notes: args.notes,
      createdAt: Date.now(),
      approvedAt: args.status === "approved" ? Date.now() : undefined,
    });
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("agentLearnings"),
    status: LEARNING_STATUS,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      approvedAt: args.status === "approved" ? Date.now() : undefined,
    });
    return { success: true };
  },
});
