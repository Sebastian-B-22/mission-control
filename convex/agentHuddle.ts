import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

const MISSION_PHASES = ["round1", "round2", "synthesis"] as const;
type MissionPhase = (typeof MISSION_PHASES)[number];

type MissionStatus = MissionPhase | "completed" | "cancelled";

type MissionDoc = Doc<"agentHuddleMissions">;
type MessageDoc = Doc<"agentHuddle">;

const ACTIVE_MISSION_STATUSES = new Set<MissionStatus>(["round1", "round2", "synthesis"]);

// ─── Channel Definitions ────────────────────────────────────────────────────

export const CHANNELS = {
  main: { name: "Main Huddle", description: "Daily standups, announcements, all-hands", icon: "📢", mode: "live", participants: ["scout", "maven", "compass", "james", "sebastian"] },
  "aspire-ops": { name: "Aspire Ops", description: "Registrations, scheduling, coach management", icon: "⚽", mode: "live", participants: ["scout", "sebastian"] },
  "hta-launch": { name: "HTA Launch", description: "Marketing, product, launch prep", icon: "🚀", mode: "live", participants: ["maven", "sebastian"] },
  family: { name: "Family", description: "Kids' learning, projects, activities", icon: "👨‍👩‍👧‍👦", mode: "live", participants: ["compass", "james", "sebastian"] },
  ideas: { name: "Ideas", description: "Brainstorming, proposals, discussions", icon: "💡", mode: "live", participants: ["scout", "maven", "sebastian"] },
  "overnight-strategy": { name: "Overnight Huddle", description: "Overnight strategy pass for leverage, revenue, retention, and tomorrow's priorities", icon: "🌙", mode: "overnight", participants: ["scout", "maven", "sebastian"] },
  "joy-support": { name: "Joy Support", description: "Joy asking Sebastian for help", icon: "🌸", mode: "live", participants: ["sebastian"] },
} as const;

function uniqueAgents(values: string[]): string[] {
  return [...new Set(values.map((value) => value.toLowerCase().trim()).filter(Boolean))];
}

function getChannelConfig(channel: string) {
  return CHANNELS[channel as keyof typeof CHANNELS] ?? CHANNELS.main;
}

function getMissionParticipants(channel: string, explicitParticipants?: string[]) {
  const channelParticipants = getChannelConfig(channel).participants;
  const base = explicitParticipants && explicitParticipants.length > 0
    ? explicitParticipants
    : channelParticipants;

  return uniqueAgents([...base.filter((agent) => agent !== "corinne"), "sebastian"]);
}

function getDiscussionParticipants(participants: string[]) {
  return participants.filter((participant) => participant !== "sebastian");
}

function buildMissionTitle(message: string) {
  const collapsed = message.replace(/\s+/g, " ").trim();
  return collapsed.length <= 88 ? collapsed : `${collapsed.slice(0, 85)}...`;
}

function toMissionPhase(status: MissionStatus): MissionPhase | null {
  return status === "round1" || status === "round2" || status === "synthesis"
    ? status
    : null;
}

async function findActiveMissionByChannel(ctx: any, channel: string): Promise<MissionDoc | null> {
  const missions = await ctx.db
    .query("agentHuddleMissions")
    .withIndex("by_channel_updated", (q: any) => q.eq("channel", channel))
    .order("desc")
    .take(10);

  return missions.find((mission: MissionDoc) => ACTIVE_MISSION_STATUSES.has(mission.status as MissionStatus)) ?? null;
}

async function getMissionMessages(ctx: any, missionId: Id<"agentHuddleMissions">): Promise<MessageDoc[]> {
  return await ctx.db
    .query("agentHuddle")
    .withIndex("by_mission_created", (q: any) => q.eq("missionId", missionId))
    .order("asc")
    .collect();
}

function buildMissionProgress(mission: MissionDoc, messages: MessageDoc[]) {
  const discussionParticipants = getDiscussionParticipants(mission.participants);
  const round1Responded = uniqueAgents(
    messages
      .filter((message) => message.round === "round1")
      .map((message) => message.agent)
  );
  const round2Responded = uniqueAgents(
    messages
      .filter((message) => message.round === "round2")
      .map((message) => message.agent)
  );
  const synthesisPosted = messages.some(
    (message) => message.round === "synthesis" && message.agent.toLowerCase() === "sebastian"
  );

  let waitingOn: string[] = [];
  if (mission.status === "round1") {
    waitingOn = discussionParticipants.filter((agent) => !round1Responded.includes(agent));
  } else if (mission.status === "round2") {
    waitingOn = discussionParticipants.filter((agent) => !round2Responded.includes(agent));
  } else if (mission.status === "synthesis" && !synthesisPosted) {
    waitingOn = ["sebastian"];
  }

  return {
    phase: mission.status,
    discussionParticipants,
    round1Responded,
    round2Responded,
    synthesisPosted,
    waitingOn,
    totalDiscussionParticipants: discussionParticipants.length,
  };
}

function buildRoundPrompt(mission: MissionDoc, phase: MissionPhase) {
  const channel = getChannelConfig(mission.channel);
  const isOvernight = mission.mode === "overnight";

  if (phase === "round1") {
    return [
      `Mission started in ${channel.name}.`,
      "Round 1: give your initial take.",
      `Brief: ${mission.brief}`,
      isOvernight
        ? "Bring back concrete leverage. Look for workflow, revenue, retention, and tomorrow's priority."
        : "Be practical. Name the best move, the main risk, and what matters most right now.",
      "Reply in the huddle thread, not a side chat.",
    ].join(" ");
  }

  if (phase === "round2") {
    return [
      `Round 2 is open for the ${channel.name} mission.`,
      `Original brief: ${mission.brief}`,
      "Read the Round 1 takes already in the thread, respond to each other, challenge weak assumptions, and sharpen the recommendation.",
      "Reply in the huddle thread and keep it bounded.",
    ].join(" ");
  }

  if (isOvernight) {
    return [
      `Sebastian synthesis needed for the ${channel.name} mission.`,
      `Original brief: ${mission.brief}`,
      "Review the brief plus the agent discussion and post the final synthesis in the huddle.",
      "Format it with exact section labels: Workflow:, Revenue:, Retention:, Tomorrow:, and X Post: when relevant.",
      "Keep each section concrete and actionable.",
    ].join(" ");
  }

  return [
    `Sebastian synthesis needed for the ${channel.name} mission.`,
    `Original brief: ${mission.brief}`,
    "Review the brief plus the agent discussion and post the final synthesis in the huddle.",
    "Format it with Recommendation, Why, Owner, and Next Step.",
  ].join(" ");
}

type OvernightBucket =
  | "workflow"
  | "revenue"
  | "retention"
  | "tomorrow"
  | "idea"
  | "x-post";

function cleanStructuredText(value: string) {
  return value
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/^`+|`+$/g, "")
    .replace(/^\*\*|\*\*$/g, "")
    .trim();
}

function normalizeOvernightBucket(label: string): OvernightBucket | null {
  const normalized = label
    .toLowerCase()
    .replace(/[*_`:#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (["workflow", "workflows", "ops", "operations"].includes(normalized)) return "workflow";
  if (["revenue", "growth", "sales"].includes(normalized)) return "revenue";
  if (["retention", "customer retention", "parent retention"].includes(normalized)) return "retention";
  if (["tomorrow", "priority", "priorities", "next step", "next steps"].includes(normalized)) return "tomorrow";
  if (["idea", "ideas", "recommendation", "recommendations"].includes(normalized)) return "idea";
  if (["x post", "x posts", "x-post", "x-posts", "tweet", "tweets", "social", "social post", "social posts"].includes(normalized)) return "x-post";

  return null;
}

function detectOvernightBucket(line: string) {
  const headingMatch = line.match(/^#{1,6}\s+(.+?)\s*$/);
  if (headingMatch) {
    const bucket = normalizeOvernightBucket(headingMatch[1]);
    if (bucket) {
      return { bucket, remainder: "" };
    }
  }

  const labelMatch = line.match(/^\s*(?:[-*•]\s*)?(?:\*\*|__)?([A-Za-z][A-Za-z\s/-]{1,40}?)(?:\*\*|__)?\s*:\s*(.*)$/);
  if (!labelMatch) return null;

  const bucket = normalizeOvernightBucket(labelMatch[1]);
  if (!bucket) return null;

  return {
    bucket,
    remainder: cleanStructuredText(labelMatch[2] || ""),
  };
}

function linesToItems(lines: string[]) {
  const items: string[] = [];
  let current = "";

  const flush = () => {
    const cleaned = cleanStructuredText(current);
    if (cleaned) items.push(cleaned);
    current = "";
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }

    const cleanedLine = cleanStructuredText(line);
    if (!cleanedLine) continue;

    if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      flush();
      current = cleanedLine;
      continue;
    }

    current = current ? `${current} ${cleanedLine}` : cleanedLine;
  }

  flush();
  return items;
}

function buildOvernightExtraction(message: string) {
  const buckets = new Map<OvernightBucket, string[]>();
  let currentBucket: OvernightBucket | null = null;

  for (const rawLine of message.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const detected = detectOvernightBucket(line);
    if (detected) {
      currentBucket = detected.bucket;
      if (!buckets.has(currentBucket)) buckets.set(currentBucket, []);
      if (detected.remainder) buckets.get(currentBucket)!.push(detected.remainder);
      continue;
    }

    if (currentBucket) {
      buckets.get(currentBucket)!.push(line);
    }
  }

  const ideas = (["workflow", "revenue", "retention", "tomorrow", "idea"] as OvernightBucket[])
    .flatMap((bucket) => linesToItems(buckets.get(bucket) ?? []).map((text) => ({ bucket, text })));

  const xPosts = linesToItems(buckets.get("x-post") ?? []);

  return { ideas, xPosts };
}

function titleFromText(prefix: string, text: string, max = 72) {
  const singleLine = cleanStructuredText(text).replace(/\s+/g, " ");
  if (!singleLine) return prefix;
  const trimmed = singleLine.length <= max ? singleLine : `${singleLine.slice(0, max - 1).trimEnd()}…`;
  return `${prefix}: ${trimmed}`;
}

async function captureCompletedOvernightMission(ctx: any, mission: MissionDoc, finalMessage: MessageDoc) {
  const now = Date.now();
  const extracted = buildOvernightExtraction(finalMessage.message);

  await ctx.db.insert("overnightInbox", {
    source: "huddle",
    channel: mission.channel,
    topic: "overnight-strategy",
    text: finalMessage.message,
    author: finalMessage.agent,
    createdAt: now,
    triageStatus: "new",
    promotedTo: undefined,
    tags: ["overnight", "mission-complete", `mission:${mission._id}`],
  });

  for (const item of extracted.ideas) {
    const prefixByBucket: Record<Exclude<OvernightBucket, "x-post">, string> = {
      workflow: "Workflow idea",
      revenue: "Revenue idea",
      retention: "Retention idea",
      tomorrow: "Tomorrow priority",
      idea: "Overnight idea",
    };

    const businessAreaByBucket: Record<Exclude<OvernightBucket, "x-post">, string> = {
      workflow: "operations",
      revenue: "revenue",
      retention: "retention",
      tomorrow: "priority",
      idea: "strategy",
    };

    await ctx.db.insert("agentIdeas", {
      title: titleFromText(prefixByBucket[item.bucket as Exclude<OvernightBucket, "x-post">], item.text),
      summary: item.text,
      sourceAgent: finalMessage.agent,
      businessArea: businessAreaByBucket[item.bucket as Exclude<OvernightBucket, "x-post">],
      ideaType: item.bucket,
      recommendedAction: item.bucket === "tomorrow" ? item.text : undefined,
      status: "new",
      notes: `Auto-created from overnight huddle mission ${mission._id} (${finalMessage._id}).`,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const post of extracted.xPosts) {
    const contentId = await ctx.db.insert("contentPipeline", {
      title: titleFromText("Overnight X post", post),
      content: post,
      type: "x-post",
      stage: "review",
      createdBy: finalMessage.agent,
      assignedTo: "corinne",
      notes: `Auto-created from overnight huddle mission ${mission._id} (${finalMessage._id}).`,
      createdAt: now,
      updatedAt: now,
      verificationStatus: "pending",
    });

    await ctx.scheduler.runAfter(0, internal.contentVerification.verifyContentAction, { contentId });
  }

  return {
    overnightInboxCaptured: true,
    ideasCreated: extracted.ideas.length,
    xPostsCreated: extracted.xPosts.length,
  };
}

async function queueMissionPhase(
  ctx: any,
  mission: MissionDoc,
  phase: MissionPhase,
  huddleMessageId: Id<"agentHuddle">
) {
  const targetAgents = phase === "synthesis"
    ? ["sebastian"]
    : getDiscussionParticipants(mission.participants);

  if (targetAgents.length === 0) {
    return null;
  }

  return await ctx.scheduler.runAfter(0, internal.agentTrigger.createDirectTrigger, {
    huddleMessageId,
    channel: mission.channel,
    fromAgent: phase === "round1" ? mission.createdBy : "sebastian",
    targetAgents,
    message: buildRoundPrompt(mission, phase),
    missionId: mission._id,
    missionPhase: phase,
    reason: `mission-${phase}`,
  });
}

// ─── Queries ────────────────────────────────────────────────────────────────

export const getByChannel = query({
  args: {
    channel: v.string(),
    limit: v.optional(v.number()),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const targetChannel = args.channel;

    const allMessages = await ctx.db
      .query("agentHuddle")
      .withIndex("by_created")
      .order("desc")
      .take(limit * 2);

    const filtered = allMessages.filter((message: MessageDoc) => {
      const messageChannel = message.channel || "main";
      return messageChannel === targetChannel;
    });

    const afterSince = args.since
      ? filtered.filter((message: MessageDoc) => message.createdAt > args.since!)
      : filtered;

    return afterSince.slice(0, limit).reverse();
  },
});

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

export const getChannelStats = query({
  args: {
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const since = args.since || Date.now() - 24 * 60 * 60 * 1000;
    const stats: Record<string, { count: number; lastMessage?: number; hasActiveMission: boolean }> = {};

    for (const channelId of Object.keys(CHANNELS)) {
      const messages = await ctx.db
        .query("agentHuddle")
        .withIndex("by_channel", (q) => q.eq("channel", channelId))
        .filter((q) => q.gt(q.field("createdAt"), since))
        .collect();

      const lastMessage = messages[messages.length - 1];
      const activeMission = await findActiveMissionByChannel(ctx, channelId);
      stats[channelId] = {
        count: messages.length,
        lastMessage: lastMessage?.createdAt,
        hasActiveMission: Boolean(activeMission),
      };
    }

    return stats;
  },
});

export const getActiveMission = query({
  args: {
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const mission = await findActiveMissionByChannel(ctx, args.channel);
    if (!mission) {
      return null;
    }

    const messages = await getMissionMessages(ctx, mission._id);
    const progress = buildMissionProgress(mission, messages);

    return {
      mission,
      progress,
      messages,
    };
  },
});

export const getChannelView = query({
  args: {
    channel: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const mission = await findActiveMissionByChannel(ctx, args.channel);

    if (mission) {
      const messages = await getMissionMessages(ctx, mission._id);
      return {
        activeMission: mission,
        progress: buildMissionProgress(mission, messages),
        messages: messages.slice(-limit),
      };
    }

    const messages = await ctx.db
      .query("agentHuddle")
      .withIndex("by_channel", (q) => q.eq("channel", args.channel))
      .order("desc")
      .take(limit);

    return {
      activeMission: null,
      progress: null,
      messages: messages.reverse(),
    };
  },
});

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
      const allMessages = await ctx.db
        .query("agentHuddle")
        .withIndex("by_created")
        .order("desc")
        .take(limit * 2);

      const targetChannel = args.channel;
      messages = allMessages.filter((message: MessageDoc) => {
        const messageChannel = message.channel || "main";
        if (args.since && message.createdAt <= args.since) return false;
        return messageChannel === targetChannel;
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

export const startMission = mutation({
  args: {
    channel: v.string(),
    message: v.string(),
    agent: v.optional(v.string()),
    mentions: v.optional(v.array(v.string())),
    participants: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const createdBy = (args.agent || "corinne").toLowerCase();
    const channel = args.channel || "main";

    const existingMission = await findActiveMissionByChannel(ctx, channel);
    if (existingMission) {
      await ctx.db.patch(existingMission._id, {
        status: "completed",
        completedAt: now,
        updatedAt: now,
      });
    }

    const participants = getMissionParticipants(channel, args.participants);
    const discussionParticipants = getDiscussionParticipants(participants);
    const mode = getChannelConfig(channel).mode;
    const initialStatus: MissionStatus = discussionParticipants.length > 0 ? "round1" : "synthesis";

    const missionId = await ctx.db.insert("agentHuddleMissions", {
      channel,
      mode,
      title: buildMissionTitle(args.message),
      brief: args.message.trim(),
      createdBy,
      participants,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    });

    const messageId = await ctx.db.insert("agentHuddle", {
      agent: createdBy,
      message: args.message.trim(),
      channel,
      missionId,
      round: "brief",
      kind: "brief",
      mentions: args.mentions,
      createdAt: now,
    });

    if (initialStatus === "round1") {
      await queueMissionPhase(ctx, {
        _id: missionId,
        _creationTime: now,
        channel,
        mode,
        title: buildMissionTitle(args.message),
        brief: args.message.trim(),
        createdBy,
        participants,
        status: initialStatus,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
      }, "round1", messageId);
    } else {
      await queueMissionPhase(ctx, {
        _id: missionId,
        _creationTime: now,
        channel,
        mode,
        title: buildMissionTitle(args.message),
        brief: args.message.trim(),
        createdBy,
        participants,
        status: initialStatus,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
      }, "synthesis", messageId);
    }

    return { missionId, messageId, status: initialStatus, participants };
  },
});

export const post = mutation({
  args: {
    agent: v.string(),
    message: v.string(),
    channel: v.string(),
    missionId: v.optional(v.id("agentHuddleMissions")),
    replyTo: v.optional(v.id("agentHuddle")),
    mentions: v.optional(v.array(v.string())),
    skipTrigger: v.optional(v.boolean()),
    source: v.optional(v.union(
      v.literal("mission-control"),
      v.literal("telegram"),
      v.literal("agent"),
      v.literal("manual")
    )),
    sourceMessageId: v.optional(v.string()),
    sourceThreadId: v.optional(v.string()),
    sourceAuthor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const channel = args.channel || "main";
    const agent = args.agent.toLowerCase();

    const mission = args.missionId
      ? await ctx.db.get(args.missionId)
      : await findActiveMissionByChannel(ctx, channel);

    const round = mission ? (toMissionPhase(mission.status as MissionStatus) ?? "note") : undefined;
    const kind = mission
      ? (round === "synthesis" && agent === "sebastian" ? "synthesis" : "response")
      : undefined;

    const messageId = await ctx.db.insert("agentHuddle", {
      agent,
      message: args.message.trim(),
      channel,
      missionId: mission?._id,
      round,
      kind,
      replyTo: args.replyTo,
      mentions: args.mentions,
      source: args.source,
      sourceMessageId: args.sourceMessageId,
      sourceThreadId: args.sourceThreadId,
      sourceAuthor: args.sourceAuthor,
      createdAt: now,
    });

    if (mission) {
      await ctx.db.patch(mission._id, {
        updatedAt: now,
        lastMessageAt: now,
      });
    }

    if (!args.skipTrigger) {
      await ctx.scheduler.runAfter(0, internal.agentTrigger.createTrigger, {
        huddleMessageId: messageId,
        channel,
        fromAgent: agent,
        message: args.message.trim(),
        mentions: args.mentions,
        missionId: mission?._id,
        missionPhase: round && round !== "note" ? round : undefined,
        reason: mission ? `mission-message-${round ?? "note"}` : undefined,
      });
    }

    if (mission && ACTIVE_MISSION_STATUSES.has(mission.status as MissionStatus)) {
      await ctx.scheduler.runAfter(0, internal.agentHuddle.advanceMission, {
        missionId: mission._id,
        sourceMessageId: messageId,
      });
    }

    return messageId;
  },
});

export const postInternal = internalMutation({
  args: {
    agent: v.string(),
    message: v.string(),
    channel: v.string(),
    missionId: v.optional(v.id("agentHuddleMissions")),
    replyTo: v.optional(v.id("agentHuddle")),
    mentions: v.optional(v.array(v.string())),
    skipTrigger: v.optional(v.boolean()),
    source: v.optional(v.union(
      v.literal("mission-control"),
      v.literal("telegram"),
      v.literal("agent"),
      v.literal("manual")
    )),
    sourceMessageId: v.optional(v.string()),
    sourceThreadId: v.optional(v.string()),
    sourceAuthor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const channel = args.channel || "main";
    const agent = args.agent.toLowerCase();

    const mission = args.missionId
      ? await ctx.db.get(args.missionId)
      : await findActiveMissionByChannel(ctx, channel);

    const round = mission ? (toMissionPhase(mission.status as MissionStatus) ?? "note") : undefined;
    const kind = mission
      ? (round === "synthesis" && agent === "sebastian" ? "synthesis" : "response")
      : undefined;

    const messageId = await ctx.db.insert("agentHuddle", {
      agent,
      message: args.message.trim(),
      channel,
      missionId: mission?._id,
      round,
      kind,
      replyTo: args.replyTo,
      mentions: args.mentions,
      source: args.source,
      sourceMessageId: args.sourceMessageId,
      sourceThreadId: args.sourceThreadId,
      sourceAuthor: args.sourceAuthor,
      createdAt: now,
    });

    if (mission) {
      await ctx.db.patch(mission._id, {
        updatedAt: now,
        lastMessageAt: now,
      });
    }

    if (!args.skipTrigger) {
      await ctx.scheduler.runAfter(0, internal.agentTrigger.createTrigger, {
        huddleMessageId: messageId,
        channel,
        fromAgent: agent,
        message: args.message.trim(),
        mentions: args.mentions,
        missionId: mission?._id,
        missionPhase: round && round !== "note" ? round : undefined,
        reason: mission ? `mission-message-${round ?? "note"}` : undefined,
      });
    }

    if (mission && ACTIVE_MISSION_STATUSES.has(mission.status as MissionStatus)) {
      await ctx.scheduler.runAfter(0, internal.agentHuddle.advanceMission, {
        missionId: mission._id,
        sourceMessageId: messageId,
      });
    }

    return messageId;
  },
});

export const advanceMission = internalMutation({
  args: {
    missionId: v.id("agentHuddleMissions"),
    sourceMessageId: v.id("agentHuddle"),
  },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId);
    if (!mission || !ACTIVE_MISSION_STATUSES.has(mission.status as MissionStatus)) {
      return { advanced: false, reason: "inactive" };
    }

    const messages = await getMissionMessages(ctx, mission._id);
    const progress = buildMissionProgress(mission, messages);
    const now = Date.now();

    if (mission.status === "round1") {
      if (progress.waitingOn.length > 0) {
        return { advanced: false, reason: "waiting-round1", waitingOn: progress.waitingOn };
      }

      if (progress.totalDiscussionParticipants < 2) {
        await ctx.db.patch(mission._id, {
          status: "synthesis",
          updatedAt: now,
        });
        const refreshed = await ctx.db.get(mission._id);
        if (refreshed) {
          await queueMissionPhase(ctx, refreshed, "synthesis", args.sourceMessageId);
        }
        return { advanced: true, phase: "synthesis" };
      }

      await ctx.db.patch(mission._id, {
        status: "round2",
        updatedAt: now,
      });
      const refreshed = await ctx.db.get(mission._id);
      if (refreshed) {
        await queueMissionPhase(ctx, refreshed, "round2", args.sourceMessageId);
      }
      return { advanced: true, phase: "round2" };
    }

    if (mission.status === "round2") {
      if (progress.waitingOn.length > 0) {
        return { advanced: false, reason: "waiting-round2", waitingOn: progress.waitingOn };
      }

      await ctx.db.patch(mission._id, {
        status: "synthesis",
        updatedAt: now,
      });
      const refreshed = await ctx.db.get(mission._id);
      if (refreshed) {
        await queueMissionPhase(ctx, refreshed, "synthesis", args.sourceMessageId);
      }
      return { advanced: true, phase: "synthesis" };
    }

    if (mission.status === "synthesis") {
      const finalMessage = [...messages]
        .reverse()
        .find((message) => message.round === "synthesis" && message.agent.toLowerCase() === "sebastian");

      if (!finalMessage) {
        return { advanced: false, reason: "waiting-synthesis" };
      }

      await ctx.db.patch(mission._id, {
        status: "completed",
        completedAt: now,
        updatedAt: now,
        finalMessageId: finalMessage._id,
      });

      let extractedOutputs = null;
      if (mission.channel === "overnight-strategy" || mission.mode === "overnight") {
        extractedOutputs = await captureCompletedOvernightMission(ctx, mission, finalMessage);
      }

      return { advanced: true, phase: "completed", finalMessageId: finalMessage._id, extractedOutputs };
    }

    return { advanced: false, reason: "unknown" };
  },
});

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
        for (const message of toDelete) {
          await ctx.db.delete(message._id);
        }
        totalDeleted += toDelete.length;
      }
    }

    return { deleted: totalDeleted };
  },
});
