"use client";

import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users } from "lucide-react";
import { RosterAssignmentQueue } from "@/components/RosterAssignmentQueue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WorkSurfacePageHeader, WorkSurfaceStatCard } from "@/components/work-surface";

interface AspirePDPViewProps {
  userId: Id<"users">;
}

export function AspirePDPView({ userId }: AspirePDPViewProps) {
  const counts = useQuery(api.registrations.getAllCounts) || [];
  const pdpCount = counts.find((c: any) => c.program === "pdp")?.count || 0;
  const agouraTasks = useQuery(api.projectTasks.getTasksByProject, {
    userId,
    project: "aspire",
    subProject: "pdp-agoura",
  }) || [];
  const paliTasks = useQuery(api.projectTasks.getTasksByProject, {
    userId,
    project: "aspire",
    subProject: "pdp-pali",
  }) || [];
  const openAgouraTasks = agouraTasks.filter((task: any) => task.status !== "done").length;
  const openPaliTasks = paliTasks.filter((task: any) => task.status !== "done").length;

  return (
    <div className="space-y-6">
      <WorkSurfacePageHeader
        title="PDP"
        description="Winter training roster operations for both regions."
        action={(
          <Badge variant="info" className="gap-1.5 px-3 py-1.5 text-sm">
            <Users className="h-4 w-4" />
            {pdpCount} total registered
          </Badge>
        )}
      />

      <Card className="border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 shadow-[0_0_40px_rgba(56,189,248,0.05)]">
        <CardContent className="p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <WorkSurfaceStatCard
              label="PDP registrations"
              value={pdpCount}
              description="All PDP players"
              tone="info"
              size="compact"
              className="border-cyan-400/35 bg-gradient-to-br from-cyan-500/28 via-sky-500/14 to-slate-950"
            />
            <WorkSurfaceStatCard
              label="Agoura follow-up"
              value={openAgouraTasks}
              description="Open ops tasks"
              tone="danger"
              size="compact"
              className="border-rose-400/35 bg-gradient-to-br from-rose-500/28 via-red-500/12 to-slate-950"
            />
            <WorkSurfaceStatCard
              label="Pali follow-up"
              value={openPaliTasks}
              description="Open ops tasks"
              tone="warning"
              size="compact"
              className="border-amber-400/35 bg-gradient-to-br from-amber-500/28 via-orange-500/12 to-slate-950"
            />
          </div>
        </CardContent>
      </Card>

      <RosterAssignmentQueue
        program="pdp"
        eyebrow="PDP roster operations"
        title="PDP assignment queue"
        description="Paid PDP players land here before Coach Hub groups are finalized."
      />

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
