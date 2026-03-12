"use client";

import { useEffect, useMemo, useState } from "react";

export type GatewayStatus = {
  connected: boolean;
  checkedAt: number;
  latencyMs?: number;
  error?: string;
};

export function useGatewayStatus(opts?: { pollMs?: number }) {
  const pollMs = opts?.pollMs ?? 10_000;
  const [status, setStatus] = useState<GatewayStatus>({
    connected: false,
    checkedAt: 0,
  });

  useEffect(() => {
    let cancelled = false;
    let t: any;

    async function tick() {
      const start = Date.now();
      try {
        const res = await fetch("/api/gateway/status", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || `Gateway status failed (${res.status})`);
        }

        if (!cancelled) {
          setStatus({
            connected: Boolean(data?.connected),
            checkedAt: Date.now(),
            latencyMs: typeof data?.latencyMs === "number" ? data.latencyMs : Date.now() - start,
            error: data?.error ? String(data.error) : undefined,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setStatus({
            connected: false,
            checkedAt: Date.now(),
            latencyMs: Date.now() - start,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      } finally {
        if (!cancelled) t = setTimeout(tick, pollMs);
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, [pollMs]);

  const label = useMemo(() => (status.connected ? "Connected" : "Disconnected"), [status.connected]);

  return { ...status, label };
}
