import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function getPacificYearMonth(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(timestamp));

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

export const createCategory = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("personal"), v.literal("professional")),
    purpose: v.optional(v.string()),
    yearlyGoals: v.array(v.string()),
    monthlyFocus: v.array(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rpmCategories", args);
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("rpmCategories"),
    purpose: v.optional(v.string()),
    yearlyGoals: v.optional(v.array(v.string())),
    monthlyFocus: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const getCategoriesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rpmCategories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getCategoryById = query({
  args: { id: v.id("rpmCategories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getMonthlyAccomplishmentsByCategory = query({
  args: {
    categoryId: v.id("rpmCategories"),
    nowTs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) return { count: 0, items: [] };

    const targetYearMonth = getPacificYearMonth(args.nowTs ?? Date.now());

    const quickWins = await ctx.db
      .query("quickWins")
      .withIndex("by_user", (q) => q.eq("userId", category.userId))
      .collect();

    const quickWinItems = quickWins
      .filter(
        (item) =>
          item.categoryId === args.categoryId &&
          item.completed &&
          item.completedAt &&
          getPacificYearMonth(item.completedAt) === targetYearMonth
      )
      .map((item) => ({
        source: "quick-win" as const,
        text: item.task,
        completedAt: item.completedAt as number,
      }));

    const fiveToThriveDocs = await ctx.db
      .query("fiveToThrive")
      .withIndex("by_user", (q) => q.eq("userId", category.userId))
      .collect();

    const fiveToThriveItems = fiveToThriveDocs.flatMap((doc) =>
      doc.tasks
        .filter(
          (task) =>
            task.categoryId === args.categoryId &&
            task.completed &&
            task.completedAt &&
            getPacificYearMonth(task.completedAt) === targetYearMonth
        )
        .map((task) => ({
          source: "five-to-thrive" as const,
          text: task.text,
          completedAt: task.completedAt as number,
        }))
    );

    const items = [...quickWinItems, ...fiveToThriveItems].sort(
      (a, b) => b.completedAt - a.completedAt
    );

    return { count: items.length, items };
  },
});

export const initializeDefaultCategories = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const personalCategories = [
      "Magnificent Mommy/Homeschooling Hero",
      "Financial Independence & Freedom",
      "Home Haven & Sanctuary",
      "Bangin' Ass Body",
      "Extraordinary Friendships",
      "Phenomenal Relationship",
    ];

    const professionalCategories = [
      "Bad Ass Business Owner",
      "HTA Empire Builder",
      "Staff Empowerment & Kickass Workplace",
      "Marketing & Networking Genius",
      "Operational Systems Guru",
      "Program Innovation & Excellence",
    ];

    let order = 0;

    for (const name of personalCategories) {
      await ctx.db.insert("rpmCategories", {
        userId: args.userId,
        name,
        type: "personal",
        yearlyGoals: [],
        monthlyFocus: [],
        order: order++,
      });
    }

    for (const name of professionalCategories) {
      await ctx.db.insert("rpmCategories", {
        userId: args.userId,
        name,
        type: "professional",
        yearlyGoals: [],
        monthlyFocus: [],
        order: order++,
      });
    }
  },
});
