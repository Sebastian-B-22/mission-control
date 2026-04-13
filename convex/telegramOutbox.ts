import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

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

function topicToChannel(topic: AgentHqTopic): string {
  switch (topic) {
    case "operations":
      return "aspire-ops";
    case "marketing":
      return "hta-launch";
    case "family":
      return "family";
    case "ideas":
      return "ideas";
    case "general":
    default:
      return "main";
  }
}

// Enqueue a message to be sent to Telegram by the host poller.
export const enqueue = mutation({
  args: {
    text: v.string(),
    topic: v.string(),
    channel: v.optional(v.string()),
    agent: v.optional(v.string()),
    sourceHuddleMessageId: v.optional(v.id("agentHuddle")),
    // Optional: route via a specific OpenClaw telegram account (default/scout/maven/compass/james)
    accountId: v.optional(v.string()),
    // Optional: store who requested the send (Clerk/Convex user name etc.)
    requestedBy: v.optional(v.string()),
    threadId: v.optional(v.string()),
    replyToTelegramMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const topic = normalizeTopic(args.topic);
    const id = await ctx.db.insert("telegramOutbox", {
      text: args.text,
      topic,
      channel: args.channel ?? topicToChannel(topic),
      agent: args.agent,
      sourceHuddleMessageId: args.sourceHuddleMessageId,
      accountId: args.accountId,
      requestedBy: args.requestedBy,
      threadId: args.threadId,
      replyToTelegramMessageId: args.replyToTelegramMessageId,
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
    deliveredAccountId: v.optional(v.string()),
    deliveredThreadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const outbox = await ctx.db.get(args.id);

    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: now,
      telegramMessageId: args.telegramMessageId,
      deliveredAccountId: args.deliveredAccountId,
      deliveredThreadId: args.deliveredThreadId,
    });

    if (outbox?.sourceHuddleMessageId) {
      await ctx.db.patch(outbox.sourceHuddleMessageId, {
        deliveredToTopic: outbox.topic,
        deliveredAt: now,
        telegramMessageId: args.telegramMessageId,
      });
    }
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

export const getByTelegramMessageIdInternal = internalQuery({
  args: { telegramMessageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("telegramOutbox")
      .withIndex("by_telegram_message_id", (q) => q.eq("telegramMessageId", args.telegramMessageId))
      .first();
  },
});

export const ingestTelegramReplyInternal = internalMutation({
  args: {
    text: v.string(),
    topic: v.optional(v.string()),
    channel: v.optional(v.string()),
    author: v.optional(v.string()),
    agent: v.optional(v.string()),
    telegramMessageId: v.optional(v.string()),
    telegramThreadId: v.optional(v.string()),
    replyToTelegramMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"agentHuddle">> => {
    const topic = normalizeTopic(args.topic ?? "general");
    const requestedAgent = (args.agent ?? "corinne").toLowerCase();
    const agent = requestedAgent === "joy" ? "joy" : "corinne";

    let replyTo: Id<"agentHuddle"> | undefined = undefined;
    let missionId: Id<"agentHuddleMissions"> | undefined = undefined;
    let replyTarget: Doc<"agentHuddle"> | null = null;

    if (args.replyToTelegramMessageId) {
      const bridged = await ctx.db
        .query("telegramOutbox")
        .withIndex("by_telegram_message_id", (q) => q.eq("telegramMessageId", args.replyToTelegramMessageId!))
        .first();

      if (bridged?.sourceHuddleMessageId) {
        replyTarget = await ctx.db.get(bridged.sourceHuddleMessageId);
      }

      if (!replyTarget) {
        replyTarget = await ctx.db
          .query("agentHuddle")
          .withIndex("by_source_and_message_id", (q) =>
            q.eq("source", "telegram").eq("sourceMessageId", args.replyToTelegramMessageId!)
          )
          .first();
      }

      replyTo = replyTarget?._id;
      missionId = replyTarget?.missionId;
    }

    const channel = args.channel ?? replyTarget?.channel ?? topicToChannel(topic);

    return await ctx.runMutation(internal.agentHuddle.postInternal, {
      agent,
      message: args.text,
      channel,
      missionId,
      replyTo,
      source: "telegram",
      sourceMessageId: args.telegramMessageId,
      sourceThreadId: args.telegramThreadId,
      sourceAuthor: args.author,
    });
  },
});
