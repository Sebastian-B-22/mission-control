"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Zap, TrendingUp } from "lucide-react";
import { SelfImprovementFeedback } from "./SelfImprovementFeedback";

interface SebastianDailyViewProps {
  userId: Id<"users">;
}

export function SebastianDailyView({ userId }: SebastianDailyViewProps) {
  const tasks = useQuery(api.sebastianTasks.getSebastianTasks, { userId }) || [];
  const cronJobs = useQuery(api.cronJobs.getCronJobs) || [];
  
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Categorize tasks
  const inProgress = tasks.filter((t: any) => t.status === "in-progress");
  const highPriorityTodo = tasks.filter((t: any) => t.status === "todo" && t.priority === "high");
  const completedToday = tasks.filter((t: any) => {
    if (t.status !== "done" || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const isToday = completedDate.toDateString() === new Date().toDateString();
    return isToday;
  });

  // Process Cron Jobs for Daily View
  // Filter for active jobs that run at a specific time (daily)
  const dailyTasks = cronJobs
    .filter((job: any) => job.status === "active")
    .map((job: any) => {
      // Try to extract time from cron schedule
      // Format: "cron MIN HOUR * * * ..."
      const cronMatch = job.schedule.match(/cron (\d+) (\d+) .*/);
      let timeStr = "";
      let sortTime = 0;
      
      if (cronMatch) {
        const min = parseInt(cronMatch[1]);
        const hour = parseInt(cronMatch[2]);
        const date = new Date();
        date.setHours(hour, min, 0, 0);
        timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        sortTime = hour * 60 + min;
      } else if (job.schedule.startsWith("every")) {
        timeStr = "Recurring";
        sortTime = 9999; // Put at end
      } else {
        return null; // Skip non-daily/weird schedules for this view
      }

      // Assign emojis based on keywords
      let emoji = "🤖";
      const name = job.name.toLowerCase();
      if (name.includes("morning")) emoji = "☀️";
      else if (name.includes("evening") || name.includes("night")) emoji = "🌙";
      else if (name.includes("email")) emoji = "📧";
      else if (name.includes("health")) emoji = "❤️";
      else if (name.includes("quo")) emoji = "📱";
      else if (name.includes("screen")) emoji = "📵";
      else if (name.includes("memory")) emoji = "💾";
      else if (name.includes("maven")) emoji = "📣";
      else if (name.includes("scout")) emoji = "🔍";
      
      return {
        id: job.jobId,
        time: timeStr,
        task: job.name,
        status: job.status === "active" ? "scheduled" : "paused",
        emoji,
        sortTime
      };
    })
    .filter((task: any): task is NonNullable<typeof task> => task !== null)
    .sort((a: any, b: any) => a.sortTime - b.sortTime);

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      infrastructure: "🔧",
      hta: "🏠",
      aspire: "⚽",
      "agent-squad": "🤖",
      skills: "🎯",
      other: "📋",
    };
    return emojis[category] || "📋";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500" />
            Today&apos;s Focus
          </h2>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-600">{completedToday.length}</div>
          <p className="text-sm text-muted-foreground">completed today</p>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* In Progress */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              In Progress ({inProgress.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing in progress</p>
            ) : (
              inProgress.map((task: any) => (
                <div key={task._id} className="p-3 bg-amber-950/50 rounded-lg border border-amber-800">
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{getCategoryEmoji(task.category)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <Badge variant="outline" className="mt-2 text-xs">
                        {task.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* High Priority To Do */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Circle className="h-5 w-5 text-red-500" />
              High Priority ({highPriorityTodo.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPriorityTodo.length === 0 ? (
              <p className="text-sm text-muted-foreground">No urgent tasks</p>
            ) : (
              highPriorityTodo.map((task: any) => (
                <div key={task._id} className="p-3 bg-red-950/50 rounded-lg border border-red-800">
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{getCategoryEmoji(task.category)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <Badge variant="outline" className="mt-2 text-xs">
                        {task.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Completed Today */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Done Today ({completedToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing completed yet</p>
            ) : (
              completedToday.map((task: any) => (
                <div key={task._id} className="p-3 bg-green-950/50 rounded-lg border border-green-800 opacity-80">
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{getCategoryEmoji(task.category)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm line-through text-gray-600">{task.title}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {task.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Recurring Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Daily Recurring Tasks
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Live from Cron
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyTasks.length > 0 ? (
              dailyTasks.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.task}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Loading active tasks...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-100 dark:bg-zinc-800/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">{tasks.filter((t: any) => t.status === "backlog").length}</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Backlog</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tasks.filter((t: any) => t.status === "todo").length}</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">To Do</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{inProgress.length}</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{tasks.filter((t: any) => t.status === "done").length}</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Done (All Time)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Self-Improvement Feedback */}
      <SelfImprovementFeedback />
    </div>
  );
}
