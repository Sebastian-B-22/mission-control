"use client";

import { GatewayBadge } from "@/components/GatewayBadge";
import { ApprovalsInboxDialog } from "@/components/ApprovalsInboxDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Id } from "@/convex/_generated/dataModel";

export function DashboardTopBar(props: {
  userId: Id<"users">;
  onOpenOnboarding: () => void;
  onResetOnboarding: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 px-4 py-3 bg-black/80 backdrop-blur border-b border-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GatewayBadge />
        </div>
        <div className="flex items-center gap-2">
          <SettingsDialog
            userId={props.userId}
            onOpenOnboarding={props.onOpenOnboarding}
            onResetOnboarding={props.onResetOnboarding}
          />
          <ApprovalsInboxDialog />
        </div>
      </div>
    </div>
  );
}
