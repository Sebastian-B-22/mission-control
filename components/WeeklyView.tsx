"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp, CalendarDays, List, LayoutGrid, Plus, Star, Trash2 } from "lucide-react";
import { getCategoryColor } from "@/lib/categoryColors";
import { groupByCategory } from "@/lib/groupByCategory";

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
  const setScheduledDay = useMutation(api.weeklyGoals.setScheduledDay);
  const updateGoalCategory = useMutation(api.weeklyGoals.updateGoalCategory);
  const reorderGoals = useMutation(api.weeklyGoals.reorderGoals);
  const toggleImportant = useMutation(api.weeklyGoals.toggleImportant);

  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const rpmCategories = useQuery(api.rpm.getCategoriesByUser, { userId }) || [];

  const [goalText, setGoalText] = useState("");
  const [goalCategoryId, setGoalCategoryId] = useState<string>("none");

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [monday]);

  // Helper to get YYYY-MM-DD in PST timezone
  const toPSTDateKey = (timestampMs: number): string => {
    const pstDateStr = new Date(timestampMs).toLocaleDateString("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const [m, d, y] = pstDateStr.split("/");
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof events>();
    
    // Initialize map with all 7 days using YYYY-MM-DD keys
    for (const day of days) {
      const key = toPSTDateKey(day.getTime());
      map.set(key, []);
    }
    
    // Group events by day (PST timezone)
    for (const e of events) {
      const dayKey = toPSTDateKey(e.startMs);
      
      // Add to map (create array if key doesn't exist yet)
      const arr = map.get(dayKey);
      if (arr) {
        arr.push(e);
      } else {
        console.warn("Event date not in week range:", dayKey, e.title);
      }
    }
    
    // Sort events within each day
    for (const [k, list] of map) {
      list.sort((a, b) => a.startMs - b.startMs);
    }
    
    return map;
  }, [events, days]);

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  // Group goals by category for display
  const groupedGoals = useMemo(
    () => groupByCategory(goals, rpmCategories),
    [goals, rpmCategories]
  );
  const importantGoals = useMemo(() => goals.filter((g: any) => g.important && !g.done), [goals]);
  const unassignedGoals = useMemo(() => goals.filter((g: any) => g.scheduledDay === undefined && !g.done), [goals]);

  const moveGoal = async (goalId: Id<"weeklyGoals">, direction: "up" | "down") => {
    const index = goals.findIndex((goal: any) => goal._id === goalId);
    if (index === -1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= goals.length) return;

    const reordered = [...goals];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    await reorderGoals({ orderedGoalIds: reordered.map((goal: any) => goal._id) });
  };

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
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="Add a goal for this week"
              onKeyDown={async (e) => {
                if (e.key === "Enter" && goalText.trim()) {
                  await addGoal({
                    userId,
                    weekOf,
                    text: goalText.trim(),
                    categoryId: goalCategoryId !== "none" ? (goalCategoryId as any) : undefined,
                  });
                  setGoalText("");
                }
              }}
            />

            <div className="flex gap-2">
              <Select value={goalCategoryId} onValueChange={setGoalCategoryId}>
                <SelectTrigger className="w-[210px]">
                  <SelectValue placeholder="Assign RPM category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {rpmCategories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={async () => {
                  if (!goalText.trim()) return;
                  await addGoal({
                    userId,
                    weekOf,
                    text: goalText.trim(),
                    categoryId: goalCategoryId !== "none" ? (goalCategoryId as any) : undefined,
                  });
                  setGoalText("");
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Goals - Grouped by Category */}
          <div className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals yet.</p>
            ) : (
              groupedGoals.map((group) => (
                <div key={group.categoryId ?? "uncategorized"} className="space-y-2">
                  {/* Category header - only show if there's a category */}
                  {group.categoryName && (
                    <div className="flex items-center gap-2 pt-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getCategoryColor(group.categoryName).badge}`}
                      >
                        {group.categoryName}
                      </span>
                    </div>
                  )}
                  {!group.categoryName && groupedGoals.length > 1 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground font-medium">Uncategorized</span>
                    </div>
                  )}
                  {/* Goals in this category */}
                  {group.items.map((g) => (
                    <div
                      key={g._id}
                      className={`flex items-center justify-between gap-3 rounded border p-2 ${group.categoryName ? getCategoryColor(group.categoryName).border : ""} ${g.scheduledDay === undefined && !g.done ? "bg-amber-50/80 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800" : ""} ${g.important && !g.done ? "ring-1 ring-yellow-300/70" : ""}`}
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => toggleImportant({ goalId: g._id, important: !Boolean(g.important) })}
                          title={g.important ? "Remove Friday Finisher" : "Mark as Friday Finisher"}
                          className="h-7 w-7"
                        >
                          <Star className={`h-4 w-4 ${g.important ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground"}`} />
                        </Button>
                        <Select 
                          value={g.scheduledDay !== undefined ? String(g.scheduledDay) : "none"}
                          onValueChange={async (v) => {
                            await setScheduledDay({ 
                              goalId: g._id, 
                              scheduledDay: v === "none" ? null : parseInt(v) 
                            });
                          }}
                        >
                          <SelectTrigger className={`w-[80px] h-7 text-xs ${g.scheduledDay === undefined && !g.done ? "border-amber-300 bg-amber-100/70 dark:bg-amber-950/30" : ""}`}>
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Any</SelectItem>
                            {DAY_NAMES.map((d, i) => (
                              <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={g.categoryId ?? "none"}
                          onValueChange={async (value) => {
                            await updateGoalCategory({
                              goalId: g._id,
                              categoryId: value === "none" ? null : (value as Id<"rpmCategories">),
                            });
                          }}
                        >
                          <SelectTrigger className="w-[170px] h-7 text-xs">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No category</SelectItem>
                            {rpmCategories.map((c) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => moveGoal(g._id, "up")}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => moveGoal(g._id, "down")}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => removeGoal({ goalId: g._id })}
                          title="Delete"
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      {mode === "agenda" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2 border-yellow-200 bg-yellow-50/70 dark:border-yellow-800 dark:bg-yellow-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                Friday Finishers ({importantGoals.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {importantGoals.length > 0 ? (
                importantGoals.map((g: any) => (
                  <div key={g._id} className="flex items-center justify-between gap-2 rounded border bg-background/70 p-2 text-sm">
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={g.done}
                        onChange={async (e) => toggleDone({ goalId: g._id, done: e.target.checked })}
                      />
                      <span>{g.text}</span>
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {g.scheduledDay === undefined ? "Any" : DAY_NAMES[g.scheduledDay]}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Star your must-finish tasks for the week and they’ll collect here.</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Unassigned / Anytime ({unassignedGoals.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {unassignedGoals.length > 0 ? (
                unassignedGoals.map((g: any) => (
                  <div key={g._id} className="flex items-center justify-between gap-2 rounded border bg-background/70 p-2 text-sm">
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={g.done}
                        onChange={async (e) => toggleDone({ goalId: g._id, done: e.target.checked })}
                      />
                      <span>{g.important ? "⭐ " : ""}{g.text}</span>
                    </label>
                    <Select
                      value="none"
                      onValueChange={async (v) => {
                        await setScheduledDay({ goalId: g._id, scheduledDay: v === "none" ? null : parseInt(v) });
                      }}
                    >
                      <SelectTrigger className="w-[90px] h-7 text-xs border-amber-300 bg-amber-100/70 dark:bg-amber-950/30">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Any</SelectItem>
                        {DAY_NAMES.map((d, i) => (
                          <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Nothing floating. Everything has a day or is done.</p>
              )}
            </CardContent>
          </Card>

          {days.map((day, dayIndex) => {
            const dayKey = toPSTDateKey(day.getTime());
            const list = eventsByDay.get(dayKey) || [];
            const dayGoals = goals.filter(g => g.scheduledDay === dayIndex);
            const hasContent = list.length > 0 || dayGoals.length > 0;
            return (
              <Card key={day.toISOString()}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Scheduled goals for this day */}
                  {dayGoals.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {dayGoals.map((g) => (
                        <div key={g._id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={g.done}
                            onChange={async (e) => {
                              await toggleDone({ goalId: g._id, done: e.target.checked });
                            }}
                            className="h-3 w-3"
                          />
                          <span className={g.done ? "line-through text-muted-foreground" : ""}>
                            {g.text}
                          </span>
                          {g.categoryId ? (
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${getCategoryColor(rpmCategories.find((c) => c._id === g.categoryId)?.name).badge}`}>
                              {rpmCategories.find((c) => c._id === g.categoryId)?.name}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Calendar events */}
                  {list.length > 0 ? (
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
                  ) : !dayGoals.length ? (
                    <p className="text-xs text-muted-foreground">No events</p>
                  ) : null}
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
                    {(eventsByDay.get(toPSTDateKey(day.getTime())) || []).map((e) => (
                      <div key={e._id} className="rounded border p-2 text-xs">
                        <div className="font-medium">{e.title}</div>
                        <div className="text-muted-foreground">
                          {e.allDay ? "All day" : `${formatTime(e.startMs)} - ${formatTime(e.endMs)}`}
                        </div>
                      </div>
                    ))}
                    {(eventsByDay.get(toPSTDateKey(day.getTime())) || []).length === 0 ? (
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

    </div>
  );
}
// deploy 1775001337
