import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const TASK_STATUS = v.union(
  v.literal("backlog"),
  v.literal("todo"),
  v.literal("in-progress"),
  v.literal("done")
);

const IDEA_STATUS = v.union(
  v.literal("new"),
  v.literal("priority"),
  v.literal("later"),
  v.literal("needs-work"),
  v.literal("converted"),
  v.literal("dismissed")
);

const LEVEL = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));

const LEGACY_STAGE_TO_IDEA_STATUS = {
  idea: "new",
  priority: "priority",
  later: "later",
  "needs-work": "needs-work",
} as const;

export const list = query({
  args: {
    status: v.optional(IDEA_STATUS),
    sourceAgent: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items = args.status
      ? await ctx.db
          .query("agentIdeas")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("agentIdeas").collect();

    if (args.sourceAgent) {
      items = items.filter((i) => i.sourceAgent === args.sourceAgent);
    }

    items.sort((a, b) => b.updatedAt - a.updatedAt);
    return items.slice(0, args.limit ?? 100);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    summary: v.string(),
    sourceAgent: v.optional(v.string()),
    businessArea: v.optional(v.string()),
    ideaType: v.optional(v.string()),
    confidence: v.optional(LEVEL),
    effort: v.optional(LEVEL),
    recommendedAction: v.optional(v.string()),
    status: v.optional(IDEA_STATUS),
    notes: v.optional(v.string()),
    sourceContentId: v.optional(v.id("contentPipeline")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("agentIdeas", {
      title: args.title,
      summary: args.summary,
      sourceAgent: args.sourceAgent ?? "sebastian",
      businessArea: args.businessArea,
      ideaType: args.ideaType,
      confidence: args.confidence,
      effort: args.effort,
      recommendedAction: args.recommendedAction,
      status: args.status ?? "new",
      notes: args.notes,
      sourceContentId: args.sourceContentId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("agentIdeas"),
    status: IDEA_STATUS,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.notes !== undefined) patch.notes = args.notes;

    await ctx.db.patch(args.id, patch);
    return { success: true };
  },
});

export const updateIdea = mutation({
  args: {
    id: v.id("agentIdeas"),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    businessArea: v.optional(v.string()),
    ideaType: v.optional(v.string()),
    confidence: v.optional(LEVEL),
    effort: v.optional(LEVEL),
    recommendedAction: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (rest.title !== undefined) patch.title = rest.title;
    if (rest.summary !== undefined) patch.summary = rest.summary;
    if (rest.businessArea !== undefined) patch.businessArea = rest.businessArea;
    if (rest.ideaType !== undefined) patch.ideaType = rest.ideaType;
    if (rest.confidence !== undefined) patch.confidence = rest.confidence;
    if (rest.effort !== undefined) patch.effort = rest.effort;
    if (rest.recommendedAction !== undefined) patch.recommendedAction = rest.recommendedAction;
    if (rest.notes !== undefined) patch.notes = rest.notes;

    await ctx.db.patch(id, patch);
    return { success: true };
  },
});

export const convertToTask = mutation({
  args: {
    ideaId: v.id("agentIdeas"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(LEVEL),
    assignedTo: v.optional(v.string()),
    status: v.optional(TASK_STATUS),
    agentNotes: v.optional(v.string()),
    lastUpdatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) throw new Error("Idea not found");

    const now = Date.now();
    const taskId = await ctx.db.insert("sebastianTasks", {
      userId: args.userId,
      title: args.title ?? idea.title,
      description: args.description ?? idea.summary,
      status: args.status ?? "todo",
      priority: args.priority ?? idea.effort ?? "medium",
      category: args.category ?? idea.businessArea ?? "agent-squad",
      assignedTo: args.assignedTo ?? "sebastian",
      agentNotes: args.agentNotes ?? idea.recommendedAction ?? idea.notes,
      lastUpdatedBy: args.lastUpdatedBy ?? "sebastian",
      createdAt: now,
    });

    await ctx.db.patch(args.ideaId, {
      status: "converted",
      convertedToTaskId: taskId,
      updatedAt: now,
      notes: args.agentNotes ?? idea.notes,
    });

    return { success: true, taskId };
  },
});

export const backfillFromLegacyContent = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const legacyItems = await ctx.db.query("contentPipeline").collect();
    const existingIdeas = await ctx.db.query("agentIdeas").collect();
    const existingSourceIds = new Set(
      existingIdeas
        .map((idea) => idea.sourceContentId)
        .filter((sourceContentId): sourceContentId is NonNullable<typeof sourceContentId> => Boolean(sourceContentId))
    );

    const candidates = legacyItems.filter((item) => {
      if (!(item.stage in LEGACY_STAGE_TO_IDEA_STATUS)) return false;
      return !existingSourceIds.has(item._id);
    });

    if (!dryRun) {
      for (const item of candidates) {
        const mappedStatus = LEGACY_STAGE_TO_IDEA_STATUS[item.stage as keyof typeof LEGACY_STAGE_TO_IDEA_STATUS];
        await ctx.db.insert("agentIdeas", {
          title: item.title,
          summary: item.content,
          sourceAgent: item.createdBy,
          status: mappedStatus,
          notes: item.notes,
          sourceContentId: item._id,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      }
    }

    return {
      dryRun,
      candidateCount: candidates.length,
      candidateIds: candidates.map((item) => item._id),
    };
  },
});

export const deleteIdea = mutation({
  args: { id: v.id("agentIdeas") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
