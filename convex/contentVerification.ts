import { v } from "convex/values";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

const URL_REGEX = /(https?:\/\/[^\s)\],]+)/gi;
const FIRST_PERSON_REGEX = /\b(i|i'm|i’ve|ive|me|my|mine|we|we're|we’ve|our|ours|us)\b/gi;
const ALL_CAPS_SENTENCE_REGEX = /(^|[.!?]\s+)([A-Z][A-Z\s,'"0-9-]{8,})([.!?])/g;
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

function wordCount(text: string) {
  return (text.match(/\b\w+\b/g) || []).length;
}

function normalizeType(type: string): "x-post" | "linkedin" | "other" {
  if (type === "x-post") return "x-post";
  if (type === "blog" || type === "email" || type === "landing-page") return "linkedin";
  return "other";
}

function runCharacterCheck(content: string, type: string) {
  const normalized = normalizeType(type);
  const count = content.length;
  const warnings: string[] = [];
  const limit = normalized === "x-post" ? 280 : normalized === "linkedin" ? 3000 : 3000;

  let passed = count <= limit;
  if (normalized === "linkedin" && count > 1300 && count <= 3000) {
    warnings.push(`LinkedIn engagement warning: ${count}/1300 optimal length.`);
  }
  if (count > limit) {
    passed = false;
    warnings.push(`Over limit: ${count}/${limit}.`);
  }

  return { passed, count, limit, warnings };
}

async function runLinkCheck(content: string) {
  const urls = [...new Set(content.match(URL_REGEX) || [])];
  const broken: string[] = [];
  const warnings: string[] = [];

  for (const url of urls) {
    try {
      const resp = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (!resp.ok) {
        broken.push(url);
        warnings.push(`${url} returned HTTP ${resp.status}.`);
      }
      if ([401, 403].includes(resp.status)) {
        warnings.push(`${url} may require auth (HTTP ${resp.status}).`);
      }
    } catch {
      broken.push(url);
      warnings.push(`${url} is unreachable.`);
    }
  }

  return { passed: broken.length === 0, broken, warnings };
}

function extractToneSignals(text: string) {
  const words = wordCount(text);
  const firstPerson = (text.match(FIRST_PERSON_REGEX) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;
  const sentenceCount = Math.max(1, (text.match(/[.!?]+/g) || []).length);
  const questionRatio = questionCount / sentenceCount;
  const exclamationRatio = exclamations / sentenceCount;

  return {
    words,
    firstPersonRatio: firstPerson / Math.max(1, words),
    questionRatio,
    exclamationRatio,
  };
}

function similarityScore(a: ReturnType<typeof extractToneSignals>, b: ReturnType<typeof extractToneSignals>) {
  const safePct = (x: number) => Math.max(0, 1 - Math.min(1, Math.abs(x)));
  const fp = safePct(a.firstPersonRatio - b.firstPersonRatio);
  const q = safePct(a.questionRatio - b.questionRatio);
  const e = safePct(a.exclamationRatio - b.exclamationRatio);
  const w = safePct((a.words - b.words) / Math.max(1, b.words));

  return Math.round(((fp + q + e + w) / 4) * 100);
}

function runFormattingChecks(content: string) {
  const issues: string[] = [];
  const emojiCount = (content.match(EMOJI_REGEX) || []).length;
  if (emojiCount > 3) issues.push(`Too many emojis (${emojiCount}). Keep to 2-3 max.`);

  const paragraphCount = content.split(/\n\s*\n/).filter(Boolean).length;
  if (content.length > 240 && paragraphCount < 2) {
    issues.push("Wall of text: add paragraph breaks for readability.");
  }

  if (ALL_CAPS_SENTENCE_REGEX.test(content)) {
    issues.push("Contains ALL CAPS sentence(s).");
  }

  const hashtags = [...content.matchAll(/#\w+/g)].map((m) => m.index || 0);
  if (hashtags.length > 1) {
    const lastQuarterIndex = Math.floor(content.length * 0.75);
    const scattered = hashtags.some((idx) => idx < lastQuarterIndex);
    if (scattered) issues.push("Hashtags should be grouped at the end, not scattered.");
  }

  return { passed: issues.length === 0, issues };
}

export const verifyContentAction = internalAction({
  args: { contentId: v.id("contentPipeline") },
  handler: async (ctx, args) => {
    const item = await ctx.runQuery(api.contentPipeline.getById, { id: args.contentId });
    if (!item) throw new Error("Content not found");

    const charCheck = runCharacterCheck(item.content, item.type);
    const linkCheck = await runLinkCheck(item.content);

    const published = await ctx.runQuery(api.contentPipeline.listByStage, { stage: "published" });
    const baselinePool = published.filter((p) => p.createdBy === item.createdBy);
    const baselineItems = baselinePool.length > 0 ? baselinePool : published;

    const draftTone = extractToneSignals(item.content);
    const baselineTone = baselineItems.length
      ? baselineItems
          .map((p) => extractToneSignals(p.content))
          .reduce(
            (acc, cur) => ({
              words: acc.words + cur.words,
              firstPersonRatio: acc.firstPersonRatio + cur.firstPersonRatio,
              questionRatio: acc.questionRatio + cur.questionRatio,
              exclamationRatio: acc.exclamationRatio + cur.exclamationRatio,
            }),
            { words: 0, firstPersonRatio: 0, questionRatio: 0, exclamationRatio: 0 }
          )
      : draftTone;

    const baselineAvg = baselineItems.length
      ? {
          words: baselineTone.words / baselineItems.length,
          firstPersonRatio: baselineTone.firstPersonRatio / baselineItems.length,
          questionRatio: baselineTone.questionRatio / baselineItems.length,
          exclamationRatio: baselineTone.exclamationRatio / baselineItems.length,
        }
      : draftTone;

    const toneScore = similarityScore(draftTone, baselineAvg);
    const toneWarnings: string[] = [];
    if (toneScore < 70) {
      toneWarnings.push(`Tone similarity is ${toneScore} (below 70 threshold).`);
    }

    const formatting = runFormattingChecks(item.content);

    const checks = {
      characterCount: charCheck,
      links: linkCheck,
      tone: {
        passed: toneScore >= 70,
        score: toneScore,
        warnings: toneWarnings,
      },
      formatting,
    };

    const issueReasons: string[] = [];
    if (!charCheck.passed) issueReasons.push("character_limit");
    if (!linkCheck.passed) issueReasons.push("broken_links");
    if (toneScore < 70) issueReasons.push("tone_mismatch");
    if (!formatting.passed) issueReasons.push("formatting");

    const passed = checks.characterCount.passed && checks.links.passed && checks.tone.passed && checks.formatting.passed;
    const overallScore = Math.round(
      (Number(checks.characterCount.passed) + Number(checks.links.passed) + toneScore / 100 + Number(checks.formatting.passed)) * 25
    );

    await ctx.runMutation(internal.contentVerification.storeVerificationInternal, {
      contentId: args.contentId,
      checks,
      overallPassed: passed,
      overallScore,
      issueReasons,
    });

    return { success: true, overallPassed: passed, overallScore };
  },
});

export const storeVerificationInternal = internalMutation({
  args: {
    contentId: v.id("contentPipeline"),
    checks: v.object({
      characterCount: v.object({ passed: v.boolean(), count: v.number(), limit: v.number(), warnings: v.array(v.string()) }),
      links: v.object({ passed: v.boolean(), broken: v.array(v.string()), warnings: v.array(v.string()) }),
      tone: v.object({ passed: v.boolean(), score: v.number(), warnings: v.array(v.string()) }),
      formatting: v.object({ passed: v.boolean(), issues: v.array(v.string()) }),
    }),
    overallPassed: v.boolean(),
    overallScore: v.number(),
    issueReasons: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("contentVerification", {
      contentId: args.contentId,
      verifiedAt: Date.now(),
      checks: args.checks,
      overallPassed: args.overallPassed,
      overallScore: args.overallScore,
      issueReasons: args.issueReasons,
    });

    await ctx.db.patch(args.contentId, {
      verificationStatus: args.overallPassed ? "passed" : "failed",
      verificationScore: args.overallScore,
      updatedAt: Date.now(),
    });
  },
});

export const verifyContent = mutation({
  args: { contentId: v.id("contentPipeline") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contentId, { verificationStatus: "pending", updatedAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.contentVerification.verifyContentAction, { contentId: args.contentId });
    return { queued: true };
  },
});

export const getVerificationHistory = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("contentVerification").order("desc").take(200);
    if (!args.userId) return all;

    const filtered = [];
    for (const vrec of all) {
      const content = await ctx.db.get(vrec.contentId);
      if (content?.createdBy === args.userId || content?.assignedTo === args.userId) {
        filtered.push(vrec);
      }
    }
    return filtered;
  },
});

export const getVerificationForContent = query({
  args: { contentId: v.id("contentPipeline") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contentVerification")
      .withIndex("by_content", (q) => q.eq("contentId", args.contentId))
      .order("desc")
      .first();
  },
});

export const getVerificationStats = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const history = await ctx.db.query("contentVerification").collect();

    const scoped = [] as typeof history;
    for (const record of history) {
      const content = await ctx.db.get(record.contentId);
      if (!content) continue;
      if (!args.userId || content.createdBy === args.userId || content.assignedTo === args.userId) {
        scoped.push(record);
      }
    }

    const total = scoped.length;
    const passed = scoped.filter((r) => r.overallPassed).length;
    const passRate = total ? Math.round((passed / total) * 100) : 0;

    const issueCounts: Record<string, number> = {};
    scoped.forEach((r) => r.issueReasons.forEach((reason) => {
      issueCounts[reason] = (issueCounts[reason] || 0) + 1;
    }));

    const commonIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([issue, count]) => ({ issue, count }));

    const toneScores = scoped.map((r) => r.checks.tone.score);
    const toneDrift = toneScores.length
      ? Math.round(toneScores.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, toneScores.length))
      : 100;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weeklyTrend = Array.from({ length: 7 }).map((_, i) => {
      const start = now - (6 - i) * dayMs;
      const end = start + dayMs;
      const dayRecords = scoped.filter((r) => r.verifiedAt >= start && r.verifiedAt < end);
      const dayPassRate = dayRecords.length
        ? Math.round((dayRecords.filter((r) => r.overallPassed).length / dayRecords.length) * 100)
        : 0;
      return { dayOffset: i, count: dayRecords.length, passRate: dayPassRate };
    });

    return {
      total,
      passRate,
      commonIssues,
      toneDrift,
      weeklyTrend,
    };
  },
});

export const overrideVerification = mutation({
  args: { contentId: v.id("contentPipeline"), overriddenBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const latest = await ctx.db
      .query("contentVerification")
      .withIndex("by_content", (q) => q.eq("contentId", args.contentId))
      .order("desc")
      .first();

    if (latest) {
      await ctx.db.patch(latest._id, {
        overridden: true,
        overriddenBy: args.overriddenBy ?? "corinne",
        overriddenAt: Date.now(),
      });
    }

    await ctx.db.patch(args.contentId, {
      verificationStatus: "overridden",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
