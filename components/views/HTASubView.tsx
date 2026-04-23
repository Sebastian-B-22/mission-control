"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";

interface HTASubViewProps {
  userId: Id<"users">;
  subProject: string;
  title: string;
  description: string;
}

const subProjectLead: Record<string, string> = {
  gtm: "Clarify the offer, launch sequence, and signup path.",
  product: "Make the box feel real, valuable, and ready to buy.",
  curriculum: "Turn the experience into missions families can actually use.",
  marketing: "Create demand and trust before June 15.",
  operations: "Make fulfillment and systems boringly reliable.",
};

const subProjectTone: Record<string, { hero: string; stat: string; badge: string }> = {
  gtm: {
    hero: "border-cyan-400/30 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white shadow-[0_0_40px_rgba(34,211,238,0.16)]",
    stat: "border-cyan-200/20 bg-black/20 text-white",
    badge: "border-cyan-400/30 bg-cyan-500/12 text-cyan-100",
  },
  product: {
    hero: "border-violet-400/30 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 text-white shadow-[0_0_40px_rgba(167,139,250,0.16)]",
    stat: "border-violet-200/20 bg-black/20 text-white",
    badge: "border-violet-400/30 bg-violet-500/12 text-violet-100",
  },
  curriculum: {
    hero: "border-emerald-400/30 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-[0_0_40px_rgba(52,211,153,0.16)]",
    stat: "border-emerald-200/20 bg-black/20 text-white",
    badge: "border-emerald-400/30 bg-emerald-500/12 text-emerald-100",
  },
  marketing: {
    hero: "border-amber-400/30 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_0_40px_rgba(251,191,36,0.16)]",
    stat: "border-amber-200/20 bg-black/20 text-white",
    badge: "border-amber-400/30 bg-amber-500/12 text-amber-100",
  },
  operations: {
    hero: "border-rose-400/30 bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 text-white shadow-[0_0_40px_rgba(251,113,133,0.16)]",
    stat: "border-rose-200/20 bg-black/20 text-white",
    badge: "border-rose-400/30 bg-rose-500/12 text-rose-100",
  },
};

export function HTASubView({ userId, subProject, title }: HTASubViewProps) {
  const tasks = useQuery(api.projectTasks.getTasksByProject, {
    userId,
    project: "hta",
    subProject,
  }) || [];

  const stats = useMemo(() => {
    const done = tasks.filter((task: any) => task.status === "done").length;
    const open = tasks.length - done;
    const overdue = tasks.filter((task: any) => {
      if (task.status === "done" || !task.dueDate) return false;
      return new Date(`${task.dueDate}T00:00:00`) < new Date();
    }).length;

    return {
      total: tasks.length,
      done,
      open,
      overdue,
    };
  }, [tasks]);

  const tone = subProjectTone[subProject] || {
    hero: "border-sky-500/20 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 text-white",
    stat: "border-sky-200/20 bg-black/20 text-white",
    badge: "border-zinc-700 bg-zinc-800 text-zinc-100",
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-3xl font-bold">{title}</h1>
          <Badge variant="outline" className={`${tone.badge} px-2 py-0.5 text-[11px]`}>{stats.open} open</Badge>
        </div>
      </div>

      <Card className={`overflow-hidden ${tone.hero}`}>
        <CardContent className="p-2.5 md:p-3">
          <div className="grid gap-2 md:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,1fr))] md:items-stretch">
            <div className={`rounded-lg border p-2.5 ${tone.stat}`}>
              <div className="text-xs uppercase tracking-wide text-white/75">Focus</div>
              <div className="text-sm mt-1 text-white leading-snug">{subProjectLead[subProject] || "Move this lane toward launch readiness."}</div>
            </div>
            <div className={`rounded-lg border p-2.5 ${tone.stat}`}>
              <div className="text-xs uppercase tracking-wide text-white/75">Open</div>
              <div className="text-xl font-bold mt-1 text-white leading-none">{stats.open}</div>
            </div>
            <div className={`rounded-lg border p-2.5 ${tone.stat}`}>
              <div className="text-xs uppercase tracking-wide text-white/75">Done</div>
              <div className="text-xl font-bold mt-1 text-white leading-none">{stats.done}</div>
            </div>
            <div className={`rounded-lg border p-2.5 ${tone.stat}`}>
              <div className="text-xs uppercase tracking-wide text-white/75">Overdue</div>
              <div className="text-xl font-bold mt-1 text-white leading-none">{stats.overdue}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProjectTaskList
        userId={userId}
        project="hta"
        subProject={subProject}
        title={title}
        description=""
      />
    </div>
  );
}
