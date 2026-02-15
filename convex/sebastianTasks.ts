import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("sebastianTasks", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      category: args.category,
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
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const task = await ctx.db.get(id);
    
    if (!task) {
      throw new Error("Task not found");
    }

    const updateData: any = {};
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
