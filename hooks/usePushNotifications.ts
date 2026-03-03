"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getSubscriptionDetails,
} from "@/lib/push-notifications";

export function usePushNotifications(userId: Id<"users"> | null) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const subscribe = useMutation(api.push.subscribe);
  const unsubscribe = useMutation(api.push.unsubscribe);
  const subscriptions = useQuery(
    api.push.getSubscriptions,
    userId ? { userId } : "skip"
  );

  // Check support and current state on mount
  useEffect(() => {
    setIsSupported(isPushSupported());
    setPermission(getNotificationPermission());

    // Check if already subscribed
    if (isPushSupported()) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      });
    }
  }, []);

  // Enable push notifications
  const enable = useCallback(async () => {
    if (!userId || !isSupported) return false;

    setIsLoading(true);
    try {
      // Request permission
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== "granted") {
        return false;
      }

      // Subscribe to push
      const subscription = await subscribeToPush();
      if (!subscription) {
        return false;
      }

      // Get subscription details
      const details = getSubscriptionDetails(subscription);
      if (!details) {
        return false;
      }

      // Save to database
      await subscribe({
        userId,
        endpoint: details.endpoint,
        p256dh: details.p256dh,
        auth: details.auth,
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSupported, subscribe]);

  // Disable push notifications
  const disable = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get current subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await unsubscribeFromPush();

        // Remove from database
        await unsubscribe({ endpoint: subscription.endpoint });
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error("Failed to disable push notifications:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [unsubscribe]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    enable,
    disable,
    subscriptions,
  };
}
