"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HTAMonthSwimlanes } from "@/components/HTAMonthSwimlanes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  List,
  Package,
  Megaphone,
  BookOpen,
  Cog,
  Target,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface HTAOverviewProps {
  userId: Id<"users">;
  onNavigate?: (view: string) => void;
}

const launchDate = new Date("2026-06-15T00:00:00");
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const subProjectMeta: Record<string, { label: string; lane: string; icon: any; tone: string; badgeTone: string }> = {
  gtm: {
    label: "GTM",
    lane: "Offer + launch path",
    icon: Target,
    tone: "border-cyan-400/30 bg-gradient-to-br from-cyan-500/22 via-sky-500/14 to-slate-950 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]",
    badgeTone: "border-cyan-400/30 bg-cyan-500/18 text-cyan-100",
  },
  product: {
    label: "Product",
    lane: "Box + experience",
    icon: Package,
    tone: "border-violet-400/30 bg-gradient-to-br from-violet-500/22 via-fuchsia-500/14 to-slate-950 shadow-[0_0_0_1px_rgba(167,139,250,0.08)]",
    badgeTone: "border-violet-400/30 bg-violet-500/18 text-violet-100",
  },
  curriculum: {
    label: "Curriculum",
    lane: "Missions + learning",
    icon: BookOpen,
    tone: "border-emerald-400/30 bg-gradient-to-br from-emerald-500/24 via-teal-500/14 to-slate-950 shadow-[0_0_0_1px_rgba(52,211,153,0.08)]",
    badgeTone: "border-emerald-400/30 bg-emerald-500/18 text-emerald-100",
  },
  marketing: {
    label: "Marketing",
    lane: "Audience + demand",
    icon: Megaphone,
    tone: "border-amber-400/30 bg-gradient-to-br from-amber-500/24 via-orange-500/14 to-slate-950 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]",
    badgeTone: "border-amber-400/30 bg-amber-500/18 text-amber-100",
  },
  operations: {
    label: "Operations",
    lane: "Fulfillment + systems",
    icon: Cog,
    tone: "border-rose-400/30 bg-gradient-to-br from-rose-500/22 via-red-500/14 to-slate-950 shadow-[0_0_0_1px_rgba(251,113,133,0.08)]",
    badgeTone: "border-rose-400/30 bg-rose-500/18 text-rose-100",
  },
};

function getTaskDiffDays(dueDate?: string) {
  if (!dueDate) return null;
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((due.getTime() - todayOnly.getTime()) / MS_PER_DAY);
}

export function HTAOverview({ userId, onNavigate }: HTAOverviewProps) {
  const [viewMode, setViewMode] = useState<"dashboard" | "timeline" | "sections">("dashboard");
  const tasks = useQuery(api.projectTasks.getTasksByProject, {
    userId,
    project: "hta",
  }) || [];
  const teamMembers = useQuery(api.teamMembers.getTeamMembers, { userId }) || [];

  const launchStats = useMemo(() => {
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysToLaunch = Math.max(0, Math.ceil((launchDate.getTime() - todayOnly.getTime()) / MS_PER_DAY));

    const done = tasks.filter((task: any) => task.status === "done");
    const open = tasks.filter((task: any) => task.status !== "done");
    const overdue = open.filter((task: any) => task.dueDate && new Date(`${task.dueDate}T00:00:00`) < todayOnly);
    const next14 = open.filter((task: any) => {
      const diff = getTaskDiffDays(task.dueDate);
      return diff !== null && diff >= 0 && diff <= 14;
    });
    const undated = open.filter((task: any) => !task.dueDate);

    const focusTasks = [...overdue, ...next14]
      .filter((task: any, index: number, list: any[]) => list.findIndex((candidate) => candidate._id === task._id) === index)
      .sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || ""))
      .slice(0, 6);

    const lanes = Object.entries(subProjectMeta).map(([key, meta]) => {
      const laneTasks = tasks.filter((task: any) => task.subProject === key);
      const laneDone = laneTasks.filter((task: any) => task.status === "done").length;
      const laneOpen = laneTasks.length - laneDone;
      const laneOverdue = laneTasks.filter((task: any) => {
        const diff = getTaskDiffDays(task.dueDate);
        return task.status !== "done" && diff !== null && diff < 0;
      }).length;

      const nextTask = laneTasks
        .filter((task: any) => task.status !== "done")
        .sort((a: any, b: any) => {
          const aDiff = getTaskDiffDays(a.dueDate);
          const bDiff = getTaskDiffDays(b.dueDate);
          if (aDiff === null && bDiff === null) return (a.order || 0) - (b.order || 0);
          if (aDiff === null) return 1;
          if (bDiff === null) return -1;
          return aDiff - bDiff;
        })[0] || null;

      return {
        key,
        ...meta,
        total: laneTasks.length,
        done: laneDone,
        open: laneOpen,
        overdue: laneOverdue,
        nextTask,
      };
    });

    const criticalPath = Object.keys(subProjectMeta)
      .map((key) => {
        const laneTasks = open
          .filter((task: any) => task.subProject === key)
          .sort((a: any, b: any) => {
            const aDiff = getTaskDiffDays(a.dueDate);
            const bDiff = getTaskDiffDays(b.dueDate);
            if (aDiff === null && bDiff === null) return (a.order || 0) - (b.order || 0);
            if (aDiff === null) return 1;
            if (bDiff === null) return -1;
            return aDiff - bDiff;
          });
        return laneTasks[0];
      })
      .filter(Boolean);

    const nowTasks = open
      .filter((task: any) => {
        const diff = getTaskDiffDays(task.dueDate);
        return diff === null ? false : diff <= 7;
      })
      .sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || ""))
      .slice(0, 8);

    const nextTasks = open
      .filter((task: any) => {
        const diff = getTaskDiffDays(task.dueDate);
        return diff !== null && diff >= 8 && diff <= 21;
      })
      .sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || ""))
      .slice(0, 8);

    const laterTasks = open
      .filter((task: any) => {
        const diff = getTaskDiffDays(task.dueDate);
        return diff === null || diff > 21;
      })
      .sort((a: any, b: any) => {
        if (!a.dueDate && !b.dueDate) return (a.order || 0) - (b.order || 0);
        if (!a.dueDate) return -1;
        if (!b.dueDate) return 1;
        return (a.dueDate || "").localeCompare(b.dueDate || "");
      })
      .slice(0, 8);

    const ownerPods = [
      ...teamMembers.map((member: any) => {
        const ownerTasks = open.filter((task: any) => task.assignedToId === member._id);
        const nextDueTask = ownerTasks
          .filter((task: any) => task.dueDate)
          .sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || ""))[0] || null;
        return {
          key: member._id,
          name: member.name,
          role: member.role,
          open: ownerTasks.length,
          high: ownerTasks.filter((task: any) => task.priority === "high").length,
          overdue: ownerTasks.filter((task: any) => {
            const diff = getTaskDiffDays(task.dueDate);
            return diff !== null && diff < 0;
          }).length,
          nextDueTask,
        };
      }),
      {
        key: "unassigned",
        name: "Unassigned",
        role: "Needs an owner",
        open: open.filter((task: any) => !task.assignedToId).length,
        high: open.filter((task: any) => !task.assignedToId && task.priority === "high").length,
        overdue: open.filter((task: any) => {
          const diff = getTaskDiffDays(task.dueDate);
          return !task.assignedToId && diff !== null && diff < 0;
        }).length,
        nextDueTask:
          open
            .filter((task: any) => !task.assignedToId && task.dueDate)
            .sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || ""))[0] || null,
      },
    ];

    return {
      daysToLaunch,
      doneCount: done.length,
      openCount: open.length,
      overdueCount: overdue.length,
      next14Count: next14.length,
      undatedCount: undated.length,
      focusTasks,
      percentComplete: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0,
      overdueTasks: overdue.sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || "")).slice(0, 6),
      next14Tasks: next14.sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || "")).slice(0, 6),
      lanes,
      criticalPath,
      sprintBuckets: {
        now: nowTasks,
        next: nextTasks,
        later: laterTasks,
      },
      ownerPods,
    };
  }, [tasks, teamMembers]);

  const metricCards = [
    {
      label: "Launch runway",
      value: `${launchStats.daysToLaunch} days`,
      sub: "Target: June 15",
      tone: "border-emerald-400/35 bg-gradient-to-br from-emerald-500/28 via-emerald-400/12 to-slate-950",
      labelTone: "text-emerald-100/90",
    },
    {
      label: "Open tasks",
      value: launchStats.openCount,
      sub: "Across the active launch sprint",
      tone: "border-cyan-400/35 bg-gradient-to-br from-cyan-500/26 via-sky-500/12 to-slate-950",
      labelTone: "text-cyan-100/90",
    },
    {
      label: "Next 14 days",
      value: launchStats.next14Count,
      sub: "What is actually coming up next",
      tone: "border-amber-400/35 bg-gradient-to-br from-amber-500/26 via-orange-500/12 to-slate-950",
      labelTone: "text-amber-100/90",
    },
    {
      label: "Completed",
      value: `${launchStats.percentComplete}%`,
      sub: `${launchStats.doneCount} done`,
      tone: "border-violet-400/35 bg-gradient-to-br from-violet-500/24 via-indigo-500/12 to-slate-950",
      labelTone: "text-violet-100/90",
    },
  ];

  const dashboardContent = (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 shadow-[0_0_40px_rgba(245,158,11,0.05)]">
        <CardHeader className="pb-3">
          <div className="space-y-3">
            <CardTitle>Launch at a glance</CardTitle>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="border-rose-400/30 bg-rose-500/12 text-rose-100">
                {launchStats.overdueCount} overdue
              </Badge>
              <Badge variant="outline" className="border-fuchsia-400/30 bg-fuchsia-500/12 text-fuchsia-100">
                {launchStats.undatedCount} without dates
              </Badge>
              <Badge variant="outline" className="border-emerald-400/30 bg-emerald-500/12 text-emerald-100">
                August 1 first box ship
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card) => (
              <div key={card.label} className={`rounded-2xl border p-4 ${card.tone}`}>
                <div className={`text-[11px] uppercase tracking-[0.18em] ${card.labelTone}`}>{card.label}</div>
                <div className="mt-2 text-3xl font-semibold text-white">{card.value}</div>
                <div className="mt-1 text-sm text-zinc-300">{card.sub}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-zinc-800 bg-zinc-950/80 shadow-[0_0_30px_rgba(34,211,238,0.04)]">
          <CardHeader>
            <CardTitle>Launch lanes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {launchStats.lanes.map((lane) => {
                const Icon = lane.icon;
                return (
                  <button
                    key={lane.key}
                    type="button"
                    onClick={() => onNavigate ? onNavigate(`hta-${lane.key}`) : setViewMode("sections")}
                    className={`w-full rounded-2xl border p-4 space-y-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${lane.tone}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-zinc-200/85">{lane.label}</div>
                        <div className="mt-1 font-semibold text-white">{lane.lane}</div>
                      </div>
                      <div className="flex items-center gap-2 text-white/85">
                        <Icon className="h-5 w-5" />
                        <ChevronRight className="h-4 w-4 opacity-80" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {[
                        ["Open", lane.open],
                        ["Done", lane.done],
                        ["Late", lane.overdue],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-xl border border-white/8 bg-black/28 p-2.5">
                          <div className="text-[11px] uppercase tracking-wide text-zinc-300">{label}</div>
                          <div className="mt-1 font-semibold text-white">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="text-sm text-zinc-200 min-h-[2.5rem]">
                      {lane.nextTask ? (
                        <>
                          <span className="font-medium text-white">Next:</span> {lane.nextTask.title}
                        </>
                      ) : (
                        "No upcoming dated task in this lane yet."
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-400/30 bg-gradient-to-br from-amber-500/16 via-orange-500/10 to-zinc-950 shadow-[0_0_30px_rgba(245,158,11,0.05)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Calendar className="h-4 w-4 text-amber-200" />
              Focus this week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {launchStats.focusTasks.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-black/25 p-4 text-sm text-zinc-200">
                Nothing urgent is dated yet, which probably means the dates need love.
              </div>
            ) : (
              launchStats.focusTasks.map((task: any) => {
                const tone = subProjectMeta[task.subProject]?.badgeTone || "border-white/12 bg-black/30 text-zinc-100";
                const isOverdue = task.dueDate && new Date(`${task.dueDate}T00:00:00`) < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

                return (
                  <div key={task._id} className="rounded-xl border border-white/8 bg-black/25 p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-white">{task.title}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                        <Badge variant="outline" className={tone}>{subProjectMeta[task.subProject]?.label || task.subProject}</Badge>
                        <span>{task.assignedTo?.name || "Needs owner"}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-white/12 bg-black/30 text-zinc-100 whitespace-nowrap">
                      {isOverdue ? `late • ${task.dueDate}` : task.dueDate || "No date"}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">HTA Launch Center</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={viewMode === "dashboard" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("dashboard")}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Launch Dashboard
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("timeline")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Timeline
          </Button>
          <Button
            variant={viewMode === "sections" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("sections")}
          >
            <List className="h-4 w-4 mr-2" />
            By Section
          </Button>
        </div>
      </div>

      {viewMode === "dashboard" && dashboardContent}

      {viewMode === "timeline" && <HTAMonthSwimlanes userId={userId} />}

      {viewMode === "sections" && (
        <Tabs defaultValue="gtm" className="w-full">
          <TabsList>
            <TabsTrigger value="gtm">GTM Timeline</TabsTrigger>
            <TabsTrigger value="product">Product Dev</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum Dev</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="gtm" className="space-y-4">
            <ProjectTaskList
              userId={userId}
              project="hta"
              subProject="gtm"
              title="Go-To-Market Timeline"
              description="Offer, sign-up path, founding families, and the path to June 15."
            />
          </TabsContent>

          <TabsContent value="product" className="space-y-4">
            <ErrorBoundary>
              <ProjectTaskList
                userId={userId}
                project="hta"
                subProject="product"
                title="Product Development"
                description="Box experience, prototype quality, and what families actually receive."
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-4">
            <ProjectTaskList
              userId={userId}
              project="hta"
              subProject="curriculum"
              title="Curriculum Development"
              description="Missions, instructions, learning arc, and parent usability."
            />
          </TabsContent>

          <TabsContent value="marketing" className="space-y-4">
            <ProjectTaskList
              userId={userId}
              project="hta"
              subProject="marketing"
              title="Marketing"
              description="Audience capture, launch messaging, and demand generation."
            />
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            <ProjectTaskList
              userId={userId}
              project="hta"
              subProject="operations"
              title="Operations"
              description="Fulfillment, systems, and what has to work behind the scenes."
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
