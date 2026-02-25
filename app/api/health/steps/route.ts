import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { steps, userId, date } = body;

    if (!steps || !userId) {
      return NextResponse.json(
        { error: "Missing steps or userId" },
        { status: 400 }
      );
    }

    // Update or create today's health record with steps
    const targetDate = date || new Date().toISOString().split("T")[0];
    
    await convex.mutation(api.health.updateSteps, {
      clerkId: userId,
      date: targetDate,
      steps: Number(steps),
    });

    return NextResponse.json({ 
      success: true, 
      message: `Logged ${steps} steps for ${targetDate}` 
    });
  } catch (error) {
    console.error("Error logging steps:", error);
    return NextResponse.json(
      { error: "Failed to log steps" },
      { status: 500 }
    );
  }
}

// Also support GET for testing
export async function GET() {
  return NextResponse.json({ 
    status: "ok",
    usage: "POST with { steps: number, userId: string, date?: string }"
  });
}
