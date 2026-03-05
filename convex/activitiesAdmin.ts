import { v } from "convex/values";
import { mutation } from "./_generated/server";

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

    // group key
    const groups = new Map<string, typeof acts>();
    for (const a of acts) {
      const key = `${a.student}::${a.category}::${a.activity}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    }

    let deleted = 0;
    for (const list of groups.values()) {
      if (list.length <= 1) continue;
      // Keep oldest
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
