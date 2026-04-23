import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getConvexHttpClient } from "@/lib/server/convexHttp";
import { api } from "@/convex/_generated/api";


export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const convex = getConvexHttpClient();

  // Make sure user exists in Convex
  let u = await convex.query(api.users.getUserByClerkId, { clerkId });
  if (!u) {
    const cu = await currentUser();
    const email = cu?.emailAddresses?.[0]?.emailAddress || "";
    const name = cu?.fullName || cu?.firstName || "User";
    await convex.mutation(api.users.createUser, { clerkId, email, name });
    u = await convex.query(api.users.getUserByClerkId, { clerkId });
  }

  return NextResponse.json({ clerkId, userId: u?._id || null });
}
