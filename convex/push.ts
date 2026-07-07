import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Subscribe to push notifications
export const subscribe = mutation({
  args: {
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        p256dh: args.p256dh,
        auth: args.auth,
        userAgent: args.userAgent,
      });
      return existing._id;
    }

    // Create new subscription
    return await ctx.db.insert("pushSubscriptions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Unsubscribe from push notifications
export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (subscription) {
      await ctx.db.delete(subscription._id);
      return true;
    }
    return false;
  },
});

// Get subscriptions for a user
export const getSubscriptions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get all subscriptions (for sending broadcast notifications)
export const getAllSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pushSubscriptions").collect();
  },
});
