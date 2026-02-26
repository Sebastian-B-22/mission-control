"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2, Circle, Target } from "lucide-react";

interface HTAMonthSwimlanesProps {
  userId: Id<"users">;
}

export function HTAMonthSwimlanes({ userId }: HTAMonthSwimlanesProps) {
  // Get all HTA tasks across all subprojects
  const tasks = useQuery(api.projectTasks.getTasksByProject, {
    userId,
    project: "hta",
  }) || [];

  // Group tasks by target month
  const tasksByMonth = {
    february: tasks.filter(t => t.dueDate && t.dueDate.startsWith("2026-02")),
    march: tasks.filter(t => t.dueDate && t.dueDate.startsWith("2026-03")),
    april: tasks.filter(t => t.dueDate && t.dueDate.startsWith("2026-04")),
    may: tasks.filter(t => t.dueDate && t.dueDate.startsWith("2026-05")),
    june: tasks.filter(t => t.dueDate && t.dueDate.startsWith("2026-06")),
    noDate: tasks.filter(t => !t.dueDate),
  };

  const getMonthProgress = (monthTasks: typeof tasks) => {
    if (monthTasks.length === 0) return 0;
    const completed = monthTasks.filter(t => t.status === "done").length;
    return Math.round((completed / monthTasks.length) * 100);
  };

  const getMonthColor = (month: string) => {
    const colors: Record<string, string> = {
      february: "from-blue-500 to-blue-600",
      march: "from-green-500 to-green-600",
      april: "from-amber-500 to-amber-600",
      may: "from-orange-500 to-orange-600",
      june: "from-red-500 to-red-600",
    };
    return colors[month] || "from-gray-500 to-gray-600";
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-zinc-800 text-zinc-200 border-zinc-700";
    }
  };

  const getSubProjectEmoji = (subProject: string) => {
    const emojis: Record<string, string> = {
      gtm: "🎯",
      product: "📦",
      curriculum: "📚",
      marketing: "📣",
      operations: "⚙️",
    };
    return emojis[subProject] || "📋";
  };

  const monthData = [
    { key: "february", name: "February 2026", tasks: tasksByMonth.february },
    { key: "march", name: "March 2026", tasks: tasksByMonth.march },
    { key: "april", name: "April 2026", tasks: tasksByMonth.april },
    { key: "may", name: "May 2026", tasks: tasksByMonth.may },
    { key: "june", name: "June 2026 🚀 LAUNCH", tasks: tasksByMonth.june },
  ];

  return (
    <div className="space-y-6">
      {/* Launch Countdown Header */}
      <Card className="bg-gradient-to-r from-red-500 to-amber-500 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">HTA Launch Timeline</CardTitle>
              <p className="text-white/90 mt-1">Target: June 15, 2026 (World Cup Opening Weekend)</p>
            </div>
            <Target className="h-12 w-12" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-bold">{getMonthProgress(tasks)}%</span>
              </div>
              <Progress value={getMonthProgress(tasks)} className="h-3 bg-white/20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month Swimlanes */}
      {monthData.map((month) => {
        const progress = getMonthProgress(month.tasks);
        const completedCount = month.tasks.filter(t => t.status === "done").length;

        return (
          <Card key={month.key} className="overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${getMonthColor(month.key)} text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{month.name}</CardTitle>
                  <p className="text-white/90 text-sm mt-1">
                    {completedCount} of {month.tasks.length} tasks completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{progress}%</div>
                  <Progress value={progress} className="w-24 h-2 bg-white/20 mt-1" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {month.tasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tasks scheduled for this month yet
                </p>
              ) : (
                <div className="space-y-3">
                  {month.tasks
                    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
                    .map((task) => (
                      <div
                        key={task._id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                          task.status === "done"
                            ? "bg-zinc-800 opacity-60"
                            : "bg-zinc-900 hover:bg-zinc-800"
                        }`}
                      >
                        {/* Status Icon */}
                        {task.status === "done" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        )}

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className={`font-medium ${
                                task.status === "done" ? "line-through text-gray-500" : ""
                              }`}>
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Priority Badge */}
                            <Badge
                              variant="outline"
                              className={`${getTaskPriorityColor(task.priority)} text-xs`}
                            >
                              {task.priority}
                            </Badge>
                          </div>

                          {/* Metadata Row */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {/* Category */}
                            <span className="flex items-center gap-1">
                              {getSubProjectEmoji(task.subProject)}
                              {task.subProject.toUpperCase()}
                            </span>

                            {/* Due Date */}
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}

                            {/* Assigned To */}
                            {task.assignedToId && (
                              <span>👤 Assigned</span>
                            )}
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

      {/* Tasks Without Dates */}
      {tasksByMonth.noDate.length > 0 && (
        <Card>
          <CardHeader className="bg-zinc-800">
            <CardTitle className="text-lg">⚠️ Tasks Without Dates</CardTitle>
            <p className="text-sm text-muted-foreground">
              {tasksByMonth.noDate.length} tasks need to be scheduled
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {tasksByMonth.noDate.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center gap-2 p-2 rounded bg-amber-50 border border-amber-200 text-sm"
                >
                  <span className="flex-shrink-0">{getSubProjectEmoji(task.subProject)}</span>
                  <span className="flex-1">{task.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {task.subProject}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
