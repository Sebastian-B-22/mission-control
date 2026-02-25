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
    categoryId: v.optional(v.id("rpmCategories")),
    completedAt: v.optional(v.number()),
    tasks: v.array(
      v.object({
        text: v.string(),
        completed: v.boolean(),
        categoryId: v.optional(v.id("rpmCategories")),
        completedAt: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user", ["userId"]),

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
    verificationStatus: v.optional(
      v.union(v.literal("pending"), v.literal("passed"), v.literal("failed"), v.literal("overridden"))
    ),
    verificationScore: v.optional(v.number()),
  })
    .index("by_stage", ["stage"])
    .index("by_type", ["type"])
    .index("by_created_by", ["createdBy"])
    .index("by_stage_type", ["stage", "type"]),

  contentVerification: defineTable({
    contentId: v.id("contentPipeline"),
    verifiedAt: v.number(),
    checks: v.object({
      characterCount: v.object({
        passed: v.boolean(),
        count: v.number(),
        limit: v.number(),
        warnings: v.array(v.string()),
      }),
      links: v.object({
        passed: v.boolean(),
        broken: v.array(v.string()),
        warnings: v.array(v.string()),
      }),
      tone: v.object({
        passed: v.boolean(),
        score: v.number(),
        warnings: v.array(v.string()),
      }),
      formatting: v.object({
        passed: v.boolean(),
        issues: v.array(v.string()),
      }),
    }),
    overallPassed: v.boolean(),
    overallScore: v.number(),
    issueReasons: v.array(v.string()),
    overridden: v.optional(v.boolean()),
    overriddenBy: v.optional(v.string()),
    overriddenAt: v.optional(v.number()),
  })
    .index("by_content", ["contentId"])
    .index("by_verified_at", ["verifiedAt"]),

  // ─── Camp Registration ────────────────────────────────────────────────
  campRegistrations: defineTable({
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
    emergencyContact: v.object({
      name: v.string(),
      phone: v.string(),
    }),
    waiverAccepted: v.boolean(),
    promoCode: v.optional(v.string()),
    pricing: v.object({
      subtotal: v.number(),
      discount: v.number(),
      total: v.number(),
    }),
    stripePaymentIntentId: v.string(),
    status: v.string(),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_email", ["parent.email"])
    .index("by_stripe_pi", ["stripePaymentIntentId"]),

  campAvailability: defineTable({
    weekId: v.string(),
    label: v.string(),
    shortLabel: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    weeklySlots: v.number(),
    weeklyUsed: v.number(),
    dailySlots: v.number(),
    dailyUsed: v.number(),
  }).index("by_week_id", ["weekId"]),

  campPromoCodes: defineTable({
    code: v.string(),
    type: v.string(),
    value: v.number(),
    description: v.string(),
    active: v.boolean(),
    usedCount: v.number(),
    maxUses: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // ─── Family CRM ───────────────────────────────────────────────────────
  families: defineTable({
    parentFirstName: v.string(),
    parentLastName: v.string(),
    email: v.string(),
    phone: v.string(),
    lastQuoMessage: v.optional(v.string()),
    lastQuoDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  children: defineTable({
    familyId: v.id("families"),
    firstName: v.string(),
    lastName: v.string(),
    birthYear: v.optional(v.number()),
    gender: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_family", ["familyId"]),

  enrollments: defineTable({
    childId: v.id("children"),
    familyId: v.id("families"),
    program: v.string(),
    region: v.optional(v.string()),
    season: v.optional(v.string()),
    division: v.optional(v.string()),
    practiceDay: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_family", ["familyId"])
    .index("by_child", ["childId"])
    .index("by_program", ["program"]),

  // ─── Personal CRM ─────────────────────────────────────────────────────
  // People Corinne wants to maintain relationships with: friends, family, mentors
  contacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    relationship: v.string(), // "friend" | "family" | "mentor" | "community" | "colleague" | "other"
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    birthday: v.optional(v.string()),          // MM-DD
    keyFacts: v.optional(v.string()),          // kids names, what they care about, job, etc
    memories: v.optional(v.string()),          // meaningful shared moments/context
    lastContactDate: v.optional(v.number()),   // timestamp ms
    lastContactMethod: v.optional(v.string()), // "voice-text" | "call" | "text" | "in-person" | "card" | "gift"
    lastContactNote: v.optional(v.string()),   // brief note on what was said/sent
    nextAction: v.optional(v.string()),        // "send-note" | "call" | "gift" | "card" | "nothing"
    nextActionNote: v.optional(v.string()),
    occasions: v.optional(v.array(v.object({
      name: v.string(),   // "birthday" | "anniversary" | "graduation" | custom
      date: v.string(),   // MM-DD
    }))),
    priority: v.optional(v.string()),         // "high" | "medium" | "low"
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_last_contact", ["userId", "lastContactDate"]),

  // ─── Maven Voice Feedback ────────────────────────────────────────────────
  // Tracks feedback when Corinne rejects or edits Maven's content
  mavenFeedback: defineTable({
    contentId: v.optional(v.id("contentPipeline")),
    feedbackType: v.union(
      v.literal("reject"),
      v.literal("edit")
    ),
    reason: v.optional(v.string()),  // "too-salesy" | "off-brand" | "wrong-tone" | "factually-wrong" | "custom"
    customReason: v.optional(v.string()),  // When reason is "custom"
    originalContent: v.optional(v.string()),  // Original content before edit
    finalContent: v.optional(v.string()),  // Final content after edit
    contentTitle: v.string(),
    contentType: v.string(),
    createdBy: v.string(),  // Who created the original content (maven, scout, etc.)
    reviewedBy: v.string(),  // Who provided feedback (corinne)
    createdAt: v.number(),
  })
    .index("by_content", ["contentId"])
    .index("by_type", ["feedbackType"])
    .index("by_created_at", ["createdAt"]),

  // ─── Engagement Habits ───────────────────────────────────────────────────
  // Tracks daily engagement activities (comments, posts, interactions)
  engagementActivities: defineTable({
    userId: v.id("users"),
    date: v.string(),  // YYYY-MM-DD format
    type: v.union(
      v.literal("comment"),
      v.literal("post"),
      v.literal("reply"),
      v.literal("like"),
      v.literal("share")
    ),
    platform: v.string(),  // "x" | "linkedin" | "instagram" | "other"
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  // ─── Engagement Settings ─────────────────────────────────────────────────
  engagementSettings: defineTable({
    userId: v.id("users"),
    dailyGoalMin: v.number(),  // Minimum engagements per day (default: 3)
    dailyGoalMax: v.number(),  // Maximum engagements per day (default: 5)
    trackingEnabled: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ─── Family Meeting + Quick Wins ───────────────────────────────────────
  quickWins: defineTable({
    userId: v.id("users"),
    task: v.string(),
    categoryId: v.optional(v.id("rpmCategories")),
    completed: v.boolean(),
    date: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  familyMeetings: defineTable({
    userId: v.id("users"),
    weekOf: v.string(),
    familyMembers: v.array(v.string()),
    acknowledgements: v.array(
      v.object({
        from: v.string(),
        to: v.string(),
        message: v.string(),
        createdAt: v.number(),
      })
    ),
    supportRequests: v.array(
      v.object({
        person: v.string(),
        request: v.string(),
        conflict: v.optional(v.boolean()),
      })
    ),
    goals: v.array(
      v.object({
        person: v.string(),
        goal: v.string(),
        habitFocus: v.optional(v.string()),
        completed: v.optional(v.boolean()),
      })
    ),
    mealPlan: v.optional(
      v.array(
        v.object({
          day: v.string(),
          meal: v.string(),
        })
      )
    ),
    gameNights: v.array(
      v.object({
        game: v.string(),
        winner: v.optional(v.string()),
        moment: v.optional(v.string()),
        date: v.string(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_week", ["userId", "weekOf"]),

  discussionQueue: defineTable({
    userId: v.id("users"),
    item: v.string(),
    addedBy: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("resolved"),
      v.literal("tabled"),
      v.literal("action-needed"),
      v.literal("archived")
    ),
    notes: v.optional(v.string()),
    dateAdded: v.string(),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"]),

  movieLibrary: defineTable({
    userId: v.id("users"),
    title: v.string(),
    type: v.union(v.literal("suggestion"), v.literal("watched")),
    suggestedBy: v.optional(v.string()),
    watchedOn: v.optional(v.string()),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    votes: v.array(v.string()),
    favorite: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // ─── Health Dashboard ───────────────────────────────────────────────────
  // Whoop OAuth tokens (per user)
  whoopTokens: defineTable({
    userId: v.id("users"),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Daily health scores (aggregated from Whoop + manual entries)
  dailyHealth: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    // Sleep data (from Whoop)
    sleepHours: v.optional(v.number()),
    sleepScore: v.optional(v.number()), // 0-33 points
    // Steps data (manual entry for now)
    steps: v.optional(v.number()),
    stepsScore: v.optional(v.number()), // 0-33 points
    // Active calories (from Whoop)
    activeCalories: v.optional(v.number()),
    caloriesScore: v.optional(v.number()), // 0-34 points
    // Weight (from Withings via Apple Health)
    weight: v.optional(v.number()), // in lbs
    // Overall health score (0-100)
    healthScore: v.number(),
    isPerfectDay: v.boolean(), // healthScore === 100
    // Source metadata
    whoopSynced: v.optional(v.boolean()),
    whoopSyncedAt: v.optional(v.number()),
    manualEntry: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Health goals (progressive targets)
  healthGoals: defineTable({
    userId: v.id("users"),
    sleepGoalHours: v.number(), // default: 7
    stepsGoal: v.number(), // default: 3500
    caloriesGoal: v.number(), // default: 350
    perfectDaysGoal: v.number(), // default: 20 (per month)
    currentLevel: v.number(), // 1 = 20 days, 2 = 25 days, 3 = 30 days
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
