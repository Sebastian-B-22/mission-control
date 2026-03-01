"use client";

import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users } from "lucide-react";

interface AspireSpringViewProps {
  userId: Id<"users">;
}

export function AspireSpringView({ userId }: AspireSpringViewProps) {
  const counts = useQuery(api.registrations.getAllCounts) || [];
  const paliCount = counts.find(c => c.program === "spring-pali")?.count || 0;
  const agouraCount = counts.find(c => c.program === "spring-agoura")?.count || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Spring League</h1>
        <p className="text-muted-foreground mt-1">Season planning & registration for both regions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="spring-agoura"
          title="Agoura Spring League"
          description="Region 4 season planning & registration"
          headerExtra={
            <div className="flex items-center gap-1.5 bg-green-900/50 text-green-400 px-2 py-1 rounded-full text-sm font-medium">
              <Users className="w-3.5 h-3.5" />
              {agouraCount} registered
            </div>
          }
        />
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="spring-pali"
          title="Pali Spring League"
          description="Region 69 season planning & registration"
          headerExtra={
            <div className="flex items-center gap-1.5 bg-green-900/50 text-green-400 px-2 py-1 rounded-full text-sm font-medium">
              <Users className="w-3.5 h-3.5" />
              {paliCount} registered
            </div>
          }
        />
      </div>
    </div>
  );
}
