import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ──────────────────────────────────────────────────────────────

// Simple list query for Family CRM page
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("families").order("desc").collect();
  },
});

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
    const miniCamp = enrollments.filter((e) => e.program === "mini_camp");
    const pdp = enrollments.filter((e) => e.program === "pdp");
    return {
      totalFamilies: families.length,
      springLeagueFamilies: new Set(springLeague.map((e) => e.familyId)).size,
      campFamilies: new Set(camp.map((e) => e.familyId)).size,
      miniCampFamilies: new Set(miniCamp.map((e) => e.familyId)).size,
      pdpFamilies: new Set(pdp.map((e) => e.familyId)).size,
    };
  },
});

export const getSpringLeagueSummary = query({
  args: {},
  handler: async (ctx) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_program", (q) => q.eq("program", "spring_league"))
      .collect();

    const familyCache = new Map();
    const childCache = new Map();

    const getRegionKey = (region?: string) => {
      const value = (region || "").toLowerCase();
      if (value.includes("agoura") || value.includes("region 4")) return "agoura";
      if (value.includes("pali") || value.includes("palisades") || value.includes("69")) return "pali";
      return "unassigned";
    };

    const getRegionLabel = (key: string, raw?: string) => {
      if (key === "agoura") return "Agoura";
      if (key === "pali") return "Pali";
      return raw?.trim() || "Unassigned region";
    };

    const normalizePracticeDay = (day?: string) => {
      if (!day?.trim()) return "Unassigned";
      const value = day.trim();
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    };

    const rows: Array<{
      enrollmentId: string;
      familyId: string;
      childId: string;
      childName: string;
      familyName: string;
      regionKey: string;
      regionLabel: string;
      division: string;
      practiceDay: string;
      status: string;
      hasMissingRegion: boolean;
      hasMissingDivision: boolean;
      hasMissingPracticeDay: boolean;
    }> = [];

    for (const enrollment of enrollments) {
      let child = childCache.get(enrollment.childId);
      if (child === undefined) {
        child = await ctx.db.get(enrollment.childId);
        childCache.set(enrollment.childId, child);
      }

      let family = familyCache.get(enrollment.familyId);
      if (family === undefined) {
        family = await ctx.db.get(enrollment.familyId);
        familyCache.set(enrollment.familyId, family);
      }

      const regionKey = getRegionKey(enrollment.region);
      const regionLabel = getRegionLabel(regionKey, enrollment.region);
      const division = enrollment.division?.trim() || "Unassigned";
      const practiceDay = normalizePracticeDay(enrollment.practiceDay);
      const childName = child ? `${child.firstName} ${child.lastName}` : "Unknown child";
      const familyName = family
        ? `${family.parentFirstName} ${family.parentLastName}`.trim() || family.email
        : "Unknown family";

      rows.push({
        enrollmentId: enrollment._id,
        familyId: enrollment.familyId,
        childId: enrollment.childId,
        childName,
        familyName,
        regionKey,
        regionLabel,
        division,
        practiceDay,
        status: enrollment.status || "unknown",
        hasMissingRegion: regionKey === "unassigned",
        hasMissingDivision: division === "Unassigned",
        hasMissingPracticeDay: practiceDay === "Unassigned",
      });
    }

    const buildRegionSummary = (regionKey: string, label: string) => {
      const regionRows = rows.filter((row) => row.regionKey === regionKey);
      const byDivision = new Map<string, number>();
      const byPracticeDay = new Map<string, number>();
      const byStatus = new Map<string, number>();

      for (const row of regionRows) {
        byDivision.set(row.division, (byDivision.get(row.division) || 0) + 1);
        byPracticeDay.set(row.practiceDay, (byPracticeDay.get(row.practiceDay) || 0) + 1);
        byStatus.set(row.status, (byStatus.get(row.status) || 0) + 1);
      }

      return {
        regionKey,
        label,
        playerCount: regionRows.length,
        familyCount: new Set(regionRows.map((row) => row.familyId)).size,
        missingDivisionCount: regionRows.filter((row) => row.hasMissingDivision).length,
        missingPracticeDayCount: regionRows.filter((row) => row.hasMissingPracticeDay).length,
        divisions: Array.from(byDivision.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
        practiceDays: Array.from(byPracticeDay.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
        statuses: Array.from(byStatus.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
      };
    };

    const missingAssignments = rows
      .filter(
        (row) => row.hasMissingRegion || row.hasMissingDivision || row.hasMissingPracticeDay
      )
      .sort((a, b) => a.familyName.localeCompare(b.familyName))
      .slice(0, 20)
      .map((row) => ({
        childName: row.childName,
        familyName: row.familyName,
        regionLabel: row.regionLabel,
        missing: [
          row.hasMissingRegion ? "region" : null,
          row.hasMissingDivision ? "division" : null,
          row.hasMissingPracticeDay ? "practice day" : null,
        ].filter(Boolean),
      }));

    const rosterGroups = Array.from(
      rows.reduce((map, row) => {
        const key = `${row.regionKey}__${row.practiceDay}__${row.division}`;
        const existing = map.get(key) || {
          regionKey: row.regionKey,
          regionLabel: row.regionLabel,
          practiceDay: row.practiceDay,
          division: row.division,
          playerCount: 0,
          familyIds: new Set<string>(),
          players: [] as Array<{ childName: string; familyName: string; status: string }>,
        };

        existing.playerCount += 1;
        existing.familyIds.add(row.familyId);
        existing.players.push({
          childName: row.childName,
          familyName: row.familyName,
          status: row.status,
        });

        map.set(key, existing);
        return map;
      }, new Map<string, {
        regionKey: string;
        regionLabel: string;
        practiceDay: string;
        division: string;
        playerCount: number;
        familyIds: Set<string>;
        players: Array<{ childName: string; familyName: string; status: string }>;
      }>())
    )
      .map(([, group]) => ({
        regionKey: group.regionKey,
        regionLabel: group.regionLabel,
        practiceDay: group.practiceDay,
        division: group.division,
        playerCount: group.playerCount,
        familyCount: group.familyIds.size,
        players: group.players.sort((a, b) => a.childName.localeCompare(b.childName)),
      }))
      .sort((a, b) => {
        if (a.regionKey !== b.regionKey) return a.regionKey.localeCompare(b.regionKey);
        if (a.practiceDay !== b.practiceDay) return a.practiceDay.localeCompare(b.practiceDay);
        return a.division.localeCompare(b.division);
      });

    return {
      totalPlayers: rows.length,
      totalFamilies: new Set(rows.map((row) => row.familyId)).size,
      playersMissingRegion: rows.filter((row) => row.hasMissingRegion).length,
      playersMissingDivision: rows.filter((row) => row.hasMissingDivision).length,
      playersMissingPracticeDay: rows.filter((row) => row.hasMissingPracticeDay).length,
      byRegion: [
        buildRegionSummary("agoura", "Agoura"),
        buildRegionSummary("pali", "Pali"),
      ],
      rosterGroups,
      missingAssignments,
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
      const updates: { birthYear?: number; gender?: string } = {};
      if (args.birthYear !== undefined) updates.birthYear = args.birthYear;
      if (args.gender !== undefined) updates.gender = args.gender;
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existing._id, updates);
      }
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
      const updates: {
        familyId?: typeof args.familyId;
        childId?: typeof args.childId;
        program?: string;
        region?: string;
        season?: string;
        division?: string;
        practiceDay?: string;
        status?: string;
        notes?: string;
      } = {
        familyId: args.familyId,
        childId: args.childId,
        program: args.program,
        status: args.status,
      };

      if (args.region !== undefined) updates.region = args.region;
      if (args.season !== undefined) updates.season = args.season;
      if (args.division !== undefined) updates.division = args.division;
      if (args.practiceDay !== undefined) updates.practiceDay = args.practiceDay;
      if (args.notes !== undefined) updates.notes = args.notes;

      await ctx.db.patch(existing._id, updates);
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

// ─── Credit System ────────────────────────────────────────────────────────

export const getCreditBalance = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const family = await ctx.db
      .query("families")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase().trim()))
      .first();
    
    return { balance: family?.creditBalance ?? 0 };
  },
});

export const getCreditHistory = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_email", (q) => q.eq("familyEmail", email.toLowerCase().trim()))
      .order("desc")
      .collect();
    
    return transactions;
  },
});

export const addCredit = mutation({
  args: {
    familyEmail: v.string(),
    amount: v.number(),
    type: v.union(v.literal("refund_credit"), v.literal("promotional_credit")),
    description: v.string(),
    registrationId: v.optional(v.string()),
    processedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.familyEmail.toLowerCase().trim();
    
    // Find or create family record
    let family = await ctx.db
      .query("families")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    const now = Date.now();
    
    if (!family) {
      // Create basic family record if it doesn't exist
      const familyId = await ctx.db.insert("families", {
        parentFirstName: "",
        parentLastName: "",
        email,
        phone: "",
        creditBalance: args.amount,
        createdAt: now,
        updatedAt: now,
      });
      family = await ctx.db.get(familyId);
    } else {
      // Update existing family's credit balance
      const newBalance = (family.creditBalance ?? 0) + args.amount;
      await ctx.db.patch(family._id, {
        creditBalance: newBalance,
        updatedAt: now,
      });
    }
    
    // Record the transaction
    await ctx.db.insert("creditTransactions", {
      familyEmail: email,
      amount: args.amount,
      type: args.type,
      description: args.description,
      registrationId: args.registrationId,
      processedBy: args.processedBy,
      createdAt: now,
    });
    
    return {
      success: true,
      newBalance: (family?.creditBalance ?? 0) + args.amount,
    };
  },
});

export const applyCredit = mutation({
  args: {
    familyEmail: v.string(),
    amount: v.number(),
    description: v.string(),
    registrationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.familyEmail.toLowerCase().trim();
    
    const family = await ctx.db
      .query("families")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!family) {
      throw new Error("Family not found");
    }
    
    const currentBalance = family.creditBalance ?? 0;
    
    if (currentBalance < args.amount) {
      throw new Error(`Insufficient credit balance. Available: ${currentBalance}, Requested: ${args.amount}`);
    }
    
    const newBalance = currentBalance - args.amount;
    const now = Date.now();
    
    // Update family's credit balance
    await ctx.db.patch(family._id, {
      creditBalance: newBalance,
      updatedAt: now,
    });
    
    // Record the transaction (negative amount = credit used)
    await ctx.db.insert("creditTransactions", {
      familyEmail: email,
      amount: -args.amount,
      type: "applied_to_purchase",
      description: args.description,
      registrationId: args.registrationId,
      createdAt: now,
    });
    
    return {
      success: true,
      amountApplied: args.amount,
      remainingBalance: newBalance,
    };
  },
});
