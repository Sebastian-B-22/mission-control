import { auth } from "@clerk/nextjs/server";
import { getConvexHttpClient } from "@/lib/server/convexHttp";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";


export async function GET() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const convex = getConvexHttpClient();

  // Step 1: Get user by Clerk ID
  const user = await convex.query(api.users.getUserByClerkId, { clerkId });
  
  if (!user) {
    return NextResponse.json({ 
      error: "User not found",
      clerkId,
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
    }, { status: 404 });
  }

  // Step 2: Get health stats
  const healthStats = await convex.query(api.health.getMonthStats, { userId: user._id });

  return NextResponse.json({
    clerkId,
    userId: user._id,
    email: user.email,
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
    healthStats,
  });
}
