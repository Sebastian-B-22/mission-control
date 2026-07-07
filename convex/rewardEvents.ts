import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

type Child = "roma" | "anthony";
type RewardType = "bonus_bot_minutes" | "barnes_points" | "roblox_points";

type Balances = Record<Child, Record<RewardType, number>>;

async function getUserIdByClerkId(ctx: QueryCtx, clerkId: string): Promise<Id<"users"> | null> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .first();
  return user?._id ?? null;
}

function emptyBalances(): Balances {
  return {
    roma: { bonus_bot_minutes: 0, barnes_points: 0, roblox_points: 0 },
    anthony: { bonus_bot_minutes: 0, barnes_points: 0, roblox_points: 0 },
  };
}

export const getBalances = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("rewardEvents")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", args.userId))
      .collect();

    const balances = emptyBalances();
    for (const ev of events) {
      if (ev.redeemedAt) continue;
      const child = ev.child as Child;
      const rt = ev.rewardType as RewardType;
      balances[child][rt] += ev.amount;
    }
    return balances;
  },
});

export const getBalancesByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdByClerkId(ctx, args.clerkId);
    if (!userId) return emptyBalances();

    const events = await ctx.db
      .query("rewardEvents")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .collect();

    const balances = emptyBalances();
    for (const ev of events) {
      if (ev.redeemedAt) continue;
      const child = ev.child as Child;
      const rt = ev.rewardType as RewardType;
      balances[child][rt] += ev.amount;
    }
    return balances;
  },
});

export const listUnredeemed = query({
  args: {
    userId: v.id("users"),
    child: v.union(v.literal("roma"), v.literal("anthony")),
  },
  handler: async (ctx, args) => {
    // Note: optional-index query on redeemedAt isn't super efficient; MVP ok.
    const events = await ctx.db
      .query("rewardEvents")
      .withIndex("by_user_child_createdAt", (q) => q.eq("userId", args.userId).eq("child", args.child))
      .order("desc")
      .take(200);

    return events.filter((e) => !e.redeemedAt);
  },
});

export const redeemEvent = mutation({
  args: {
    eventId: v.id("rewardEvents"),
  },
  handler: async (ctx, args) => {
    const ev = await ctx.db.get(args.eventId);
    if (!ev) return null;
    if (ev.redeemedAt) return ev;

    await ctx.db.patch(args.eventId, { redeemedAt: Date.now() });
    return await ctx.db.get(args.eventId);
  },
});
