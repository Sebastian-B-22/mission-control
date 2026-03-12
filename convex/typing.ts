import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const BOT_XP_STEP = 200;
const BOT_MINUTES_PER_STEP = 5;
const BARNES_XP_STEP = 500;
const BARNES_POINTS_PER_STEP = 10;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeXp({ wpm, accuracy }: { wpm: number; accuracy: number }) {
  // MVP scoring: always give some XP; reward both speed and accuracy.
  const base = 10;
  const speed = Math.round(wpm * 0.5); // 0-~30
  const acc = Math.round(clamp(accuracy, 0, 1) * 20); // 0-20
  return clamp(base + speed + acc, 5, 100);
}

async function getOrCreateProfile(
  ctx: MutationCtx,
  args: { userId: Id<"users">; child: "roma" | "anthony" }
) {
  const existing = await ctx.db
    .query("typingProfiles")
    .withIndex("by_user_child", (q) => q.eq("userId", args.userId).eq("child", args.child))
    .first();

  if (existing) return existing;

  const now = Date.now();
  const _id = await ctx.db.insert("typingProfiles", {
    userId: args.userId,
    child: args.child,
    totalXp: 0,
    totalSessions: 0,
    bestWpm: undefined,
    bestAccuracy: undefined,
    lastRewardXpBot: 0,
    lastRewardXpBarnes: 0,
    updatedAt: now,
  });

  const created = await ctx.db.get(_id);
  if (!created) throw new Error("Failed to create typing profile");
  return created;
}

export const getProfile = query({
  args: {
    userId: v.id("users"),
    child: v.union(v.literal("roma"), v.literal("anthony")),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("typingProfiles")
      .withIndex("by_user_child", (q) => q.eq("userId", args.userId).eq("child", args.child))
      .first();
    return profile;
  },
});

export const getRecentSessions = query({
  args: {
    userId: v.id("users"),
    child: v.union(v.literal("roma"), v.literal("anthony")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("typingSessions")
      .withIndex("by_user_child_createdAt", (q) => q.eq("userId", args.userId).eq("child", args.child))
      .order("desc")
      .take(limit);
  },
});

export const addSession = mutation({
  args: {
    userId: v.id("users"),
    child: v.union(v.literal("roma"), v.literal("anthony")),
    prompt: v.string(),
    wpm: v.number(),
    accuracy: v.number(), // 0..1
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const profile = await getOrCreateProfile(ctx, { userId: args.userId, child: args.child });

    const wpm = clamp(args.wpm, 0, 300);
    const accuracy = clamp(args.accuracy, 0, 1);
    const xpEarned = computeXp({ wpm, accuracy });

    await ctx.db.insert("typingSessions", {
      userId: args.userId,
      child: args.child,
      prompt: args.prompt,
      wpm,
      accuracy,
      xpEarned,
      createdAt: now,
    });

    const newTotalXp = (profile.totalXp ?? 0) + xpEarned;
    const newTotalSessions = (profile.totalSessions ?? 0) + 1;

    const bestWpm = profile.bestWpm === undefined ? wpm : Math.max(profile.bestWpm, wpm);
    const bestAccuracy = profile.bestAccuracy === undefined ? accuracy : Math.max(profile.bestAccuracy, accuracy);

    // Rewards: grant on XP milestones crossed since last grant.
    const lastBot = profile.lastRewardXpBot ?? 0;
    const lastBarnes = profile.lastRewardXpBarnes ?? 0;

    const botStepsBefore = Math.floor(lastBot / BOT_XP_STEP);
    const botStepsAfter = Math.floor(newTotalXp / BOT_XP_STEP);
    const barnesStepsBefore = Math.floor(lastBarnes / BARNES_XP_STEP);
    const barnesStepsAfter = Math.floor(newTotalXp / BARNES_XP_STEP);

    const botNewSteps = Math.max(0, botStepsAfter - botStepsBefore);
    const barnesNewSteps = Math.max(0, barnesStepsAfter - barnesStepsBefore);

    for (let i = 0; i < botNewSteps; i++) {
      await ctx.db.insert("rewardEvents", {
        userId: args.userId,
        child: args.child,
        rewardType: "bonus_bot_minutes",
        amount: BOT_MINUTES_PER_STEP,
        source: "typing",
        note: `Reached ${BOT_XP_STEP * (botStepsBefore + 1 + i)} XP`,
        createdAt: now,
        redeemedAt: undefined,
      });
    }

    for (let i = 0; i < barnesNewSteps; i++) {
      await ctx.db.insert("rewardEvents", {
        userId: args.userId,
        child: args.child,
        rewardType: "barnes_points",
        amount: BARNES_POINTS_PER_STEP,
        source: "typing",
        note: `Reached ${BARNES_XP_STEP * (barnesStepsBefore + 1 + i)} XP`,
        createdAt: now,
        redeemedAt: undefined,
      });
    }

    await ctx.db.patch(profile._id, {
      totalXp: newTotalXp,
      totalSessions: newTotalSessions,
      bestWpm,
      bestAccuracy,
      lastRewardXpBot: botStepsAfter * BOT_XP_STEP,
      lastRewardXpBarnes: barnesStepsAfter * BARNES_XP_STEP,
      updatedAt: now,
    });

    return {
      xpEarned,
      totalXp: newTotalXp,
      rewardsGranted: {
        bonus_bot_minutes: botNewSteps * BOT_MINUTES_PER_STEP,
        barnes_points: barnesNewSteps * BARNES_POINTS_PER_STEP,
      },
    };
  },
});
