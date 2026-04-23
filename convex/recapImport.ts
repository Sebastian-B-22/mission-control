import { v } from "convex/values";
import { mutation } from "./_generated/server";

function extractScienceActivity(notes: string): string {
  const trimmed = notes.trim();
  if (!trimmed) return "Experiment";

  const clean = (value: string) =>
    value.replace(/\s+/g, " ").replace(/^[,.;:\s]+|[,.;:\s]+$/g, "").trim();

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const explicitScienceLine = lines.find((line) => /^science\s*[:\-]/i.test(line));
  if (explicitScienceLine) {
    return clean(explicitScienceLine.replace(/^science\s*[:\-]\s*/i, "")).slice(0, 120) || "Experiment";
  }

  const bookTitleMatch = trimmed.match(
    /(?:^|[,.;]|\band\b)\s*(?:we\s+)?(?:read\s+)?([^,.]+?)\s+book\s+for science\b/i
  );
  const bookTitle = bookTitleMatch ? clean(bookTitleMatch[1]) : "";

  const chapterMatch = trimmed.match(/book\s+for science\s*\(([^)]+)\)/i);
  const chapterDetail = chapterMatch ? clean(chapterMatch[1]) : "";

  const videoMatch = trimmed.match(/watched\s+(?:youtube\s+)?videos?\s+(?:on|about)\s+(.+?)\s+for science\b/i);
  const videoTopic = videoMatch ? clean(videoMatch[1]) : "";

  const parts: string[] = [];
  if (bookTitle) {
    parts.push(chapterDetail ? `${bookTitle} (${chapterDetail})` : bookTitle);
  }
  if (videoTopic) {
    parts.push(`${videoTopic} video`);
  }

  if (parts.length > 0) {
    return parts.join(" + ").slice(0, 120);
  }

  if (/health\s*&\s*body/i.test(trimmed) && /esophagus/i.test(trimmed)) {
    return "Health & Body Experiment - Esophagus";
  }
  if (/esophagus/i.test(trimmed)) return "Esophagus experiment";
  if (/learning lab/i.test(trimmed)) return "Learning Lab experiment";
  if (/astrophysics/i.test(trimmed) && /artemis\s*2/i.test(trimmed)) return "Astrophysics + Artemis 2";
  if (/astrophysics/i.test(trimmed)) return "Astrophysics";
  if (/artemis\s*2/i.test(trimmed)) return "Artemis 2";

  return "Experiment";
}

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
    if (has("wonder math")) candidates.push({ category: "math", activity: "Wonder Math", notes });

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
      const detail = extractScienceActivity(notes);
      candidates.push({ category: "science", activity: detail, notes });
    }

    // Art / Music
    if (has("drawing") || has("sketch")) candidates.push({ category: "art", activity: "Drawing", notes });
    if (
      has("music") ||
      has("piano") ||
      has("drumming") ||
      has("drum practice") ||
      has("drum lesson") ||
      has("drums") ||
      has("drumeo")
    ) {
      let activity = "Music";
      if (has("drumeo")) activity = "Drumeo";
      else if (has("drum lesson")) activity = "Drum Lesson";
      else if (has("drum practice") || has("drumming") || has("drums")) activity = "Drum Practice";
      candidates.push({ category: "music", activity, notes });
    }

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

export const repairScienceForDate = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const recap = await ctx.db
      .query("dailyRecap")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .first();

    const notes = (recap?.notes ?? "").trim();
    if (!notes) {
      return { ok: false, reason: "no-recap" };
    }

    const nextActivity = extractScienceActivity(notes);

    const activities = await ctx.db
      .query("homeschoolActivities")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .collect();

    const scienceActivities = activities
      .filter((activity) => activity.category === "science")
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

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

      return { ok: true, inserted: 1, patched: 0, deleted: 0, activity: nextActivity, id };
    }

    const [primary, ...duplicates] = scienceActivities;
    await ctx.db.patch(primary._id, {
      activity: nextActivity,
      notes,
    });

    for (const duplicate of duplicates) {
      await ctx.db.delete(duplicate._id);
    }

    return {
      ok: true,
      inserted: 0,
      patched: 1,
      deleted: duplicates.length,
      activity: nextActivity,
      id: primary._id,
    };
  },
});
