"use client";

import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users } from "lucide-react";

interface AspirePDPViewProps {
  userId: Id<"users">;
}

export function AspirePDPView({ userId }: AspirePDPViewProps) {
  const counts = useQuery(api.registrations.getAllCounts) || [];
  const pdpCount = counts.find(c => c.program === "pdp")?.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PDP (Player Development Program)</h1>
          <p className="text-muted-foreground mt-1">Winter training program for both regions</p>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-900/50 text-blue-400 px-3 py-1.5 rounded-full text-sm font-medium">
          <Users className="w-4 h-4" />
          {pdpCount} total registered
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="pdp-agoura"
          title="Agoura PDP"
          description="Region 4 winter training program"
        />
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="pdp-pali"
          title="Pali PDP"
          description="Region 69 winter training program"
        />
      </div>
    </div>
  );
}
