import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getPayrollPayments = query({
  args: {
    userId: v.id("users"),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("financePayrollPayments")
      .withIndex("by_user_period", (q) => q.eq("userId", args.userId).eq("period", args.period))
      .collect();
  },
});

export const setPayrollPayment = mutation({
  args: {
    userId: v.id("users"),
    period: v.string(),
    coach: v.string(),
    hours: v.number(),
    rate: v.number(),
    amount: v.number(),
    method: v.string(),
    paid: v.boolean(),
    paidAt: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("financePayrollPayments")
      .withIndex("by_user_period_coach", (q) =>
        q.eq("userId", args.userId).eq("period", args.period).eq("coach", args.coach)
      )
      .first();

    const now = Date.now();
    const patch = {
      hours: args.hours,
      rate: args.rate,
      amount: args.amount,
      method: args.method,
      paid: args.paid,
      paidAt: args.paid ? args.paidAt : undefined,
      notes: args.notes,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("financePayrollPayments", {
      userId: args.userId,
      period: args.period,
      coach: args.coach,
      createdAt: now,
      ...patch,
    });
  },
});

export const getProgramExpenses = query({
  args: {
    userId: v.id("users"),
    program: v.string(),
    season: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("financeProgramExpenses")
      .withIndex("by_user_program_season", (q) =>
        q.eq("userId", args.userId).eq("program", args.program).eq("season", args.season)
      )
      .collect();
  },
});

export const setProgramExpense = mutation({
  args: {
    userId: v.id("users"),
    entity: v.string(),
    program: v.string(),
    season: v.string(),
    expenseKey: v.string(),
    label: v.string(),
    category: v.string(),
    amount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("financeProgramExpenses")
      .withIndex("by_user_expense", (q) => q.eq("userId", args.userId).eq("expenseKey", args.expenseKey))
      .filter((q) =>
        q.and(
          q.eq(q.field("program"), args.program),
          q.eq(q.field("season"), args.season)
        )
      )
      .first();

    const now = Date.now();
    const patch = {
      entity: args.entity,
      program: args.program,
      season: args.season,
      label: args.label,
      category: args.category,
      amount: args.amount,
      notes: args.notes,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("financeProgramExpenses", {
      userId: args.userId,
      expenseKey: args.expenseKey,
      createdAt: now,
      ...patch,
    });
  },
});
