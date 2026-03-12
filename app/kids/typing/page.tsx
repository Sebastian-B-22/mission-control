"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import KidsTypingGame from "@/components/KidsTypingGame";

export default function KidsTypingPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) router.push("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || (isSignedIn && convexUser === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) return null;

  if (!convexUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Setting up user...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mx-auto max-w-4xl mb-4">
        <a className="underline text-sm text-muted-foreground" href="/dashboard">
          ← Back to dashboard
        </a>
      </div>
      <KidsTypingGame userId={convexUser._id} />
    </div>
  );
}
