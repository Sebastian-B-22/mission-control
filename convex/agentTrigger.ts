/**
 * Agent Trigger System
 * 
 * Handles routing huddle messages to the correct agents.
 * Works via polling since OpenClaw gateway is loopback-only.
 * 
 * Flow:
 * 1. Huddle message posted → createTrigger() adds to queue
 * 2. OpenClaw polls /huddle/triggers every 30s (via cron)
 * 3. OpenClaw wakes relevant agents with message context
 * 4. Agent processes, OpenClaw marks trigger complete
 */

import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ─── Channel → Agent Routing ────────────────────────────────────────────────

export const CHANNEL_ROUTING: Record<string, string[]> = {
  "aspire-ops": ["scout", "sebastian"],
  "hta-launch": ["maven", "sebastian"],
  "family": ["compass", "james", "sebastian"],
  "main": ["scout", "maven", "compass", "james", "sebastian"],
  "ideas": ["scout", "maven", "compass", "james", "sebastian"],
};

// All known agents
const ALL_AGENTS = ["sebastian", "scout", "maven", "compass", "james", "corinne"];

// ─── Helper: Parse @mentions ────────────────────────────────────────────────

function parseMentions(message: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(message)) !== null) {
    const agent = match[1].toLowerCase();
    if (ALL_AGENTS.includes(agent)) {
      mentions.push(agent);
    }
  }
  
  return [...new Set(mentions)]; // Deduplicate
}

// ─── Helper: Get target agents ──────────────────────────────────────────────

export function getTargetAgents(
  channel: string,
  fromAgent: string,
  message: string,
  explicitMentions?: string[]
): string[] {
  // Start with explicit mentions if provided
  const targets = new Set<string>(explicitMentions || []);
  
  // Parse @mentions from message
  const parsedMentions = parseMentions(message);
  parsedMentions.forEach(m => targets.add(m));
  
  // If no specific mentions, use channel routing
  if (targets.size === 0) {
    const channelAgents = CHANNEL_ROUTING[channel] || CHANNEL_ROUTING["main"];
    channelAgents.forEach(a => targets.add(a));
  }
  
  // Remove the sender from targets (don't wake yourself)
  targets.delete(fromAgent.toLowerCase());
  
  // Corinne doesn't get automated triggers (she's the human)
  targets.delete("corinne");
  
  return Array.from(targets);
}

// ─── Mutations ──────────────────────────────────────────────────────────────

// Create a trigger when a huddle message is posted
export const createTrigger = internalMutation({
  args: {
    huddleMessageId: v.id("agentHuddle"),
    channel: v.string(),
    fromAgent: v.string(),
    message: v.string(),
    mentions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const targetAgents = getTargetAgents(
      args.channel,
      args.fromAgent,
      args.message,
      args.mentions
    );
    
    // Don't create trigger if no agents to wake
    if (targetAgents.length === 0) {
      return null;
    }
    
    const triggerId = await ctx.db.insert("agentTriggers", {
      huddleMessageId: args.huddleMessageId,
      channel: args.channel,
      fromAgent: args.fromAgent,
      targetAgents,
      message: args.message,
      status: "pending",
      createdAt: Date.now(),
    });
    
    return triggerId;
  },
});

// Mark trigger as processing
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

// Mark trigger as completed
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

// Mark trigger as failed
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

// Get pending triggers (for OpenClaw to poll)
export const getPendingTriggers = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const triggers = await ctx.db
      .query("agentTriggers")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(limit);
    
    return triggers;
  },
});

// Get recent triggers for debugging
export const getRecentTriggers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const triggers = await ctx.db
      .query("agentTriggers")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
    
    return triggers;
  },
});

// Get trigger stats
export const getTriggerStats = query({
  args: {},
  handler: async (ctx) => {
    const allTriggers = await ctx.db
      .query("agentTriggers")
      .collect();
    
    const stats = {
      total: allTriggers.length,
      pending: allTriggers.filter(t => t.status === "pending").length,
      processing: allTriggers.filter(t => t.status === "processing").length,
      completed: allTriggers.filter(t => t.status === "completed").length,
      failed: allTriggers.filter(t => t.status === "failed").length,
    };
    
    return stats;
  },
});

// Cleanup old triggers (keep last 100)
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
