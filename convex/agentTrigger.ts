/**
 * Agent Trigger System
 *
 * Handles routing huddle messages to the correct agents.
 * Works via polling since OpenClaw gateway is loopback-only.
 */

import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ─── Channel → Agent Routing ────────────────────────────────────────────────

export const CHANNEL_ROUTING: Record<string, string[]> = {
  "aspire-ops": ["scout", "sebastian"],
  "hta-launch": ["maven", "sebastian"],
  family: ["compass", "james", "sebastian"],
  main: ["scout", "maven", "compass", "james", "sebastian"],
  ideas: ["scout", "maven", "compass", "james", "sebastian"],
  "overnight-strategy": ["scout", "maven", "sebastian"],
  "joy-support": ["sebastian"],
};

const ALL_AGENTS = ["sebastian", "scout", "maven", "compass", "james", "corinne", "joy"];
const HUMAN_OR_EXTERNAL_INITIATORS = new Set(["corinne", "joy"]);

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseMentions(message: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(message)) !== null) {
    const agent = match[1].toLowerCase();
    if (ALL_AGENTS.includes(agent)) {
      mentions.push(agent);
    }
  }

  return [...new Set(mentions)];
}

export function getTargetAgents(
  channel: string,
  fromAgent: string,
  message: string,
  explicitMentions?: string[]
): string[] {
  const normalizedFromAgent = fromAgent.toLowerCase();
  const targets = new Set<string>((explicitMentions || []).map((mention) => mention.toLowerCase()));

  parseMentions(message).forEach((mention) => targets.add(mention));

  if (targets.size > 0) {
    targets.delete(normalizedFromAgent);
    return Array.from(targets);
  }

  if (HUMAN_OR_EXTERNAL_INITIATORS.has(normalizedFromAgent)) {
    const channelAgents = CHANNEL_ROUTING[channel] || CHANNEL_ROUTING.main;
    channelAgents.forEach((agent) => targets.add(agent));
    targets.delete(normalizedFromAgent);
    return Array.from(targets);
  }

  if (normalizedFromAgent !== "sebastian") {
    targets.add("sebastian");
  }

  targets.delete(normalizedFromAgent);
  return Array.from(targets);
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export const createTrigger = internalMutation({
  args: {
    huddleMessageId: v.id("agentHuddle"),
    channel: v.string(),
    fromAgent: v.string(),
    message: v.string(),
    mentions: v.optional(v.array(v.string())),
    missionId: v.optional(v.id("agentHuddleMissions")),
    missionPhase: v.optional(v.union(
      v.literal("round1"),
      v.literal("round2"),
      v.literal("synthesis")
    )),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const targetAgents = getTargetAgents(
      args.channel,
      args.fromAgent,
      args.message,
      args.mentions
    );

    if (targetAgents.length === 0) {
      return null;
    }

    const triggerId = await ctx.db.insert("agentTriggers", {
      huddleMessageId: args.huddleMessageId,
      channel: args.channel,
      fromAgent: args.fromAgent,
      targetAgents,
      message: args.message,
      missionId: args.missionId,
      missionPhase: args.missionPhase,
      reason: args.reason,
      status: "pending",
      createdAt: Date.now(),
    });

    return triggerId;
  },
});

export const createDirectTrigger = internalMutation({
  args: {
    huddleMessageId: v.id("agentHuddle"),
    channel: v.string(),
    fromAgent: v.string(),
    targetAgents: v.array(v.string()),
    message: v.string(),
    missionId: v.optional(v.id("agentHuddleMissions")),
    missionPhase: v.optional(v.union(
      v.literal("round1"),
      v.literal("round2"),
      v.literal("synthesis")
    )),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const targetAgents = [...new Set(args.targetAgents.map((agent) => agent.toLowerCase()))]
      .filter((agent) => agent !== args.fromAgent.toLowerCase());

    if (targetAgents.length === 0) {
      return null;
    }

    return await ctx.db.insert("agentTriggers", {
      huddleMessageId: args.huddleMessageId,
      channel: args.channel,
      fromAgent: args.fromAgent,
      targetAgents,
      message: args.message,
      missionId: args.missionId,
      missionPhase: args.missionPhase,
      reason: args.reason,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const markProcessing = internalMutation({
  args: {
    triggerId: v.id("agentTriggers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.triggerId, {
      status: "processing",
    });
  },
});

export const markCompleted = internalMutation({
  args: {
    triggerId: v.id("agentTriggers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.triggerId, {
      status: "completed",
      processedAt: Date.now(),
    });
  },
});

export const markFailed = internalMutation({
  args: {
    triggerId: v.id("agentTriggers"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.triggerId, {
      status: "failed",
      processedAt: Date.now(),
      error: args.error,
    });
  },
});

// ─── Queries ────────────────────────────────────────────────────────────────

export const getPendingTriggers = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    return await ctx.db
      .query("agentTriggers")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(limit);
  },
});

export const getRecentTriggers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    return await ctx.db
      .query("agentTriggers")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

export const getTriggerStats = query({
  args: {},
  handler: async (ctx) => {
    const allTriggers = await ctx.db.query("agentTriggers").collect();

    return {
      total: allTriggers.length,
      pending: allTriggers.filter((trigger) => trigger.status === "pending").length,
      processing: allTriggers.filter((trigger) => trigger.status === "processing").length,
      completed: allTriggers.filter((trigger) => trigger.status === "completed").length,
      failed: allTriggers.filter((trigger) => trigger.status === "failed").length,
    };
  },
});

export const cleanup = mutation({
  args: {},
  handler: async (ctx) => {
    const triggers = await ctx.db
      .query("agentTriggers")
      .withIndex("by_created")
      .order("asc")
      .collect();

    if (triggers.length <= 100) {
      return { deleted: 0 };
    }

    const toDelete = triggers.slice(0, triggers.length - 100);
    for (const trigger of toDelete) {
      await ctx.db.delete(trigger._id);
    }

    return { deleted: toDelete.length };
  },
});
