import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const GROUP_STATUS = v.union(
  v.literal("draft"),
  v.literal("in-progress"),
  v.literal("complete"),
  v.literal("archived")
);

const SOURCE_TYPE = v.union(
  v.literal("content"),
  v.literal("idea"),
  v.literal("task"),
  v.literal("manual")
);

const CONTENT_TYPE = v.union(
  v.literal("x-post"),
  v.literal("x-reply"),
  v.literal("email"),
  v.literal("blog"),
  v.literal("landing-page"),
  v.literal("other")
);

const CONTENT_STAGE = v.union(
  v.literal("idea"),
  v.literal("priority"),
  v.literal("later"),
  v.literal("needs-work"),
  v.literal("review"),
  v.literal("approved"),
  v.literal("published"),
  v.literal("dismissed")
);

export const list = query({
  args: {
    status: v.optional(GROUP_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let groups = args.status
      ? await ctx.db
          .query("contentOutputGroups")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("contentOutputGroups").collect();

    groups = groups.sort((a, b) => b.updatedAt - a.updatedAt);
    const limitedGroups = groups.slice(0, args.limit ?? 50);

    return await Promise.all(
      limitedGroups.map(async (group) => {
        const outputs = await ctx.db
          .query("contentOutputItems")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();

        const enrichedOutputs = await Promise.all(
          outputs
            .sort((a, b) => a.order - b.order)
            .map(async (output) => ({
              ...output,
              content: await ctx.db.get(output.contentId),
            }))
        );

        return {
          ...group,
          outputs: enrichedOutputs,
        };
      })
    );
  },
});

export const getWithOutputs = query({
  args: { groupId: v.id("contentOutputGroups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const outputs = await ctx.db
      .query("contentOutputItems")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const enrichedOutputs = await Promise.all(
      outputs
        .sort((a, b) => a.order - b.order)
        .map(async (output) => ({
          ...output,
          content: await ctx.db.get(output.contentId),
        }))
    );

    return {
      ...group,
      outputs: enrichedOutputs,
    };
  },
});

export const createGroup = mutation({
  args: {
    title: v.string(),
    summary: v.optional(v.string()),
    sourceType: SOURCE_TYPE,
    sourceContentId: v.optional(v.id("contentPipeline")),
    sourceIdeaId: v.optional(v.id("agentIdeas")),
    sourceTaskId: v.optional(v.id("sebastianTasks")),
    owner: v.optional(v.string()),
    status: v.optional(GROUP_STATUS),
    targetChannels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("contentOutputGroups", {
      title: args.title,
      summary: args.summary,
      sourceType: args.sourceType,
      sourceContentId: args.sourceContentId,
      sourceIdeaId: args.sourceIdeaId,
      sourceTaskId: args.sourceTaskId,
      owner: args.owner,
      status: args.status ?? "draft",
      targetChannels: args.targetChannels,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createOutput = mutation({
  args: {
    groupId: v.id("contentOutputGroups"),
    title: v.string(),
    content: v.string(),
    type: CONTENT_TYPE,
    stage: v.optional(CONTENT_STAGE),
    createdBy: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
    outputType: v.string(),
    channel: v.optional(v.string()),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Output group not found");

    const source = group.sourceContentId ? await ctx.db.get(group.sourceContentId) : null;
    const rootContentId = source?.rootContentId ?? source?._id ?? group.sourceContentId;

    const now = Date.now();
    const existingOutputs = await ctx.db
      .query("contentOutputItems")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const contentId = await ctx.db.insert("contentPipeline", {
      title: args.title,
      content: args.content,
      type: args.type,
      stage: args.stage ?? "idea",
      createdBy: args.createdBy ?? "sebastian",
      assignedTo: args.assignedTo ?? "corinne",
      notes: args.notes,
      parentContentId: group.sourceContentId,
      rootContentId,
      outputGroupId: args.groupId,
      outputRole: args.outputType,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("contentOutputItems", {
      groupId: args.groupId,
      contentId,
      outputType: args.outputType,
      channel: args.channel,
      label: args.label,
      order: existingOutputs.length,
      createdAt: now,
    });

    await ctx.db.patch(args.groupId, {
      status: "in-progress",
      updatedAt: now,
    });

    return contentId;
  },
});

export const createGroupFromContent = mutation({
  args: {
    sourceContentId: v.id("contentPipeline"),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    owner: v.optional(v.string()),
    targetChannels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceContentId);
    if (!source) throw new Error("Source content not found");

    const existingGroup = source.outputGroupId
      ? ((await ctx.db.get(source.outputGroupId as Id<"contentOutputGroups">)) ?? null)
      : null;

    if (existingGroup) {
      return existingGroup._id;
    }

    const now = Date.now();
    const groupId = await ctx.db.insert("contentOutputGroups", {
      title: args.title ?? source.title,
      summary: args.summary ?? source.notes,
      sourceType: "content",
      sourceContentId: source._id,
      owner: args.owner ?? source.createdBy,
      status: "draft",
      targetChannels: args.targetChannels,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(source._id, {
      outputGroupId: groupId,
      rootContentId: source.rootContentId ?? source._id,
      updatedAt: now,
    });

    return groupId;
  },
});

export const createOutputFromTemplate = mutation({
  args: {
    groupId: v.id("contentOutputGroups"),
    template: v.union(
      v.literal("x-post"),
      v.literal("email"),
      v.literal("landing-page"),
      v.literal("blog"),
      v.literal("follow-up")
    ),
    createdBy: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Output group not found");

    const source = group.sourceContentId ? await ctx.db.get(group.sourceContentId) : null;
    const baseTitle = group.title || source?.title || "Content Output";
    const sourcePreview = source?.content ? source.content.slice(0, 240) : group.summary || "";
    const rootContentId = source?.rootContentId ?? source?._id ?? group.sourceContentId;

    const templates: Record<string, { title: string; type: "x-post" | "email" | "landing-page" | "blog" | "other"; outputType: string; channel?: string; content: string; label: string }> = {
      "x-post": {
        title: `${baseTitle} - X Post`,
        type: "x-post",
        outputType: "social-primary",
        channel: "x",
        label: "X Post",
        content: source?.content || `Write a tight X post based on: ${sourcePreview}`,
      },
      email: {
        title: `${baseTitle} - Email`,
        type: "email",
        outputType: "email-primary",
        channel: "email",
        label: "Email",
        content: `Subject: ${baseTitle}\n\nDraft an email based on:\n\n${sourcePreview}`,
      },
      "landing-page": {
        title: `${baseTitle} - Landing Page`,
        type: "landing-page",
        outputType: "landing-page",
        channel: "web",
        label: "Landing Page",
        content: `Draft a landing page structure for:\n\n${sourcePreview}`,
      },
      blog: {
        title: `${baseTitle} - Blog`,
        type: "blog",
        outputType: "blog-article",
        channel: "blog",
        label: "Blog",
        content: `Draft a blog post outline for:\n\n${sourcePreview}`,
      },
      "follow-up": {
        title: `${baseTitle} - Follow-up`,
        type: "other",
        outputType: "follow-up",
        channel: "crm",
        label: "Follow-up",
        content: `Draft a follow-up message sequence based on:\n\n${sourcePreview}`,
      },
    };

    const selected = templates[args.template];
    const now = Date.now();
    const existingOutputs = await ctx.db
      .query("contentOutputItems")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const contentId = await ctx.db.insert("contentPipeline", {
      title: selected.title,
      content: selected.content,
      type: selected.type,
      stage: "idea",
      createdBy: args.createdBy ?? group.owner ?? "sebastian",
      assignedTo: args.assignedTo ?? "corinne",
      notes: `Created from output template: ${selected.label}`,
      parentContentId: group.sourceContentId,
      rootContentId,
      outputGroupId: args.groupId,
      outputRole: selected.outputType,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("contentOutputItems", {
      groupId: args.groupId,
      contentId,
      outputType: selected.outputType,
      channel: selected.channel,
      label: selected.label,
      order: existingOutputs.length,
      createdAt: now,
    });

    await ctx.db.patch(args.groupId, {
      status: "in-progress",
      updatedAt: now,
    });

    return contentId;
  },
});

export const markCompleteIfReady = mutation({
  args: {
    groupId: v.id("contentOutputGroups"),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Output group not found");

    const outputs = await ctx.db
      .query("contentOutputItems")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    if (outputs.length === 0) {
      await ctx.db.patch(args.groupId, {
        status: "draft",
        updatedAt: Date.now(),
      });
      return "draft";
    }

    const linkedContent = await Promise.all(outputs.map((output) => ctx.db.get(output.contentId)));
    const allPublished = linkedContent.every((content) => content?.stage === "published");
    const nextStatus = allPublished ? "complete" : "in-progress";

    await ctx.db.patch(args.groupId, {
      status: nextStatus,
      updatedAt: Date.now(),
    });

    return nextStatus;
  },
});
