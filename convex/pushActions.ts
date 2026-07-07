"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import * as webpush from "web-push";

// Send push notification to a specific user
export const sendToUser = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.runQuery(api.push.getSubscriptions, {
      userId: args.userId,
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Configure VAPID
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    webpush.setVapidDetails(
      "mailto:corinne@aspiresoccercoaching.com",
      vapidPublicKey,
      vapidPrivateKey
    );

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url || "/dashboard",
      tag: args.tag || "mission-control",
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub: any) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        return webpush.sendNotification(pushSubscription, payload);
      })
    );

    let sent = 0;
    let failed = 0;
    for (const r of results) {
      if (r.status === "fulfilled") sent++;
      else failed++;
    }

    return { sent, failed };
  },
});

// Send push notification to all subscribers
export const sendToAll = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.runQuery(api.push.getAllSubscriptions, {});

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Configure VAPID
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    webpush.setVapidDetails(
      "mailto:corinne@aspiresoccercoaching.com",
      vapidPublicKey,
      vapidPrivateKey
    );

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url || "/dashboard",
      tag: args.tag || "mission-control",
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub: any) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        return webpush.sendNotification(pushSubscription, payload);
      })
    );

    let sent = 0;
    let failed = 0;
    for (const r of results) {
      if (r.status === "fulfilled") sent++;
      else failed++;
    }

    return { sent, failed };
  },
});
