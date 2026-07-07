import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export type HealthRunKind = "doctor" | "security_audit";
export type HealthRunStatus = "ok" | "warn" | "critical";

export const ingestHealthRun = mutation({
  args: {
    userId: v.id("users"),
    kind: v.union(v.literal("doctor"), v.literal("security_audit")),
    status: v.union(v.literal("ok"), v.literal("warn"), v.literal("critical")),
    counts: v.optional(
      v.object({
        critical: v.number(),
        warn: v.number(),
        info: v.number(),
      })
    ),
    rawText: v.string(),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("healthRuns", {
      userId: args.userId,
      kind: args.kind,
      status: args.status,
      counts: args.counts,
      rawText: args.rawText,
      createdAt: args.createdAt ?? Date.now(),
    });
  },
});

export const listRecentHealthRuns = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    kind: v.optional(v.union(v.literal("doctor"), v.literal("security_audit"))),
  },
  handler: async (ctx, { userId, limit, kind }) => {
    const lim = Math.min(Math.max(limit ?? 20, 1), 100);

    if (kind) {
      return await ctx.db
        .query("healthRuns")
        .withIndex("by_user_kind_createdAt", (q) =>
          q.eq("userId", userId).eq("kind", kind)
        )
        .order("desc")
        .take(lim);
    }

    return await ctx.db
      .query("healthRuns")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(lim);
  },
});
