import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get notes for a date range (for monthly PDF)
export const getNotesForRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("homeschoolAgentNotes")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    return notes
      .filter((n) => n.date >= args.startDate && n.date <= args.endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});

// Get notes by source (e.g., all Math Academy notes)
export const getNotesBySource = query({
  args: {
    source: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("homeschoolAgentNotes")
      .withIndex("by_source", (q) => q.eq("source", args.source))
      .collect();

    if (args.startDate && args.endDate) {
      return notes.filter((n) => n.date >= args.startDate! && n.date <= args.endDate!);
    }
    return notes;
  },
});

// Get notes for a specific student
export const getNotesByStudent = query({
  args: {
    student: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("homeschoolAgentNotes")
      .withIndex("by_student", (q) => q.eq("student", args.student))
      .collect();

    if (args.startDate && args.endDate) {
      return notes.filter((n) => n.date >= args.startDate! && n.date <= args.endDate!);
    }
    return notes;
  },
});

// Add a note (from agent or email parser)
export const addNote = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    source: v.string(),
    student: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.string(),
    highlights: v.optional(v.array(v.string())),
    sentiment: v.optional(v.string()),
    rawEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("homeschoolAgentNotes", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Update a note
export const updateNote = mutation({
  args: {
    noteId: v.id("homeschoolAgentNotes"),
    content: v.optional(v.string()),
    highlights: v.optional(v.array(v.string())),
    sentiment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { noteId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(noteId, filtered);
    }
  },
});

// Delete a note
export const deleteNote = mutation({
  args: { noteId: v.id("homeschoolAgentNotes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.noteId);
  },
});
