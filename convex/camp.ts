import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

declare const process: { env: Record<string, string | undefined> };

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
      gender: v.optional(v.string()),
      allergies: v.optional(v.string()),
      sessions: v.any(),
    })),
    emergencyContact: v.object({ name: v.string(), phone: v.string() }),
    waiverAccepted: v.boolean(),
    promoCode: v.optional(v.string()),
    pricing: v.object({ subtotal: v.number(), discount: v.number(), total: v.number() }),
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

export const markPaid = internalMutation({
  args: { stripePaymentIntentId: v.string() },
  handler: async (ctx, { stripePaymentIntentId }) => {
    const reg = await ctx.db
      .query("campRegistrations")
      .withIndex("by_stripe_pi", (q) => q.eq("stripePaymentIntentId", stripePaymentIntentId))
      .first();
    if (!reg) return null;

    await ctx.db.patch(reg._id, { status: "paid", paidAt: Date.now() });

    // Update promo usage
    if (reg.promoCode) {
      const promo = await ctx.db
        .query("campPromoCodes")
        .withIndex("by_code", (q) => q.eq("code", reg.promoCode!))
        .first();
      if (promo) await ctx.db.patch(promo._id, { usedCount: promo.usedCount + 1 });
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

    return reg;
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
