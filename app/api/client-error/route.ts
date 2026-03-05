import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Log to serverless logs (Vercel)
    console.error("CLIENT_ERROR", {
      at: new Date().toISOString(),
      ...body,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("CLIENT_ERROR_LOGGING_FAILED", e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
