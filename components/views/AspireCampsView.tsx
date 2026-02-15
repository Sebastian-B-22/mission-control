"use client";

import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Id } from "@/convex/_generated/dataModel";

interface AspireCampsViewProps {
  userId: Id<"users">;
}

export function AspireCampsView({ userId }: AspireCampsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Camps</h1>
        <p className="text-muted-foreground mt-1">Camp planning & execution for both regions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="camps-agoura"
          title="Agoura Camps"
          description="Region 4 camp planning & execution"
        />
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="camps-pali"
          title="Pali Camps"
          description="Region 69 camp planning & execution"
        />
      </div>
    </div>
  );
}
