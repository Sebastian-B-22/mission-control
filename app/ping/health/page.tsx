"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export default function HealthPing() {
  const { user, isLoaded: clerkLoaded } = useUser();
  
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const monthStats = useQuery(
    api.health.getMonthStats,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  return (
    <div style={{ padding: 20, fontFamily: "monospace", background: "#111", color: "#fff", minHeight: "100vh" }}>
      <h1>Health Debug</h1>
      
      <h2>1. Clerk</h2>
      <pre>
        loaded: {String(clerkLoaded)}{"\n"}
        user.id: {user?.id || "null"}{"\n"}
        email: {user?.emailAddresses?.[0]?.emailAddress || "null"}
      </pre>
      
      <h2>2. Convex User</h2>
      <pre>{JSON.stringify(convexUser, null, 2)}</pre>
      
      <h2>3. Month Stats</h2>
      <pre>{JSON.stringify(monthStats, null, 2)}</pre>
    </div>
  );
}
