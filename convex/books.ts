import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Book Library
export const getBookLibrary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("bookLibrary")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Sort alphabetically by title
    return books.sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const addBookToLibrary = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    author: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bookLibrary", {
      userId: args.userId,
      title: args.title,
      author: args.author,
      category: args.category,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const toggleBookRead = mutation({
  args: {
    id: v.id("bookLibrary"),
    read: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { read: args.read });
  },
});

export const deleteBookFromLibrary = mutation({
  args: { id: v.id("bookLibrary") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Read-Aloud Books
export const getReadAloudBooks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("readAloudBooks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Sort alphabetically by title
    return books.sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const addReadAloudBook = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    author: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("readAloudBooks", {
      userId: args.userId,
      title: args.title,
      author: args.author,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

export const toggleReadAloudCompleted = mutation({
  args: {
    id: v.id("readAloudBooks"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { completed: args.completed });
  },
});

export const deleteReadAloudBook = mutation({
  args: { id: v.id("readAloudBooks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
