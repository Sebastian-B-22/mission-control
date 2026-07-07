import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get registration count for a specific program
 */
export const getCount = query({
  args: { program: v.string() },
  handler: async (ctx, args) => {
    const count = await ctx.db
      .query("registrationCounts")
      .withIndex("by_program", (q) => q.eq("program", args.program))
      .first();
    
    return count || { program: args.program, count: 0, lastUpdated: Date.now() };
  },
});

/**
 * Get all registration counts
 */
export const getAllCounts = query({
  args: {},
  handler: async (ctx) => {
    const counts = await ctx.db.query("registrationCounts").collect();
    
    // Return all counts, with defaults for missing programs
    const programs = ["spring-pali", "spring-agoura", "camps", "pdp", "7v7"];
    const countsMap = new Map(counts.map(c => [c.program, c]));
    
    return programs.map(program => 
      countsMap.get(program) || { program, count: 0, lastUpdated: Date.now() }
    );
  },
});

/**
 * Update count for a single program
 */
export const updateCount = mutation({
  args: {
    program: v.string(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if count already exists
    const existing = await ctx.db
      .query("registrationCounts")
      .withIndex("by_program", (q) => q.eq("program", args.program))
      .first();
    
    if (existing) {
      // Update existing count
      await ctx.db.patch(existing._id, {
        count: args.count,
        lastUpdated: Date.now(),
      });
      return { success: true, updated: true, program: args.program };
    } else {
      // Insert new count
      await ctx.db.insert("registrationCounts", {
        program: args.program,
        count: args.count,
        lastUpdated: Date.now(),
      });
      return { success: true, updated: false, program: args.program };
    }
  },
});

/**
 * Bulk update counts for multiple programs
 * Used by Scout's nightly sync script
 */
export const bulkUpdateCounts = mutation({
  args: {
    counts: v.array(
      v.object({
        program: v.string(),
        count: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const { program, count } of args.counts) {
      const existing = await ctx.db
        .query("registrationCounts")
        .withIndex("by_program", (q) => q.eq("program", program))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          count,
          lastUpdated: Date.now(),
        });
        results.push({ program, updated: true });
      } else {
        await ctx.db.insert("registrationCounts", {
          program,
          count,
          lastUpdated: Date.now(),
        });
        results.push({ program, updated: false });
      }
    }
    
    return { success: true, results };
  },
});
