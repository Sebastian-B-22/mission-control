import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  
  return NextResponse.json({
    clerkUserId: userId,
    email: user?.emailAddresses?.[0]?.emailAddress,
    name: user?.firstName,
    expectedClerkId: process.env.CORINNE_CLERK_ID,
    match: userId === process.env.CORINNE_CLERK_ID,
  });
}
