"use client";

import { useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Id } from "@/convex/_generated/dataModel";
import { Bell, BellOff, X } from "lucide-react";

interface PushNotificationBannerProps {
  userId: Id<"users">;
}

export function PushNotificationBanner({ userId }: PushNotificationBannerProps) {
  const { isSupported, permission, isSubscribed, isLoading, enable, disable } =
    usePushNotifications(userId);

  // Avoid showing the banner for a split-second on every load by reading
  // localStorage synchronously (this is a client component).
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return false;
      return window.localStorage.getItem("push-banner-dismissed") === "true";
    } catch {
      return false;
    }
  });

  // Don't show if not supported, already subscribed, denied, or dismissed
  if (!isSupported || isSubscribed || permission === "denied" || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("push-banner-dismissed", "true");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-amber-900 text-sm">
              Enable Notifications
            </h3>
            <p className="text-amber-700 text-xs mt-1">
              Get alerts when agents need your attention or complete tasks.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={enable}
                disabled={isLoading}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 disabled:opacity-50"
              >
                {isLoading ? "Enabling..." : "Enable"}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-amber-600 text-xs font-medium hover:text-amber-800"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-amber-400 hover:text-amber-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple toggle button for settings
export function PushNotificationToggle({ userId }: PushNotificationBannerProps) {
  const { isSupported, permission, isSubscribed, isLoading, enable, disable } =
    usePushNotifications(userId);

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">
        Push notifications are not supported on this device.
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="text-sm text-red-500">
        Notifications are blocked. Enable them in your browser settings.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={isSubscribed ? disable : enable}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
          isSubscribed
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-amber-600 text-white hover:bg-amber-700"
        } disabled:opacity-50`}
      >
        {isSubscribed ? (
          <>
            <BellOff className="w-4 h-4" />
            {isLoading ? "Disabling..." : "Disable Notifications"}
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            {isLoading ? "Enabling..." : "Enable Notifications"}
          </>
        )}
      </button>
      {isSubscribed && (
        <span className="text-sm text-green-600">✓ Notifications enabled</span>
      )}
    </div>
  );
}
