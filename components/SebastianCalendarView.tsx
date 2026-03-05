"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface SebastianCalendarViewProps {
  userId: Id<"users">;
}

export function SebastianCalendarView({ userId }: SebastianCalendarViewProps) {
  const tasks = useQuery(api.sebastianTasks.getSebastianTasks, { userId }) || [];
  const cronJobs = useQuery(api.cronJobs.getCronJobs) || [];

  const [showAllCron, setShowAllCron] = useState(false);

  // Process Cron Jobs
  const dailyRecurring = cronJobs
    .filter(job => job.status === "active")
    .filter(job => {
      if (showAllCron) return true;
      const name = job.name.toLowerCase();
      // Hide noisy infra jobs by default
      const noisy = ["huddle", "trigger poll", "activity alert", "security", "backup", "monitor", "check"].some(s => name.includes(s));
      return !noisy;
    })
    .flatMap(job => {
      // Format: "cron MIN HOUR DAY MONTH WEEKDAY ..." (may include tz suffix)
      if (!job.schedule.startsWith("cron ")) return [];
      const parts = job.schedule.replace("cron ", "").split(" ");
      if (parts.length < 5) return [];

      // Only show fixed-time cron jobs; allow comma-separated hour lists (e.g. "8,11,14,17")
      const parseNumberList = (s: string): number[] | null => {
        if (/^\d+$/.test(s)) return [parseInt(s, 10)];
        if (/^\d+(,\d+)+$/.test(s)) return s.split(",").map(v => parseInt(v, 10));
        return null;
      };

      const mins = parseNumberList(parts[0]);
      const hours = parseNumberList(parts[1]);
      if (!mins || !hours) return [];

      const weekday = parts[4];

      const out: Array<{ type: string; time: string; task: string; emoji: string; sortTime: number }> = [];
      for (const hour of hours) {
        for (const min of mins) {
          if (Number.isNaN(min) || Number.isNaN(hour)) continue;
          const date = new Date();
          date.setHours(hour, min, 0, 0);
          const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
          const sortTime = hour * 60 + min;

          // Detect emojis
          let emoji = "🤖";
          const name = job.name.toLowerCase();
          if (name.includes("morning")) emoji = "☀️";
          else if (name.includes("evening") || name.includes("night")) emoji = "🌙";
          else if (name.includes("email")) emoji = "📧";
          else if (name.includes("health")) emoji = "❤️";
          else if (name.includes("quo")) emoji = "📱";
          else if (name.includes("maven")) emoji = "📣";
          else if (name.includes("scout")) emoji = "🔍";

          if (weekday === "*" || weekday === "0-6" || weekday === "1-5") {
            out.push({ type: "daily", time: timeStr, task: job.name, emoji, sortTime });
          } else if (weekday === "0") {
            out.push({ type: "sunday", time: timeStr, task: job.name, emoji, sortTime });
          } else if (weekday === "1") {
            out.push({ type: "monday", time: timeStr, task: job.name, emoji, sortTime });
          }
        }
      }

      return out;
    })
    .sort((a, b) => a.sortTime - b.sortTime);

  const [weekAnchor] = useState(() => new Date());
  const currentDay = weekAnchor.getDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

  const days = dayKeys.map((key, index) => ({
    key,
    name: dayNames[index],
    date: new Date(weekAnchor.getTime() - (currentDay - index) * 86400000),
    dayIndex: index // 0 = Sunday, 1 = Monday, etc.
  }));

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Weekly Calendar</h2>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {showAllCron ? "all active cron" : "important fixed-time cron"}
        </div>
        <button
          className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={() => setShowAllCron(v => !v)}
        >
          {showAllCron ? "Hide noisy" : "Show all"}
        </button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <Card
            key={day.key}
            className={`${
              isToday(day.date) ? "border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-900/20" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {day.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </CardHeader>
            <CardContent className="space-y-1 pt-2">
              {/* Cron Jobs for this day */}
              {dailyRecurring.map((item, i) => {
                // Determine if we show this item today
                const show = 
                  item.type === "daily" || 
                  (item.type === "sunday" && day.dayIndex === 0) ||
                  (item.type === "monday" && day.dayIndex === 1);

                if (!show) return null;

                const isSpecial = item.type !== "daily";
                const bgClass = isSpecial 
                  ? "bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800/50"
                  : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700";

                return (
                  <div
                    key={`${day.key}-${i}`}
                    className={`p-2 text-xs rounded border transition-colors ${bgClass}`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{item.emoji}</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.time}</span>
                    </div>
                    <p className="text-xs mt-1 leading-tight text-zinc-700 dark:text-zinc-300 line-clamp-2">{item.task}</p>
                  </div>
                );
              })}

              {/* Active project tasks could go here */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card className="bg-zinc-50 dark:bg-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800 border dark:border-zinc-700"></div>
            <span>Daily recurring tasks (automated via cron)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-700"></div>
            <span>Weekly tasks (Specific days)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded border-2 border-amber-500"></div>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Project Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active Project Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.filter(t => t.status === "in-progress" || t.status === "todo").slice(0, 5).map((task) => (
              <div key={task._id} className="flex items-center justify-between p-2 rounded border dark:border-zinc-700 text-sm">
                <span>{task.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  task.priority === "high" 
                    ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300" 
                    : task.priority === "medium"
                    ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300"
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
