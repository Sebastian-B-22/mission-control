"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { FamilyMeetingDashboard } from "@/components/FamilyMeetingDashboard";

export default function FamilyMeetingPage() {
  const { user } = useUser();

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    if (user && convexUser === null) {
      createUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || user.firstName || "User",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, convexUser]);

  if (!convexUser) {
    return <div className="container mx-auto py-10 px-4">Loading Family Meeting dashboard...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <FamilyMeetingDashboard userId={convexUser._id} />
    </div>
  );
}
