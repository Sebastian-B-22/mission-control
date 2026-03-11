import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type Body = {
  text?: string;
  topic?: string;
  accountId?: string;
  requestedBy?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const text = (body.text || "").trim();
    const topic = (body.topic || "general").trim();

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const id = await convex.mutation(api.telegramOutbox.enqueue, {
      text,
      topic,
      accountId: body.accountId,
      requestedBy: body.requestedBy,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Agent HQ send error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/agent-hq/send",
    method: "POST",
    body: { text: "Hello", topic: "operations" },
  });
}
