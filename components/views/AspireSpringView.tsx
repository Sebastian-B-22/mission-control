"use client";

import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Id } from "@/convex/_generated/dataModel";

interface AspireSpringViewProps {
  userId: Id<"users">;
}

export function AspireSpringView({ userId }: AspireSpringViewProps) {
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
        />
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="spring-pali"
          title="Pali Spring League"
          description="Region 69 season planning & registration"
        />
      </div>
    </div>
  );
}
