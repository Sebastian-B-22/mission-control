/**
 * Trial Day Registration Functions
 * 
 * Manages free trial day (mini camp) registrations for Aspire Soccer.
 * Data is stored in the campTrialDayRegistrations table.
 */

import { v } from "convex/values";
import { internalQuery, internalMutation, query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Internal Queries (for HTTP actions) ─────────────────────────────────────

/**
 * List all trial day registrations
 */
export const listRegistrations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("campTrialDayRegistrations").collect();
  },
});

/**
 * Get availability counts for trial day sessions
 */
export const getAvailability = internalQuery({
  args: {
    eventDate: v.optional(v.string()),
    programId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let registrations = await ctx.db.query("campTrialDayRegistrations").collect();
    
    // Filter by eventDate if provided
    if (args.eventDate) {
      registrations = registrations.filter(r => r.eventDate === args.eventDate);
    }
    
    // Filter by programId if provided
    if (args.programId) {
      registrations = registrations.filter(r => r.programId === args.programId);
    }
    
    // Only count confirmed registrations
    const confirmed = registrations.filter(r => r.status === "confirmed");
    
    // Group by session
    const sessionCounts: Record<string, number> = {};
    for (const reg of confirmed) {
      const session = reg.session || "Unknown";
      sessionCounts[session] = (sessionCounts[session] || 0) + 1;
    }
    
    // Default sessions with capacity
    const sessions = [
      { session: "Morning Session (9:00 AM - 11:30 AM)", capacity: 40 },
      { session: "Afternoon Session (12:00 PM - 2:30 PM)", capacity: 40 },
    ];
    
    return sessions.map(s => ({
      session: s.session,
      capacity: s.capacity,
      reserved: sessionCounts[s.session] || 0,
      remaining: Math.max(0, s.capacity - (sessionCounts[s.session] || 0)),
      isFull: (sessionCounts[s.session] || 0) >= s.capacity,
    }));
  },
});

// ─── Internal Mutations (for HTTP actions) ───────────────────────────────────

/**
 * Update a trial day registration
 */
export const updateRegistration = internalMutation({
  args: {
    registrationId: v.string(),
    session: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = args.registrationId as Id<"campTrialDayRegistrations">;
    const existing = await ctx.db.get(id);
    
    if (!existing) {
      throw new Error(`Registration not found: ${args.registrationId}`);
    }
    
    const updates: Partial<Doc<"campTrialDayRegistrations">> = {};
    
    if (args.session !== undefined) {
      updates.session = args.session;
    }
    
    if (args.status !== undefined) {
      updates.status = args.status;
    }
    
    await ctx.db.patch(id, updates);
    
    return { 
      success: true, 
      registrationId: args.registrationId,
      updates,
    };
  },
});

/**
 * Create a new trial day registration
 */
export const createRegistration = internalMutation({
  args: {
    programId: v.string(),
    eventDate: v.string(),
    session: v.string(),
    region: v.string(),
    childFirstName: v.string(),
    childLastName: v.string(),
    dateOfBirth: v.optional(v.string()),
    gender: v.string(),
    parentFirstName: v.string(),
    parentLastName: v.string(),
    email: v.string(),
    phone: v.string(),
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    medicalNotes: v.optional(v.string()),
    waiverAccepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("campTrialDayRegistrations", {
      ...args,
      status: "confirmed",
      createdAt: Date.now(),
    });
    
    return { success: true, registrationId: id };
  },
});

// ─── Public Queries ──────────────────────────────────────────────────────────

/**
 * Get trial day availability (public - for registration form)
 */
export const getTrialDayAvailability = query({
  args: {
    eventDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let registrations = await ctx.db.query("campTrialDayRegistrations").collect();
    
    // Default to May 17 if not specified
    const targetDate = args.eventDate || "2026-05-17";
    registrations = registrations.filter(r => r.eventDate === targetDate && r.status === "confirmed");
    
    // Group by session
    const sessionCounts: Record<string, number> = {};
    for (const reg of registrations) {
      const session = reg.session || "Unknown";
      sessionCounts[session] = (sessionCounts[session] || 0) + 1;
    }
    
    // Return availability with 40 capacity per session
    return {
      availability: [
        {
          session: "Morning Session (9:00 AM - 11:30 AM)",
          capacity: 40,
          reserved: sessionCounts["Morning Session (9:00 AM - 11:30 AM)"] || 0,
          remaining: Math.max(0, 40 - (sessionCounts["Morning Session (9:00 AM - 11:30 AM)"] || 0)),
          isFull: (sessionCounts["Morning Session (9:00 AM - 11:30 AM)"] || 0) >= 40,
        },
        {
          session: "Afternoon Session (12:00 PM - 2:30 PM)",
          capacity: 40,
          reserved: sessionCounts["Afternoon Session (12:00 PM - 2:30 PM)"] || 0,
          remaining: Math.max(0, 40 - (sessionCounts["Afternoon Session (12:00 PM - 2:30 PM)"] || 0)),
          isFull: (sessionCounts["Afternoon Session (12:00 PM - 2:30 PM)"] || 0) >= 40,
        },
      ],
    };
  },
});
