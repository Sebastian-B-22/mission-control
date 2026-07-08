"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorkSurfaceEmptyState, WorkSurfacePageHeader, WorkSurfaceStatCard } from "@/components/work-surface";
import { mergeCalendarDisplayEvents } from "@/lib/calendarDisplay";
import { getCategoryColor } from "@/lib/categoryColors";
import { inferCalendarRpmCategoryName } from "@/lib/rpmCategoryInference";
import { cn } from "@/lib/utils";
import { Activity, CalendarClock, Clock3, Gauge, Sparkles, Target } from "lucide-react";

type CalendarEvent = {
  _id?: string;
  source?: string;
  account?: string;
  calendarId?: string;
  externalId?: string;
  title: string;
  location?: string;
  startMs: number;
  endMs: number;
  allDay?: boolean;
  responseStatus?: string;
};

type TimeRating = {
  eventKey: string;
  quality?: number;
  energy?: "draining" | "neutral" | "energizing";
  note?: string;
};

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildEventKey(event: CalendarEvent) {
  return [
    event.source || "calendar",
    event.account || "account",
    event.calendarId || "calendar",
    event.externalId || event._id || event.title,
    event.startMs,
  ].join(":");
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

function formatDay(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function formatDayNumber(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function hoursBetween(startMs: number, endMs: number) {
  return Math.max(0, (endMs - startMs) / 36e5);
}

function dayKey(ms: number) {
  const d = new Date(ms);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(d);
}

function startOfDayMs(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayRangeMs(day: Date) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

function qualityTone(quality?: number) {
  if (!quality) return "text-ink-soft";
  if (quality >= 8) return "text-emerald-300";
  if (quality >= 5) return "text-amber-300";
  return "text-rose-300";
}

function energyLabel(energy?: TimeRating["energy"]) {
  if (energy === "energizing") return "Energizing";
  if (energy === "draining") return "Draining";
  if (energy === "neutral") return "Neutral";
  return "Energy";
}

export function TimeDashboardView({ userId }: { userId: Id<"users"> }) {
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const weekStart = useMemo(() => startOfWeekMonday(new Date()), []);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + index);
        return d;
      }),
    [weekStart]
  );

  const events =
    useQuery(api.calendarEvents.listRange, {
      userId,
      startMs: weekStart.getTime(),
      endMs: weekEnd.getTime(),
    }) || [];
  const categories = useQuery(api.rpm.getCategoriesByUser, { userId }) || [];
  const ratings =
    useQuery(api.timeBlocks.listRatingsForRange, {
      userId,
      startMs: weekStart.getTime(),
      endMs: weekEnd.getTime(),
    }) || [];

  const upsertRating = useMutation(api.timeBlocks.upsertRating);

  const categoryByName = useMemo(() => {
    const map = new Map<string, any>();
    for (const category of categories as any[]) {
      map.set(category.name, category);
    }
    return map;
  }, [categories]);

  const ratingByKey = useMemo(() => {
    const map = new Map<string, TimeRating>();
    for (const rating of ratings as TimeRating[]) {
      map.set(rating.eventKey, rating);
    }
    return map;
  }, [ratings]);

  const timeBlocks = useMemo(() => {
    return mergeCalendarDisplayEvents(events as any)
      .map((event: CalendarEvent) => {
        const categoryName = inferCalendarRpmCategoryName(event);
        const category = categoryName ? categoryByName.get(categoryName) : undefined;
        const eventKey = buildEventKey(event);
        const rating = ratingByKey.get(eventKey);
        return {
          ...event,
          eventKey,
          category,
          categoryName,
          rating,
          hours: event.allDay ? 0 : hoursBetween(event.startMs, event.endMs),
        };
      })
      .sort((a, b) => a.startMs - b.startMs);
  }, [categoryByName, events, ratingByKey]);

  const blocksByDay = useMemo(() => {
    const map = new Map<string, typeof timeBlocks>();
    for (const day of weekDays) {
      map.set(dayKey(day.getTime()), []);
    }

    for (const block of timeBlocks) {
      for (const day of weekDays) {
        const range = dayRangeMs(day);
        if (block.startMs < range.endMs && block.endMs > range.startMs) {
          map.get(dayKey(day.getTime()))?.push(block);
        }
      }
    }

    for (const blocks of map.values()) {
      blocks.sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return a.startMs - b.startMs;
      });
    }

    return map;
  }, [timeBlocks, weekDays]);

  const stats = useMemo(() => {
    const scheduledHours = timeBlocks.reduce((sum, block) => sum + block.hours, 0);
    const rated = timeBlocks.filter((block) => block.rating?.quality);
    const averageQuality = rated.length
      ? rated.reduce((sum, block) => sum + (block.rating?.quality || 0), 0) / rated.length
      : 0;
    const categoryHours = new Map<string, number>();
    for (const block of timeBlocks) {
      const name = block.categoryName || "Unsorted";
      categoryHours.set(name, (categoryHours.get(name) || 0) + block.hours);
    }
    const topCategory = [...categoryHours.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      scheduledHours,
      ratedCount: rated.length,
      averageQuality,
      topCategory,
      categoryHours: [...categoryHours.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [timeBlocks]);

  const saveRating = async (
    block: (typeof timeBlocks)[number],
    updates: Pick<TimeRating, "quality" | "energy" | "note">
  ) => {
    await upsertRating({
      userId,
      eventKey: block.eventKey,
      title: block.title,
      startMs: block.startMs,
      endMs: block.endMs,
      categoryId: block.category?._id,
      categoryName: block.categoryName,
      quality: updates.quality ?? block.rating?.quality,
      energy: updates.energy ?? block.rating?.energy,
      note: updates.note ?? block.rating?.note,
    });
  };

  return (
    <div className="space-y-6">
      <WorkSurfacePageHeader
        title="Time"
        description="See where the week is going, color-coded by RPM category, then qualify the blocks that mattered."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <WorkSurfaceStatCard
          label="Scheduled"
          value={`${Math.round(stats.scheduledHours)}h`}
          description="Calendar time this week"
          icon={<Clock3 className="h-5 w-5 text-amber-400" />}
          size="compact"
        />
        <WorkSurfaceStatCard
          label="Qualified"
          value={stats.ratedCount}
          description="Blocks with quality ratings"
          icon={<Gauge className="h-5 w-5 text-emerald-400" />}
          size="compact"
          tone="success"
        />
        <WorkSurfaceStatCard
          label="Avg Quality"
          value={stats.averageQuality ? stats.averageQuality.toFixed(1) : "-"}
          description="Rated blocks only"
          icon={<Sparkles className="h-5 w-5 text-violet-400" />}
          size="compact"
          tone="accent"
        />
        <WorkSurfaceStatCard
          label="Top RPM"
          value={stats.topCategory ? `${stats.topCategory[1].toFixed(1)}h` : "-"}
          description={stats.topCategory?.[0] || "No blocks yet"}
          icon={<Target className="h-5 w-5 text-sky-400" />}
          size="compact"
          tone="info"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="border-line bg-card shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarClock className="h-5 w-5 text-amber-400" />
              Week Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeBlocks.length === 0 ? (
              <WorkSurfaceEmptyState
                icon={<CalendarClock className="h-8 w-8" />}
                title="No timed calendar blocks found"
                description="Run the calendar sync or add a manual event to start building the time picture."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-7">
                {weekDays.map((day) => {
                  const key = dayKey(day.getTime());
                  const dayBlocks = blocksByDay.get(key) || [];
                  const today = key === dayKey(Date.now());

                  return (
                    <section
                      key={key}
                      className={cn(
                        "min-h-[260px] rounded-lg border border-line bg-surface-0/50",
                        today && "border-amber-400/60 bg-amber-950/10"
                      )}
                    >
                      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card/95 px-3 py-2 backdrop-blur">
                        <div>
                          <div className="text-xs font-medium uppercase text-ink-faint">{formatDay(day.getTime())}</div>
                          <div className="text-2xl font-semibold leading-none text-ink">{formatDayNumber(day.getTime())}</div>
                        </div>
                        <div className="rounded-full border border-line bg-surface-1 px-2 py-1 text-xs text-ink-soft">
                          {dayBlocks.length}
                        </div>
                      </div>

                      <div className="space-y-2 p-2">
                        {dayBlocks.length === 0 ? (
                          <div className="rounded-md border border-dashed border-line px-3 py-6 text-center text-sm text-ink-faint">
                            Open
                          </div>
                        ) : (
                          dayBlocks.map((block) => {
                            const colors = getCategoryColor(block.categoryName);
                            const noteValue = noteDrafts[block.eventKey] ?? block.rating?.note ?? "";
                            const startsOnThisDay = dayKey(block.startMs) === key || startOfDayMs(block.startMs) < day.getTime();

                            return (
                              <div
                                key={`${key}:${block.eventKey}`}
                                className={cn("rounded-md border bg-surface-1 p-3", colors.surface)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
                                      {block.allDay ? (
                                        <span>All day</span>
                                      ) : (
                                        <span>
                                          {formatTime(Math.max(block.startMs, dayRangeMs(day).startMs))} -{" "}
                                          {formatTime(Math.min(block.endMs, dayRangeMs(day).endMs))}
                                        </span>
                                      )}
                                      {!block.allDay && startsOnThisDay ? <span>{block.hours.toFixed(1)}h</span> : null}
                                    </div>
                                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-ink">{block.title}</h3>
                                  </div>
                                  {block.rating?.quality ? (
                                    <span className={cn("shrink-0 text-sm font-semibold", qualityTone(block.rating.quality))}>
                                      {block.rating.quality}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <Badge variant="outline" className={cn("max-w-full truncate text-[11px]", colors.badge)}>
                                    {block.categoryName || "Unsorted"}
                                  </Badge>
                                  {block.rating?.energy ? (
                                    <Badge variant="outline" className="border-line bg-surface-2 text-[11px] text-ink-soft">
                                      {energyLabel(block.rating.energy)}
                                    </Badge>
                                  ) : null}
                                </div>

                                <div className="mt-3 grid grid-cols-[78px_minmax(0,1fr)] gap-2">
                                  <select
                                    aria-label={`Quality rating for ${block.title}`}
                                    value={block.rating?.quality ?? ""}
                                    onChange={(event) => saveRating(block, { quality: Number(event.target.value) })}
                                    className="h-8 rounded-md border border-line bg-surface-0 px-2 text-sm text-ink outline-none focus:border-brand"
                                  >
                                    <option value="">Rate</option>
                                    {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                                      <option key={score} value={score}>
                                        {score}/10
                                      </option>
                                    ))}
                                  </select>
                                  <div className="grid grid-cols-3 gap-1">
                                    {(["draining", "neutral", "energizing"] as const).map((energy) => (
                                      <Button
                                        key={energy}
                                        size="sm"
                                        variant={block.rating?.energy === energy ? "default" : "outline"}
                                        onClick={() => saveRating(block, { energy })}
                                        className="h-8 px-1 text-[11px]"
                                      >
                                        {energyLabel(energy)}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_52px] gap-2">
                                  <Input
                                    value={noteValue}
                                    onChange={(event) =>
                                      setNoteDrafts((drafts) => ({ ...drafts, [block.eventKey]: event.target.value }))
                                    }
                                    placeholder="Note..."
                                    className="h-8 bg-surface-0 text-sm"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => saveRating(block, { note: noteValue })}
                                    className="h-8 px-2"
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-line bg-card shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-emerald-400" />
                RPM Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.categoryHours.map(([name, hours]) => {
                const colors = getCategoryColor(name === "Unsorted" ? undefined : name);
                const percent = stats.scheduledHours ? Math.round((hours / stats.scheduledHours) * 100) : 0;

                return (
                  <div key={name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-ink-soft">{name}</span>
                      <span className="shrink-0 font-medium tabular-nums text-ink">{hours.toFixed(1)}h</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className={cn("h-full rounded-full", colors.bg)} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
