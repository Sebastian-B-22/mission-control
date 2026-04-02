import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  const userId = "kx77km204g5c9m51b0280eegh1821dne"; // Corinne's user ID
  
  try {
    const monthStats = await convex.query(api.health.getMonthStats, { 
      userId: userId as any 
    });
    
    const todayHealth = await convex.query(api.health.getTodayHealth, {
      userId: userId as any
    });
    
    return NextResponse.json({
      success: true,
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
      userId,
      monthStats,
      todayHealth,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
      error: error.message,
    }, { status: 500 });
  }
}
