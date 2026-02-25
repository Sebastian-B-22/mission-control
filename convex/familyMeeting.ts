import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const familyMeetingStatus = v.union(
  v.literal("queued"),
  v.literal("resolved"),
  v.literal("tabled"),
  v.literal("action-needed"),
  v.literal("archived")
);

export const getQuickWins = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quickWins")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .order("asc")
      .collect();
  },
});

export const addQuickWin = mutation({
  args: {
    userId: v.id("users"),
    task: v.string(),
    date: v.string(),
    categoryId: v.optional(v.id("rpmCategories")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quickWins", {
      userId: args.userId,
      task: args.task,
      categoryId: args.categoryId,
      completed: false,
      date: args.date,
      createdAt: Date.now(),
    });
  },
});

export const toggleQuickWin = mutation({
  args: {
    id: v.id("quickWins"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      completed: args.completed,
      completedAt: args.completed ? Date.now() : undefined,
    });
  },
});

export const deleteQuickWin = mutation({
  args: { id: v.id("quickWins") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const carryOverUncheckedQuickWins = mutation({
  args: {
    userId: v.id("users"),
    fromDate: v.string(),
    toDate: v.string(),
  },
  handler: async (ctx, args) => {
    const unchecked = await ctx.db
      .query("quickWins")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.fromDate))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    const existingToday = await ctx.db
      .query("quickWins")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.toDate))
      .collect();

    const existingTasks = new Set(existingToday.map((t) => t.task.toLowerCase().trim()));

    let inserted = 0;
    for (const item of unchecked) {
      const normalized = item.task.toLowerCase().trim();
      if (existingTasks.has(normalized)) continue;

      await ctx.db.insert("quickWins", {
        userId: args.userId,
        task: item.task,
        categoryId: item.categoryId,
        completed: false,
        date: args.toDate,
        createdAt: Date.now(),
      });
      inserted += 1;
      existingTasks.add(normalized);
    }

    return { inserted };
  },
});

export const getDiscussionQueue = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("discussionQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const addDiscussionItem = mutation({
  args: {
    userId: v.id("users"),
    item: v.string(),
    addedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("discussionQueue", {
      userId: args.userId,
      item: args.item,
      addedBy: args.addedBy,
      status: "queued",
      dateAdded: new Date().toISOString().split("T")[0],
      createdAt: Date.now(),
    });
  },
});

export const updateDiscussionStatus = mutation({
  args: {
    id: v.id("discussionQueue"),
    status: familyMeetingStatus,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      notes: args.notes,
      resolvedAt: args.status === "resolved" || args.status === "archived" ? Date.now() : undefined,
    });
  },
});

export const getMovieItems = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("movieLibrary")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const addMovieSuggestion = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    suggestedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("movieLibrary", {
      userId: args.userId,
      title: args.title,
      type: "suggestion",
      suggestedBy: args.suggestedBy,
      votes: [],
      favorite: false,
      createdAt: Date.now(),
    });
  },
});

export const voteMovie = mutation({
  args: {
    id: v.id("movieLibrary"),
    voter: v.string(),
  },
  handler: async (ctx, args) => {
    const movie = await ctx.db.get(args.id);
    if (!movie) throw new Error("Movie not found");

    const votes = movie.votes || [];
    const alreadyVoted = votes.includes(args.voter);

    await ctx.db.patch(args.id, {
      votes: alreadyVoted ? votes.filter((voter) => voter !== args.voter) : [...votes, args.voter],
    });
  },
});

export const markMovieWatched = mutation({
  args: {
    id: v.id("movieLibrary"),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      type: "watched",
      watchedOn: new Date().toISOString().split("T")[0],
      rating: args.rating,
      notes: args.notes,
      favorite: args.favorite,
    });
  },
});

export const getFamilyMeetingByWeek = query({
  args: {
    userId: v.id("users"),
    weekOf: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("familyMeetings")
      .withIndex("by_user_and_week", (q) => q.eq("userId", args.userId).eq("weekOf", args.weekOf))
      .first();
  },
});

export const saveFamilyMeeting = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("familyMeetings")
      .withIndex("by_user_and_week", (q) => q.eq("userId", args.userId).eq("weekOf", args.weekOf))
      .first();

    const payload = {
      familyMembers: args.familyMembers,
      acknowledgements: args.acknowledgements,
      supportRequests: args.supportRequests,
      goals: args.goals,
      mealPlan: args.mealPlan,
      gameNights: args.gameNights,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("familyMeetings", {
      userId: args.userId,
      weekOf: args.weekOf,
      ...payload,
      createdAt: Date.now(),
    });
  },
});

export const seedDemoData = mutation({
  args: {
    userId: v.id("users"),
    today: v.string(),
    weekOf: v.string(),
  },
  handler: async (ctx, args) => {
    const quickWinExisting = await ctx.db
      .query("quickWins")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.today))
      .first();

    if (!quickWinExisting) {
      const quickWins = ["Send one gratitude text", "Prep Friday movie options", "Review week calendar"];
      for (const task of quickWins) {
        await ctx.db.insert("quickWins", {
          userId: args.userId,
          task,
          completed: false,
          date: args.today,
          createdAt: Date.now(),
        });
      }
    }

    const queueExisting = await ctx.db
      .query("discussionQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!queueExisting) {
      await ctx.db.insert("discussionQueue", {
        userId: args.userId,
        item: "Spring break plan + budget",
        addedBy: "Corinne",
        status: "queued",
        dateAdded: args.today,
        createdAt: Date.now(),
      });
      await ctx.db.insert("discussionQueue", {
        userId: args.userId,
        item: "Who handles Wednesday pickups?",
        addedBy: "Sebastian",
        status: "action-needed",
        dateAdded: args.today,
        createdAt: Date.now(),
      });
    }

    const movieExisting = await ctx.db
      .query("movieLibrary")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!movieExisting) {
      await ctx.db.insert("movieLibrary", {
        userId: args.userId,
        title: "The Wild Robot",
        type: "suggestion",
        suggestedBy: "Family",
        votes: ["Corinne", "Sebastian"],
        favorite: false,
        createdAt: Date.now(),
      });
      await ctx.db.insert("movieLibrary", {
        userId: args.userId,
        title: "Inside Out 2",
        type: "watched",
        suggestedBy: "Kids",
        watchedOn: args.today,
        rating: 5,
        notes: "Big laughs, everyone loved it",
        votes: [],
        favorite: true,
        createdAt: Date.now(),
      });
    }

    const meetingExisting = await ctx.db
      .query("familyMeetings")
      .withIndex("by_user_and_week", (q) => q.eq("userId", args.userId).eq("weekOf", args.weekOf))
      .first();

    if (!meetingExisting) {
      await ctx.db.insert("familyMeetings", {
        userId: args.userId,
        weekOf: args.weekOf,
        familyMembers: ["Corinne", "Sebastian", "Kid 1", "Kid 2"],
        acknowledgements: [
          { from: "Corinne", to: "Sebastian", message: "Thanks for handling pickups", createdAt: Date.now() },
          { from: "Kid 1", to: "Kid 2", message: "Thanks for sharing your game", createdAt: Date.now() },
        ],
        supportRequests: [
          { person: "Corinne", request: "Help with Thursday dinner", conflict: false },
          { person: "Kid 1", request: "Need ride to practice Friday", conflict: true },
        ],
        goals: [
          { person: "Sebastian", goal: "3 strength workouts", habitFocus: "Morning routine", completed: false },
          { person: "Corinne", goal: "2 deep-work blocks", habitFocus: "No phone first hour", completed: false },
        ],
        mealPlan: [
          { day: "Monday", meal: "Tacos" },
          { day: "Tuesday", meal: "Pasta" },
        ],
        gameNights: [
          { game: "Uno", winner: "Kid 2", moment: "Crazy reverse chain", date: args.today },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { ok: true };
  },
});

export const clearDemoData = mutation({
  args: {
    userId: v.id("users"),
    weekOf: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete demo family meeting
    const meetings = await ctx.db
      .query("familyMeetings")
      .withIndex("by_user_and_week", (q) => q.eq("userId", args.userId).eq("weekOf", args.weekOf))
      .collect();
    
    for (const meeting of meetings) {
      await ctx.db.delete(meeting._id);
    }

    // Delete demo discussion items
    const discussions = await ctx.db
      .query("discussionQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const disc of discussions) {
      if (disc.addedBy === "Sebastian" || disc.item.includes("Spring break") || disc.item.includes("Wednesday pickups")) {
        await ctx.db.delete(disc._id);
      }
    }

    // Delete demo movies
    const movies = await ctx.db
      .query("movieLibrary")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const movie of movies) {
      if (movie.votes && movie.votes.includes("Sebastian")) {
        await ctx.db.delete(movie._id);
      }
    }

    return { cleared: true };
  },
});

export const fixFamilyMembers = mutation({
  args: {
    weekOf: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all meetings for this week with old family members
    const meetings = await ctx.db
      .query("familyMeetings")
      .filter((q) => q.eq(q.field("weekOf"), args.weekOf))
      .collect();
    
    let fixed = 0;
    for (const meeting of meetings) {
      if (meeting.familyMembers.includes("Sebastian") || 
          meeting.familyMembers.includes("Kid 1") || 
          meeting.familyMembers.includes("Kid 2")) {
        await ctx.db.patch(meeting._id, {
          familyMembers: ["Corinne", "Joey", "Anthony", "Roma"]
        });
        fixed++;
      }
    }
    
    return { fixed, total: meetings.length };
  },
});

export const clearExampleData = mutation({
  args: {
    weekOf: v.string(),
  },
  handler: async (ctx, args) => {
    // Clear all meetings for this week
    const meetings = await ctx.db
      .query("familyMeetings")
      .filter((q) => q.eq(q.field("weekOf"), args.weekOf))
      .collect();
    
    for (const meeting of meetings) {
      await ctx.db.patch(meeting._id, {
        acknowledgements: [],
        supportRequests: [],
        goals: [],
        mealPlan: [],
        gameNights: [],
      });
    }

    // Clear discussion queue
    const discussions = await ctx.db.query("discussionQueue").collect();
    for (const disc of discussions) {
      await ctx.db.delete(disc._id);
    }

    // Clear movie library
    const movies = await ctx.db.query("movieLibrary").collect();
    for (const movie of movies) {
      await ctx.db.delete(movie._id);
    }

    return { cleared: true, meetings: meetings.length };
  },
});
