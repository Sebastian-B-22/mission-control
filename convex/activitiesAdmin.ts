import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Remove duplicate activities for a date by collapsing identical rows.
// Keeps the earliest-created row, deletes the rest.
export const dedupeForDate = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const acts = await ctx.db
      .query("homeschoolActivities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .collect();

    const groups = new Map<string, typeof acts>();
    for (const a of acts) {
      const key = `${a.student}::${a.category}::${a.activity}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    }

    let deleted = 0;
    for (const list of groups.values()) {
      if (list.length <= 1) continue;
      list.sort((a, b) => a._creationTime - b._creationTime);
      const toDelete = list.slice(1);
      for (const d of toDelete) {
        await ctx.db.delete(d._id);
        deleted++;
      }
    }

    return { ok: true, deleted, total: acts.length };
  },
});

// Delete all homeschool activities for a date (useful for a clean rebuild)
export const clearForDate = mutation({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, args) => {
    const acts = await ctx.db
      .query("homeschoolActivities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .collect();

    for (const a of acts) {
      await ctx.db.delete(a._id);
    }

    return { ok: true, deleted: acts.length };
  },
});

// Clear activities for a date and rebuild them from the saved Daily Recap.
export const rebuildFromRecap = mutation({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx: any, args: any): Promise<any> => {
    const cleared = (await ctx.runMutation(api.activitiesAdmin.clearForDate, {
      userId: args.userId,
      date: args.date,
    })) as any;

    const imported = (await ctx.runMutation(api.recapImport.importRecapToProgress, {
      userId: args.userId,
      date: args.date,
    })) as any;

    return { ok: true, cleared, imported };
  },
});
