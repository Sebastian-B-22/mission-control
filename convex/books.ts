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

// Read-Aloud Books (currently reading)
export const getReadAloudBooks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("readAloudBooks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter to only "reading" or undefined status (backward compat), sort alphabetically
    return books
      .filter(b => !b.status || b.status === "reading")
      .sort((a, b) => a.title.localeCompare(b.title));
  },
});

// Up Next / Books on Deck
export const getUpNextBooks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("readAloudBooks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter to only "up-next" status, sort alphabetically
    return books
      .filter(b => b.status === "up-next")
      .sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const addReadAloudBook = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    author: v.optional(v.string()),
    status: v.optional(v.union(v.literal("reading"), v.literal("up-next"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("readAloudBooks", {
      userId: args.userId,
      title: args.title,
      author: args.author,
      completed: false,
      status: args.status || "reading",
      createdAt: Date.now(),
    });
  },
});

// Move book from up-next to currently reading
export const moveToReading = mutation({
  args: { id: v.id("readAloudBooks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "reading" });
  },
});

// Move book to up-next
export const moveToUpNext = mutation({
  args: { id: v.id("readAloudBooks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "up-next" });
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
