import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

// ─── Public Queries ────────────────────────────────────────────────────────

export const getSebastianTasks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("sebastianTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Get tasks filtered by assignee - for both UI and agent consumption */
export const getActiveTasks = query({
  args: {
    userId: v.id("users"),
    assignedTo: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("sebastianTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.assignedTo) {
      tasks = tasks.filter((t) => t.assignedTo === args.assignedTo);
    }
    if (args.status) {
      tasks = tasks.filter((t) => t.status === args.status);
    }

    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ─── Public Mutations (UI) ─────────────────────────────────────────────────

export const createSebastianTask = mutation({
  args: {
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
    category: v.string(),
    assignedTo: v.optional(v.string()),
    agentNotes: v.optional(v.string()),
    lastUpdatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("sebastianTasks", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      category: args.category,
      assignedTo: args.assignedTo,
      agentNotes: args.agentNotes,
      lastUpdatedBy: args.lastUpdatedBy ?? "corinne",
      createdAt: Date.now(),
    });

    return taskId;
  },
});

export const updateSebastianTask = mutation({
  args: {
    id: v.id("sebastianTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("backlog"),
        v.literal("todo"),
        v.literal("in-progress"),
        v.literal("done")
      )
    ),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    category: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    agentNotes: v.optional(v.string()),
    lastUpdatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const task = await ctx.db.get(id);

    if (!task) {
      throw new Error("Task not found");
    }

    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === "done" && !task.completedAt) {
        updateData.completedAt = Date.now();
      } else if (updates.status !== "done" && task.completedAt) {
        updateData.completedAt = undefined;
      }
    }
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.assignedTo !== undefined) updateData.assignedTo = updates.assignedTo;
    if (updates.agentNotes !== undefined) updateData.agentNotes = updates.agentNotes;
    if (updates.lastUpdatedBy !== undefined) updateData.lastUpdatedBy = updates.lastUpdatedBy;

    await ctx.db.patch(id, updateData);
  },
});

export const deleteSebastianTask = mutation({
  args: {
    id: v.id("sebastianTasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ─── Agent-Facing Mutations (called via HTTP or CLI) ──────────────────────

/** Create a task - agents call this via HTTP endpoint */
export const createTask = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    category: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    agentNotes: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done")
    )),
    lastUpdatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("sebastianTasks", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      status: args.status ?? "todo",
      priority: args.priority ?? "medium",
      category: args.category ?? "agent-squad",
      assignedTo: args.assignedTo,
      agentNotes: args.agentNotes,
      lastUpdatedBy: args.lastUpdatedBy ?? "sebastian",
      createdAt: Date.now(),
    });
    return taskId;
  },
});

/** Update a task's status - agents use this to move tasks through the board */
export const updateTaskStatus = mutation({
  args: {
    id: v.id("sebastianTasks"),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done")
    ),
    agentNotes: v.optional(v.string()),
    lastUpdatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    const updateData: Record<string, unknown> = {
      status: args.status,
      lastUpdatedBy: args.lastUpdatedBy ?? "sebastian",
    };

    if (args.status === "done" && !task.completedAt) {
      updateData.completedAt = Date.now();
    } else if (args.status !== "done") {
      updateData.completedAt = undefined;
    }

    if (args.agentNotes !== undefined) {
      updateData.agentNotes = args.agentNotes;
    }

    await ctx.db.patch(args.id, updateData);
    return { success: true };
  },
});

/** Add/update an agent note on a task - for progress updates */
export const addAgentNote = mutation({
  args: {
    id: v.id("sebastianTasks"),
    note: v.string(),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.id, {
      agentNotes: args.note,
      lastUpdatedBy: args.updatedBy ?? "sebastian",
    });
    return { success: true };
  },
});

// ─── Internal versions (called from HTTP actions) ─────────────────────────

export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const createTaskInternal = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    category: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    agentNotes: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done")
    )),
    lastUpdatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sebastianTasks", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      status: args.status ?? "todo",
      priority: args.priority ?? "medium",
      category: args.category ?? "agent-squad",
      assignedTo: args.assignedTo,
      agentNotes: args.agentNotes,
      lastUpdatedBy: args.lastUpdatedBy ?? "sebastian",
      createdAt: Date.now(),
    });
  },
});

export const updateTaskStatusInternal = internalMutation({
  args: {
    id: v.id("sebastianTasks"),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done")
    ),
    agentNotes: v.optional(v.string()),
    lastUpdatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found: " + args.id);

    const updateData: Record<string, unknown> = {
      status: args.status,
      lastUpdatedBy: args.lastUpdatedBy ?? "sebastian",
    };
    if (args.status === "done" && !task.completedAt) {
      updateData.completedAt = Date.now();
    } else if (args.status !== "done") {
      updateData.completedAt = undefined;
    }
    if (args.agentNotes !== undefined) updateData.agentNotes = args.agentNotes;

    await ctx.db.patch(args.id, updateData);
    return { success: true };
  },
});

export const addAgentNoteInternal = internalMutation({
  args: {
    id: v.id("sebastianTasks"),
    note: v.string(),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found: " + args.id);
    await ctx.db.patch(args.id, {
      agentNotes: args.note,
      lastUpdatedBy: args.updatedBy ?? "sebastian",
    });
    return { success: true };
  },
});

export const getActiveTasksInternal = internalQuery({
  args: {
    userId: v.id("users"),
    assignedTo: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("sebastianTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.assignedTo) tasks = tasks.filter((t) => t.assignedTo === args.assignedTo);
    if (args.status) tasks = tasks.filter((t) => t.status === args.status);

    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  },
});
