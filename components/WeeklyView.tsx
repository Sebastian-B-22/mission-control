"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, List, LayoutGrid, Plus, Trash2 } from "lucide-react";

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toWeekOfString(monday: Date): string {
  // YYYY-MM-DD
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function WeeklyView({ userId }: { userId: Id<"users"> }) {
  const [mode, setMode] = useState<"agenda" | "grid">("agenda");

  const monday = useMemo(() => startOfWeekMonday(new Date()), []);
  const nextMonday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    return d;
  }, [monday]);

  const weekOf = useMemo(() => toWeekOfString(monday), [monday]);

  const events =
    useQuery(api.calendarEvents.listRange, {
      userId,
      startMs: monday.getTime(),
      endMs: nextMonday.getTime(),
    }) || [];

  const goals = useQuery(api.weeklyGoals.listByWeek, { userId, weekOf }) || [];
  const addGoal = useMutation(api.weeklyGoals.add);
  const toggleDone = useMutation(api.weeklyGoals.toggleDone);
  const removeGoal = useMutation(api.weeklyGoals.remove);

  const [goalText, setGoalText] = useState("");

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [monday]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const day of days) {
      map.set(day.toDateString(), []);
    }
    for (const e of events) {
      const d = new Date(e.startMs);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    for (const [k, list] of map) {
      list.sort((a, b) => a.startMs - b.startMs);
      map.set(k, list);
    }
    return map;
  }, [events, days]);

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Weekly</h2>
          <Badge variant="outline" className="ml-2">
            Week of {monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={mode === "agenda" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("agenda")}
          >
            <List className="h-4 w-4 mr-2" />
            Agenda
          </Button>
          <Button
            variant={mode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("grid")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Grid
          </Button>
        </div>
      </div>

      {/* Goals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Weekly Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="Add a goal for this week"
              onKeyDown={async (e) => {
                if (e.key === "Enter" && goalText.trim()) {
                  await addGoal({ userId, weekOf, text: goalText.trim() });
                  setGoalText("");
                }
              }}
            />
            <Button
              onClick={async () => {
                if (!goalText.trim()) return;
                await addGoal({ userId, weekOf, text: goalText.trim() });
                setGoalText("");
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals yet.</p>
            ) : (
              goals.map((g) => (
                <div
                  key={g._id}
                  className="flex items-center justify-between gap-3 rounded border p-2"
                >
                  <label className="flex items-center gap-3 text-sm flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={g.done}
                      onChange={async (e) => {
                        await toggleDone({ goalId: g._id, done: e.target.checked });
                      }}
                    />
                    <span className={g.done ? "line-through text-muted-foreground" : ""}>
                      {g.text}
                    </span>
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => removeGoal({ goalId: g._id })}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      {mode === "agenda" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {days.map((day) => {
            const list = eventsByDay.get(day.toDateString()) || [];
            return (
              <Card key={day.toISOString()}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {list.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No events</p>
                  ) : (
                    list.map((e) => (
                      <div key={e._id} className="rounded border p-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{e.title}</div>
                          <Badge variant="outline" className="text-xs">
                            {e.allDay ? "All day" : `${formatTime(e.startMs)} - ${formatTime(e.endMs)}`}
                          </Badge>
                        </div>
                        {e.location ? (
                          <div className="text-xs text-muted-foreground mt-1">{e.location}</div>
                        ) : null}
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {e.account}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Time Block Grid (simple)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => (
                <div key={day.toISOString()} className="border rounded p-2">
                  <div className="text-xs font-semibold mb-2">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                    <span className="text-muted-foreground"> {day.getDate()}</span>
                  </div>
                  <div className="space-y-2">
                    {(eventsByDay.get(day.toDateString()) || []).map((e) => (
                      <div key={e._id} className="rounded border p-2 text-xs">
                        <div className="font-medium">{e.title}</div>
                        <div className="text-muted-foreground">
                          {e.allDay ? "All day" : `${formatTime(e.startMs)} - ${formatTime(e.endMs)}`}
                        </div>
                      </div>
                    ))}
                    {(eventsByDay.get(day.toDateString()) || []).length === 0 ? (
                      <div className="text-xs text-muted-foreground">No events</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Grid is intentionally lightweight for v1. If you want true drag-and-drop time-blocking, we can add it next.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-zinc-50 dark:bg-zinc-800/50">
        <CardContent className="pt-6 space-y-2">
          <p className="text-xs text-muted-foreground">
            Calendar events are synced from your Mac mini (merged Google accounts) into Mission Control.
          </p>
          <p className="text-xs text-muted-foreground">
            Setup note (for sync scripts): your userId is <span className="font-mono">{userId}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
