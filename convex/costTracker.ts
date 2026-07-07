import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function startOfDayLosAngeles(nowMs: number) {
  const now = new Date(nowMs);
  // Use locale string roundtrip to coerce to LA date parts.
  const la = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  la.setHours(0, 0, 0, 0);
  return la.getTime();
}

export const ingest = mutation({
  args: {
    userId: v.id("users"),
    agent: v.string(),
    model: v.string(),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    costUsd: v.number(),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const createdAt = args.createdAt ?? now;

    return await ctx.db.insert("costEvents", {
      userId: args.userId,
      agent: args.agent,
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      costUsd: args.costUsd,
      createdAt,
    });
  },
});

export const listRecent = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const limit = args.limit ?? 200;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("costEvents")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId).gte("createdAt", since))
      .order("desc")
      .take(limit);

    return events;
  },
});

export const getSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const todayStart = startOfDayLosAngeles(now);
    const last7dStart = now - 7 * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("costEvents")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId).gte("createdAt", last7dStart))
      .collect();

    let todayTotal = 0;
    let last7dTotal = 0;

    const byModel = new Map<string, number>();
    const byAgent = new Map<string, number>();

    for (const e of events) {
      last7dTotal += e.costUsd;
      if (e.createdAt >= todayStart) todayTotal += e.costUsd;

      byModel.set(e.model, (byModel.get(e.model) ?? 0) + e.costUsd);
      byAgent.set(e.agent, (byAgent.get(e.agent) ?? 0) + e.costUsd);
    }

    const topModels = [...byModel.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([model, costUsd]) => ({ model, costUsd }));

    const topAgents = [...byAgent.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agent, costUsd]) => ({ agent, costUsd }));

    return {
      todayTotal,
      last7dTotal,
      topModels,
      topAgents,
      last7dCount: events.length,
    };
  },
});
