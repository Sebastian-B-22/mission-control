import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Using v.any() for all tables to avoid schema validation issues with existing data
// Indexes are added based on what was deleted in the previous deployment

export default defineSchema({
  // Agent tables
  agentHuddle: defineTable(v.any())
    .index("by_created", ["createdAt"])
    .index("by_channel", ["channel", "createdAt"])
    .index("by_agent", ["agent"])
    .index("by_source_and_message_id", ["source", "sourceMessageId"])
    .index("by_mission_created", ["missionId", "createdAt"]),
  
  agentHuddleMissions: defineTable(v.any())
    .index("by_channel_updated", ["channel", "updatedAt"])
    .index("by_created", ["createdAt"])
    .index("by_status_updated", ["status", "updatedAt"]),
  
  agentIdeas: defineTable(v.any())
    .index("by_status", ["status", "updatedAt"])
    .index("by_source_agent", ["sourceAgent", "updatedAt"]),
  
  agentLearnings: defineTable(v.any())
    .index("by_status", ["status", "createdAt"])
    .index("by_scope", ["scopeType", "createdAt"])
    .index("by_source_content", ["sourceContentId"]),
  
  agentTraining: defineTable(v.any())
    .index("by_key", ["key"])
    .index("by_category", ["category", "updatedAt"]),
  
  agentTriggers: defineTable(v.any())
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // App tables
  announcements: defineTable(v.any()),
  
  approvalsQueue: defineTable(v.any())
    .index("by_status", ["status", "updatedAt"])
    .index("by_created", ["createdAt"]),
  
  attendanceRecords: defineTable(v.any()),
  
  biomarkerResults: defineTable(v.any())
    .index("by_user_date", ["userId", "testDate"])
    .index("by_user", ["userId"]),
  
  bookLibrary: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  calendarEvents: defineTable(v.any())
    .index("by_user_end", ["userId", "endMs"])
    .index("by_user_start", ["userId", "startMs"]),

  // Camp tables
  campAttendance: defineTable(v.any())
    .index("by_key", ["key"])
    .index("by_date_region", ["date", "regionKey"]),
  
  campAvailability: defineTable(v.any())
    .index("by_week_id", ["weekId"]),
  
  campPromoCodes: defineTable(v.any())
    .index("by_code", ["code"]),
  
  campRegistrations: defineTable(v.any())
    .index("by_email", ["parent.email"])
    .index("by_status", ["status"])
    .index("by_stripe_pi", ["stripePaymentIntentId"]),
  
  campTrialDayRegistrations: defineTable(v.any())
    .index("by_email", ["email"])
    .index("by_session", ["session"])
    .index("by_status", ["status"]),
  
  cancellationLog: defineTable(v.any()),
  certifications: defineTable(v.any()),
  channelComments: defineTable(v.any()),
  channelMessages: defineTable(v.any()),
  channels: defineTable(v.any()),
  
  children: defineTable(v.any())
    .index("by_family", ["familyId"]),
  
  comments: defineTable(v.any()),
  
  contacts: defineTable(v.any())
    .index("by_user_and_last_contact", ["userId", "lastContactDate"])
    .index("by_user", ["userId"]),
  
  contentOutputGroups: defineTable(v.any())
    .index("by_source_idea", ["sourceIdeaId", "updatedAt"])
    .index("by_status", ["status", "updatedAt"])
    .index("by_source_task", ["sourceTaskId", "updatedAt"])
    .index("by_source_content", ["sourceContentId", "updatedAt"]),
  
  contentOutputItems: defineTable(v.any())
    .index("by_content", ["contentId"])
    .index("by_group", ["groupId", "order"]),
  
  contentPipeline: defineTable(v.any())
    .index("by_stage_type", ["stage", "type"])
    .index("by_created_by", ["createdBy"])
    .index("by_root_content", ["rootContentId", "updatedAt"])
    .index("by_parent_content", ["parentContentId", "updatedAt"])
    .index("by_stage", ["stage"])
    .index("by_type", ["type"]),
  
  contentVerification: defineTable(v.any())
    .index("by_content", ["contentId"])
    .index("by_verified_at", ["verifiedAt"]),
  
  costEvents: defineTable(v.any())
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_created", ["createdAt"]),
  
  creditTransactions: defineTable(v.any())
    .index("by_type", ["type"])
    .index("by_email", ["familyEmail"]),
  
  cronJobs: defineTable(v.any())
    .index("by_jobId", ["jobId"]),
  
  dailyCanvasNotes: defineTable(v.any())
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_date_kind", ["userId", "date", "kind"]),
  
  dailyCheckIns: defineTable(v.any())
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_and_type", ["userId", "type"]),
  
  dailyHabits: defineTable(v.any())
    .index("by_template", ["habitTemplateId"])
    .index("by_user_and_date", ["userId", "date"]),
  
  dailyHealth: defineTable(v.any())
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),
  
  dailyRecap: defineTable(v.any())
    .index("by_user_and_date", ["userId", "date"]),
  
  dailyReflections: defineTable(v.any())
    .index("by_user_and_date", ["userId", "date"]),
  
  discussionQueue: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  drills: defineTable(v.any()),
  
  emailDrafts: defineTable(v.any())
    .index("by_status", ["status"])
    .index("by_updated", ["updatedAt"]),
  
  engagementActivities: defineTable(v.any())
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),
  
  engagementSettings: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  enrollments: defineTable(v.any())
    .index("by_program_status", ["program", "status"])
    .index("by_region_status", ["region", "status"])
    .index("by_child", ["childId"])
    .index("by_program", ["program"])
    .index("by_status", ["status"])
    .index("by_family", ["familyId"]),
  
  events: defineTable(v.any()),
  
  families: defineTable(v.any())
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .searchIndex("search_families", { searchField: "email", filterFields: ["tags"] }),
  
  familyCredits: defineTable(v.any()),
  
  familyMeetings: defineTable(v.any())
    .index("by_user_and_week", ["userId", "weekOf"])
    .index("by_user", ["userId"]),
  
  fieldTrips: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  fields: defineTable(v.any()),
  
  fiveToThrive: defineTable(v.any())
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),
  
  gameLibrary: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  habitScores: defineTable(v.any())
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user", ["userId"]),
  
  habitTemplates: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  healthGoals: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  healthRuns: defineTable(v.any())
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_user_kind_createdAt", ["userId", "kind", "createdAt"]),
  
  homeRemodelBudgetItems: defineTable(v.any())
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"]),
  
  homeRemodelIdeas: defineTable(v.any())
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"]),
  
  homeRemodelMilestones: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  homeRemodelRooms: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  homeRemodelTasks: defineTable(v.any())
    .index("by_status", ["status"])
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"]),
  
  homeschoolActivities: defineTable(v.any())
    .index("by_user_date", ["userId", "date"])
    .index("by_student_date", ["student", "date"])
    .index("by_category", ["category"]),
  
  homeschoolAgentNotes: defineTable(v.any())
    .index("by_student", ["student", "date"])
    .index("by_source", ["source", "date"])
    .index("by_user_date", ["userId", "date"]),
  
  homeschoolProgress: defineTable(v.any())
    .index("by_student", ["studentName"])
    .index("by_scraped_at", ["scrapedAt"])
    .index("by_student_platform", ["studentName", "platform"])
    .index("by_platform", ["platform"]),
  
  homeschoolWeeklySummary: defineTable(v.any())
    .index("by_student_week", ["student", "weekOf"])
    .index("by_user_week", ["userId", "weekOf"]),

  // Homeschool planning tables
  hsCompletions: defineTable(v.any())
    .index("by_date", ["date"])
    .index("by_subject", ["subject"]),
  
  hsDailySchedule: defineTable(v.any())
    .index("by_date", ["date"]),
  
  hsMonthlyFocus: defineTable(v.any())
    .index("by_quarter", ["quarterId"]),
  
  hsPlanningBlocks: defineTable(v.any())
    .index("by_date", ["date"])
    .index("by_date_kid", ["date", "kid"]),
  
  hsQuarters: defineTable(v.any())
    .index("by_dates", ["startDate", "endDate"]),
  
  hsResources: defineTable(v.any())
    .index("by_category", ["category"])
    .index("by_type", ["type"])
    .searchIndex("search_resources", { searchField: "name", filterFields: ["category", "type"] }),
  
  hsStudentProgress: defineTable(v.any())
    .index("by_subject", ["subject"])
    .index("by_student", ["student"]),
  
  hsWeeklyTemplate: defineTable(v.any())
    .index("by_day", ["dayOfWeek"]),
  
  links: defineTable(v.any()),
  
  mavenFeedback: defineTable(v.any())
    .index("by_content", ["contentId"])
    .index("by_created_at", ["createdAt"])
    .index("by_type", ["feedbackType"]),
  
  memorySnapshots: defineTable(v.any())
    .index("by_user_path", ["userId", "path"])
    .index("by_user_updated", ["userId", "updatedAt"]),
  
  monthlyItinerary: defineTable(v.any())
    .index("by_user_and_month", ["userId", "month"]),
  
  movieLibrary: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  onboardingState: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  overnightInbox: defineTable(v.any())
    .index("by_status", ["triageStatus", "createdAt"])
    .index("by_created", ["createdAt"]),
  
  pendingItems: defineTable(v.any())
    .index("by_owner", ["owner", "updatedAt"])
    .index("by_status", ["status", "updatedAt"]),
  
  players: defineTable(v.any()),
  practiceGroups: defineTable(v.any()),
  programConfigs: defineTable(v.any()),
  
  projectTasks: defineTable(v.any())
    .index("by_assignedTo", ["assignedToId"])
    .index("by_user", ["userId"])
    .index("by_project", ["project", "subProject"]),
  
  pushSubscriptions: defineTable(v.any())
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),
  
  quickWins: defineTable(v.any())
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user", ["userId"]),
  
  readAloudBooks: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  registrationCounts: defineTable(v.any())
    .index("by_program", ["program"]),
  
  registrations: defineTable(v.any()),
  resources: defineTable(v.any()),
  
  rewardEvents: defineTable(v.any())
    .index("by_user_child_redeemedAt", ["userId", "child", "redeemedAt"])
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_user_child_createdAt", ["userId", "child", "createdAt"]),
  
  rosterGroups: defineTable(v.any()),
  
  rpmCategories: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  rsvps: defineTable(v.any()),
  schedules: defineTable(v.any()),
  
  sebastianTasks: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  shifts: defineTable(v.any()),
  speechCoach: defineTable(v.any()),
  speechSessions: defineTable(v.any()),
  
  teamMembers: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  telegramOutbox: defineTable(v.any())
    .index("by_source_huddle_message", ["sourceHuddleMessageId"])
    .index("by_telegram_message_id", ["telegramMessageId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
  
  ticketClaims: defineTable(v.any())
    .index("by_listing", ["listingId"])
    .index("by_phone", ["phone"])
    .index("by_status", ["status"]),
  
  ticketContacts: defineTable(v.any())
    .index("by_updated", ["updatedAt"])
    .index("by_phone", ["phone"]),
  
  ticketListings: defineTable(v.any())
    .index("by_status", ["status"])
    .index("by_event_date", ["eventDate"])
    .index("by_team", ["team"]),
  
  ticketNotificationBatches: defineTable(v.any())
    .index("by_listing", ["listingId"])
    .index("by_created", ["createdAt"]),
  
  typingProfiles: defineTable(v.any())
    .index("by_user_child", ["userId", "child"]),
  
  typingSessions: defineTable(v.any())
    .index("by_user_child_createdAt", ["userId", "child", "createdAt"])
    .index("by_user_createdAt", ["userId", "createdAt"]),
  
  users: defineTable(v.any())
    .index("by_clerk_id", ["clerkId"]),
  
  weeklyGoals: defineTable(v.any())
    .index("by_user_week", ["userId", "weekOf"]),
  
  weeklyRPM: defineTable(v.any())
    .index("by_user_and_week", ["userId", "weekStartDate"])
    .index("by_user", ["userId"]),
  
  weeklySchedule: defineTable(v.any())
    .index("by_user_and_day", ["userId", "dayOfWeek"]),
  
  whoopTokens: defineTable(v.any())
    .index("by_user", ["userId"]),
  
  workoutExerciseLogs: defineTable(v.any())
    .index("by_user_exercise_date", ["userId", "exerciseTemplateId", "workoutDate"])
    .index("by_user_date", ["userId", "workoutDate"])
    .index("by_log_order", ["workoutLogId", "order"]),
  
  workoutLogs: defineTable(v.any())
    .index("by_user_day_date", ["userId", "programDayId", "workoutDate"])
    .index("by_day_date", ["programDayId", "workoutDate"])
    .index("by_user_date", ["userId", "workoutDate"]),
  
  workoutProgramDays: defineTable(v.any())
    .index("by_user", ["userId"])
    .index("by_program_order", ["programId", "order"]),
  
  workoutProgramExercises: defineTable(v.any())
    .index("by_program", ["programId"])
    .index("by_user", ["userId"])
    .index("by_day_order", ["programDayId", "order"]),
  
  workoutPrograms: defineTable(v.any())
    .index("by_user", ["userId"]),
});
