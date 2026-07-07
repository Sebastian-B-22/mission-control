import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Import Daily Recap notes -> homeschoolActivities for the given date.
// Idempotent: won't create duplicates for same (date, category, activity).
export const importRecapToProgress = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD (PST)
  },
  handler: async (ctx, args) => {
    const recap = await ctx.db
      .query("dailyRecap")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .first();

    const notes = (recap?.notes ?? "").trim();
    if (!notes) {
      return { ok: false, reason: "no-recap", inserted: 0 };
    }

    const existing = await ctx.db
      .query("homeschoolActivities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .collect();

    const existingSet = new Set(existing.map((a) => `${a.category}::${a.activity}`));

    const lower = notes.toLowerCase();
    const has = (s: string) => lower.includes(s);

    const candidates: Array<{ category: string; activity: string; notes?: string }> = [];

    // Math
    if (has("math academy")) candidates.push({ category: "math", activity: "Math Academy" });

    // Writing / language
    if (has("membean")) candidates.push({ category: "writing", activity: "Membean" });
    if (has("rosetta")) candidates.push({ category: "writing", activity: "Rosetta Stone" });

    // History + Financial Literacy
    // Tuttle Twins: if recap mentions supply/demand/pricing, log under Financial Literacy.
    if (has("tuttle twins")) {
      if (has("supply") || has("demand") || has("pricing") || has("price")) {
        candidates.push({ category: "financial", activity: "Tuttle Twins (Supply & Demand)", notes });
      } else {
        candidates.push({ category: "history", activity: "Tuttle Twins", notes });
      }
    }

    // Only log Story of the World when explicitly mentioned.
    if (has("story of the world")) {
      candidates.push({ category: "history", activity: "Story of the World", notes });
    }

    // Combine Donner + Nathan Hale into a single history record when both are present.
    if (has("donner") && has("nathan hale")) {
      candidates.push({ category: "history", activity: "Donner Party (Nathan Hale's Hazardous Tales)", notes });
    } else {
      if (has("nathan hale")) candidates.push({ category: "history", activity: "Nathan Hale", notes });
      if (has("donner")) candidates.push({ category: "history", activity: "Donner Party", notes });
    }

    // Science - keep it specific
    if (has("science") || has("experiment") || has("esophagus") || has("learning lab") || has("science kit") || has("health & body")) {
      // Prefer explicit "Science:" line, otherwise use best-effort from known phrases.
      let detail = "Experiment";
      const lines = notes.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const scienceLine = lines.find((l) => l.toLowerCase().startsWith("science"));
      if (scienceLine) {
        detail = scienceLine.replace(/^science\s*[:\-]\s*/i, "").slice(0, 120) || detail;
      } else if (has("health & body") && has("esophagus")) {
        detail = "Health & Body Experiment (day 4) - Esophagus";
      } else if (has("science kit") && has("day 4") && has("esophagus")) {
        detail = "Health & Body Experiment (day 4) - Esophagus";
      } else if (has("esophagus")) {
        detail = "Esophagus experiment";
      } else if (has("learning lab")) {
        detail = "Learning Lab experiment";
      }
      candidates.push({ category: "science", activity: detail, notes });
    }

    // Art / Music
    if (has("drawing") || has("sketch")) candidates.push({ category: "art", activity: "Drawing", notes });
    if (has("music") || has("piano")) candidates.push({ category: "music", activity: "Music", notes });

    // Financial literacy
    if (has("money") || has("budget") || has("allowance") || has("invest")) {
      candidates.push({ category: "financial", activity: "Money Management", notes });
    }

    // PE
    if (has("boxing")) candidates.push({ category: "pe", activity: "Boxing" });
    if (has("jiu")) candidates.push({ category: "pe", activity: "Jiu-jitsu" });
    if (has("horse")) candidates.push({ category: "pe", activity: "Other", notes });
    if (has("ninja")) candidates.push({ category: "pe", activity: "Ninja Academy" });

    // Literature / reading
    if (has("read aloud") || has("read-aloud")) candidates.push({ category: "literature", activity: "Read Aloud", notes });
    if (has("wings of fire") || has("redwall") || has("they read") || has("reading")) {
      candidates.push({ category: "literature", activity: "Reading", notes });
    }

    const uniq = new Map<string, { category: string; activity: string; notes?: string }>();
    for (const c of candidates) uniq.set(`${c.category}::${c.activity}`, c);

    let inserted = 0;
    const now = Date.now();
    for (const c of uniq.values()) {
      const key = `${c.category}::${c.activity}`;
      if (existingSet.has(key)) continue;
      await ctx.db.insert("homeschoolActivities", {
        userId: args.userId,
        date: args.date,
        student: "both",
        category: c.category,
        activity: c.activity,
        completed: true,
        notes: c.notes,
        createdAt: now,
      });
      inserted++;
    }

    return { ok: true, inserted };
  },
});
