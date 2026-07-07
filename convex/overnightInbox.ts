import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

function deriveTitle(text: string) {
  const firstLine = text.split("\n").map((l) => l.trim()).filter(Boolean)[0] ?? "(no text)";
  // Keep task titles short-ish
  return firstLine.length > 90 ? firstLine.slice(0, 87) + "…" : firstLine;
}

export const ingest = mutation({
  args: {
    source: v.union(v.literal("huddle"), v.literal("telegram")),
    channel: v.optional(v.string()),
    topic: v.optional(v.string()),
    text: v.string(),
    author: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.createdAt ?? Date.now();
    const id = await ctx.db.insert("overnightInbox", {
      source: args.source,
      channel: args.channel,
      topic: args.topic,
      text: args.text,
      author: args.author,
      createdAt: now,
      triageStatus: "new",
      promotedTo: undefined,
      tags: args.tags ?? [],
    });
    return id;
  },
});

export const listNewSince = query({
  args: {
    sinceMs: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);

    const rows = await ctx.db
      .query("overnightInbox")
      .withIndex("by_status", (q) =>
        q.eq("triageStatus", "new").gte("createdAt", args.sinceMs)
      )
      .order("desc")
      .take(limit);

    return rows;
  },
});

export const archive = mutation({
  args: { id: v.id("overnightInbox") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      triageStatus: "archived",
    });
    return { ok: true };
  },
});

export const promoteToPending = mutation({
  args: {
    id: v.id("overnightInbox"),
    owner: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Overnight inbox item not found");

    const title = deriveTitle(item.text);

    const details = [
      item.text,
      "",
      `Source: ${item.source}`,
      item.channel ? `Channel: ${item.channel}` : null,
      item.topic ? `Topic: ${item.topic}` : null,
      item.author ? `Author: ${item.author}` : null,
      `Inbox ID: ${item._id}`,
    ]
      .filter(Boolean)
      .join("\n");

    const now = Date.now();

    const pendingItemId = await ctx.db.insert("pendingItems", {
      title,
      details,
      owner: args.owner ?? "corinne",
      status: "open",
      source: item.source,
      dueAt: undefined,
      tags: args.tags ?? item.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.id, {
      triageStatus: "promoted",
      promotedTo: { pendingItemId },
    });

    return { ok: true, pendingItemId };
  },
});

export const promoteToProjects = mutation({
  args: {
    id: v.id("overnightInbox"),
    userId: v.id("users"),
    status: v.optional(v.union(v.literal("backlog"), v.literal("todo"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    category: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Overnight inbox item not found");

    const title = deriveTitle(item.text);

    const description = [
      item.text,
      "",
      `Source: ${item.source}`,
      item.channel ? `Channel: ${item.channel}` : null,
      item.topic ? `Topic: ${item.topic}` : null,
      item.author ? `Author: ${item.author}` : null,
      `Inbox ID: ${item._id}`,
    ]
      .filter(Boolean)
      .join("\n");

    const now = Date.now();

    const taskId: Id<"sebastianTasks"> = await ctx.db.insert("sebastianTasks", {
      userId: args.userId,
      title,
      description,
      status: args.status ?? "backlog",
      priority: args.priority ?? "medium",
      category: args.category ?? "agent-squad",
      assignedTo: args.assignedTo,
      agentNotes: undefined,
      lastUpdatedBy: "mission-control-ui",
      createdAt: now,
    });

    await ctx.db.patch(args.id, {
      triageStatus: "promoted",
      promotedTo: { taskId },
    });

    return { ok: true, taskId };
  },
});
