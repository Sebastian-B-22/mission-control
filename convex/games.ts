import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Game Library
export const getGameLibrary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query("gameLibrary")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Sort alphabetically by title
    return games.sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const addGameToLibrary = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    publisher: v.optional(v.string()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    minPlayers: v.optional(v.number()),
    maxPlayers: v.optional(v.number()),
    ageRange: v.optional(v.string()),
    playTime: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("own"),
      v.literal("want"),
      v.literal("borrowed")
    )),
    favorite: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gameLibrary", {
      userId: args.userId,
      title: args.title,
      publisher: args.publisher,
      category: args.category,
      imageUrl: args.imageUrl,
      minPlayers: args.minPlayers,
      maxPlayers: args.maxPlayers,
      ageRange: args.ageRange,
      playTime: args.playTime,
      status: args.status || "own",
      favorite: args.favorite || false,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

export const updateGameImage = mutation({
  args: {
    id: v.id("gameLibrary"),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { imageUrl: args.imageUrl });
  },
});

export const updateGameStatus = mutation({
  args: {
    id: v.id("gameLibrary"),
    status: v.union(
      v.literal("own"),
      v.literal("want"),
      v.literal("borrowed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const toggleGameFavorite = mutation({
  args: {
    id: v.id("gameLibrary"),
    favorite: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { favorite: args.favorite });
  },
});

export const markGamePlayed = mutation({
  args: {
    id: v.id("gameLibrary"),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    await ctx.db.patch(args.id, { lastPlayed: today });
  },
});

export const deleteGameFromLibrary = mutation({
  args: { id: v.id("gameLibrary") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateGame = mutation({
  args: {
    id: v.id("gameLibrary"),
    title: v.optional(v.string()),
    publisher: v.optional(v.string()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    minPlayers: v.optional(v.number()),
    maxPlayers: v.optional(v.number()),
    ageRange: v.optional(v.string()),
    playTime: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleanUpdates);
  },
});
