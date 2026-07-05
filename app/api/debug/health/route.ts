import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    return NextResponse.json({
      success: false,
      error: "NEXT_PUBLIC_CONVEX_URL not set",
    });
  }
  
  const convex = new ConvexHttpClient(convexUrl);
  
  try {
    // First get all users to find Corinne's actual ID
    const users = await convex.query(api.admin.getAllUsers, {});
    
    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        convexUrl,
        error: "No users found in database",
        users: [],
      });
    }
    
    const corinne = users.find((u: any) => u.email === "corinne@aspiresoccercoaching.com");
    
    if (!corinne) {
      return NextResponse.json({
        success: false,
        convexUrl,
        error: "Corinne user not found",
        users: users.map((u: any) => ({ email: u.email, id: u._id })),
      });
    }
    
    const monthStats = await convex.query(api.health.getMonthStats, { 
      userId: corinne._id
    });
    
    const todayHealth = await convex.query(api.health.getTodayHealth, {
      userId: corinne._id
    });
    
    return NextResponse.json({
      success: true,
      convexUrl,
      userId: corinne._id,
      userEmail: corinne.email,
      monthStats,
      todayHealth,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      convexUrl,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
