"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Calendar, CheckCircle2, Circle, Rocket, Target } from "lucide-react";

interface HTAMonthSwimlanesProps {
  userId: Id<"users">;
}

const launchDate = new Date("2026-06-15T00:00:00");
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getDiffDays(dueDate?: string) {
  if (!dueDate) return null;
  const today = startOfToday();
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((due.getTime() - today.getTime()) / MS_PER_DAY);
}

function getMonthProgress(monthTasks: any[]) {
  if (monthTasks.length === 0) return 0;
  const completed = monthTasks.filter((task: any) => task.status === "done").length;
  return Math.round((completed / monthTasks.length) * 100);
}

function getTaskPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "bg-red-500/15 text-red-100 border-red-400/30";
    case "medium":
      return "bg-amber-500/15 text-amber-100 border-amber-400/30";
    default:
      return "bg-zinc-800 text-zinc-200 border-zinc-700";
  }
}

function getSubProjectBadge(subProject: string) {
  const tones: Record<string, string> = {
    gtm: "border-cyan-400/30 bg-cyan-500/15 text-cyan-100",
    product: "border-violet-400/30 bg-violet-500/15 text-violet-100",
    curriculum: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
    marketing: "border-amber-400/30 bg-amber-500/15 text-amber-100",
    operations: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  };
  return tones[subProject] || "border-zinc-700 bg-zinc-800 text-zinc-100";
}

export function HTAMonthSwimlanes({ userId }: HTAMonthSwimlanesProps) {
  const tasks = useQuery(api.projectTasks.getTasksByProject, {
    userId,
    project: "hta",
  }) || [];

  const timeline = useMemo(() => {
    const today = startOfToday();
    const daysToLaunch = Math.max(0, Math.ceil((launchDate.getTime() - today.getTime()) / MS_PER_DAY));
    const openTasks = tasks.filter((task: any) => task.status !== "done");
    const doneTasks = tasks.filter((task: any) => task.status === "done");

    const tasksByMonth = {
      april: tasks.filter((task: any) => task.dueDate?.startsWith("2026-04")),
      may: tasks.filter((task: any) => task.dueDate?.startsWith("2026-05")),
      june: tasks.filter((task: any) => task.dueDate?.startsWith("2026-06")),
      july: tasks.filter((task: any) => task.dueDate?.startsWith("2026-07")),
      august: tasks.filter((task: any) => task.dueDate?.startsWith("2026-08")),
      noDate: tasks.filter((task: any) => !task.dueDate),
    };

    const urgentTasks = openTasks
      .filter((task: any) => {
        const diff = getDiffDays(task.dueDate);
        return diff !== null && diff <= 7;
      })
      .sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || ""));

    const nextTasks = openTasks
      .filter((task: any) => {
        const diff = getDiffDays(task.dueDate);
        return diff !== null && diff >= 8 && diff <= 21;
      })
      .sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || ""));

    return {
      daysToLaunch,
      openCount: openTasks.length,
      doneCount: doneTasks.length,
      percentComplete: tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
      urgentTasks,
      nextTasks,
      tasksByMonth,
    };
  }, [tasks]);

  const monthData = [
    {
      key: "april",
      name: "April - offer and launch foundation",
      description: "Lock the offer, parent promise, first box, and page direction.",
      tone: "from-amber-500 to-orange-500",
      tasks: timeline.tasksByMonth.april,
    },
    {
      key: "may",
      name: "May - build the machine",
      description: "Get the assets, signup flow, onboarding, and fulfillment system ready.",
      tone: "from-cyan-500 to-sky-500",
      tasks: timeline.tasksByMonth.may,
    },
    {
      key: "june",
      name: "June - Founding Families open",
      description: "World Cup energy, waitlist conversion, and opening Founding Families on June 15.",
      tone: "from-rose-500 to-red-500",
      tasks: timeline.tasksByMonth.june,
    },
    {
      key: "july",
      name: "July - convert and prepare fulfillment",
      description: "Keep enrollment momentum up and tighten packout, onboarding, and shipping readiness.",
      tone: "from-fuchsia-500 to-pink-500",
      tasks: timeline.tasksByMonth.july,
    },
    {
      key: "august",
      name: "August - first boxes ship",
      description: "Turn Founding Families into a real delivered experience on August 1.",
      tone: "from-emerald-500 to-teal-500",
      tasks: timeline.tasksByMonth.august,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white shadow-[0_0_40px_rgba(217,70,239,0.15)]">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">HTA Launch Runway</CardTitle>
              <p className="text-white/90 mt-1">A live April to August path, with Founding Families opening June 15 and first boxes shipping August 1.</p>
            </div>
            <Rocket className="h-11 w-11 text-white/90" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Days to launch</div>
              <div className="mt-2 text-3xl font-semibold">{timeline.daysToLaunch}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Open tasks</div>
              <div className="mt-2 text-3xl font-semibold">{timeline.openCount}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Complete</div>
              <div className="mt-2 text-3xl font-semibold">{timeline.percentComplete}%</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-white/85">
              <span>Overall sprint progress</span>
              <span>{timeline.doneCount} of {tasks.length} done</span>
            </div>
            <Progress value={timeline.percentComplete} className="h-3 bg-white/20" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-rose-400/30 bg-gradient-to-br from-rose-500/14 via-red-500/10 to-zinc-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <AlertTriangle className="h-4 w-4 text-rose-200" />
              This week decides the launch shape
            </CardTitle>
            <p className="text-sm text-zinc-300">Anything due in the next 7 days, including overdue items.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.urgentTasks.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-200">No urgent tasks are dated yet.</div>
            ) : (
              timeline.urgentTasks.map((task: any) => {
                const diff = getDiffDays(task.dueDate);
                return (
                  <div key={task._id} className="rounded-xl border border-white/10 bg-black/25 p-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-sm text-white">{task.title}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                        <Badge variant="outline" className={getSubProjectBadge(task.subProject)}>{task.subProject}</Badge>
                        <span>{task.assignedTo?.name || "Needs owner"}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-white/10 bg-black/30 text-zinc-100">
                      {diff !== null && diff < 0 ? `${Math.abs(diff)}d late` : task.dueDate}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-cyan-400/30 bg-gradient-to-br from-cyan-500/14 via-sky-500/10 to-zinc-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Target className="h-4 w-4 text-cyan-200" />
              Coming right after that
            </CardTitle>
            <p className="text-sm text-zinc-300">The next 8 to 21 days of work, once the foundation is locked.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.nextTasks.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-200">Nothing is staged in the next window yet.</div>
            ) : (
              timeline.nextTasks.map((task: any) => (
                <div key={task._id} className="rounded-xl border border-white/10 bg-black/25 p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm text-white">{task.title}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                      <Badge variant="outline" className={getSubProjectBadge(task.subProject)}>{task.subProject}</Badge>
                      <span>{task.assignedTo?.name || "Needs owner"}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-white/10 bg-black/30 text-zinc-100">{task.dueDate}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {monthData.map((month) => {
        const progress = getMonthProgress(month.tasks);
        const completedCount = month.tasks.filter((task: any) => task.status === "done").length;

        return (
          <Card key={month.key} className="overflow-hidden border-zinc-800 bg-zinc-950/80">
            <CardHeader className={`bg-gradient-to-r ${month.tone} text-white`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{month.name}</CardTitle>
                  <p className="text-white/90 text-sm mt-1">{month.description}</p>
                  <p className="text-white/80 text-xs mt-2">{completedCount} of {month.tasks.length} tasks completed</p>
                </div>
                <div className="text-right min-w-[88px]">
                  <div className="text-3xl font-bold">{progress}%</div>
                  <Progress value={progress} className="w-24 h-2 bg-white/20 mt-1" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {month.tasks.length === 0 ? (
                <p className="text-center text-zinc-400 py-8">No tasks scheduled in this phase yet.</p>
              ) : (
                <div className="space-y-3">
                  {month.tasks
                    .sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || ""))
                    .map((task: any) => (
                      <div
                        key={task._id}
                        className={`flex items-start gap-3 rounded-xl border border-white/8 p-3 transition-all ${
                          task.status === "done" ? "bg-zinc-900/40 opacity-60" : "bg-black/20"
                        }`}
                      >
                        {task.status === "done" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-zinc-500 mt-0.5 flex-shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className={`font-medium text-white ${task.status === "done" ? "line-through text-zinc-500" : ""}`}>
                                {task.title}
                              </h4>
                            </div>
                            <Badge variant="outline" className={getTaskPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                            <Badge variant="outline" className={getSubProjectBadge(task.subProject)}>{task.subProject}</Badge>
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(`${task.dueDate}T00:00:00`).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                            <span>{task.assignedTo?.name || "Needs owner"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {timeline.tasksByMonth.noDate.length > 0 && (
        <Card className="border-amber-400/20 bg-zinc-950/80">
          <CardHeader>
            <CardTitle className="text-lg text-white">Tasks without dates</CardTitle>
            <p className="text-sm text-zinc-400">These still need a place on the runway.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {timeline.tasksByMonth.noDate.map((task: any) => (
              <div key={task._id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 p-3 text-sm">
                <div className="text-zinc-200">{task.title}</div>
                <Badge variant="outline" className={getSubProjectBadge(task.subProject)}>{task.subProject}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
