"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import KidsTypingGame from "@/components/KidsTypingGame";
import Image from "next/image";

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-black to-cyan-950 text-white p-4">
      {/* Ambient aurora + shimmer */}
      <div className="pointer-events-none absolute inset-0 kids-aurora" />
      <div className="pointer-events-none absolute -inset-x-24 top-0 h-24 opacity-20 kids-shimmer" />

      {/* Dragon silhouettes (original assets) */}
      <div className="pointer-events-none absolute left-[-60px] top-[80px] w-[320px] sm:w-[420px] opacity-[0.10] blur-[0.2px] kids-float kids-glow-gold">
        <Image src="/kids/dragon-silhouette-left.svg" alt="" width={700} height={500} />
      </div>
      <div className="pointer-events-none absolute right-[-80px] bottom-[-40px] w-[360px] sm:w-[520px] opacity-[0.10] blur-[0.2px] kids-float kids-glow-indigo">
        <Image src="/kids/dragon-silhouette-right.svg" alt="" width={780} height={520} />
      </div>

      <div className="relative mx-auto max-w-4xl mb-4 flex items-center justify-between gap-4">
        <a className="underline text-sm text-muted-foreground" href="/dashboard">
          ← Back to dashboard
        </a>
        <a className="underline text-sm text-muted-foreground" href="/kids/rewards">
          Rewards vault →
        </a>
      </div>

      <div className="relative">
        <KidsTypingGame userId={convexUser._id} />
      </div>
    </div>
  );
}
