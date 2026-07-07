import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Availability ──────────────────────────────────────────────────────────

export const getAvailability = query({
  args: {},
  handler: async (ctx) => {
    const weeks = await ctx.db.query("campAvailability").collect();
    const result: Record<string, unknown> = {};
    for (const week of weeks) {
      const totalRegistered = week.weeklyUsed + week.dailyUsed;
      const displaySpots = Math.max(0, 30 - totalRegistered);
      result[week.weekId] = {
        label: week.label,
        shortLabel: week.shortLabel,
        startDate: week.startDate,
        endDate: week.endDate,
        weeklyRemaining: Math.max(0, week.weeklySlots - week.weeklyUsed),
        dailyRemaining: Math.max(0, week.dailySlots - week.dailyUsed),
        displaySpots,
        totalRegistered,
        isFull: displaySpots === 0,
      };
    }
    return result;
  },
});

// ─── Promo Codes ──────────────────────────────────────────────────────────

export const validatePromo = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const promo = await ctx.db
      .query("campPromoCodes")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .first();
    if (!promo || !promo.active) return { valid: false, error: "Invalid or expired promo code" };
    if (promo.maxUses !== undefined && promo.usedCount >= promo.maxUses) {
      return { valid: false, error: "This promo code has reached its limit" };
    }
    return {
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      description: promo.description,
    };
  },
});

export const getPromoCodes = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("campPromoCodes").collect();
  },
});

export const createPromoCode = mutation({
  args: {
    code: v.string(),
    type: v.string(),
    value: v.number(),
    description: v.string(),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const upper = args.code.trim().toUpperCase();
    const existing = await ctx.db
      .query("campPromoCodes")
      .withIndex("by_code", (q) => q.eq("code", upper))
      .first();
    if (existing) throw new Error("Code already exists");
    return ctx.db.insert("campPromoCodes", {
      code: upper,
      type: args.type,
      value: args.value,
      description: args.description,
      active: true,
      usedCount: 0,
      maxUses: args.maxUses,
      createdAt: Date.now(),
    });
  },
});

export const togglePromoCode = mutation({
  args: { code: v.string(), active: v.optional(v.boolean()) },
  handler: async (ctx, { code, active }) => {
    const promo = await ctx.db
      .query("campPromoCodes")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();
    if (!promo) throw new Error("Promo code not found");
    const newActive = active !== undefined ? active : !promo.active;
    await ctx.db.patch(promo._id, { active: newActive });
    return { ...promo, active: newActive };
  },
});

// ─── Registrations ────────────────────────────────────────────────────────

export const createRegistration = mutation({
  args: {
    season: v.string(),
    programSlug: v.optional(v.string()),
    programType: v.optional(v.string()),
    parent: v.object({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
    children: v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      age: v.optional(v.number()),
      birthDate: v.optional(v.string()),  // YYYY-MM-DD format
      birthYear: v.optional(v.union(v.string(), v.number())),
      gender: v.optional(v.string()),
      allergies: v.optional(v.string()),
      practiceDay: v.optional(v.string()),
      division: v.optional(v.string()),
      ageGroup: v.optional(v.string()),
      sessions: v.any(),
    })),
    emergencyContact: v.object({ name: v.string(), phone: v.string() }),
    waiverAccepted: v.boolean(),
    promoCode: v.optional(v.string()),
    pricing: v.object({
      subtotal: v.number(),
      discount: v.number(),
      accountCreditApplied: v.optional(v.number()),
      total: v.number(),
    }),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("campRegistrations", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const markFreeRegistration = mutation({
  args: { 
    registrationId: v.string(),
    promoCode: v.optional(v.string())
  },
  handler: async (ctx, { registrationId, promoCode }) => {
    // Find by stripePaymentIntentId (which was stored during registration)
    const reg = await ctx.db
      .query("campRegistrations")
      .withIndex("by_stripe_pi", (q) => q.eq("stripePaymentIntentId", registrationId))
      .first();
    
    if (!reg) {
      console.log("[markFreeRegistration] No registration found for:", registrationId);
      return null;
    }
    
    await ctx.db.patch(reg._id, { 
      status: "paid", 
      paidAt: Date.now(),
      paymentMethod: "free_promo",
      appliedPromoCode: promoCode
    });
    
    return { success: true };
  },
});

function getProgramFromSeason(season: string | undefined) {
  if (!season) return "camp";
  if (season.includes("pdp")) return "pdp";
  if (season.includes("spring")) return "spring_league";
  return "camp";
}

function getRegionFromSeason(season: string | undefined) {
  if (!season) return undefined;
  if (season.includes("agoura")) return "agoura";
  if (season.includes("pali")) return "pali";
  return undefined;
}

function normalizeBirthYear(value: unknown, birthDate?: string) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d{4}$/.test(value)) return Number(value);
  if (birthDate && /^\d{4}/.test(birthDate)) return Number(birthDate.slice(0, 4));
  return undefined;
}

export const markPaid = internalMutation({
  args: { stripePaymentIntentId: v.string() },
  handler: async (ctx, { stripePaymentIntentId }) => {
    const reg = await ctx.db
      .query("campRegistrations")
      .withIndex("by_stripe_pi", (q) => q.eq("stripePaymentIntentId", stripePaymentIntentId))
      .first();
    if (!reg) return null;
    if (reg.status === "paid") return reg;

    await ctx.db.patch(reg._id, { status: "paid", paidAt: Date.now() });

    // ═══ Auto-populate Family CRM ═══
    const email = reg.parent.email.toLowerCase().trim();
    const now = Date.now();
    
    // Check if family exists
    let family = await ctx.db
      .query("families")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!family) {
      // Create new family record
      const familyId = await ctx.db.insert("families", {
        parentFirstName: reg.parent.firstName,
        parentLastName: reg.parent.lastName,
        email,
        phone: reg.parent.phone,
        tags: [reg.programType || getProgramFromSeason(reg.season), reg.season].filter(Boolean),
        createdAt: now,
        updatedAt: now,
      });
      family = await ctx.db.get(familyId);
    } else {
      const existingTags = Array.isArray(family.tags) ? family.tags : [];
      const nextTags = [
        ...new Set([
          ...existingTags,
          reg.programType || getProgramFromSeason(reg.season),
          reg.season,
        ].filter(Boolean)),
      ];
      await ctx.db.patch(family._id, {
        parentFirstName: reg.parent.firstName,
        parentLastName: reg.parent.lastName,
        phone: reg.parent.phone,
        tags: nextTags,
        updatedAt: now,
      });
      family = await ctx.db.get(family._id);
    }
    
    // Auto-create children records
    const childResults = [];
    if (family) {
      for (const child of reg.children) {
        if (!child.firstName || !child.lastName) continue;
        
        // Check if child already exists
        const existingChild = await ctx.db
          .query("children")
          .withIndex("by_family", (q) => q.eq("familyId", family._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("firstName"), child.firstName),
              q.eq(q.field("lastName"), child.lastName)
            )
          )
          .first();
        
        const birthYear = normalizeBirthYear(child.birthYear, child.birthDate);
        let childId = existingChild?._id;

        if (!existingChild) {
          // Create child record
          childId = await ctx.db.insert("children", {
            familyId: family._id,
            firstName: child.firstName,
            lastName: child.lastName,
            birthYear,
            birthDate: child.birthDate,
            gender: child.gender,
            createdAt: now,
            updatedAt: now,
          });
        } else {
          await ctx.db.patch(existingChild._id, {
            birthYear,
            birthDate: child.birthDate,
            gender: child.gender,
            updatedAt: now,
          });
        }

        if (childId) {
          childResults.push({ childId, child });

          const program = reg.programType || getProgramFromSeason(reg.season);
          if (program === "spring" || program === "spring_league" || program === "pdp") {
            const normalizedProgram = program === "spring" ? "spring_league" : program;
            const existingEnrollment = await ctx.db
              .query("enrollments")
              .withIndex("by_child", (q) => q.eq("childId", childId))
              .filter((q) =>
                q.and(
                  q.eq(q.field("program"), normalizedProgram),
                  q.eq(q.field("season"), reg.season)
                )
              )
              .first();

            const enrollment = {
              childId,
              familyId: family._id,
              program: normalizedProgram,
              region: getRegionFromSeason(reg.season),
              season: reg.season,
              division: child.division || child.ageGroup,
              practiceDay: child.practiceDay,
              status: "paid_unassigned",
              sourceRegistrationId: reg._id,
              updatedAt: now,
            };

            if (existingEnrollment) {
              await ctx.db.patch(existingEnrollment._id, enrollment);
            } else {
              await ctx.db.insert("enrollments", { ...enrollment, createdAt: now });
            }
          }
        }
      }
    }

    // Update promo usage
    if (reg.promoCode) {
      const promo = await ctx.db
        .query("campPromoCodes")
        .withIndex("by_code", (q) => q.eq("code", reg.promoCode!))
        .first();
      if (promo) await ctx.db.patch(promo._id, { usedCount: promo.usedCount + 1 });
    }

    const accountCreditApplied = reg.pricing?.accountCreditApplied ?? 0;
    if (accountCreditApplied > 0) {
      const currentBalance = family?.creditBalance ?? 0;
      const debitAmount = Math.min(accountCreditApplied, currentBalance);

      if (family && debitAmount > 0) {
        await ctx.db.patch(family._id, {
          creditBalance: currentBalance - debitAmount,
          updatedAt: now,
        });

        await ctx.db.insert("creditTransactions", {
          familyEmail: email,
          amount: -debitAmount,
          type: "applied_to_purchase",
          description: "Applied account credit to summer camp registration",
          registrationId: reg._id,
          createdAt: now,
        });
      }
    }

    // Update availability
    for (const child of reg.children) {
      const sessions = child.sessions as Record<string, { type: string; selectedDays?: string[] }>;
      for (const [weekId, session] of Object.entries(sessions)) {
        const week = await ctx.db
          .query("campAvailability")
          .withIndex("by_week_id", (q) => q.eq("weekId", weekId))
          .first();
        if (!week) continue;
        if (session.type === "full") {
          await ctx.db.patch(week._id, {
            weeklyUsed: Math.min(week.weeklyUsed + 1, week.weeklySlots),
          });
        } else if (session.type === "days" && (session.selectedDays?.length ?? 0) > 0) {
          await ctx.db.patch(week._id, {
            dailyUsed: Math.min(week.dailyUsed + 1, week.dailySlots),
          });
        }
      }
    }

    return {
      ...reg,
      familyId: family?._id,
      childrenWithIds: childResults.map((item) => ({
        ...item.child,
        childId: item.childId,
      })),
    };
  },
});

export const getRegistrations = query({
  args: {
    week: v.optional(v.string()),
    status: v.optional(v.string()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, { week, status, q }) => {
    let regs = await ctx.db.query("campRegistrations").order("desc").collect();
    if (status) regs = regs.filter((r) => r.status === status);
    if (week) {
      regs = regs.filter((r) =>
        r.children.some((c) => {
          const s = (c.sessions as Record<string, { type: string; selectedDays?: string[] }>)[week];
          return s && s.type !== "none" && (s.type === "full" || (s.selectedDays?.length ?? 0) > 0);
        })
      );
    }
    if (q) {
      const lower = q.toLowerCase();
      regs = regs.filter(
        (r) =>
          r.parent.firstName.toLowerCase().includes(lower) ||
          r.parent.lastName.toLowerCase().includes(lower) ||
          r.parent.email.toLowerCase().includes(lower) ||
          r.children.some(
            (c) =>
              c.firstName.toLowerCase().includes(lower) ||
              c.lastName.toLowerCase().includes(lower)
          )
      );
    }
    return regs;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const regs = await ctx.db.query("campRegistrations").collect();
    const paid = regs.filter((r) => r.status === "paid");
    const pending = regs.filter((r) => r.status === "pending");
    const totalKids = paid.reduce((s, r) => s + r.children.length, 0);
    const totalRevenue = paid.reduce((s, r) => s + r.pricing.total, 0);
    const weeks = await ctx.db.query("campAvailability").collect();
    const weekStats: Record<string, unknown> = {};
    for (const w of weeks) {
      weekStats[w.weekId] = {
        label: w.label,
        weeklyUsed: w.weeklyUsed,
        weeklySlots: w.weeklySlots,
        dailyUsed: w.dailyUsed,
        dailySlots: w.dailySlots,
        totalRegistered: w.weeklyUsed + w.dailyUsed,
        displaySpots: Math.max(0, 30 - w.weeklyUsed - w.dailyUsed),
      };
    }
    return {
      totalKids,
      totalRevenue,
      totalFamilies: paid.length,
      pendingCount: pending.length,
      weekStats,
    };
  },
});

// ─── Seed ─────────────────────────────────────────────────────────────────

export const seedCampData = mutation({
  args: {},
  handler: async (ctx) => {
    // Seed availability if not already seeded
    const existing = await ctx.db.query("campAvailability").first();
    if (!existing) {
      const weeks = [
        { weekId: "week1", label: "June 22-26",  shortLabel: "Jun 22-26", startDate: "2026-06-22", endDate: "2026-06-26" },
        { weekId: "week2", label: "July 6-10",   shortLabel: "Jul 6-10",  startDate: "2026-07-06", endDate: "2026-07-10" },
        { weekId: "week3", label: "July 20-24",  shortLabel: "Jul 20-24", startDate: "2026-07-20", endDate: "2026-07-24" },
        { weekId: "week4", label: "July 27-31",  shortLabel: "Jul 27-31", startDate: "2026-07-27", endDate: "2026-07-31" },
      ];
      for (const w of weeks) {
        await ctx.db.insert("campAvailability", {
          ...w,
          weeklySlots: 20,
          weeklyUsed: 0,
          dailySlots: 25,
          dailyUsed: 0,
        });
      }
    }

    // Seed promo codes if not seeded
    const existingPromo = await ctx.db.query("campPromoCodes").first();
    if (!existingPromo) {
      await ctx.db.insert("campPromoCodes", {
        code: "REFERRAL",
        type: "free_days",
        value: 1,
        description: "1 free camp day ($65 value)",
        active: true,
        usedCount: 0,
        createdAt: Date.now(),
      });
      await ctx.db.insert("campPromoCodes", {
        code: "EARLYBIRD",
        type: "percent_off",
        value: 10,
        description: "10% off total",
        active: true,
        usedCount: 0,
        createdAt: Date.now(),
      });
      await ctx.db.insert("campPromoCodes", {
        code: "ASPIRE",
        type: "dollar_off",
        value: 50,
        description: "$50 off - Aspire Soccer families",
        active: true,
        usedCount: 0,
        createdAt: Date.now(),
      });
    }

    return { seeded: true };
  },
});

// ─── Admin Stats & Reports ────────────────────────────────────────────────

export const getCampStats = query({  
  args: {},
  handler: async (ctx) => {
    const regs = await ctx.db.query("campRegistrations")
      .filter(q => q.eq(q.field("status"), "paid"))
      .collect();

    let totalRevenue = 0;
    let totalKids = 0;
    let totalAge = 0;
    let ageCount = 0;
    
    const weeklyBreakdown: Record<string, Record<string, number>> = {
      "Week 1 (Jun 16-20)": {},
      "Week 2 (Jun 23-27)": {},
      "Week 3 (Jul 14-18)": {},
      "Week 4 (Jul 21-25)": {},
    };

    const weekMap: Record<string, string> = {
      week1: "Week 1 (Jun 16-20)",
      week2: "Week 2 (Jun 23-27)",
      week3: "Week 3 (Jul 14-18)",
      week4: "Week 4 (Jul 21-25)",
    };

    for (const reg of regs) {
      totalRevenue += reg.pricing.total;
      totalKids += reg.children.length;

      for (const child of reg.children) {
        // Calculate age
        if (child.birthDate) {
          const birth = new Date(child.birthDate);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          totalAge += age;
          ageCount++;
        }

        // Count days per week
        const sessions = child.sessions as Record<string, { type: string; selectedDays?: string[] }>;
        for (const [wk, sess] of Object.entries(sessions || {})) {
          const weekName = weekMap[wk];
          if (!weekName) continue;
          
          if (!weeklyBreakdown[weekName]) weeklyBreakdown[weekName] = {};
          
          for (const day of sess.selectedDays || []) {
            const dayLower = day.toLowerCase();
            weeklyBreakdown[weekName][dayLower] = (weeklyBreakdown[weekName][dayLower] || 0) + 1;
          }
        }
      }
    }

    return {
      totalRegistrations: regs.length,
      totalRevenue,
      totalKids,
      avgAge: ageCount > 0 ? totalAge / ageCount : 0,
      weeklyBreakdown,
    };
  },
});
