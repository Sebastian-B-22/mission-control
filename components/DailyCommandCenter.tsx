"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BriefcaseBusiness, CalendarClock, ChevronDown, ChevronUp, Plus, Star, Trash2 } from "lucide-react";
import { mergeCalendarDisplayEvents } from "@/lib/calendarDisplay";
import { getCategoryColor } from "@/lib/categoryColors";
import { inferCalendarRpmCategoryName, inferProjectTaskRpmCategoryName } from "@/lib/rpmCategoryInference";

type MonthlyHighlight = {
  id: string;
  categoryId: string;
  categoryName: string;
  text: string;
};

const STORAGE_KEY = "mission-control-monthly-highlights";

function loadHighlights(): MonthlyHighlight[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function dateBounds(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

export function DailyCommandCenter({ userId, date }: { userId: Id<"users">; date: string }) {
  const [highlights, setHighlights] = useState<MonthlyHighlight[]>([]);
  const [showAllGoals, setShowAllGoals] = useState(false);
  const [showAllBusiness, setShowAllBusiness] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("12:00");
  const [eventLocation, setEventLocation] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);
  const { startMs, endMs } = useMemo(() => dateBounds(date), [date]);

  const categories = useQuery(api.rpm.getCategoriesByUser, { userId }) || [];
  const events = useQuery(api.calendarEvents.listRange, { userId, startMs, endMs }) || [];
  const projectTasks = useQuery(api.projectTasks.getOpenTasks, { userId, limit: 12 }) || [];
  const createManualEvent = useMutation(api.calendarEvents.createManualEvent);
  const deleteManualEvent = useMutation(api.calendarEvents.deleteManualEvent);

  useEffect(() => {
    const refresh = () => setHighlights(loadHighlights());
    refresh();
    window.addEventListener("mission-control-monthly-highlights-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("mission-control-monthly-highlights-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const fallbackMonthly = useMemo(() => {
    return categories
      .flatMap((category: any) =>
        (category.monthlyFocus || []).map((text: string) => ({
          id: `${category._id}:${text}`,
          categoryId: category._id,
          categoryName: category.name,
          text,
        }))
      )
      .slice(0, 5);
  }, [categories]);

  const monthlyFocus = highlights.length > 0 ? highlights : fallbackMonthly;
  const pressureEvents = mergeCalendarDisplayEvents(events as any).slice(0, 4);
  const allBusinessTasks = projectTasks
    .filter((task: any) => task.project === "aspire" || task.project === "hta")
    .slice(0, 5);
  const visibleMonthlyFocus = showAllGoals ? monthlyFocus.slice(0, 5) : monthlyFocus.slice(0, 3);
  const visibleBusinessTasks = showAllBusiness ? allBusinessTasks : allBusinessTasks.slice(0, 3);

  const calendarCategoryStyle = (event: { title?: string; location?: string }) => {
    const categoryName = inferCalendarRpmCategoryName(event);
    const colors = getCategoryColor(categoryName);
    return { categoryName, colors };
  };

  const taskCategoryStyle = (task: { project?: string; subProject?: string; title?: string; description?: string }) => {
    const categoryName = inferProjectTaskRpmCategoryName(task);
    const colors = getCategoryColor(categoryName);
    return { categoryName, colors };
  };

  async function handleAddEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = eventTitle.trim();
    if (!title) return;

    setSavingEvent(true);
    try {
      const start = new Date(date + "T" + (eventTime || "12:00") + ":00");
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 60);
      await createManualEvent({
        userId,
        title,
        location: eventLocation.trim() || undefined,
        startMs: start.getTime(),
        endMs: end.getTime(),
        allDay: false,
      });
      setEventTitle("");
      setEventLocation("");
      setAddEventOpen(false);
    } finally {
      setSavingEvent(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <CalendarClock className="h-4 w-4 text-sky-400" />
                Calendar
              </span>
              <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Add daily calendar note">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <form onSubmit={handleAddEvent} className="space-y-4">
                    <DialogHeader>
                      <DialogTitle>Add Daily Calendar Note</DialogTitle>
                      <DialogDescription>
                        Add a plan or thing-that-happened to this day without touching Google Calendar.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="daily-event-title">Title</Label>
                      <Input
                        id="daily-event-title"
                        value={eventTitle}
                        onChange={(event) => setEventTitle(event.target.value)}
                        placeholder="Farm tour"
                        autoComplete="off"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="daily-event-time">Time</Label>
                        <Input
                          id="daily-event-time"
                          type="time"
                          value={eventTime}
                          onChange={(event) => setEventTime(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="daily-event-location">Location</Label>
                        <Input
                          id="daily-event-location"
                          value={eventLocation}
                          onChange={(event) => setEventLocation(event.target.value)}
                          placeholder="Optional"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={savingEvent || !eventTitle.trim()}>
                        {savingEvent ? "Adding..." : "Add"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>What compresses the day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-4">
            {pressureEvents.length > 0 ? pressureEvents.map((event: any) => {
              const category = calendarCategoryStyle(event);
              return (
              <div key={event._id} className={`rounded-md border px-2.5 py-2 ${category.categoryName ? category.colors.surface : "bg-background/70"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate text-sm font-medium">{event.title}</div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {category.categoryName ? (
                      <Badge variant="outline" className={`hidden text-[10px] sm:inline-flex ${category.colors.badge}`}>
                        {category.categoryName}
                      </Badge>
                    ) : null}
                    <Badge variant="outline">{event.allDay ? "All day" : formatTime(event.startMs)}</Badge>
                    {event.source === "manual" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={"Delete " + event.title}
                        onClick={() => deleteManualEvent({ eventId: event._id })}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {event.location && <div className="mt-1 truncate text-xs text-muted-foreground">{event.location}</div>}
              </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground">No calendar events synced for today.</p>
            )}
          </CardContent>
        </Card>

        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <BriefcaseBusiness className="h-4 w-4 text-emerald-400" />
              Business Queue
            </CardTitle>
            <CardDescription>Aspire + HTA open loops.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-4">
            {visibleBusinessTasks.length > 0 ? visibleBusinessTasks.map((task: any) => {
              const category = taskCategoryStyle(task);
              return (
              <div key={task._id} className={`rounded-md border px-2.5 py-2 ${category.categoryName ? category.colors.surface : "bg-background/70"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-sm font-medium leading-snug">{task.title}</div>
                  <div className="flex flex-shrink-0 flex-wrap justify-end gap-1">
                    {category.categoryName ? (
                      <Badge variant="outline" className={`text-[10px] ${category.colors.badge}`}>
                        {category.categoryName}
                      </Badge>
                    ) : null}
                    <Badge variant={task.priority === "high" ? "default" : "outline"} className="capitalize">{task.project}</Badge>
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {task.subProject}{task.dueDate ? ` - due ${task.dueDate}` : ""}
                </div>
              </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground">No open Aspire or HTA tasks in the queue.</p>
            )}
            {allBusinessTasks.length > 3 && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="w-full justify-center text-muted-foreground"
                onClick={() => setShowAllBusiness((open) => !open)}
              >
                {showAllBusiness ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showAllBusiness ? "Show less" : "Show " + (allBusinessTasks.length - 3) + " more"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 border-amber-500/30 bg-amber-500/5 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Top 3 Monthly Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4">
          {visibleMonthlyFocus.length > 0 ? visibleMonthlyFocus.map((goal) => {
            const colors = getCategoryColor(goal.categoryName);
            return (
            <div key={goal.id} className={`rounded-md border px-2.5 py-2 ${colors.surface}`}>
              <Badge variant="outline" className={`mb-1 text-[10px] ${colors.badge}`}>
                {goal.categoryName}
              </Badge>
              <div className="text-sm font-medium leading-snug">{goal.text}</div>
            </div>
            );
          }) : (
            <p className="text-sm text-muted-foreground">Add monthly needle movers in the Monthly tab.</p>
          )}
          {monthlyFocus.length > 3 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="w-full justify-center text-muted-foreground"
              onClick={() => setShowAllGoals((open) => !open)}
            >
              {showAllGoals ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showAllGoals ? "Show less" : "Show " + (monthlyFocus.length - 3) + " more"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
