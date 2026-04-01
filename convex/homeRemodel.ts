import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ===== ROOMS =====

export const getRooms = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("homeRemodelRooms")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return rooms.sort((a, b) => a.order - b.order);
  },
});

export const createRoom = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("homeRemodelRooms")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), -1);
    
    return await ctx.db.insert("homeRemodelRooms", {
      userId: args.userId,
      name: args.name,
      order: maxOrder + 1,
      status: "not-started",
      priority: args.priority || "must-have",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateRoom = mutation({
  args: {
    roomId: v.id("homeRemodelRooms"),
    name: v.optional(v.string()),
    currentState: v.optional(v.string()),
    vision: v.optional(v.string()),
    budgetEstimate: v.optional(v.number()),
    budgetActual: v.optional(v.number()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { roomId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(roomId, { ...filtered, updatedAt: Date.now() });
  },
});

export const deleteRoom = mutation({
  args: { roomId: v.id("homeRemodelRooms") },
  handler: async (ctx, args) => {
    // Delete associated tasks and ideas
    const tasks = await ctx.db
      .query("homeRemodelTasks")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    for (const t of tasks) await ctx.db.delete(t._id);
    
    const ideas = await ctx.db
      .query("homeRemodelIdeas")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    for (const i of ideas) await ctx.db.delete(i._id);
    
    await ctx.db.delete(args.roomId);
  },
});

// ===== TASKS =====

export const getTasks = query({
  args: { roomId: v.id("homeRemodelRooms") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("homeRemodelTasks")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    return tasks.sort((a, b) => a.order - b.order);
  },
});

export const getAllTasks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("homeRemodelTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createTask = mutation({
  args: {
    userId: v.id("users"),
    roomId: v.id("homeRemodelRooms"),
    title: v.string(),
    description: v.optional(v.string()),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    priority: v.optional(v.string()),
    estimatedCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("homeRemodelTasks")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const maxOrder = existing.reduce((m, t) => Math.max(m, t.order), -1);
    
    return await ctx.db.insert("homeRemodelTasks", {
      userId: args.userId,
      roomId: args.roomId,
      title: args.title,
      description: args.description,
      status: "idea",
      assignee: args.assignee,
      dueDate: args.dueDate,
      priority: args.priority || "medium",
      estimatedCost: args.estimatedCost,
      order: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("homeRemodelTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    priority: v.optional(v.string()),
    estimatedCost: v.optional(v.number()),
    actualCost: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(taskId, { ...filtered, updatedAt: Date.now() });
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("homeRemodelTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});

// ===== IDEAS =====

export const getIdeas = query({
  args: { userId: v.id("users"), roomId: v.optional(v.id("homeRemodelRooms")) },
  handler: async (ctx, args) => {
    if (args.roomId) {
      return await ctx.db
        .query("homeRemodelIdeas")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();
    }
    return await ctx.db
      .query("homeRemodelIdeas")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createIdea = mutation({
  args: {
    userId: v.id("users"),
    roomId: v.optional(v.id("homeRemodelRooms")),
    content: v.string(),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("homeRemodelIdeas", {
      userId: args.userId,
      roomId: args.roomId,
      content: args.content,
      category: args.category,
      priority: args.priority || "nice-to-have",
      sourceUrl: args.sourceUrl,
      promoted: false,
      createdAt: Date.now(),
    });
  },
});

export const promoteIdeaToTask = mutation({
  args: { ideaId: v.id("homeRemodelIdeas"), roomId: v.id("homeRemodelRooms") },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) return null;
    
    const existing = await ctx.db
      .query("homeRemodelTasks")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const maxOrder = existing.reduce((m, t) => Math.max(m, t.order), -1);
    
    const taskId = await ctx.db.insert("homeRemodelTasks", {
      userId: idea.userId,
      roomId: args.roomId,
      title: idea.content,
      status: "planned",
      priority: idea.priority === "must-have" ? "high" : idea.priority === "dream" ? "low" : "medium",
      order: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    await ctx.db.patch(args.ideaId, { promoted: true });
    return taskId;
  },
});

export const deleteIdea = mutation({
  args: { ideaId: v.id("homeRemodelIdeas") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.ideaId);
  },
});

// ===== MILESTONES =====

export const getMilestones = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const milestones = await ctx.db
      .query("homeRemodelMilestones")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return milestones.sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  },
});

export const createMilestone = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    targetDate: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("homeRemodelMilestones")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    return await ctx.db.insert("homeRemodelMilestones", {
      userId: args.userId,
      title: args.title,
      targetDate: args.targetDate,
      description: args.description,
      completed: false,
      order: existing.length,
      createdAt: Date.now(),
    });
  },
});

export const toggleMilestone = mutation({
  args: { milestoneId: v.id("homeRemodelMilestones"), completed: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.milestoneId, {
      completed: args.completed,
      completedAt: args.completed ? Date.now() : undefined,
    });
  },
});

export const deleteMilestone = mutation({
  args: { milestoneId: v.id("homeRemodelMilestones") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.milestoneId);
  },
});

// ===== STATS =====

export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("homeRemodelRooms")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const tasks = await ctx.db
      .query("homeRemodelTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const ideas = await ctx.db
      .query("homeRemodelIdeas")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const milestones = await ctx.db
      .query("homeRemodelMilestones")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const totalBudget = rooms.reduce((s, r) => s + (r.budgetEstimate || 0), 0);
    const totalSpent = rooms.reduce((s, r) => s + (r.budgetActual || 0), 0) +
                       tasks.reduce((s, t) => s + (t.actualCost || 0), 0);
    
    return {
      roomsTotal: rooms.length,
      roomsComplete: rooms.filter(r => r.status === "done").length,
      tasksTotal: tasks.length,
      tasksByStatus: {
        idea: tasks.filter(t => t.status === "idea").length,
        planned: tasks.filter(t => t.status === "planned").length,
        inProgress: tasks.filter(t => t.status === "in-progress").length,
        done: tasks.filter(t => t.status === "done").length,
      },
      ideasTotal: ideas.length,
      ideasPromoted: ideas.filter(i => i.promoted).length,
      milestonesTotal: milestones.length,
      milestonesComplete: milestones.filter(m => m.completed).length,
      totalBudget,
      totalSpent,
    };
  },
});

// ===== SEED =====

export const seedRooms = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rooms = [
      "Kitchen",
      "Master Bedroom",
      "Master Bath",
      "Roma's Bedroom",
      "Anthony's Bedroom",
      "Office",
      "Game Room",
      "Bathroom",
      "Gym",
      "Living Room",
    ];
    
    for (let i = 0; i < rooms.length; i++) {
      await ctx.db.insert("homeRemodelRooms", {
        userId: args.userId,
        name: rooms[i],
        order: i,
        status: "not-started",
        priority: "must-have",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Add default milestones
    const milestones = [
      { title: "Initial walkthrough & assessment", targetDate: "2026-04-15" },
      { title: "Finalize room plans", targetDate: "2026-06-01" },
      { title: "Contractor quotes received", targetDate: "2026-07-01" },
      { title: "Major work begins", targetDate: "2026-09-01" },
      { title: "Final walkthrough before move", targetDate: "2026-12-15" },
      { title: "Move-in day!", targetDate: "2027-01-15" },
    ];
    
    for (let i = 0; i < milestones.length; i++) {
      await ctx.db.insert("homeRemodelMilestones", {
        userId: args.userId,
        title: milestones[i].title,
        targetDate: milestones[i].targetDate,
        completed: false,
        order: i,
        createdAt: Date.now(),
      });
    }
    
    return { rooms: rooms.length, milestones: milestones.length };
  },
});
