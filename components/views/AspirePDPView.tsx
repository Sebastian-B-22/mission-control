"use client";

import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Id } from "@/convex/_generated/dataModel";

interface AspirePDPViewProps {
  userId: Id<"users">;
}

export function AspirePDPView({ userId }: AspirePDPViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">PDP (Player Development Program)</h1>
        <p className="text-muted-foreground mt-1">Winter training program for both regions</p>
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
