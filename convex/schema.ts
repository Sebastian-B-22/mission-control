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
    purpose: v.optional(v.string()),
    role: v.optional(v.string()),
    yearlyGoals: v.array(v.string()),
    monthlyFocus: v.array(v.string()),
    order: v.number(),
  }).index("by_user", ["userId"]),

  teamMembers: defineTable({
    userId: v.id("users"),
    name: v.string(),
    role: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  habitTemplates: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  dailyHabits: defineTable({
    userId: v.id("users"),
    habitTemplateId: v.id("habitTemplates"),
    date: v.string(), // YYYY-MM-DD format
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_template", ["habitTemplateId"]),

  projectTasks: defineTable({
    userId: v.id("users"),
    project: v.union(v.literal("hta"), v.literal("aspire"), v.literal("homeschool")),
    subProject: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    assignedToId: v.optional(v.id("teamMembers")),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done")
    ),
    dueDate: v.optional(v.string()), // YYYY-MM-DD format
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    order: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["project", "subProject"])
    .index("by_assignedTo", ["assignedToId"]),

  fiveToThrive: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    tasks: v.array(
      v.object({
        text: v.string(),
        completed: v.boolean(),
        completedAt: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
  }).index("by_user_and_date", ["userId", "date"]),

  dailyReflections: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    morningExcited: v.optional(v.string()),
    morningSurprise: v.optional(v.string()),
    eveningAppreciated: v.optional(v.string()),
    eveningLearned: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user_and_date", ["userId", "date"]),

  fieldTrips: defineTable({
    userId: v.id("users"),
    name: v.string(),
    location: v.string(),
    date: v.optional(v.string()), // YYYY-MM-DD format
    notes: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  monthlyItinerary: defineTable({
    userId: v.id("users"),
    month: v.string(), // YYYY-MM format
    content: v.string(),
    updatedAt: v.number(),
  }).index("by_user_and_month", ["userId", "month"]),

  weeklySchedule: defineTable({
    userId: v.id("users"),
    dayOfWeek: v.union(
      v.literal("monday"),
      v.literal("tuesday"),
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday"),
      v.literal("sunday")
    ),
    startTime: v.string(), // HH:MM format (24-hour)
    endTime: v.string(), // HH:MM format (24-hour)
    activity: v.string(),
    notes: v.optional(v.string()),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user_and_day", ["userId", "dayOfWeek"]),

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

  bookLibrary: defineTable({
    userId: v.id("users"),
    title: v.string(),
    author: v.optional(v.string()),
    category: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  readAloudBooks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    author: v.optional(v.string()),
    completed: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  sebastianTasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.string(), // infrastructure, hta, aspire, agent-squad, skills, other
    // Agent-aware fields (Sprint 1 upgrade)
    assignedTo: v.optional(v.string()),    // "corinne" | "sebastian" | "scout" | "maven" | "compass" | "james"
    agentNotes: v.optional(v.string()),    // Progress notes written by agents
    lastUpdatedBy: v.optional(v.string()), // Who last touched this task
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // ─── Content Pipeline ──────────────────────────────────────────────────
  // Where agents drop drafts and Corinne reviews/approves them.
  contentPipeline: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("x-post"),
      v.literal("email"),
      v.literal("blog"),
      v.literal("landing-page"),
      v.literal("other")
    ),
    stage: v.union(
      v.literal("idea"),
      v.literal("draft"),
      v.literal("review"),
      v.literal("approved"),
      v.literal("published")
    ),
    createdBy: v.string(),           // "sebastian" | "maven" | "scout"
    assignedTo: v.string(),          // "corinne" (who reviews)
    notes: v.optional(v.string()),   // Agent notes / Corinne feedback
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedUrl: v.optional(v.string()),
  })
    .index("by_stage", ["stage"])
    .index("by_type", ["type"])
    .index("by_created_by", ["createdBy"])
    .index("by_stage_type", ["stage", "type"]),
});
