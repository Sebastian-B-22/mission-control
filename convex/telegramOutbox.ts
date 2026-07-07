import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export type AgentHqTopic =
  | "operations"
  | "marketing"
  | "family"
  | "ideas"
  | "general";

const TOPICS: AgentHqTopic[] = [
  "operations",
  "marketing",
  "family",
  "ideas",
  "general",
];

function normalizeTopic(input: string): AgentHqTopic {
  const t = input.toLowerCase().trim();
  if ((TOPICS as string[]).includes(t)) return t as AgentHqTopic;
  return "general";
}

// Enqueue a message to be sent to Telegram by the host poller.
export const enqueue = mutation({
  args: {
    text: v.string(),
    topic: v.string(),
    // Optional: route via a specific OpenClaw telegram account (default/scout/maven/compass/james)
    accountId: v.optional(v.string()),
    // Optional: store who requested the send (Clerk/Convex user name etc.)
    requestedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const topic = normalizeTopic(args.topic);
    const id = await ctx.db.insert("telegramOutbox", {
      text: args.text,
      topic,
      accountId: args.accountId,
      requestedBy: args.requestedBy,
      status: "pending",
      createdAt: Date.now(),
    });

    return id;
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 25;
    return await ctx.db
      .query("telegramOutbox")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

export const getPendingInternal = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("telegramOutbox")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(limit);
  },
});

export const markSentInternal = internalMutation({
  args: {
    id: v.id("telegramOutbox"),
    telegramMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
      telegramMessageId: args.telegramMessageId,
    });
  },
});

export const markFailedInternal = internalMutation({
  args: { id: v.id("telegramOutbox"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "failed",
      failedAt: Date.now(),
      error: args.error,
    });
  },
});
