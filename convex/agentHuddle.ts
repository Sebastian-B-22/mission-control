import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ─── Channel Definitions ────────────────────────────────────────────────────

export const CHANNELS = {
  main: { name: "Main Huddle", description: "Daily standups, announcements, all-hands", icon: "📢" },
  "aspire-ops": { name: "Aspire Ops", description: "Registrations, scheduling, coach management", icon: "⚽" },
  "hta-launch": { name: "HTA Launch", description: "Marketing, product, launch prep", icon: "🚀" },
  family: { name: "Family", description: "Kids' learning, projects, activities", icon: "👨‍👩‍👧‍👦" },
  ideas: { name: "Ideas", description: "Brainstorming, proposals, discussions", icon: "💡" },
};

// ─── Queries ────────────────────────────────────────────────────────────────

// Get recent messages for a channel
export const getByChannel = query({
  args: {
    channel: v.string(),
    limit: v.optional(v.number()),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const targetChannel = args.channel;
    
    // Fetch recent messages
    const allMessages = await ctx.db
      .query("agentHuddle")
      .withIndex("by_created")
      .order("desc")
      .take(limit * 2); // Fetch extra to account for filtering
    
    // Filter by channel (include legacy messages without channel in "main")
    const filtered = allMessages.filter(m => {
      const msgChannel = m.channel || "main"; // Treat missing channel as "main"
      return msgChannel === targetChannel;
    });
    
    // Apply since filter if needed
    const afterSince = args.since 
      ? filtered.filter(m => m.createdAt > args.since!)
      : filtered;
    
    // Take limit and reverse to chronological order
    return afterSince.slice(0, limit).reverse();
  },
});

// Get recent messages across all channels (for agents checking in)
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let messages;
    if (args.since) {
      messages = await ctx.db
        .query("agentHuddle")
        .withIndex("by_created")
        .filter((q) => q.gt(q.field("createdAt"), args.since!))
        .order("desc")
        .take(limit);
    } else {
      messages = await ctx.db
        .query("agentHuddle")
        .withIndex("by_created")
        .order("desc")
        .take(limit);
    }
    
    return messages.reverse();
  },
});

// Get channel list with unread counts
export const getChannelStats = query({
  args: {
    since: v.optional(v.number()), // For calculating "new" messages
  },
  handler: async (ctx, args) => {
    const since = args.since || Date.now() - 24 * 60 * 60 * 1000; // Default: last 24h
    
    const stats: Record<string, { count: number; lastMessage?: number }> = {};
    
    for (const channelId of Object.keys(CHANNELS)) {
      const messages = await ctx.db
        .query("agentHuddle")
        .withIndex("by_channel", (q) => q.eq("channel", channelId))
        .filter((q) => q.gt(q.field("createdAt"), since))
        .collect();
      
      const lastMsg = messages[messages.length - 1];
      stats[channelId] = {
        count: messages.length,
        lastMessage: lastMsg?.createdAt,
      };
    }
    
    return stats;
  },
});

// Internal query for HTTP endpoint
export const getRecentInternal = internalQuery({
  args: {
    channel: v.optional(v.string()),
    limit: v.optional(v.number()),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let messages;
    
    if (args.channel) {
      // Fetch recent and filter by channel (include legacy messages without channel in "main")
      const allMessages = await ctx.db
        .query("agentHuddle")
        .withIndex("by_created")
        .order("desc")
        .take(limit * 2);
      
      const targetChannel = args.channel;
      messages = allMessages.filter(m => {
        const msgChannel = m.channel || "main";
        if (args.since && m.createdAt <= args.since) return false;
        return msgChannel === targetChannel;
      }).slice(0, limit);
    } else {
      if (args.since) {
        messages = await ctx.db
          .query("agentHuddle")
          .withIndex("by_created")
          .filter((q) => q.gt(q.field("createdAt"), args.since!))
          .order("desc")
          .take(limit);
      } else {
        messages = await ctx.db
          .query("agentHuddle")
          .withIndex("by_created")
          .order("desc")
          .take(limit);
      }
    }
    
    return messages.reverse();
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

// Post a message (authenticated - from UI)
export const post = mutation({
  args: {
    agent: v.string(),
    message: v.string(),
    channel: v.string(),
    replyTo: v.optional(v.id("agentHuddle")),
    mentions: v.optional(v.array(v.string())),
    skipTrigger: v.optional(v.boolean()), // Set true to skip agent wake-up
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("agentHuddle", {
      agent: args.agent,
      message: args.message,
      channel: args.channel,
      replyTo: args.replyTo,
      mentions: args.mentions,
      createdAt: Date.now(),
    });
    
    // Create trigger to wake up relevant agents (unless skipped)
    if (!args.skipTrigger) {
      await ctx.scheduler.runAfter(0, internal.agentTrigger.createTrigger, {
        huddleMessageId: messageId,
        channel: args.channel,
        fromAgent: args.agent,
        message: args.message,
        mentions: args.mentions,
      });
    }
    
    return messageId;
  },
});

// Internal mutation for HTTP endpoint (no auth required)
export const postInternal = internalMutation({
  args: {
    agent: v.string(),
    message: v.string(),
    channel: v.string(),
    replyTo: v.optional(v.id("agentHuddle")),
    mentions: v.optional(v.array(v.string())),
    skipTrigger: v.optional(v.boolean()), // Set true to skip agent wake-up
  },
  handler: async (ctx, args) => {
    // Default to main channel if not specified
    const channel = args.channel || "main";
    
    const messageId = await ctx.db.insert("agentHuddle", {
      agent: args.agent,
      message: args.message,
      channel,
      replyTo: args.replyTo,
      mentions: args.mentions,
      createdAt: Date.now(),
    });
    
    // Create trigger to wake up relevant agents (unless skipped)
    if (!args.skipTrigger) {
      await ctx.scheduler.runAfter(0, internal.agentTrigger.createTrigger, {
        huddleMessageId: messageId,
        channel,
        fromAgent: args.agent,
        message: args.message,
        mentions: args.mentions,
      });
    }
    
    return messageId;
  },
});

// Clear old messages (housekeeping - keep last 500 per channel)
export const cleanup = mutation({
  args: {},
  handler: async (ctx) => {
    let totalDeleted = 0;
    
    for (const channelId of Object.keys(CHANNELS)) {
      const channelMessages = await ctx.db
        .query("agentHuddle")
        .withIndex("by_channel", (q) => q.eq("channel", channelId))
        .order("asc")
        .collect();
      
      if (channelMessages.length > 500) {
        const toDelete = channelMessages.slice(0, channelMessages.length - 500);
        for (const msg of toDelete) {
          await ctx.db.delete(msg._id);
        }
        totalDeleted += toDelete.length;
      }
    }
    
    return { deleted: totalDeleted };
  },
});
