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
import { ArrowDown, ArrowUp, CalendarDays, List, LayoutGrid, Plus, RotateCcw, Star, Trash2 } from "lucide-react";
import { getCategoryColor } from "@/lib/categoryColors";
import { mergeCalendarDisplayEvents } from "@/lib/calendarDisplay";
import { groupByCategory } from "@/lib/groupByCategory";
import { inferCalendarRpmCategoryName } from "@/lib/rpmCategoryInference";

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
  type CalendarEventWithRsvp = { responseStatus?: string };

  const monday = useMemo(() => startOfWeekMonday(new Date()), []);
  const nextMonday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    return d;
  }, [monday]);
  const previousMonday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7);
    return d;
  }, [monday]);

  const weekOf = useMemo(() => toWeekOfString(monday), [monday]);
  const previousWeekOf = useMemo(() => toWeekOfString(previousMonday), [previousMonday]);

  const events =
    useQuery(api.calendarEvents.listRange, {
      userId,
      startMs: monday.getTime(),
      endMs: nextMonday.getTime(),
    }) || [];
  const displayEvents = useMemo(() => mergeCalendarDisplayEvents(events as any), [events]);

  const goals = useQuery(api.weeklyGoals.listByWeek, { userId, weekOf }) || [];
  const addGoal = useMutation(api.weeklyGoals.add);
  const toggleDone = useMutation(api.weeklyGoals.toggleDone);
  const removeGoal = useMutation(api.weeklyGoals.remove);
  const setScheduledDay = useMutation(api.weeklyGoals.setScheduledDay);
  const updateGoalCategory = useMutation(api.weeklyGoals.updateGoalCategory);
  const reorderGoals = useMutation(api.weeklyGoals.reorderGoals);
  const toggleImportant = useMutation(api.weeklyGoals.toggleImportant);
  const carryOverUnchecked = useMutation(api.weeklyGoals.carryOverUnchecked);

  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const rpmCategories = useQuery(api.rpm.getCategoriesByUser, { userId }) || [];

  const [goalText, setGoalText] = useState("");
  const [goalCategoryId, setGoalCategoryId] = useState<string>("none");
  const [isCarryingOver, setIsCarryingOver] = useState(false);
  const [carryOverMessage, setCarryOverMessage] = useState("");

  const carryOverCandidates =
    useQuery(api.weeklyGoals.listCarryOverCandidates, {
      userId,
      fromWeekOf: previousWeekOf,
      toWeekOf: weekOf,
    }) || [];

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
    const map = new Map<string, typeof displayEvents>();
    
    // Initialize map with all 7 days using YYYY-MM-DD keys
    for (const day of days) {
      const key = toPSTDateKey(day.getTime());
      map.set(key, []);
    }
    
    // Group events by day (PST timezone)
    for (const e of displayEvents) {
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
  }, [displayEvents, days]);

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const getEventRsvpStyle = (responseStatus?: string) => {
    switch (responseStatus) {
      case "accepted":
        return "border-green-500/70 bg-green-500/10 ring-1 ring-green-500/20";
      case "declined":
        return "border-red-500/70 bg-red-500/10 ring-1 ring-red-500/20 opacity-75";
      case "tentative":
        return "border-amber-500/70 bg-amber-500/10 ring-1 ring-amber-500/20";
      default:
        return "";
    }
  };

  const getEventCategoryStyle = (event: { title?: string; location?: string }) => {
    const categoryName = inferCalendarRpmCategoryName(event);
    const colors = getCategoryColor(categoryName);

    return {
      categoryName,
      className: categoryName ? colors.surface : "",
      badgeClassName: colors.badge,
    };
  };

  const getEventRsvpBadge = (responseStatus?: string) => {
    switch (responseStatus) {
      case "accepted":
        return <Badge className="bg-green-600 text-white hover:bg-green-600">Joined</Badge>;
      case "declined":
        return <Badge className="bg-red-600 text-white hover:bg-red-600">Declined</Badge>;
      case "tentative":
        return <Badge className="bg-amber-500 text-black hover:bg-amber-500">Maybe</Badge>;
      default:
        return null;
    }
  };

  // Group goals by category for display
  const groupedGoals = useMemo(
    () => groupByCategory(goals, rpmCategories),
    [goals, rpmCategories]
  );
  const importantGoals = useMemo(() => goals.filter((g: any) => g.important), [goals]);
  const openImportantGoalCount = useMemo(
    () => importantGoals.filter((g: any) => !g.done).length,
    [importantGoals]
  );
  const fridayFinisherGroups = useMemo(() => {
    const groups = new Map<number | "any", typeof importantGoals>();

    for (const goal of importantGoals) {
      const key = typeof goal.scheduledDay === "number" ? goal.scheduledDay : "any";
      const group = groups.get(key) ?? [];
      group.push(goal);
      groups.set(key, group);
    }

    return [...groups.entries()]
      .sort(([a], [b]) => {
        const aValue = a === "any" ? 7 : a;
        const bValue = b === "any" ? 7 : b;
        return aValue - bValue;
      })
      .map(([scheduledDay, group]) => ({
        scheduledDay,
        goals: [...group].sort((a: any, b: any) => {
          if (Boolean(a.done) !== Boolean(b.done)) return a.done ? 1 : -1;
          return (a.order ?? 0) - (b.order ?? 0);
        }),
      }));
  }, [importantGoals]);
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

  const handleCarryOver = async () => {
    setIsCarryingOver(true);
    setCarryOverMessage("");
    try {
      const result = await carryOverUnchecked({ userId, fromWeekOf: previousWeekOf, toWeekOf: weekOf });
      setCarryOverMessage(
        result.copied > 0
          ? `Carried over ${result.copied} unfinished task${result.copied === 1 ? "" : "s"}.`
          : "No unfinished tasks left to carry over."
      );
    } finally {
      setIsCarryingOver(false);
    }
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

      {/* Calendar */}
      {mode === "agenda" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2 border-yellow-400/60 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.08)] dark:border-yellow-400/50 dark:bg-yellow-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                Friday Finishers ({openImportantGoalCount} open / {importantGoals.length} total)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {importantGoals.length > 0 ? (
                fridayFinisherGroups.map((group) => (
                  <div key={String(group.scheduledDay)} className="space-y-1.5">
                    {fridayFinisherGroups.length > 1 ? (
                      <div className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {group.scheduledDay === "any" ? "Anytime" : DAY_NAMES[group.scheduledDay]}
                      </div>
                    ) : null}
                    {group.goals.map((g: any) => (
                      <div key={g._id} className={`flex items-center justify-between gap-2 rounded border bg-background/70 p-2 text-sm ${g.done ? "opacity-70" : ""}`}>
                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={g.done}
                            onChange={async (e) => toggleDone({ goalId: g._id, done: e.target.checked })}
                          />
                          <span className={g.done ? "line-through text-muted-foreground" : ""}>{g.text}</span>
                        </label>
                        <div className="flex shrink-0 items-center gap-1">
                          {g.categoryId ? (
                            <Badge variant="outline" className={`text-xs ${getCategoryColor(rpmCategories.find((c) => c._id === g.categoryId)?.name).badge}`}>
                              {rpmCategories.find((c) => c._id === g.categoryId)?.name}
                            </Badge>
                          ) : null}
                          {g.done ? (
                            <Badge variant="outline" className="text-xs border-emerald-500/50 bg-emerald-500/10 text-emerald-300">
                              Done
                            </Badge>
                          ) : null}
                          <Badge variant="outline" className="text-xs">
                            {g.scheduledDay === undefined ? "Any" : DAY_NAMES[g.scheduledDay]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Star your must-finish tasks for the week and they’ll collect here.</p>
              )}
            </CardContent>
          </Card>

          {days.map((day, dayIndex) => {
            const dayKey = toPSTDateKey(day.getTime());
            const list = eventsByDay.get(dayKey) || [];
            const dayGoals = goals.filter(g => g.scheduledDay === dayIndex);
            const hasContent = list.length > 0 || dayGoals.length > 0;
            return (
              <Card key={day.toISOString()} className="border-2 border-zinc-600/80 bg-card shadow-sm dark:border-zinc-500/80">
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
                    list.map((e) => {
                      const responseStatus = (e as typeof e & CalendarEventWithRsvp).responseStatus;
                      const eventCategory = getEventCategoryStyle(e);
                      return (
                      <div key={e._id} className={`rounded border p-2 text-sm ${eventCategory.className} ${getEventRsvpStyle(responseStatus)}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{e.title}</div>
                          <div className="flex shrink-0 items-center gap-1">
                            {eventCategory.categoryName ? (
                              <Badge variant="outline" className={`text-xs ${eventCategory.badgeClassName}`}>
                                {eventCategory.categoryName}
                              </Badge>
                            ) : null}
                            {getEventRsvpBadge(responseStatus)}
                            <Badge variant="outline" className="text-xs">
                              {e.allDay ? "All day" : `${formatTime(e.startMs)} - ${formatTime(e.endMs)}`}
                            </Badge>
                          </div>
                        </div>
                        {e.location ? (
                          <div className="text-xs text-muted-foreground mt-1">{e.location}</div>
                        ) : null}
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {e.account}
                        </div>
                      </div>
                      );
                    })
                  ) : !dayGoals.length ? (
                    <p className="text-xs text-muted-foreground">No events</p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Unassigned / Anytime ({unassignedGoals.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {unassignedGoals.length > 0 ? (
                unassignedGoals.map((g: any) => (
                  <div key={g._id} className="flex items-center justify-between gap-2 text-sm">
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={g.done}
                        onChange={async (e) => toggleDone({ goalId: g._id, done: e.target.checked })}
                        className="h-3 w-3"
                      />
                      <span>{g.important ? "⭐ " : ""}{g.text}</span>
                    </label>
                    <Select
                      value="none"
                      onValueChange={async (v) => {
                        await setScheduledDay({ goalId: g._id, scheduledDay: v === "none" ? null : parseInt(v) });
                      }}
                    >
                      <SelectTrigger className="w-[80px] h-7 text-xs">
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
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Time Block Grid (simple)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => (
                <div key={day.toISOString()} className="rounded border-2 border-zinc-600/80 p-2 dark:border-zinc-500/80">
                  <div className="text-xs font-semibold mb-2">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                    <span className="text-muted-foreground"> {day.getDate()}</span>
                  </div>
                  <div className="space-y-2">
                    {(eventsByDay.get(toPSTDateKey(day.getTime())) || []).map((e) => {
                      const responseStatus = (e as typeof e & CalendarEventWithRsvp).responseStatus;
                      const eventCategory = getEventCategoryStyle(e);
                      return (
                      <div key={e._id} className={`rounded border p-2 text-xs ${eventCategory.className} ${getEventRsvpStyle(responseStatus)}`}>
                        <div className="font-medium">{e.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-muted-foreground">
                          {eventCategory.categoryName ? (
                            <Badge variant="outline" className={`text-[10px] ${eventCategory.badgeClassName}`}>
                              {eventCategory.categoryName}
                            </Badge>
                          ) : null}
                          {getEventRsvpBadge(responseStatus)}
                          <span>{e.allDay ? "All day" : `${formatTime(e.startMs)} - ${formatTime(e.endMs)}`}</span>
                        </div>
                      </div>
                      );
                    })}
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

      {/* Goals by Category */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-base">Weekly Goals by Category</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Plan this week, then delete anything that no longer applies.
              </p>
            </div>
            {carryOverCandidates.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCarryOver}
                disabled={isCarryingOver}
                className="w-full md:w-auto"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {isCarryingOver ? "Carrying over..." : `Carry over ${carryOverCandidates.length}`}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {carryOverCandidates.length > 0 ? (
            <div className="rounded border border-amber-400/50 bg-amber-500/10 p-3">
              <div className="text-sm font-medium">
                {carryOverCandidates.length} unfinished task{carryOverCandidates.length === 1 ? "" : "s"} from last week
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Carry them into this week with their category, day, and Friday Finisher star intact.
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {carryOverCandidates.slice(0, 6).map((goal: any) => (
                  <Badge key={goal._id} variant="outline" className="bg-background/70">
                    {goal.text}
                  </Badge>
                ))}
                {carryOverCandidates.length > 6 ? (
                  <Badge variant="outline" className="bg-background/70">
                    +{carryOverCandidates.length - 6} more
                  </Badge>
                ) : null}
              </div>
            </div>
          ) : null}
          {carryOverMessage ? (
            <p className="text-xs text-muted-foreground">{carryOverMessage}</p>
          ) : null}
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
                      className={`flex items-center justify-between gap-3 rounded border p-2 ${group.categoryName ? getCategoryColor(group.categoryName).border : ""} ${g.important && !g.done ? "ring-1 ring-yellow-300/70" : ""}`}
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
                          <SelectTrigger className="w-[80px] h-7 text-xs">
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

    </div>
  );
}
// deploy 1775001337
