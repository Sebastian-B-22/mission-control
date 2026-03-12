import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies a deep security scan via the operator gateway.
 *
 * Expected gateway endpoint:
 *   POST <OPENCLAW_GATEWAY_URL>/ops/security-audit
 * Response: { output: string }
 */
export async function POST(_req: NextRequest) {
  const base = (process.env.OPENCLAW_GATEWAY_URL || "").trim().replace(/\/$/, "");
  if (!base) {
    return NextResponse.json({ error: "OPENCLAW_GATEWAY_URL is not set" }, { status: 400 });
  }

  try {
    const res = await fetch(`${base}/ops/security-audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depth: "deep" }),
      signal: AbortSignal.timeout(5 * 60_000),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `Gateway error (${res.status})`, details: text.slice(0, 4000) },
        { status: 502 }
      );
    }

    try {
      const json = JSON.parse(text);
      const output = typeof json?.output === "string" ? json.output : text;
      return NextResponse.json({ output }, { status: 200 });
    } catch {
      return NextResponse.json({ output: text }, { status: 200 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ endpoint: "/api/gateway/security-audit", method: "POST" });
}
