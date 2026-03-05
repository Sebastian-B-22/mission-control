import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type Body = {
  userId: string;
  startMs: number;
  endMs: number;
  events: Array<{
    source: string;
    account: string;
    calendarId: string;
    externalId?: string;
    title: string;
    location?: string;
    startMs: number;
    endMs: number;
    allDay: boolean;
  }>;
};

/**
 * POST /api/calendar/update
 *
 * Push calendar events (merged accounts) from a local sync script into Convex.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    if (!body.userId || typeof body.userId !== "string") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (typeof body.startMs !== "number" || typeof body.endMs !== "number") {
      return NextResponse.json({ error: "Missing startMs/endMs" }, { status: 400 });
    }
    if (!Array.isArray(body.events)) {
      return NextResponse.json({ error: "Missing events[]" }, { status: 400 });
    }

    const result = await convex.mutation(api.calendarEvents.syncRange, {
      userId: body.userId as any,
      startMs: body.startMs,
      endMs: body.endMs,
      events: body.events,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error syncing calendar events:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/calendar/update",
    method: "POST",
    description: "Push merged calendar events into Convex (weekly view).",
  });
}
