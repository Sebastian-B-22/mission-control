"use client";

import { Badge } from "@/components/ui/badge";
import { useGatewayStatus } from "@/hooks/useGatewayStatus";

export function GatewayBadge() {
  const gw = useGatewayStatus({ pollMs: 10_000 });

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Gateway</span>
      <Badge
        variant={gw.connected ? "secondary" : "destructive"}
        className={gw.connected ? "bg-green-500/15 text-green-400 border-green-500/30" : ""}
        title={gw.error ? `Last error: ${gw.error}` : gw.latencyMs ? `Latency: ${gw.latencyMs}ms` : undefined}
      >
        {gw.connected ? "Connected" : "Disconnected"}
      </Badge>
    </div>
  );
}
