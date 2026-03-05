import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const logLine = {
      at: new Date().toISOString(),
      ...body,
    };

    const logPath = path.join(process.cwd(), "client-errors.log");
    fs.appendFileSync(logPath, JSON.stringify(logLine) + "\n", "utf8");

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
