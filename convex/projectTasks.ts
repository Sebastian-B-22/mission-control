import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTask = mutation({
  args: {
    userId: v.id("users"),
    project: v.union(v.literal("hta"), v.literal("aspire"), v.literal("homeschool")),
    subProject: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    assignedToId: v.optional(v.id("teamMembers")),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("done")
      )
    ),
    dueDate: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projectTasks", {
      userId: args.userId,
      project: args.project,
      subProject: args.subProject,
      title: args.title,
      description: args.description,
      assignedToId: args.assignedToId,
      status: args.status || "todo",
      dueDate: args.dueDate,
      priority: args.priority || "medium",
      order: args.order,
      createdAt: Date.now(),
    });
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("projectTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assignedToId: v.optional(v.id("teamMembers")),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("done")
      )
    ),
    dueDate: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, status, ...updates } = args;
    
    const updateData: Record<string, unknown> = { ...updates };
    
    if (status !== undefined) {
      updateData.status = status;
      if (status === "done") {
        updateData.completedAt = Date.now();
      } else {
        updateData.completedAt = undefined;
      }
    }
    
    await ctx.db.patch(id, updateData);
  },
});

export const deleteTask = mutation({
  args: { id: v.id("projectTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getTasksByProject = query({
  args: {
    userId: v.id("users"),
    project: v.union(v.literal("hta"), v.literal("aspire"), v.literal("homeschool")),
    subProject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("project"), args.project))
      .collect();

    if (args.subProject) {
      tasks = tasks.filter((task) => task.subProject === args.subProject);
    }

    // Get assigned team member data for each task
    const tasksWithAssignees = await Promise.all(
      tasks.map(async (task) => {
        if (task.assignedToId) {
          const assignedTo = await ctx.db.get(task.assignedToId);
          return {
            ...task,
            assignedTo,
          };
        }
        return {
          ...task,
          assignedTo: null,
        };
      })
    );

    return tasksWithAssignees.sort((a, b) => a.order - b.order);
  },
});

export const getTasksByAssignee = query({
  args: {
    assignedToId: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projectTasks")
      .withIndex("by_assignedTo", (q) => q.eq("assignedToId", args.assignedToId))
      .filter((q) => q.neq(q.field("status"), "done"))
      .collect();
  },
});

export const getOpenTasks = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("status"), "done"))
      .collect();

    const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const statusRank: Record<string, number> = { in_progress: 0, todo: 1 };

    return tasks
      .sort((a, b) => {
        const statusDelta = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
        if (statusDelta !== 0) return statusDelta;

        const priorityDelta = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
        if (priorityDelta !== 0) return priorityDelta;

        const aDue = a.dueDate ?? "9999-12-31";
        const bDue = b.dueDate ?? "9999-12-31";
        if (aDue !== bDue) return aDue.localeCompare(bDue);

        return a.order - b.order;
      })
      .slice(0, limit);
  },
});
