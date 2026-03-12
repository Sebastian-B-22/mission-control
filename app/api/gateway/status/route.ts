import { NextResponse } from "next/server";

/**
 * Gateway status probe.
 *
 * The "gateway" here is the OpenClaw gateway running on the operator host.
 * In production this is typically reachable via Tailscale (tailnet DNS).
 *
 * Configure:
 *   OPENCLAW_GATEWAY_URL=https://<your-host>:<port>
 *
 * Expected gateway endpoint:
 *   GET <OPENCLAW_GATEWAY_URL>/healthz  -> 200 OK
 */
export async function GET() {
  const base = (process.env.OPENCLAW_GATEWAY_URL || "").trim().replace(/\/$/, "");

  if (!base) {
    return NextResponse.json(
      {
        connected: false,
        error: "OPENCLAW_GATEWAY_URL is not set",
      },
      { status: 200 }
    );
  }

  const started = Date.now();
  try {
    const res = await fetch(`${base}/healthz`, {
      method: "GET",
      // Keep this tight to avoid hanging the UI
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    const latencyMs = Date.now() - started;
    if (!res.ok) {
      return NextResponse.json(
        {
          connected: false,
          latencyMs,
          error: `Gateway responded ${res.status}`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ connected: true, latencyMs }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      {
        connected: false,
        latencyMs: Date.now() - started,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 200 }
    );
  }
}
