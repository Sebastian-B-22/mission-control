import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  rpmCategories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("personal"), v.literal("professional")),
    yearlyGoals: v.array(v.string()),
    monthlyFocus: v.array(v.string()),
    order: v.number(),
  }).index("by_user", ["userId"]),

  dailyCheckIns: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    type: v.union(v.literal("morning"), v.literal("evening")),
    responses: v.object({
      oneThing: v.optional(v.string()),
      excitement: v.optional(v.string()),
      surprise: v.optional(v.string()),
      oneThingDone: v.optional(v.boolean()),
      reflection: v.optional(v.string()),
      appreciated: v.optional(v.string()),
      learned: v.optional(v.string()),
      wins: v.optional(v.string()),
    }),
    completedAt: v.number(),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_and_type", ["userId", "type"]),

  habitScores: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    clarity: v.number(), // 1-5
    productivity: v.number(), // 1-5
    energy: v.number(), // 1-5
    influence: v.number(), // 1-5
    necessity: v.number(), // 1-5
    courage: v.number(), // 1-5
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  weeklyRPM: defineTable({
    userId: v.id("users"),
    weekStartDate: v.string(), // YYYY-MM-DD format (Sunday)
    wins: v.array(v.string()),
    priorities: v.object({}), // categoryId: string[]
    focusAreas: v.array(v.string()),
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_week", ["userId", "weekStartDate"]),
});
