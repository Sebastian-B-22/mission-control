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
  
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Categorize tasks
  const inProgress = tasks.filter(t => t.status === "in-progress");
  const highPriorityTodo = tasks.filter(t => t.status === "todo" && t.priority === "high");
  const completedToday = tasks.filter(t => {
    if (t.status !== "done" || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const isToday = completedDate.toDateString() === new Date().toDateString();
    return isToday;
  });

  // Daily recurring tasks
  const dailyTasks = [
    { time: "8:00 AM", task: "Morning Brief", status: "scheduled", emoji: "☀️" },
    { time: "9:00 PM", task: "Evening Check-in", status: "scheduled", emoji: "🌙" },
    { time: "9:30 PM", task: "Quo Monitor", status: "scheduled", emoji: "📱" },
  ];

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
            Today's Focus
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
              inProgress.map((task) => (
                <div key={task._id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
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
              highPriorityTodo.map((task) => (
                <div key={task._id} className="p-3 bg-red-50 rounded-lg border border-red-200">
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
              completedToday.map((task) => (
                <div key={task._id} className="p-3 bg-green-50 rounded-lg border border-green-200 opacity-80">
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Recurring Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyTasks.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-medium">{item.task}</p>
                    <p className="text-sm text-muted-foreground">{item.time}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {item.status}
                </Badge>
              </div>
            ))}
            {new Date().getDay() === 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-purple-50 hover:bg-purple-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-medium">Weekly RPM Review</p>
                    <p className="text-sm text-muted-foreground">9:15 PM (Sunday only)</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-purple-100">
                  scheduled
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{tasks.filter(t => t.status === "backlog").length}</div>
              <p className="text-sm text-muted-foreground mt-1">Backlog</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === "todo").length}</div>
              <p className="text-sm text-muted-foreground mt-1">To Do</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{inProgress.length}</div>
              <p className="text-sm text-muted-foreground mt-1">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === "done").length}</div>
              <p className="text-sm text-muted-foreground mt-1">Done (All Time)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Self-Improvement Feedback */}
      <SelfImprovementFeedback />
    </div>
  );
}
