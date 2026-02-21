import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ──────────────────────────────────────────────────────────────

export const getFamilies = query({
  args: {},
  handler: async (ctx) => {
    const families = await ctx.db.query("families").order("asc").collect();
    const result = [];
    for (const family of families) {
      const children = await ctx.db
        .query("children")
        .withIndex("by_family", (q) => q.eq("familyId", family._id))
        .collect();
      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_family", (q) => q.eq("familyId", family._id))
        .collect();
      result.push({
        ...family,
        children,
        enrollmentCount: enrollments.length,
        programs: [...new Set(enrollments.map((e) => e.program))],
        regions: [...new Set(enrollments.map((e) => e.region).filter((r): r is string => !!r))],
      });
    }
    return result;
  },
});

export const getFamily = query({
  args: { id: v.id("families") },
  handler: async (ctx, { id }) => {
    const family = await ctx.db.get(id);
    if (!family) return null;
    const children = await ctx.db
      .query("children")
      .withIndex("by_family", (q) => q.eq("familyId", id))
      .collect();
    const childrenWithEnrollments = [];
    for (const child of children) {
      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_child", (q) => q.eq("childId", child._id))
        .collect();
      childrenWithEnrollments.push({ ...child, enrollments });
    }
    return { ...family, children: childrenWithEnrollments };
  },
});

export const searchFamilies = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    if (!q.trim()) {
      const families = await ctx.db.query("families").order("asc").take(100);
      return families;
    }
    const lower = q.toLowerCase();
    const all = await ctx.db.query("families").collect();
    return all
      .filter(
        (f) =>
          `${f.parentFirstName} ${f.parentLastName}`.toLowerCase().includes(lower) ||
          f.email.toLowerCase().includes(lower) ||
          f.phone.includes(lower)
      )
      .slice(0, 50);
  },
});

export const getFamiliesByProgram = query({
  args: { program: v.string() },
  handler: async (ctx, { program }) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_program", (q) => q.eq("program", program))
      .collect();
    const familyIds = [...new Set(enrollments.map((e) => e.familyId))];
    const families = [];
    for (const id of familyIds) {
      const fam = await ctx.db.get(id);
      if (fam) families.push(fam);
    }
    return families;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const families = await ctx.db.query("families").collect();
    const enrollments = await ctx.db.query("enrollments").collect();
    const springLeague = enrollments.filter((e) => e.program === "spring_league");
    const camp = enrollments.filter((e) => e.program === "camp");
    const pdp = enrollments.filter((e) => e.program === "pdp");
    return {
      totalFamilies: families.length,
      springLeagueFamilies: new Set(springLeague.map((e) => e.familyId)).size,
      campFamilies: new Set(camp.map((e) => e.familyId)).size,
      pdpFamilies: new Set(pdp.map((e) => e.familyId)).size,
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

export const upsertFamily = mutation({
  args: {
    parentFirstName: v.string(),
    parentLastName: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("families")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
      .first();
    const now = Date.now();
    const normalized = { ...args, email: args.email.toLowerCase().trim() };
    if (existing) {
      await ctx.db.patch(existing._id, { ...normalized, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("families", {
      ...normalized,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const upsertChild = mutation({
  args: {
    familyId: v.id("families"),
    firstName: v.string(),
    lastName: v.string(),
    birthYear: v.optional(v.number()),
    gender: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("children")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .filter((q) =>
        q.and(
          q.eq(q.field("firstName"), args.firstName),
          q.eq(q.field("lastName"), args.lastName)
        )
      )
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        birthYear: args.birthYear,
        gender: args.gender,
      });
      return existing._id;
    }
    return await ctx.db.insert("children", { ...args, createdAt: now });
  },
});

export const upsertEnrollment = mutation({
  args: {
    childId: v.id("children"),
    familyId: v.id("families"),
    program: v.string(),
    region: v.optional(v.string()),
    season: v.optional(v.string()),
    division: v.optional(v.string()),
    practiceDay: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .filter((q) =>
        q.and(
          q.eq(q.field("program"), args.program),
          q.eq(q.field("season"), args.season ?? "")
        )
      )
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("enrollments", { ...args, createdAt: now });
  },
});

export const updateFamilyQuo = mutation({
  args: {
    id: v.id("families"),
    lastQuoMessage: v.string(),
    lastQuoDate: v.number(),
  },
  handler: async (ctx, { id, lastQuoMessage, lastQuoDate }) => {
    await ctx.db.patch(id, {
      lastQuoMessage,
      lastQuoDate,
      updatedAt: Date.now(),
    });
  },
});
