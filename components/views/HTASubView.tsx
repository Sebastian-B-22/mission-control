"use client";

import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Id } from "@/convex/_generated/dataModel";

interface HTASubViewProps {
  userId: Id<"users">;
  subProject: string;
  title: string;
  description: string;
}

export function HTASubView({ userId, subProject, title, description }: HTASubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>

      <ProjectTaskList
        userId={userId}
        project="hta"
        subProject={subProject}
        title={title}
        description={description}
      />
    </div>
  );
}
