import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const syncCronJobs = mutation({
  args: {
    jobs: v.array(
      v.object({
        jobId: v.string(),
        name: v.string(),
        schedule: v.string(),
        nextRun: v.string(),
        lastRun: v.string(),
        status: v.string(),
        agentId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const job of args.jobs) {
      // Check if job exists
      const existing = await ctx.db
        .query("cronJobs")
        .withIndex("by_jobId", (q) => q.eq("jobId", job.jobId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...job,
          syncedAt: now,
        });
      } else {
        await ctx.db.insert("cronJobs", {
          ...job,
          syncedAt: now,
        });
      }
    }
  },
});

export const getCronJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cronJobs").collect();
  },
});
