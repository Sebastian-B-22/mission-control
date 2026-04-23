import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Delete sebastian tasks by ID
export const deleteSebastianTask = mutation({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId as any);
    return { success: true, deleted: args.taskId };
  },
});

// Update sebastian task
export const updateSebastianTask = mutation({
  args: { 
    taskId: v.string(),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.assignedTo) updates.assignedTo = args.assignedTo;
    await ctx.db.patch(args.taskId as any, updates);
    return { success: true, updated: args.taskId };
  },
});

// Create new sebastian task
export const createSebastianTask = mutation({
  args: { 
    userId: v.string(),
    title: v.string(),
    category: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(v.literal("backlog"), v.literal("todo"), v.literal("in-progress"), v.literal("done")),
    description: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("sebastianTasks", {
      userId: args.userId as any,
      title: args.title,
      category: args.category,
      priority: args.priority,
      status: args.status,
      description: args.description,
      assignedTo: args.assignedTo || "sebastian",
      createdAt: Date.now(),
    });
    return { success: true, id };
  },
});

// Clean up content pipeline - keep only N most recent items
export const cleanupContentPipeline = mutation({
  args: { keepCount: v.number() },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("contentPipeline").collect();
    
    // Sort by createdAt descending (most recent first)
    items.sort((a: any, b: any) => (b.createdAt || b._creationTime) - (a.createdAt || a._creationTime));
    
    // Keep the first N, delete the rest
    const toDelete = items.slice(args.keepCount);
    
    for (const item of toDelete) {
      await ctx.db.delete(item._id);
    }
    
    return { 
      success: true, 
      kept: args.keepCount, 
      deleted: toDelete.length,
      message: `Kept ${args.keepCount} most recent items, deleted ${toDelete.length} old items`
    };
  },
});

// Migrate sebastianTasks to new userId
export const migrateSebastianTasks = mutation({
  args: { 
    oldUserId: v.string(),
    newUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("sebastianTasks").collect();
    let updated = 0;
    for (const task of tasks) {
      if ((task as any).userId === args.oldUserId) {
        await ctx.db.patch(task._id, { userId: args.newUserId as any });
        updated++;
      }
    }
    return { success: true, updated, message: `Migrated ${updated} sebastian tasks` };
  },
});

function extractScienceActivity(notes: string): string {
  const trimmed = notes.trim();
  if (!trimmed) return "Experiment";

  const clean = (value: string) =>
    value.replace(/\s+/g, " ").replace(/^[,.;:\s]+|[,.;:\s]+$/g, "").trim();

  const bookTitleMatch = trimmed.match(
    /(?:^|[,.;]|\band\b)\s*(?:we\s+)?(?:read\s+)?([^,.]+?)\s+book\s+for science\b/i
  );
  const bookTitle = bookTitleMatch ? clean(bookTitleMatch[1]) : "";

  const chapterMatch = trimmed.match(/book\s+for science\s*\(([^)]+)\)/i);
  const chapterDetail = chapterMatch ? clean(chapterMatch[1]) : "";

  const videoMatch = trimmed.match(/watched\s+(?:youtube\s+)?videos?\s+(?:on|about)\s+(.+?)\s+for science\b/i);
  const videoTopic = videoMatch ? clean(videoMatch[1]) : "";

  const parts: string[] = [];
  if (bookTitle) parts.push(chapterDetail ? `${bookTitle} (${chapterDetail})` : bookTitle);
  if (videoTopic) parts.push(`${videoTopic} video`);

  if (parts.length > 0) return parts.join(" + ").slice(0, 120);
  if (/health\s*&\s*body/i.test(trimmed) && /esophagus/i.test(trimmed)) return "Health & Body Experiment - Esophagus";
  if (/esophagus/i.test(trimmed)) return "Esophagus experiment";
  if (/learning lab/i.test(trimmed)) return "Learning Lab experiment";
  if (/astrophysics/i.test(trimmed) && /artemis\s*2/i.test(trimmed)) return "Astrophysics + Artemis 2";
  if (/astrophysics/i.test(trimmed)) return "Astrophysics";
  if (/artemis\s*2/i.test(trimmed)) return "Artemis 2";

  return "Experiment";
}

// Dedupe books by title (keep oldest)
export const dedupeBooks = mutation({
  args: {
    userId: v.string(),
    mode: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.mode === "repairScience") {
      if (!args.date) throw new Error("date is required for repairScience");

      const recaps = await ctx.db.query("dailyRecap").collect();
      const recap = recaps.find((r: any) => r.userId === args.userId && r.date === args.date);
      const notes = (recap?.notes ?? "").trim();
      if (!notes) {
        return { success: false, message: "No recap found for that date" };
      }

      const activities = await ctx.db.query("homeschoolActivities").collect();
      const scienceActivities = activities
        .filter((activity: any) => activity.userId === args.userId && activity.date === args.date && activity.category === "science")
        .sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

      const nextActivity = extractScienceActivity(notes);

      if (scienceActivities.length === 0) {
        const id = await ctx.db.insert("homeschoolActivities", {
          userId: args.userId as any,
          date: args.date,
          student: "both",
          category: "science",
          activity: nextActivity,
          completed: true,
          notes,
          createdAt: Date.now(),
        });
        return { success: true, inserted: 1, patched: 0, deleted: 0, activity: nextActivity, id };
      }

      const [primary, ...duplicates] = scienceActivities;
      await ctx.db.patch(primary._id, { activity: nextActivity, notes });
      for (const duplicate of duplicates) {
        await ctx.db.delete(duplicate._id);
      }

      return {
        success: true,
        inserted: 0,
        patched: 1,
        deleted: duplicates.length,
        activity: nextActivity,
        id: primary._id,
      };
    }

    const books = await ctx.db.query("bookLibrary").collect();
    const userBooks = books.filter((b: any) => b.userId === args.userId);
    
    // Group by title
    const byTitle: Record<string, any[]> = {};
    for (const book of userBooks) {
      const title = (book as any).title;
      if (!byTitle[title]) byTitle[title] = [];
      byTitle[title].push(book);
    }
    
    let deleted = 0;
    for (const [title, copies] of Object.entries(byTitle)) {
      if (copies.length > 1) {
        // Sort by creationTime, keep oldest
        copies.sort((a, b) => a._creationTime - b._creationTime);
        for (let i = 1; i < copies.length; i++) {
          await ctx.db.delete(copies[i]._id);
          deleted++;
        }
      }
    }
    
    return { success: true, deleted, message: `Removed ${deleted} duplicate books` };
  },
});

// Migrate all data from old userId to new userId
export const migrateUserData = mutation({
  args: { 
    oldUserId: v.string(),
    newUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const oldId = args.oldUserId as any;
    const newId = args.newUserId as any;
    let totalUpdated = 0;
    
    // Tables with userId field
    const tables = [
      "weeklyGoals", "weeklySchedule", "calendarEvents", "healthMetrics",
      "habits", "habitLogs", "checkins", "rpmCategories", "rpmTasks",
      "teamMembers", "fieldTrips", "travelItems", "bookLibrary", "gameLibrary",
      "resourceLibrary", "readAloudList", "homeschoolProjects", "rooms",
      "rewardItems", "typingScores", "activities"
    ];
    
    for (const tableName of tables) {
      try {
        const records = await ctx.db.query(tableName as any).collect();
        for (const record of records) {
          if ((record as any).userId === oldId) {
            await ctx.db.patch(record._id, { userId: newId });
            totalUpdated++;
          }
        }
      } catch (e) {
        // Table might not exist, skip
      }
    }
    
    return { success: true, totalUpdated, message: `Migrated ${totalUpdated} records to new user` };
  },
});

// Delete a user by raw ID string (for cleaning up malformed records)
export const deleteUserByRawId = mutation({
  args: { rawId: v.string() },
  handler: async (ctx, { rawId }) => {
    // Use internal delete that bypasses type checking
    await ctx.db.delete(rawId as any);
    return { success: true, deleted: rawId };
  },
});

// Admin function to manually initialize user data
export const manuallyInitializeUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already initialized
    const existingTeamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingTeamMembers) {
      return { message: "User already initialized" };
    }

    // Initialize team members
    const defaultMembers = [
      { name: "Corinne", role: "Owner/Coach" },
      { name: "Sebastian", role: "AI Assistant" },
      { name: "Allie", role: "Virtual Assistant" },
    ];

    for (const member of defaultMembers) {
      await ctx.db.insert("teamMembers", {
        userId: user._id,
        name: member.name,
        role: member.role,
        active: true,
        createdAt: Date.now(),
      });
    }

    // Initialize habit templates (if not exist)
    const existingHabits = await ctx.db
      .query("habitTemplates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!existingHabits) {
      const defaultHabits = [
        { name: "Morning light", icon: "☀️", order: 0 },
        { name: "Redlight/meditation", icon: "🧘", order: 1 },
        { name: "Workout before 8am", icon: "💪", order: 2 },
        { name: "Take all supplements", icon: "💊", order: 3 },
        { name: "Ice bath", icon: "🧊", order: 4 },
        { name: "Sauna", icon: "🔥", order: 5 },
        { name: "Screens off by 9:30 pm", icon: "📱", order: 6 },
        { name: "Sleep 7.5 hours", icon: "😴", order: 7 },
      ];

      for (const habit of defaultHabits) {
        await ctx.db.insert("habitTemplates", {
          userId: user._id,
          name: habit.name,
          icon: habit.icon,
          active: true,
          order: habit.order,
          createdAt: Date.now(),
        });
      }
    }

    return { message: "User initialized successfully!" };
  },
});

// Quick reimport for first user (single-user setup) - full schedule reset
export const reimportSchedule = mutation({
  args: {},
  handler: async (ctx) => {
    // Find first user
    const allUsers = await ctx.db.query("users").collect();
    const user = allUsers[0];
    if (!user) throw new Error("No users found");

    // Clear existing schedule
    const existing = await ctx.db
      .query("weeklySchedule")
      .withIndex("by_user_and_day", (q) => q.eq("userId", user._id))
      .collect();
    for (const block of existing) {
      await ctx.db.delete(block._id);
    }

    // Full schedule data
    const scheduleData = [
      // MONDAY
      { dayOfWeek: "monday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "monday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "monday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "monday", startTime: "08:30", endTime: "09:30", activity: "Sprinting Program + Juggling" },
      { dayOfWeek: "monday", startTime: "09:30", endTime: "10:00", activity: "Writing with Skill" },
      { dayOfWeek: "monday", startTime: "10:00", endTime: "11:00", activity: "Anthony: Synthesis Teams / Roma: 1:1 with Mom", notes: "Math Academy review, Writing with Skill review, Socratic discussions" },
      { dayOfWeek: "monday", startTime: "11:00", endTime: "12:00", activity: "Roma: Synthesis Teams / Anthony: 1:1 with Mom", notes: "Math Academy review, Writing with Skill review, Socratic discussions" },
      { dayOfWeek: "monday", startTime: "12:00", endTime: "14:00", activity: "Passion Projects + Mom Work Block", notes: "Options: 3D Printing, Magic, DJ, Stop Motion, Game Design", color: "mom-work" },
      { dayOfWeek: "monday", startTime: "14:00", endTime: "14:30", activity: "Rosetta Stone Italian + Life Skills", notes: "Family session - Italian OR How to Be a Person / Manners book" },
      { dayOfWeek: "monday", startTime: "14:30", endTime: "15:00", activity: "Free Time / Transition" },
      { dayOfWeek: "monday", startTime: "15:00", endTime: "16:30", activity: "Rock Climbing", notes: "Family - 90 min" },
      { dayOfWeek: "monday", startTime: "16:30", endTime: "17:30", activity: "Free Time & Dinner" },
      { dayOfWeek: "monday", startTime: "17:30", endTime: "18:30", activity: "Screen Time" },
      { dayOfWeek: "monday", startTime: "18:30", endTime: "19:30", activity: "Free Time / Family Time" },
      { dayOfWeek: "monday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // TUESDAY
      { dayOfWeek: "tuesday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free time" },
      { dayOfWeek: "tuesday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "tuesday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "tuesday", startTime: "08:30", endTime: "09:30", activity: "Math Academy, Membean + Spelling Safari", notes: "While Mom at Jiu-Jitsu", color: "mom-work" },
      { dayOfWeek: "tuesday", startTime: "09:30", endTime: "10:30", activity: "PE with Joey", notes: "March: Throwing & Rolling Games" },
      { dayOfWeek: "tuesday", startTime: "10:30", endTime: "11:30", activity: "Health/Body Study", notes: "Systems, nutrition, CGM data review" },
      { dayOfWeek: "tuesday", startTime: "11:30", endTime: "12:00", activity: "Lunch & Free time" },
      { dayOfWeek: "tuesday", startTime: "12:00", endTime: "13:00", activity: "Anthony: Wonder Math Class / Mom Work Block", notes: "Roma: Math Academy, independent activities", color: "mom-work" },
      { dayOfWeek: "tuesday", startTime: "13:00", endTime: "14:00", activity: "Roma: Wonder Math Class + Mom Work Block", color: "mom-work" },
      { dayOfWeek: "tuesday", startTime: "14:30", endTime: "15:00", activity: "Rosetta Stone Italian" },
      { dayOfWeek: "tuesday", startTime: "15:00", endTime: "15:30", activity: "Pet Time / Free Time" },
      { dayOfWeek: "tuesday", startTime: "15:30", endTime: "17:00", activity: "Screen Time" },
      { dayOfWeek: "tuesday", startTime: "17:00", endTime: "18:00", activity: "Free Time" },
      { dayOfWeek: "tuesday", startTime: "18:00", endTime: "19:00", activity: "Dinner" },
      { dayOfWeek: "tuesday", startTime: "19:00", endTime: "19:30", activity: "Free Time" },
      { dayOfWeek: "tuesday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // WEDNESDAY
      { dayOfWeek: "wednesday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "wednesday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "wednesday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "wednesday", startTime: "08:30", endTime: "09:30", activity: "Sprinting Program + Juggling" },
      { dayOfWeek: "wednesday", startTime: "09:30", endTime: "11:30", activity: "Learning Block", notes: "Health/Science, Math, History, Writing, Shakespeare" },
      { dayOfWeek: "wednesday", startTime: "11:30", endTime: "12:00", activity: "Lunch" },
      { dayOfWeek: "wednesday", startTime: "12:00", endTime: "14:00", activity: "Passion Projects + Free Time + Mom Work Block", notes: "Options: 3D Printing, Magic, DJ, Stop Motion, Game Design", color: "mom-work" },
      { dayOfWeek: "wednesday", startTime: "14:00", endTime: "14:30", activity: "Rosetta Stone Italian + Life Skills", notes: "Family session - Italian OR How to Be a Person / Manners book" },
      { dayOfWeek: "wednesday", startTime: "14:30", endTime: "15:30", activity: "Snack & Reset/Quiet Time" },
      { dayOfWeek: "wednesday", startTime: "15:30", endTime: "16:00", activity: "Prep for Activities" },
      { dayOfWeek: "wednesday", startTime: "16:00", endTime: "17:00", activity: "Kids' Boxing" },
      { dayOfWeek: "wednesday", startTime: "17:00", endTime: "18:00", activity: "Kids' Jiu-Jitsu" },
      { dayOfWeek: "wednesday", startTime: "18:00", endTime: "19:00", activity: "Mom's Jiu-Jitsu / Kids: Screen Time", color: "mom-work" },
      { dayOfWeek: "wednesday", startTime: "19:00", endTime: "19:30", activity: "Dinner" },
      { dayOfWeek: "wednesday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // THURSDAY
      { dayOfWeek: "thursday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "thursday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "thursday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "thursday", startTime: "08:30", endTime: "09:00", activity: "Yoga + Dance Party" },
      { dayOfWeek: "thursday", startTime: "09:00", endTime: "10:00", activity: "Kids: Math Academy, Membean + Spelling Safari / Mom @ Jiu-Jitsu", color: "mom-work" },
      { dayOfWeek: "thursday", startTime: "10:00", endTime: "10:30", activity: "Car Learning", notes: "Podcasts: Greeking Out, Homeschool History, Brains On, The Past and the Curious, Dead Funny History" },
      { dayOfWeek: "thursday", startTime: "10:30", endTime: "11:00", activity: "Roma: Magic Practice / Anthony: Beyblades", notes: "Before Ninja" },
      { dayOfWeek: "thursday", startTime: "11:00", endTime: "12:00", activity: "Ninja Warrior" },
      { dayOfWeek: "thursday", startTime: "12:00", endTime: "13:30", activity: "Homeschool Group + Play Date", notes: "Social time" },
      { dayOfWeek: "thursday", startTime: "14:00", endTime: "15:30", activity: "Cooking / Meal Prep", notes: "Recipes: Hummus, Coconut Cashew Milk, Bread, Peanut Butter" },
      { dayOfWeek: "thursday", startTime: "16:00", endTime: "17:00", activity: "Outschool Drawing" },
      { dayOfWeek: "thursday", startTime: "17:00", endTime: "17:30", activity: "Screen Time" },
      { dayOfWeek: "thursday", startTime: "17:30", endTime: "18:00", activity: "Travel to Soccer" },
      { dayOfWeek: "thursday", startTime: "18:00", endTime: "20:00", activity: "Roma's Soccer + Mom Coaches", notes: "Anthony with Joey or at field" },
      { dayOfWeek: "thursday", startTime: "20:00", endTime: "20:30", activity: "Late Dinner / Snack" },
      { dayOfWeek: "thursday", startTime: "20:30", endTime: "21:00", activity: "Independent Reading & Bedtime", notes: "No formal read-aloud - late night" },
      
      // FRIDAY
      { dayOfWeek: "friday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "friday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "friday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "friday", startTime: "08:30", endTime: "09:00", activity: "Sprinting Program + Juggling" },
      { dayOfWeek: "friday", startTime: "09:00", endTime: "11:00", activity: "Learning Block (Mom @ Irish Dance 9-10AM)", notes: "Health/Science, Shakespeare, Financial Literacy, Math, Civics, Italian" },
      { dayOfWeek: "friday", startTime: "11:00", endTime: "14:00", activity: "Sky Zone or Field Trip", notes: "Alternate weeks" },
      { dayOfWeek: "friday", startTime: "14:00", endTime: "16:00", activity: "Passion Projects / Free Time", notes: "Options: 3D Printing, Magic, DJ, Stop Motion, Game Design" },
      { dayOfWeek: "friday", startTime: "16:00", endTime: "17:00", activity: "Screen Time" },
      { dayOfWeek: "friday", startTime: "17:30", endTime: "18:30", activity: "Kids' Jiu-Jitsu / Mom Work Block", color: "mom-work" },
      { dayOfWeek: "friday", startTime: "19:00", endTime: "20:30", activity: "Dinner + Movie Night", notes: "Check Family Meeting movie list" },
      { dayOfWeek: "friday", startTime: "20:30", endTime: "21:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // SATURDAY
      { dayOfWeek: "saturday", startTime: "08:00", endTime: "12:00", activity: "Spring League Games / Catch-Up", notes: "Games start Mar 7 - flexible timing" },
      { dayOfWeek: "saturday", startTime: "12:00", endTime: "18:00", activity: "Family Projects or Playdate" },
      { dayOfWeek: "saturday", startTime: "18:00", endTime: "21:00", activity: "Free Time", notes: "Movies, games, rest" },
      
      // SUNDAY
      { dayOfWeek: "sunday", startTime: "08:00", endTime: "09:30", activity: "Sunday Morning Chill & Cuddles & Free Time" },
      { dayOfWeek: "sunday", startTime: "09:30", endTime: "11:30", activity: "House Cleaning / Reset", notes: "Everyone helps" },
      { dayOfWeek: "sunday", startTime: "11:30", endTime: "12:30", activity: "Cooking / Meal Prep", notes: "Peanut butter, hummus, nut milk, bread for week + flour milling" },
      { dayOfWeek: "sunday", startTime: "12:30", endTime: "13:00", activity: "Lunch" },
      { dayOfWeek: "sunday", startTime: "13:00", endTime: "14:00", activity: "Screen Time" },
      { dayOfWeek: "sunday", startTime: "14:00", endTime: "15:00", activity: "Family Italian Practice or Origami or Card Magic Pro", notes: "Flexible family learning" },
      { dayOfWeek: "sunday", startTime: "15:00", endTime: "17:00", activity: "Free Time" },
      { dayOfWeek: "sunday", startTime: "17:00", endTime: "17:30", activity: "Family Meeting" },
      { dayOfWeek: "sunday", startTime: "17:30", endTime: "18:30", activity: "Family Game Night" },
      { dayOfWeek: "sunday", startTime: "18:30", endTime: "19:00", activity: "Dinner" },
      { dayOfWeek: "sunday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud", notes: "5 min compound interest" },
    ];

    // Insert all schedule blocks
    let insertedCount = 0;
    for (const block of scheduleData) {
      await ctx.db.insert("weeklySchedule", {
        userId: user._id,
        dayOfWeek: block.dayOfWeek as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
        startTime: block.startTime,
        endTime: block.endTime,
        activity: block.activity,
        notes: block.notes,
        color: block.color,
        createdAt: Date.now(),
      });
      insertedCount++;
    }

    return { userId: user._id, cleared: existing.length, inserted: insertedCount, message: "Schedule reimported successfully!" };
  },
});

// Import weekly schedule - can use clerkId OR find first user
export const importWeeklySchedule = mutation({
  args: { 
    clerkId: v.optional(v.string()),
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Find the user - by clerkId if provided, otherwise first user
    let user;
    if (args.clerkId) {
      const clerkId = args.clerkId;
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
    } else {
      // Find first user (for single-user setup)
      const allUsers = await ctx.db.query("users").collect();
      user = allUsers[0];
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Schedule data
    const scheduleData = [
      // MONDAY
      { dayOfWeek: "monday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "monday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "monday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "monday", startTime: "08:30", endTime: "09:30", activity: "Sprinting Program + Juggling" },
      { dayOfWeek: "monday", startTime: "09:30", endTime: "10:00", activity: "Writing with Skill" },
      { dayOfWeek: "monday", startTime: "10:00", endTime: "11:00", activity: "Anthony: Synthesis Teams / Roma: 1:1 with Mom", notes: "Math Academy review, Writing with Skill review, Socratic discussions" },
      { dayOfWeek: "monday", startTime: "11:00", endTime: "12:00", activity: "Roma: Synthesis Teams / Anthony: 1:1 with Mom", notes: "Math Academy review, Writing with Skill review, Socratic discussions" },
      { dayOfWeek: "monday", startTime: "12:00", endTime: "14:00", activity: "Passion Projects + Mom Work Block", notes: "Options: 3D Printing, Magic, DJ, Stop Motion, Game Design", color: "mom-work" },
      { dayOfWeek: "monday", startTime: "14:00", endTime: "14:30", activity: "Rosetta Stone Italian + Life Skills", notes: "Family session - Italian OR How to Be a Person / Manners book" },
      { dayOfWeek: "monday", startTime: "14:30", endTime: "15:00", activity: "Free time / transition" },
      { dayOfWeek: "monday", startTime: "15:00", endTime: "16:30", activity: "ROCK CLIMBING", notes: "family - 90 min" },
      { dayOfWeek: "monday", startTime: "16:30", endTime: "17:30", activity: "Free time & Dinner" },
      { dayOfWeek: "monday", startTime: "17:30", endTime: "18:30", activity: "Screen Time" },
      { dayOfWeek: "monday", startTime: "18:30", endTime: "19:30", activity: "Free time / Family time" },
      { dayOfWeek: "monday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // TUESDAY
      { dayOfWeek: "tuesday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "tuesday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "tuesday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "tuesday", startTime: "08:30", endTime: "09:30", activity: "Project or Reading with Joey", notes: "While Mom at Jiu-Jitsu", color: "mom-work" },
      { dayOfWeek: "tuesday", startTime: "09:30", endTime: "10:30", activity: "PE with Joey", notes: "March: Throwing & Rolling Games" },
      { dayOfWeek: "tuesday", startTime: "10:30", endTime: "11:30", activity: "Health/Body Study", notes: "Einstein Body Kit, Blood & Guts, CGM data review, nutrition discussion" },
      { dayOfWeek: "tuesday", startTime: "11:30", endTime: "12:00", activity: "Lunch & Free Time" },
      { dayOfWeek: "tuesday", startTime: "12:00", endTime: "13:00", activity: "Anthony: Wonder Math Class / Mom Work Block", notes: "Roma: Math Academy, independent activities", color: "mom-work" },
      { dayOfWeek: "tuesday", startTime: "13:00", endTime: "15:30", activity: "Park Meetup + Play Date", notes: "Homeschool group - social time" },
      { dayOfWeek: "tuesday", startTime: "15:30", endTime: "16:00", activity: "Travel to horseback riding" },
      { dayOfWeek: "tuesday", startTime: "16:00", endTime: "17:00", activity: "HORSEBACK RIDING", notes: "both kids" },
      { dayOfWeek: "tuesday", startTime: "17:30", endTime: "18:00", activity: "Dinner" },
      { dayOfWeek: "tuesday", startTime: "18:00", endTime: "19:00", activity: "Screen Time" },
      { dayOfWeek: "tuesday", startTime: "19:00", endTime: "19:30", activity: "Free time" },
      { dayOfWeek: "tuesday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // WEDNESDAY
      { dayOfWeek: "wednesday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "wednesday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "wednesday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "wednesday", startTime: "08:30", endTime: "09:30", activity: "Sprinting Program + Juggling" },
      { dayOfWeek: "wednesday", startTime: "09:30", endTime: "11:30", activity: "Learning Block", notes: "Health/Science, Math, History, Writing, Shakespeare" },
      { dayOfWeek: "wednesday", startTime: "11:30", endTime: "12:00", activity: "Lunch" },
      { dayOfWeek: "wednesday", startTime: "12:00", endTime: "14:00", activity: "Passion Projects + Free Time + Mom Work Block", notes: "Options: 3D Printing, Magic, DJ, Stop Motion, Game Design", color: "mom-work" },
      { dayOfWeek: "wednesday", startTime: "14:00", endTime: "14:30", activity: "Rosetta Stone Italian + Life Skills", notes: "Family session - Italian OR How to Be a Person / Manners book" },
      { dayOfWeek: "wednesday", startTime: "14:30", endTime: "15:30", activity: "Snack & Reset/Quiet Time" },
      { dayOfWeek: "wednesday", startTime: "15:30", endTime: "16:00", activity: "Prep for activities" },
      { dayOfWeek: "wednesday", startTime: "16:00", endTime: "17:00", activity: "Kids' Boxing" },
      { dayOfWeek: "wednesday", startTime: "17:00", endTime: "18:00", activity: "KIDS' JIU-JITSU" },
      { dayOfWeek: "wednesday", startTime: "18:00", endTime: "19:00", activity: "Mom's Jiu-Jitsu / Kids: Screen Time" },
      { dayOfWeek: "wednesday", startTime: "19:00", endTime: "19:30", activity: "Dinner" },
      { dayOfWeek: "wednesday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // THURSDAY
      { dayOfWeek: "thursday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "thursday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "thursday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "thursday", startTime: "08:30", endTime: "09:00", activity: "Yoga + Dance Party" },
      { dayOfWeek: "thursday", startTime: "09:00", endTime: "10:00", activity: "Mom's Jiu-Jitsu / Kids: Math Academy + Membean + Workbooks", color: "mom-work" },
      { dayOfWeek: "thursday", startTime: "10:00", endTime: "10:30", activity: "Car Learning", notes: "Podcasts: Greeking Out, Homeschool History, Brains On, The Past and the Curious, Dead Funny History" },
      { dayOfWeek: "thursday", startTime: "10:30", endTime: "11:00", activity: "Roma: Magic Practice / Anthony: Beyblades", notes: "before Ninja" },
      { dayOfWeek: "thursday", startTime: "11:00", endTime: "12:00", activity: "Ninja Warrior" },
      { dayOfWeek: "thursday", startTime: "12:00", endTime: "13:30", activity: "Homeschool Group + Play Date", notes: "Social time" },
      { dayOfWeek: "thursday", startTime: "14:00", endTime: "15:30", activity: "Cooking / Meal Prep", notes: "Recipes: Hummus, Coconut Cashew Milk, Bread, Peanut Butter" },
      { dayOfWeek: "thursday", startTime: "16:00", endTime: "17:00", activity: "Outschool Drawing" },
      { dayOfWeek: "thursday", startTime: "17:00", endTime: "17:30", activity: "Screen Time" },
      { dayOfWeek: "thursday", startTime: "17:30", endTime: "18:00", activity: "Travel to soccer" },
      { dayOfWeek: "thursday", startTime: "18:00", endTime: "20:00", activity: "Roma's Soccer + Mom Coaches", notes: "Anthony with Joey or at field" },
      { dayOfWeek: "thursday", startTime: "20:00", endTime: "20:30", activity: "Late dinner / snack" },
      { dayOfWeek: "thursday", startTime: "20:30", endTime: "21:00", activity: "Independent Reading & Bedtime", notes: "no formal read-aloud - late night" },
      
      // FRIDAY
      { dayOfWeek: "friday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "friday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "friday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "friday", startTime: "08:30", endTime: "09:30", activity: "Sprinting Program + Juggling" },
      { dayOfWeek: "friday", startTime: "09:30", endTime: "11:30", activity: "Learning Block (Mom @ Irish Dance 9-10AM)", notes: "Health/Science, Shakespeare, Financial Literacy, Math, Civics, Italian" },
      { dayOfWeek: "friday", startTime: "11:30", endTime: "14:00", activity: "Sky Zone or Field Trip", notes: "Alternate weeks" },
      { dayOfWeek: "friday", startTime: "14:00", endTime: "16:00", activity: "Passion Projects / Free Time", notes: "Options: 3D Printing, Magic, DJ, Stop Motion, Game Design" },
      { dayOfWeek: "friday", startTime: "16:00", endTime: "17:00", activity: "Screen Time" },
      { dayOfWeek: "friday", startTime: "17:30", endTime: "18:30", activity: "Kids' Jiu-Jitsu / Mom Work Block", color: "mom-work" },
      { dayOfWeek: "friday", startTime: "19:00", endTime: "20:30", activity: "Dinner + Movie Night", notes: "Check Family Meeting movie list" },
      { dayOfWeek: "friday", startTime: "20:30", endTime: "21:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // SATURDAY
      { dayOfWeek: "saturday", startTime: "10:00", endTime: "12:00", activity: "CATCH-UP SCHOOLWORK OR ROCK CLIMBING OR Free Time", notes: "Flexible - catch up if needed" },
      { dayOfWeek: "saturday", startTime: "12:00", endTime: "18:00", activity: "FAMILY PROJECTS or PLAYDATE" },
      { dayOfWeek: "saturday", startTime: "18:00", endTime: "21:00", activity: "Free time", notes: "movies, games, rest" },
      
      // SUNDAY
      { dayOfWeek: "sunday", startTime: "08:00", endTime: "09:30", activity: "SUNDAY MORNING CHILL & CUDDLES & FREE TIME" },
      { dayOfWeek: "sunday", startTime: "09:30", endTime: "11:30", activity: "HOUSE CLEANING / RESET", notes: "everyone helps" },
      { dayOfWeek: "sunday", startTime: "11:30", endTime: "12:30", activity: "MEAL PREP SESSION", notes: "peanut butter, hummus, nut milk, bread for week + flour milling practice" },
      { dayOfWeek: "sunday", startTime: "12:30", endTime: "13:00", activity: "Lunch" },
      { dayOfWeek: "sunday", startTime: "13:00", endTime: "14:00", activity: "Screen Time" },
      { dayOfWeek: "sunday", startTime: "14:00", endTime: "15:00", activity: "FAMILY ITALIAN PRACTICE OR ORIGAMI OR CARD MAGIC PRO", notes: "flexible family learning" },
      { dayOfWeek: "sunday", startTime: "15:00", endTime: "17:00", activity: "FREE TIME" },
      { dayOfWeek: "sunday", startTime: "17:00", endTime: "17:30", activity: "FAMILY MEETING" },
      { dayOfWeek: "sunday", startTime: "17:30", endTime: "18:30", activity: "FAMILY GAME NIGHT" },
      { dayOfWeek: "sunday", startTime: "18:30", endTime: "19:00", activity: "Dinner" },
      { dayOfWeek: "sunday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud", notes: "5 min compound interest" },
    ];

    // Clear existing if requested
    if (args.clearExisting) {
      const existing = await ctx.db
        .query("weeklySchedule")
        .withIndex("by_user_and_day", (q) => q.eq("userId", user._id))
        .collect();
      
      for (const block of existing) {
        await ctx.db.delete(block._id);
      }
    }

    // Insert all schedule blocks
    let insertedCount = 0;
    for (const block of scheduleData) {
      await ctx.db.insert("weeklySchedule", {
        userId: user._id,
        dayOfWeek: block.dayOfWeek as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
        startTime: block.startTime,
        endTime: block.endTime,
        activity: block.activity,
        notes: block.notes,
        createdAt: Date.now(),
      });
      insertedCount++;
    }

    return {
      success: true,
      count: insertedCount,
      message: `Successfully imported ${insertedCount} schedule blocks for all 7 days!`,
    };
  },
});

// Update RPM category purposes
export const updateRPMPurposes = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const categories = await ctx.db
      .query("rpmCategories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Map of category names to purposes and roles
    const categoryData: Record<string, { purpose: string; role: string }> = {
      // Personal
      "Financial Independence & Freedom": {
        purpose: "To take massive action towards creating a compelling future, eradicate financial stress, and live life on MY terms with abundance and ease.",
        role: "Disciplined Wealth Builder"
      },
      "Bangin' Ass Body": {
        purpose: "To show up every damn day with sexy confidence, limitless energy, and a body that feels as good as it looks.",
        role: "Pro Athlete & Longevity Queen"
      },
      "Home Haven & Sanctuary": {
        purpose: "To create a space where my family feels loved, safe, and at peace - our refuge from the chaos of the world.",
        role: "Intentional Nest Curator"
      },
      "Extraordinary Friendships": {
        purpose: "To consistently invest in and deepen relationships with my friends and family who make life richer, more joyful, and full of meaning.",
        role: "Loyal Connector"
      },
      "Phenomenal Relationship": {
        purpose: "To nurture a passionate partnership with Joey that models what an extraordinary relationship truly looks like for our kids.",
        role: "Woman of His Dreams"
      },
      "Raising Resilient Humans": {
        purpose: "To guide Anthony & Roma to become confident, curious, capable humans who know they're deeply loved and can create their own extraordinary lives.",
        role: "Empowering Guide"
      },
      "Magnificent Mommy/Homeschooling Hero": {
        purpose: "To guide Anthony & Roma to become confident, curious, capable humans who know they're deeply loved and can create their own extraordinary lives.",
        role: "Empowering Guide"
      },
      
      // Professional
      "Bad Ass Business Owner": {
        purpose: "To build a thriving business that creates the freedom, impact, and lifestyle I deserve - on my own terms.",
        role: "God Damn Warrior"
      },
      "HTA Empire Builder": {
        purpose: "To create a game-changing brand that transforms how families connect through sports - and scales like crazy.",
        role: "Life-Changing Wealth Creator"
      },
      "Staff Empowerment & Kickass Workplace": {
        purpose: "To build a team of empowered, passionate coaches who love what they do and help each other win every day.",
        role: "Inspiring Leader"
      },
      "Marketing & Networking Genius": {
        purpose: "To create powerful messaging that attracts our ideal families and build relationships that open doors and amplify impact.",
        role: "Compelling Storyteller"
      },
      "Operational Systems Guru": {
        purpose: "To design systems that run like clockwork - freeing me to focus on growth, innovation, and what I do best.",
        role: "Efficiency Architect"
      },
      "Program Innovation & Excellence": {
        purpose: "To continuously raise the bar and deliver phenomenal experiences that blow families away and keep them coming back for more.",
        role: "Excellence Champion"
      },
    };

    let updatedCount = 0;
    for (const category of categories) {
      const data = categoryData[category.name];
      if (data) {
        await ctx.db.patch(category._id, { 
          purpose: data.purpose,
          role: data.role 
        });
        updatedCount++;
      }
      
      // Also rename if needed
      if (category.name === "Magnificent Mommy/Homeschooling Hero") {
        const newData = categoryData["Raising Resilient Humans"];
        await ctx.db.patch(category._id, { 
          name: "Raising Resilient Humans", 
          purpose: newData.purpose,
          role: newData.role
        });
      }
    }

    return {
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} category purposes`,
    };
  },
});

// Import book library
export const importBookLibrary = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if books already exist
    const existing = await ctx.db
      .query("bookLibrary")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      return { success: true, message: "Books already imported", count: 0 };
    }

    // Your complete book collection
    const books = [
      { title: "Abraham Lincoln (DK Biography)", author: "DK", category: "Biography", read: false },
      { title: "Albert Einstein (DK Biography)", author: "DK", category: "Biography", read: false },
      { title: "Alexander Hamilton: The Outsider", author: "", category: "Biography", read: false },
      { title: "All Creatures Great and Small", author: "James Herriot", category: "Health/Science", read: false },
      { title: "Amelia Earhart (DK Biography)", author: "DK", category: "Biography", read: false },
      { title: "Ancient Art of Origami", author: "", category: "Other", read: false },
      { title: "Anne Frank's Diary", author: "Anne Frank", category: "Classic Lit", read: false },
      { title: "Blood and Guts", author: "Linda Allison", category: "Health/Science", read: false },
      { title: "Carry On, Mr. Bowditch", author: "Jean Lee Latham", category: "Adventure", read: false },
      { title: "Ender's Game", author: "Orson Scott Card", category: "Adventure", read: false },
      { title: "George Washington's Secret Six", author: "", category: "Biography", read: true },
      { title: "Great Battles for Boys - American Revolution", author: "", category: "History", read: false },
      { title: "Hana's Suitcase", author: "", category: "History", read: true },
      { title: "Heidi", author: "Johanna Spyri", category: "Classic Lit", read: false },
      { title: "How to Teach Children Shakespeare", author: "", category: "Other", read: false },
      { title: "King Arthur (Classic Starts)", author: "", category: "Classic Lit", read: false },
      { title: "Leon Garfield's Shakespeare Stories", author: "Leon Garfield", category: "Classic Lit", read: false },
      { title: "Little Britches: Father and I Were Ranchers", author: "Ralph Moody", category: "Adventure", read: false },
      { title: "Little Women", author: "Louisa May Alcott", category: "Classic Lit", read: false },
      { title: "Lord of the Flies", author: "William Golding", category: "Classic Lit", read: false },
      { title: "Lord of the Rings trilogy", author: "J.R.R. Tolkien", category: "Adventure", read: false },
      { title: "Marie Antoinette (Who/What Was)", author: "", category: "Biography", read: false },
      { title: "Miller Moguls series", author: "", category: "Other", read: false },
      { title: "Nelson Mandela (Who/What Was)", author: "", category: "Biography", read: false },
      { title: "Once and Future King", author: "T.H. White", category: "Classic Lit", read: false },
      { title: "Pearl Harbor (Who/What Was)", author: "", category: "History", read: false },
      { title: "Queen Elizabeth 2 (Who/What Was)", author: "", category: "Biography", read: false },
      { title: "Robinson Crusoe", author: "Daniel Defoe", category: "Classic Lit", read: false },
      { title: "See Inside Your Body (Usborne)", author: "Usborne", category: "Health/Science", read: false },
      { title: "Shane", author: "Jack Schaefer", category: "Classic Lit", read: false },
      { title: "Story of Doctor Doolittle", author: "Hugh Lofting", category: "Adventure", read: false },
      { title: "Story of the World Book 1 (Ancient times)", author: "", category: "History", read: false },
      { title: "The Bronze Bow", author: "Elizabeth George Speare", category: "Classic Lit", read: false },
      { title: "The Disappearing Spoon", author: "Sam Kean", category: "Health/Science", read: false },
      { title: "The Door in the Wall", author: "Marguerite de Angeli", category: "Classic Lit", read: false },
      { title: "The Way We Work", author: "David Macaulay", category: "Health/Science", read: false },
      { title: "Treasure Island (Classic Starts)", author: "", category: "Adventure", read: false },
      { title: "Treasury of Egyptian Mythology", author: "", category: "Mythology", read: false },
      { title: "Treasury of Norse Mythology", author: "", category: "Mythology", read: false },
      { title: "Tuttle Twins Free Market Rules", author: "", category: "History", read: false },
      { title: "Tuttle Twins Guide to series", author: "", category: "History", read: false },
      { title: "Tuttle Twins History Volume 2 (American Revolution)", author: "", category: "History", read: false },
      { title: "Tuttle Twins History Volume 3 (War of 1812, Civil War)", author: "", category: "History", read: false },
      { title: "Tuttle Twins Teen Series (Choose Your Consequence)", author: "", category: "History", read: false },
      { title: "Understood Betsy", author: "Dorothy Canfield Fisher", category: "Classic Lit", read: false },
      { title: "Who Was Benjamin Franklin?", author: "", category: "Biography", read: false },
      { title: "Will You Sign Here, John Hancock?", author: "", category: "Biography", read: false },
      { title: "A Wind in the Door", author: "Madeleine L'Engle", category: "Adventure", read: false },
      { title: "A Wrinkle in Time", author: "Madeleine L'Engle", category: "Adventure", read: true },
    ];

    let count = 0;
    for (const book of books) {
      await ctx.db.insert("bookLibrary", {
        userId: user._id,
        title: book.title,
        author: book.author || undefined,
        category: book.category || undefined,
        read: book.read,
        createdAt: Date.now(),
      });
      count++;
    }

    return { success: true, message: `Imported ${count} books successfully!`, count };
  },
});

// Clear all HTA tasks
export const clearHTATasks = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find all HTA tasks
    const htaTasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("project"), "hta"))
      .collect();

    // Delete them all
    for (const task of htaTasks) {
      await ctx.db.delete(task._id);
    }

    return { 
      success: true, 
      message: `Cleared ${htaTasks.length} HTA tasks`,
      count: htaTasks.length 
    };
  },
});

// Reset HTA to a current June 15 signup sprint
export const resetHTALaunchSprint = mutation({
  args: {
    clerkId: v.string(),
    clearFirst: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    let cleared = 0;
    if (args.clearFirst !== false) {
      const existingTasks = await ctx.db
        .query("projectTasks")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("project"), "hta"))
        .collect();

      cleared = existingTasks.length;
      for (const task of existingTasks) {
        await ctx.db.delete(task._id);
      }
    }

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const corinne = teamMembers.find((m) => m.name === "Corinne");
    const sebastian = teamMembers.find((m) => m.name === "Sebastian");
    const allie = teamMembers.find((m) => m.name === "Allie");

    const sprintTasks = [
      // GTM
      {
        subProject: "gtm",
        title: "Finalize Founding Families offer, pricing, and founder bonus",
        dueDate: "2026-04-19",
        assignedToId: corinne?._id,
        priority: "high" as const,
      },
      {
        subProject: "gtm",
        title: "Draft the offer architecture, FAQ, and objection handling",
        dueDate: "2026-04-20",
        assignedToId: sebastian?._id,
        priority: "high" as const,
      },
      {
        subProject: "gtm",
        title: "Set June 15 signup target, founding families cap, and launch success metric",
        dueDate: "2026-04-21",
        assignedToId: corinne?._id,
        priority: "high" as const,
      },
      {
        subProject: "gtm",
        title: "Open HTA signups on June 15",
        dueDate: "2026-06-15",
        assignedToId: corinne?._id,
        priority: "high" as const,
      },

      // Product
      {
        subProject: "product",
        title: "Approve Welcome Box v1 contents and what families actually receive",
        dueDate: "2026-04-22",
        assignedToId: corinne?._id,
        priority: "high" as const,
      },
      {
        subProject: "product",
        title: "Build item sourcing sheet with vendor options, MOQ, and cost ranges",
        dueDate: "2026-04-24",
        assignedToId: allie?._id,
        priority: "high" as const,
      },
      {
        subProject: "product",
        title: "Create box COGS tracker and first-pass packout checklist",
        dueDate: "2026-04-26",
        assignedToId: allie?._id,
        priority: "high" as const,
      },
      {
        subProject: "product",
        title: "Approve final launch box scope before sales go live",
        dueDate: "2026-05-10",
        assignedToId: corinne?._id,
        priority: "high" as const,
      },

      // Curriculum
      {
        subProject: "curriculum",
        title: "Lock Month 1 theme, age-band outcomes, and parent promise",
        dueDate: "2026-04-24",
        assignedToId: corinne?._id,
        priority: "high" as const,
      },
      {
        subProject: "curriculum",
        title: "Create first-pass mission, story, and sample asset mockups for launch",
        dueDate: "2026-04-29",
        assignedToId: sebastian?._id,
        priority: "medium" as const,
      },
      {
        subProject: "curriculum",
        title: "Finalize the sample mission and parent quick-start for the sales page",
        dueDate: "2026-05-05",
        assignedToId: corinne?._id,
        priority: "high" as const,
      },
      {
        subProject: "curriculum",
        title: "Organize approved curriculum assets for landing page, email, and onboarding use",
        dueDate: "2026-05-07",
        assignedToId: allie?._id,
        priority: "medium" as const,
      },

      // Marketing
      {
        subProject: "marketing",
        title: "Draft landing page copy with StoryBrand structure, FAQ, and CTA sections",
        dueDate: "2026-04-23",
        assignedToId: sebastian?._id,
        priority: "high" as const,
      },
      {
        subProject: "marketing",
        title: "Approve HTA positioning, headline direction, and parent-facing promise",
        dueDate: "2026-04-28",
        assignedToId: corinne?._id,
        priority: "high" as const,
      },
      {
        subProject: "marketing",
        title: "Build launch asset tracker and lead list sheet for waitlist and outreach",
        dueDate: "2026-04-30",
        assignedToId: allie?._id,
        priority: "medium" as const,
      },
      {
        subProject: "marketing",
        title: "Prepare launch email, text, and social announcement set",
        dueDate: "2026-05-20",
        assignedToId: sebastian?._id,
        priority: "high" as const,
      },

      // Operations
      {
        subProject: "operations",
        title: "Build the signup flow, payment path, and confirmation screen",
        dueDate: "2026-05-08",
        assignedToId: sebastian?._id,
        priority: "high" as const,
      },
      {
        subProject: "operations",
        title: "Build confirmation email and onboarding automation for new signups",
        dueDate: "2026-05-15",
        assignedToId: sebastian?._id,
        priority: "high" as const,
      },
      {
        subProject: "operations",
        title: "Create fulfillment tracker, shipping checklist, and launch QA sheet",
        dueDate: "2026-05-18",
        assignedToId: allie?._id,
        priority: "medium" as const,
      },
      {
        subProject: "operations",
        title: "Approve the full signup experience after QA and before launch day",
        dueDate: "2026-06-10",
        assignedToId: corinne?._id,
        priority: "high" as const,
      },
    ];

    const orderBySubProject: Record<string, number> = {};
    let inserted = 0;

    for (const task of sprintTasks) {
      const order = orderBySubProject[task.subProject] || 0;
      await ctx.db.insert("projectTasks", {
        userId: user._id,
        project: "hta",
        subProject: task.subProject,
        title: task.title,
        assignedToId: task.assignedToId,
        status: "todo",
        dueDate: task.dueDate,
        priority: task.priority,
        order,
        createdAt: Date.now(),
      });
      orderBySubProject[task.subProject] = order + 1;
      inserted++;
    }

    return {
      success: true,
      cleared,
      inserted,
      message: `Rebuilt HTA as a June 15 sprint with ${inserted} tasks`,
    };
  },
});

// Import HTA tasks for first 4 weeks
export const importHTATasks = mutation({
  args: { 
    clerkId: v.string(),
    clearFirst: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Clear existing tasks if requested
    if (args.clearFirst) {
      const htaTasks = await ctx.db
        .query("projectTasks")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("project"), "hta"))
        .collect();

      for (const task of htaTasks) {
        await ctx.db.delete(task._id);
      }
    }

    // Get team members for assignment
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    const corinne = teamMembers.find(m => m.name === "Corinne");
    const allie = teamMembers.find(m => m.name === "Allie");

    // GTM Timeline - High-level milestones
    const gtmTasks = [
      { title: "Finalize Welcome Box design & contents", dueDate: "2026-02-15", priority: "high" as const },
      { title: "Complete logo design", dueDate: "2026-02-22", priority: "high" as const },
      { title: "Film all Month 1 training videos", dueDate: "2026-02-28", priority: "high" as const },
      { title: "Assemble 10 beta Welcome Boxes", dueDate: "2026-03-08", priority: "high" as const },
      { title: "Launch beta testing (10 families)", dueDate: "2026-03-15", priority: "high" as const },
      { title: "Build Founding Families landing page", dueDate: "2026-04-01", priority: "high" as const },
      { title: "Launch Founding Families waitlist", dueDate: "2026-04-15", priority: "high" as const },
      { title: "Fulfill first 50 Welcome Boxes", dueDate: "2026-05-15", priority: "high" as const },
      { title: "🚀 LAUNCH - World Cup Opening Weekend", dueDate: "2026-06-15", priority: "high" as const },
    ];

    // Product Dev - Inventory & Welcome Box
    const productTasks = [
      { title: "Order wristbands (500-1000 units)", dueDate: "2026-02-15", assignedTo: allie, priority: "high" as const },
      { title: "Order mini soccer balls (500 units)", dueDate: "2026-02-15", assignedTo: allie, priority: "high" as const },
      { title: "Order blank t-shirts from S&S Activewear (400 total)", dueDate: "2026-02-15", assignedTo: allie, priority: "high" as const },
      { title: "Get screen printing quote from local printer", dueDate: "2026-02-15", assignedTo: allie, priority: "medium" as const },
      { title: "Order achievement posters (100 units)", dueDate: "2026-02-22", assignedTo: allie, priority: "medium" as const },
      { title: "Order storybooks (200 units - 100 per age)", dueDate: "2026-02-22", assignedTo: allie, priority: "medium" as const },
      { title: "Order shipping boxes (100 units)", dueDate: "2026-02-22", assignedTo: allie, priority: "medium" as const },
      { title: "Submit t-shirt design to screen printer", dueDate: "2026-02-22", priority: "medium" as const },
      { title: "Create inventory tracking spreadsheet", dueDate: "2026-02-22", assignedTo: allie, priority: "low" as const },
    ];

    // Curriculum Dev - Content Creation
    const curriculumTasks = [
      { title: "Design achievement poster template in Canva", dueDate: "2026-02-15", assignedTo: corinne, priority: "high" as const },
      { title: "Write Month 1 storybook (Ages 3-5)", dueDate: "2026-02-22", assignedTo: corinne, priority: "high" as const },
      { title: "Write Month 1 storybook (Ages 6-8)", dueDate: "2026-02-22", assignedTo: corinne, priority: "high" as const },
      { title: "Generate storybook illustrations (AI)", dueDate: "2026-02-22", priority: "medium" as const },
      { title: "Write 4 mission scripts (Ages 3-5)", dueDate: "2026-02-22", assignedTo: corinne, priority: "high" as const },
      { title: "Write 4 mission scripts (Ages 6-8)", dueDate: "2026-02-22", assignedTo: corinne, priority: "high" as const },
      { title: "Create Month 1 quiz questions (both tiers)", dueDate: "2026-02-22", priority: "medium" as const },
      { title: "Design mission cards template (Canva)", dueDate: "2026-02-22", priority: "medium" as const },
      { title: "Film 4 training videos (Ages 3-5)", dueDate: "2026-03-01", assignedTo: corinne, priority: "high" as const },
      { title: "Film 4 training videos (Ages 6-8)", dueDate: "2026-03-01", assignedTo: corinne, priority: "high" as const },
      { title: "Edit videos in Descript", dueDate: "2026-03-01", priority: "high" as const },
      { title: "Upload videos to Vimeo", dueDate: "2026-03-01", assignedTo: allie, priority: "medium" as const },
      { title: "Create QR codes for mission cards", dueDate: "2026-03-08", assignedTo: allie, priority: "medium" as const },
      { title: "Film lead magnet video (3 Home Drills)", dueDate: "2026-03-08", assignedTo: corinne, priority: "medium" as const },
      { title: "Create 5-10 Instagram Reels (CapCut)", dueDate: "2026-03-08", priority: "low" as const },
    ];

    // Marketing - Landing Pages & Campaigns
    const marketingTasks = [
      { title: "Draft Founding Families landing page copy (StoryBrand)", dueDate: "2026-02-22", assignedTo: corinne, priority: "high" as const },
      { title: "Write welcome email sequence (Days 1, 3, 7)", dueDate: "2026-02-22", priority: "medium" as const },
      { title: "Write mission unlock emails (Weeks 1-4)", dueDate: "2026-02-22", priority: "medium" as const },
      { title: "Create lead magnet concept", dueDate: "2026-02-22", priority: "low" as const },
      { title: "Build Founding Families landing page", dueDate: "2026-03-01", priority: "high" as const },
      { title: "Set up ConvertKit email collection", dueDate: "2026-03-01", priority: "medium" as const },
      { title: "Create social media content calendar (Mar-May)", dueDate: "2026-03-08", priority: "low" as const },
      { title: "Finalize Founding Families offer details", dueDate: "2026-03-08", priority: "high" as const },
      { title: "Design AYSO info night presentation", dueDate: "2026-03-08", priority: "medium" as const },
    ];

    // Operations - Tech & Testing
    const operationsTasks = [
      { title: "Review Bubble wireframes", dueDate: "2026-02-15", priority: "medium" as const },
      { title: "Document Convex schema needs", dueDate: "2026-02-15", priority: "medium" as const },
      { title: "Set up Convex production project", dueDate: "2026-02-22", priority: "high" as const },
      { title: "Build Convex schema & functions", dueDate: "2026-02-22", priority: "high" as const },
      { title: "Build Bubble UI - Parent dashboard", dueDate: "2026-03-01", priority: "high" as const },
      { title: "Build Bubble UI - Kids dashboards (2 versions)", dueDate: "2026-03-01", priority: "high" as const },
      { title: "Build Bubble UI - Reward shop", dueDate: "2026-03-01", priority: "medium" as const },
      { title: "Connect Bubble to Convex (API)", dueDate: "2026-03-01", priority: "high" as const },
      { title: "Integrate Stripe subscriptions", dueDate: "2026-03-01", priority: "high" as const },
      { title: "Test full user signup flow", dueDate: "2026-03-08", priority: "high" as const },
      { title: "Test mission completion & coins flow", dueDate: "2026-03-08", priority: "high" as const },
      { title: "Recruit 10 beta families", dueDate: "2026-03-08", assignedTo: corinne, priority: "high" as const },
      { title: "Create beta feedback form", dueDate: "2026-03-08", priority: "medium" as const },
      { title: "Write beta family onboarding email", dueDate: "2026-03-08", priority: "medium" as const },
    ];

    let count = 0;
    
    // Insert GTM tasks
    for (let i = 0; i < gtmTasks.length; i++) {
      await ctx.db.insert("projectTasks", {
        userId: user._id,
        project: "hta",
        subProject: "gtm",
        title: gtmTasks[i].title,
        assignedToId: corinne?._id,
        status: "todo",
        dueDate: gtmTasks[i].dueDate,
        priority: gtmTasks[i].priority,
        order: i,
        createdAt: Date.now(),
      });
      count++;
    }

    // Insert Product tasks
    for (let i = 0; i < productTasks.length; i++) {
      await ctx.db.insert("projectTasks", {
        userId: user._id,
        project: "hta",
        subProject: "product",
        title: productTasks[i].title,
        assignedToId: productTasks[i].assignedTo?._id,
        status: "todo",
        dueDate: productTasks[i].dueDate,
        priority: productTasks[i].priority,
        order: i,
        createdAt: Date.now(),
      });
      count++;
    }

    // Insert Curriculum tasks
    for (let i = 0; i < curriculumTasks.length; i++) {
      await ctx.db.insert("projectTasks", {
        userId: user._id,
        project: "hta",
        subProject: "curriculum",
        title: curriculumTasks[i].title,
        assignedToId: curriculumTasks[i].assignedTo?._id,
        status: "todo",
        dueDate: curriculumTasks[i].dueDate,
        priority: curriculumTasks[i].priority,
        order: i,
        createdAt: Date.now(),
      });
      count++;
    }

    // Insert Marketing tasks
    for (let i = 0; i < marketingTasks.length; i++) {
      await ctx.db.insert("projectTasks", {
        userId: user._id,
        project: "hta",
        subProject: "marketing",
        title: marketingTasks[i].title,
        assignedToId: marketingTasks[i].assignedTo?._id,
        status: "todo",
        dueDate: marketingTasks[i].dueDate,
        priority: marketingTasks[i].priority,
        order: i,
        createdAt: Date.now(),
      });
      count++;
    }

    // Insert Operations tasks
    for (let i = 0; i < operationsTasks.length; i++) {
      await ctx.db.insert("projectTasks", {
        userId: user._id,
        project: "hta",
        subProject: "operations",
        title: operationsTasks[i].title,
        assignedToId: operationsTasks[i].assignedTo?._id,
        status: "todo",
        dueDate: operationsTasks[i].dueDate,
        priority: operationsTasks[i].priority,
        order: i,
        createdAt: Date.now(),
      });
      count++;
    }

    return { success: true, message: `Imported ${count} HTA tasks successfully!`, count };
  },
});

// Query to check user setup
export const checkUserSetup = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { exists: false };
    }

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const habitTemplates = await ctx.db
      .query("habitTemplates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const rpmCategories = await ctx.db
      .query("rpmCategories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      exists: true,
      userId: user._id,
      teamMembersCount: teamMembers.length,
      habitTemplatesCount: habitTemplates.length,
      rpmCategoriesCount: rpmCategories.length,
    };
  },
});

// Update all RPM categories with February/March goals
export const updateAllRPMGoals = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all categories
    const categories = await ctx.db
      .query("rpmCategories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const updates = {
      "Bad Ass Business Owner": {
        monthlyFocus: [
          "Spring League registration push (300-350 Agoura, 100-125 Pali)",
          "Business insurance (get quotes, finalize policy)",
          "Complete prep for opening day: shirts/balls inventory + orders, equipment tested and organized, field setup checklist",
          "Finalize Saturday staff assignments",
          "Get all automations with Sebastian setup and executed"
        ],
        yearlyGoals: [
          "HTA launched in June",
          "Aspire camp sold out (40 kids × 4 weeks = 160 total campers)",
          "Aspire revenue: $500K in 2026",
          "All systems documented, optimized, automated as much as possible, and running smoothly"
        ]
      },
      "HTA Empire Builder": {
        monthlyFocus: [
          "Complete X API integration for social monitoring/posting",
          "Create 30-day content calendar (launch countdown)",
          "Finalize Welcome Box prototype (supplier samples)",
          "Finish curriculum development (activities + mission cards)"
        ],
        yearlyGoals: [
          "Launch June 15th with 500 Founding Families",
          "1,000 active subscribers by December",
          "MRR: $39,000/month ($468K first-year revenue)"
        ]
      },
      "Staff Empowerment & Kickass Workplace": {
        monthlyFocus: [
          "Band API setup for staff coordination",
          "Staff meeting (season kickoff + expectations)",
          "Contact FCE re: staff training opportunities",
          "Schedule staff outing (Angel City game OR World Cup watch party this summer)",
          "Figure out payroll efficiency with Sebastian (automate/streamline)"
        ],
        yearlyGoals: [
          "Full 7-agent squad operational",
          "Band app and staff scheduling automated",
          "Payroll system automated and efficient",
          "FCE course completed with all staff"
        ]
      },
      "Marketing & Networking Genius": {
        monthlyFocus: [
          "Spring League email campaign completely written and scheduled (both locations, now through opening day)",
          "Create HTA social media presence (consistent posting + engagement)",
          "Network with strategic partners/influencers: touch base with friends/reconnect, create list + track contact history, research youth sports influencers, start interacting on their X accounts"
        ],
        yearlyGoals: [
          "Personal X account: 10,000 followers",
          "HTA X account: 10,000 followers (20K total reach)",
          "5 podcast appearances",
          "Strategic partnerships established",
          "1 viral moment / press coverage in major outlet",
          "Marketing for programs designed and scheduled/automated"
        ]
      },
      "Operational Systems Guru": {
        monthlyFocus: [
          "Deploy Scout agent (Operations Commander - auto-monitoring)",
          "Jotform → roster automation fully functional",
          "Quo daily monitoring + action item workflow with Allie locked in",
          "Build curriculum database app (Next.js + Convex)",
          "Document all systems (so they run without you)"
        ],
        yearlyGoals: [
          "All major workflows automated (registration, scheduling, communications)",
          "Curriculum database live and used by all coaches",
          "7-agent squad handling 80% of routine operations",
          "Zero missed parent communications or registration issues",
          "Systems so smooth you could take a 2-week vacation"
        ]
      },
      "Program Innovation & Excellence": {
        monthlyFocus: [
          "Adult 7v7 program (restart date for Pali? Send proposal to Agoura)",
          "HTA curriculum finished",
          "Aspire curriculum database complete",
          "Promote camp mini trial day (kids can try camp before signing up)"
        ],
        yearlyGoals: [
          "Adult 7v7 running in both locations (launch Agoura, relaunch Pali)",
          "Fall PDP Agoura launched",
          "Aspire curriculum fully documented and searchable",
          "HTA proven model ready to scale",
          "FOCUS: Hit 1,000 HTA subscribers (this is the needle-mover)"
        ]
      },
      "Raising Resilient Humans": {
        monthlyFocus: [
          "iFLY and Nixon Museum field trips",
          "Anthony & Roma days (alternate - one this month, one next month)",
          "Create and support OpenClaw projects (James and Compass)",
          "Establish better morning routine"
        ],
        yearlyGoals: [
          "Help Anthony & Roma create a business and make money (utilizing James and Compass)",
          "UPW in Florida trip (November)",
          "Texas roadtrip",
          "Homeschool routine dialed in and helping us thrive",
          "Magic moments: Ed Sheeran concert, World Cup game, family cruise"
        ]
      },
      "Financial Independence & Freedom": {
        monthlyFocus: [
          "Complete Bench and Kick accounting",
          "Schedule tax appointment",
          "Automate 10% savings from every deposit into business account",
          "Automate investing"
        ],
        yearlyGoals: [
          "6-month emergency fund fully funded",
          "10% of all business income automated to savings/investments",
          "Financial freedom number defined and roadmap created",
          "Up to date on all taxes"
        ]
      },
      "Home Haven & Sanctuary": {
        monthlyFocus: [
          "Finish office flooring",
          "Declutter laundry closet",
          "Purchase plant for front garden"
        ],
        yearlyGoals: [
          "Decluttering throughout year (prep for January 2027 move)",
          "Declutter extra storage garage (big project)",
          "Every room EXACTLY how you want it",
          "Joey's mom's house ready for move-in January 2027 (this is MASSIVE!)",
          "Home systems run smoothly, family LOVES being home"
        ]
      },
      "Bangin' Ass Body": {
        monthlyFocus: [
          "Workout 4x/week",
          "Walk/run 4x/week",
          "Take measurements (set accurate weight loss goals)",
          "Sleep 7 hours every night",
          "Lose 10 lbs (to start)"
        ],
        yearlyGoals: [
          "Lose 40 lbs",
          "Workout 5x/week (260+ workouts in 2026!)",
          "Run a 5K, Tough Mudder, or Color Run with the kids",
          "Promoted from white belt in jiu-jitsu",
          "Personal stylist and new wardrobe",
          "Reduce pace of aging - biological age younger than actual age"
        ]
      },
      "Extraordinary Friendships": {
        monthlyFocus: [
          "HTA reconnect list + warm outreach",
          "Plan girls night with Lauren",
          "Create system for daily ritual of reaching out (log entries from Mission Control morning mindset question #2)"
        ],
        yearlyGoals: [
          "Weekend with Pam and Kim",
          "Fun adventure planned with Lauren",
          "Visit Twila",
          "Deep connections with 10+ friends",
          "Be the friend who shows up",
          "Daily ritual of reaching out becomes automatic"
        ]
      },
      "Phenomenal Relationship": {
        monthlyFocus: [
          "Birthday date night (Feb 22 - you share the same birthday!)",
          "Weekly in-home date night on Saturdays (no TV or video games)",
          "Family visit to see his mom"
        ],
        yearlyGoals: [
          "Trip to Vegas without the kiddos",
          "Monthly date nights (12 minimum)",
          "Date with Destiny",
          "Complete Show Her Off dance classes (online program)",
          "Sexy photo shoot for pics for Joey",
          "Create our new home together (Joey's mom's house ready January 2027)"
        ]
      }
    };

    let updated = 0;
    for (const category of categories) {
      const data = updates[category.name as keyof typeof updates];
      if (data) {
        await ctx.db.patch(category._id, {
          monthlyFocus: data.monthlyFocus,
          yearlyGoals: data.yearlyGoals,
        });
        updated++;
      }
    }

    return { 
      message: `Updated ${updated} categories with monthly needle movers and yearly goals!`,
      updated 
    };
  },
});

// Admin: get all Sebastian tasks (no userId required)
export const getAllSebastianTasks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sebastianTasks").collect();
  },
});

// Admin: get all users
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Admin: fix user clerkId (update admin-import to real Clerk ID)
export const fixUserClerkId = mutation({
  args: {
    oldClerkId: v.string(),
    newClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.oldClerkId))
      .first();
    
    if (!user) {
      return { success: false, message: "User not found" };
    }
    
    await ctx.db.patch(user._id, { clerkId: args.newClerkId });
    return { success: true, message: `Updated clerkId to ${args.newClerkId}` };
  },
});

// Admin: import movies (creates user if needed for single-user setup)
export const importMovies = mutation({
  args: {
    watched: v.array(v.object({
      title: v.string(),
      notes: v.optional(v.string()),
      rating: v.optional(v.number()),
    })),
    suggestions: v.array(v.object({
      title: v.string(),
      suggestedBy: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Find or create user for single-user setup
    let user = await ctx.db.query("users").first();
    
    if (!user) {
      // Create a default user for single-user setup
      const userId = await ctx.db.insert("users", {
        clerkId: "admin-import",
        email: "corinne@aspiresoccercoaching.com",
        name: "Corinne",
        createdAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    }
    
    if (!user) {
      throw new Error("Could not find or create user");
    }

    const results = { watched: 0, suggestions: 0, skipped: 0 };
    
    // Get existing movies to avoid duplicates
    const existingMovies = await ctx.db
      .query("movieLibrary")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const existingTitles = new Set(existingMovies.map(m => m.title.toLowerCase()));

    // Add watched movies
    for (const movie of args.watched) {
      if (existingTitles.has(movie.title.toLowerCase())) {
        results.skipped++;
        continue;
      }
      
      await ctx.db.insert("movieLibrary", {
        userId: user._id,
        title: movie.title,
        type: "watched",
        suggestedBy: "Family",
        watchedOn: new Date().toISOString().split("T")[0],
        rating: movie.rating || 5,
        notes: movie.notes,
        votes: [],
        favorite: true,
        createdAt: Date.now(),
      });
      results.watched++;
      existingTitles.add(movie.title.toLowerCase());
    }

    // Add suggestions
    for (const movie of args.suggestions) {
      if (existingTitles.has(movie.title.toLowerCase())) {
        results.skipped++;
        continue;
      }
      
      await ctx.db.insert("movieLibrary", {
        userId: user._id,
        title: movie.title,
        type: "suggestion",
        suggestedBy: movie.suggestedBy,
        votes: [],
        favorite: false,
        createdAt: Date.now(),
      });
      results.suggestions++;
      existingTitles.add(movie.title.toLowerCase());
    }

    return results;
  },
});

// Copy health data from one user to another (bypasses schema validation)
export const copyHealthData = mutation({
  args: { 
    fromUserIdStr: v.string(),
    toUserIdStr: v.string()
  },
  handler: async (ctx, { fromUserIdStr, toUserIdStr }) => {
    // Get all health records for the source user
    const healthRecords = await ctx.db
      .query("dailyHealth")
      .filter((q) => q.eq(q.field("userId"), fromUserIdStr as any))
      .collect();
    
    let copied = 0;
    for (const record of healthRecords) {
      // Check if record already exists for target user on this date
      const existing = await ctx.db
        .query("dailyHealth")
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), toUserIdStr as any),
            q.eq(q.field("date"), record.date)
          )
        )
        .first();
      
      if (!existing) {
        // Insert new record with target user
        await ctx.db.insert("dailyHealth", {
          ...record,
          _id: undefined,
          _creationTime: undefined,
          userId: toUserIdStr as any,
        } as any);
        copied++;
      }
    }
    
    return { success: true, recordsCopied: copied, total: healthRecords.length };
  },
});

// Update health records to new user ID
export const migrateHealthRecords = mutation({
  args: { 
    oldUserId: v.string(),
    newUserId: v.string()
  },
  handler: async (ctx, { oldUserId, newUserId }) => {
    // Get all health records
    const allRecords = await ctx.db.query("dailyHealth").collect();
    
    let migrated = 0;
    for (const record of allRecords) {
      if (String(record.userId) === oldUserId) {
        await ctx.db.patch(record._id, { userId: newUserId as any });
        migrated++;
      }
    }
    
    return { success: true, migrated };
  },
});

// Debug health records
export const debugHealthRecords = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("dailyHealth").take(5);
    return records.map(r => ({
      id: r._id,
      date: r.date,
      userId: r.userId,
      userIdStr: String(r.userId),
      userIdType: typeof r.userId,
    }));
  },
});

// Get all unique user IDs in dailyHealth
export const getHealthUserIds = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("dailyHealth").collect();
    const userIds = new Set<string>();
    const dateCounts: Record<string, number> = {};
    
    for (const r of records) {
      const uid = String(r.userId);
      userIds.add(uid);
      dateCounts[uid] = (dateCounts[uid] || 0) + 1;
    }
    
    return { 
      userIds: Array.from(userIds),
      counts: dateCounts,
      total: records.length
    };
  },
});

// Get date range of health records
export const getHealthDateRange = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("dailyHealth").collect();
    const dates = records.map(r => r.date).sort();
    return { 
      earliest: dates[0],
      latest: dates[dates.length - 1],
      count: dates.length,
      recentDates: dates.slice(-7)
    };
  },
});

// Remove duplicate homeschool schedule blocks
export const removeDuplicateScheduleBlocks = mutation({
  args: {},
  handler: async (ctx) => {
    // Find first user
    const allUsers = await ctx.db.query("users").collect();
    const user = allUsers[0];
    if (!user) throw new Error("No users found");

    // Get all schedule blocks for this user
    const allBlocks = await ctx.db
      .query("weeklySchedule")
      .withIndex("by_user_and_day", (q) => q.eq("userId", user._id))
      .collect();

    // Group by dayOfWeek + startTime + endTime + activity
    type Block = typeof allBlocks[number];
    const groups = new Map<string, Block[]>();
    
    for (const block of allBlocks) {
      const key = `${block.dayOfWeek}|${block.startTime}|${block.endTime}|${block.activity}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(block);
    }

    // Find and remove duplicates (keep newest)
    let deletedCount = 0;
    
    for (const [key, blocks] of Array.from(groups.entries())) {
      if (blocks.length > 1) {
        // Sort by creation time (newest first)
        const sorted = blocks.sort((a, b) => b.createdAt - a.createdAt);
        const toDelete = sorted.slice(1);
        
        for (const dupe of toDelete) {
          await ctx.db.delete(dupe._id);
          deletedCount++;
        }
      }
    }

    return {
      success: true,
      totalBlocks: allBlocks.length,
      uniqueActivities: groups.size,
      duplicatesRemoved: deletedCount,
      remainingBlocks: allBlocks.length - deletedCount
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// DATA OWNERSHIP INVESTIGATION
// ─────────────────────────────────────────────────────────────────────────────

export const investigateDataOwnership = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    const results: Record<string, Record<string, number>> = {};
    
    const tables = [
      "rpmCategories",
      "teamMembers",
      "habitTemplates",
      "bookLibrary",
      "sebastianTasks",
      "familyMeetings",
      "movieLibrary",
      "dailyHealth",
      "calendarEvents",
    ] as const;
    
    for (const table of tables) {
      results[table] = {};
      const records = await ctx.db.query(table as any).collect();
      for (const record of records) {
        const uid = String((record as any).userId);
        results[table][uid] = (results[table][uid] || 0) + 1;
      }
    }
    
    return {
      users: users.map(u => ({
        id: String(u._id),
        clerkId: u.clerkId,
        email: u.email,
        name: u.name,
      })),
      tableCounts: results,
    };
  },
});

export const rebindDataToNewUser = mutation({
  args: {
    oldUserId: v.string(),
    newUserId: v.string(),
    tables: v.array(v.string()),
    dryRun: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { oldUserId, newUserId, tables, dryRun } = args;
    
    const results: Record<string, { found: number; updated: number }> = {};
    
    for (const tableName of tables) {
      results[tableName] = { found: 0, updated: 0 };
      
      const records = await ctx.db.query(tableName as any).collect();
      
      for (const record of records) {
        if (String((record as any).userId) === oldUserId) {
          results[tableName].found++;
          
          if (!dryRun) {
            await ctx.db.patch(record._id, { userId: newUserId as any });
            results[tableName].updated++;
          }
        }
      }
    }
    
    return {
      success: true,
      dryRun,
      oldUserId,
      newUserId,
      results,
    };
  },
});

export const cleanupDuplicatesByUserForTable = mutation({
  args: {
    userId: v.string(),
    table: v.string(),
    dedupKeyFields: v.array(v.string()),
  },
  handler: async (ctx, { userId, table, dedupKeyFields }) => {
    const records = await ctx.db.query(table as any).collect();
    const userRecords = records.filter((r: any) => String(r.userId) === userId);
    
    const groups = new Map<string, typeof userRecords>();
    for (const record of userRecords) {
      const key = dedupKeyFields.map(f => String((record as any)[f] ?? "").toLowerCase().trim()).join("::");
      const arr = groups.get(key) ?? [];
      arr.push(record);
      groups.set(key, arr);
    }
    
    let deleted = 0;
    const groupsArray = Array.from(groups.values());
    for (const group of groupsArray) {
      if (group.length <= 1) continue;
      
      group.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
      
      for (const dupe of group.slice(1)) {
        await ctx.db.delete(dupe._id);
        deleted++;
      }
    }
    
    return { success: true, deleted, kept: userRecords.length - deleted };
  },
});
