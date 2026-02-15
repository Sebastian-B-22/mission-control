"use client";

import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Id } from "@/convex/_generated/dataModel";

interface Aspire7v7ViewProps {
  userId: Id<"users">;
}

export function Aspire7v7View({ userId }: Aspire7v7ViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">7v7 Tournaments</h1>
        <p className="text-muted-foreground mt-1">Tournament organization for both regions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="7v7-agoura"
          title="Agoura 7v7 Tournaments"
          description="Region 4 tournament organization"
        />
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="7v7-pali"
          title="Pali 7v7 Tournaments"
          description="Region 69 tournament organization"
        />
      </div>
    </div>
  );
}
