"use client";

import { GatewayBadge } from "@/components/GatewayBadge";
import { ApprovalsInboxDialog } from "@/components/ApprovalsInboxDialog";

export function DashboardTopBar() {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 px-4 py-3 bg-black/80 backdrop-blur border-b border-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GatewayBadge />
        </div>
        <div className="flex items-center gap-2">
          <ApprovalsInboxDialog />
        </div>
      </div>
    </div>
  );
}
