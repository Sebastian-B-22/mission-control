import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

function extractScienceActivity(notes: string): string {
  const trimmed = notes.trim();
  if (!trimmed) return "Experiment";

  const clean = (value: string) =>
    value.replace(/\s+/g, " ").replace(/^[,.;:\s]+|[,.;:\s]+$/g, "").trim();

  const bookTitleMatch = trimmed.match(
    /(?:^|[,.;]|\band\b)\s*(?:we\s+)?(?:read\s+)?([^,.]+?)\s+book\s+for science\b/i
  );
  const bookTitle = bookTitleMatch ? clean(bookTitleMatch[1]) : "";

  const chapterMatch = trimmed.match(/book\s+for science\s*\(([^)]+)\)/i);
  const chapterDetail = chapterMatch ? clean(chapterMatch[1]) : "";

  const videoMatch = trimmed.match(/watched\s+(?:youtube\s+)?videos?\s+(?:on|about)\s+(.+?)\s+for science\b/i);
  const videoTopic = videoMatch ? clean(videoMatch[1]) : "";

  const parts: string[] = [];
  if (bookTitle) parts.push(chapterDetail ? `${bookTitle} (${chapterDetail})` : bookTitle);
  if (videoTopic) parts.push(`${videoTopic} video`);

  if (parts.length > 0) return parts.join(" + ").slice(0, 120);
  if (/health\s*&\s*body/i.test(trimmed) && /esophagus/i.test(trimmed)) return "Health & Body Experiment - Esophagus";
  if (/esophagus/i.test(trimmed)) return "Esophagus experiment";
  if (/learning lab/i.test(trimmed)) return "Learning Lab experiment";
  if (/astrophysics/i.test(trimmed) && /artemis\s*2/i.test(trimmed)) return "Astrophysics + Artemis 2";
  if (/astrophysics/i.test(trimmed)) return "Astrophysics";
  if (/artemis\s*2/i.test(trimmed)) return "Artemis 2";

  return "Experiment";
}

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
  args: {
    userId: v.id("users"),
    date: v.string(),
    scope: v.optional(v.union(v.literal("all"), v.literal("science"))),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    if (args.scope === "science") {
      const recap = await ctx.db
        .query("dailyRecap")
        .withIndex("by_user_and_date", (q: any) => q.eq("userId", args.userId).eq("date", args.date))
        .first();

      const notes = (recap?.notes ?? "").trim();
      if (!notes) {
        return { ok: false, reason: "no-recap" };
      }

      const activities = await ctx.db
        .query("homeschoolActivities")
        .withIndex("by_user_date", (q: any) => q.eq("userId", args.userId).eq("date", args.date))
        .collect();

      const scienceActivities = activities
        .filter((activity: any) => activity.category === "science")
        .sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

      const nextActivity = extractScienceActivity(notes);

      if (scienceActivities.length === 0) {
        const id = await ctx.db.insert("homeschoolActivities", {
          userId: args.userId,
          date: args.date,
          student: "both",
          category: "science",
          activity: nextActivity,
          completed: true,
          notes,
          createdAt: Date.now(),
        });

        return { ok: true, scope: "science", inserted: 1, patched: 0, deleted: 0, activity: nextActivity, id };
      }

      const [primary, ...duplicates] = scienceActivities;
      await ctx.db.patch(primary._id, { activity: nextActivity, notes });
      for (const duplicate of duplicates) {
        await ctx.db.delete(duplicate._id);
      }

      return {
        ok: true,
        scope: "science",
        inserted: 0,
        patched: 1,
        deleted: duplicates.length,
        activity: nextActivity,
        id: primary._id,
      };
    }

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
