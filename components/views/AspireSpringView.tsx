"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Users,
} from "lucide-react";

interface AspireSpringViewProps {
  userId: Id<"users">;
  onNavigate: (view: string) => void;
}

const WEEKDAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function comparePracticeDayLabels(a: string, b: string) {
  const normalize = (value: string) => value.trim().toLowerCase();

  const getSortMeta = (value: string) => {
    const normalized = normalize(value);
    const weekdayIndex = WEEKDAY_ORDER.findIndex(
      (weekday) => normalized === weekday || normalized.startsWith(`${weekday} `)
    );

    if (weekdayIndex !== -1) {
      return { bucket: 0, order: weekdayIndex, normalized };
    }

    if (normalized === "unassigned") {
      return { bucket: 2, order: 999, normalized };
    }

    return { bucket: 1, order: 999, normalized };
  };

  const aMeta = getSortMeta(a);
  const bMeta = getSortMeta(b);

  if (aMeta.bucket !== bMeta.bucket) return aMeta.bucket - bMeta.bucket;
  if (aMeta.order !== bMeta.order) return aMeta.order - bMeta.order;
  return aMeta.normalized.localeCompare(bMeta.normalized);
}

function RegionOpsCard({
  title,
  registeredCount,
  regionSummary,
  openTaskCount,
  nextView,
  taskView,
  onNavigate,
}: {
  title: string;
  registeredCount: number;
  regionSummary: any;
  openTaskCount: number;
  nextView: string;
  taskView: string;
  onNavigate: (view: string) => void;
}) {
  const isAgoura = title.toLowerCase() === "agoura";
  const accentCard = isAgoura
    ? "border-red-500/20 bg-red-500/[0.05]"
    : "border-amber-500/20 bg-amber-500/[0.05]";
  const accentBadge = isAgoura
    ? "bg-red-500/10 text-red-300 border-red-500/20"
    : "bg-amber-500/10 text-amber-300 border-amber-500/20";

  return (
    <Card className={accentCard}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>{title}</CardTitle>
              <Badge variant="outline" className={accentBadge}>{registeredCount} registered</Badge>
            </div>
            <CardDescription>
              Registration demand, roster pressure, and region-specific cleanup.
            </CardDescription>
          </div>
          <Badge variant="outline">{openTaskCount} open tasks</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Registrations</div>
            <div className="text-2xl font-bold">{registeredCount}</div>
          </div>
          <div className="rounded-lg border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Players in CRM</div>
            <div className="text-2xl font-bold">{regionSummary?.playerCount ?? 0}</div>
          </div>
          <div className="rounded-lg border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Families in CRM</div>
            <div className="text-2xl font-bold">{regionSummary?.familyCount ?? 0}</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-medium">Practice day demand</div>
            <div className="flex flex-wrap gap-2">
              {(regionSummary?.practiceDays || []).slice(0, 6).map((item: any) => (
                <Badge key={item.label} variant="secondary">
                  {item.label}: {item.count}
                </Badge>
              ))}
              {(!regionSummary?.practiceDays || regionSummary.practiceDays.length === 0) && (
                <span className="text-sm text-muted-foreground">No practice day data yet</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Division mix</div>
            <div className="flex flex-wrap gap-2">
              {(regionSummary?.divisions || []).slice(0, 6).map((item: any) => (
                <Badge key={item.label} variant="secondary">
                  {item.label}: {item.count}
                </Badge>
              ))}
              {(!regionSummary?.divisions || regionSummary.divisions.length === 0) && (
                <span className="text-sm text-muted-foreground">No division data yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={regionSummary?.missingPracticeDayCount ? "destructive" : "outline"}>
            {regionSummary?.missingPracticeDayCount ?? 0} missing practice day
          </Badge>
          <Badge variant={regionSummary?.missingDivisionCount ? "destructive" : "outline"}>
            {regionSummary?.missingDivisionCount ?? 0} missing division
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onNavigate(nextView)}>
            Open region ops
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => onNavigate(taskView)}>
            Open task backlog
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RosterGroupCard({ group }: { group: any }) {
  const previewPlayers = group.players.slice(0, 10);
  const remainingCount = Math.max(0, group.players.length - previewPlayers.length);
  const isAgoura = group.regionKey === "agoura";
  const accentCard = isAgoura
    ? "border-red-500/20 bg-red-500/[0.05]"
    : "border-amber-500/20 bg-amber-500/[0.05]";
  const accentBadge = isAgoura
    ? "bg-red-500/10 text-red-300 border-red-500/20"
    : "bg-amber-500/10 text-amber-300 border-amber-500/20";

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${accentCard}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className={accentBadge}>{group.practiceDay}</Badge>
            <span className="text-xs text-muted-foreground">{group.regionLabel}</span>
          </div>
          <div className="text-lg font-semibold">{group.division}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">{group.playerCount}</div>
          <div className="text-xs text-muted-foreground">players</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{group.familyCount} families</Badge>
        {(group.practiceDay === "Unassigned" || group.division === "Unassigned") && (
          <Badge variant="destructive">Needs cleanup</Badge>
        )}
      </div>

      <div className="space-y-2">
        {previewPlayers.map((player: any) => (
          <div key={`${player.childName}-${player.familyName}`} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{player.childName}</span>
            <span className="text-muted-foreground text-right">{player.familyName}</span>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="text-sm text-muted-foreground">+ {remainingCount} more players</div>
        )}
      </div>
    </div>
  );
}

function RosterDaySection({
  day,
  groups,
  expanded,
  onToggle,
}: {
  day: string;
  groups: any[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const playerCount = groups.reduce((sum, group) => sum + group.playerCount, 0);
  const familyCount = groups.reduce((sum, group) => sum + group.familyCount, 0);
  const needsCleanup = groups.some((group) => group.practiceDay === "Unassigned" || group.division === "Unassigned");

  return (
    <div className="rounded-xl border border-white/8 bg-black/20 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-white/5 transition-colors"
      >
        <div>
          <div className="font-semibold text-white">{day}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-300">
            <Badge variant="secondary">{groups.length} group{groups.length === 1 ? "" : "s"}</Badge>
            <Badge variant="secondary">{playerCount} players</Badge>
            <Badge variant="secondary">{familyCount} families</Badge>
            {needsCleanup ? <Badge variant="destructive">Needs cleanup</Badge> : null}
          </div>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-zinc-300" /> : <ChevronRight className="h-4 w-4 text-zinc-300" />}
      </button>

      {expanded ? (
        <div className="border-t border-white/8 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((group: any) => (
              <RosterGroupCard key={`${group.regionKey}-${group.practiceDay}-${group.division}`} group={group} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AspireSpringView({ userId, onNavigate }: AspireSpringViewProps) {
  const [expandedRosterSections, setExpandedRosterSections] = useState<Record<string, boolean>>({});
  const counts = useQuery(api.registrations.getAllCounts) || [];
  const springSummary = useQuery(api.families.getSpringLeagueSummary);
  const agouraTasks = useQuery(api.projectTasks.getTasksByProject, {
    userId,
    project: "aspire",
    subProject: "spring-agoura",
  }) || [];
  const paliTasks = useQuery(api.projectTasks.getTasksByProject, {
    userId,
    project: "aspire",
    subProject: "spring-pali",
  }) || [];

  const registrationSnapshotMap = useMemo(
    () => Object.fromEntries(counts.map((item: any) => [item.program, item])),
    [counts]
  );

  const countsMap = useMemo(
    () => Object.fromEntries(counts.map((item: any) => [item.program, item.count])),
    [counts]
  );

  const springCountFreshCutoff = Date.now() - 1000 * 60 * 60 * 24 * 7;

  const openAgouraTasks = agouraTasks.filter((task: any) => task.status !== "done");
  const openPaliTasks = paliTasks.filter((task: any) => task.status !== "done");
  const openTaskCount = openAgouraTasks.length + openPaliTasks.length;

  const agouraSummary = springSummary?.byRegion?.find((region: any) => region.regionKey === "agoura");
  const paliSummary = springSummary?.byRegion?.find((region: any) => region.regionKey === "pali");
  const agouraSpringCountIsStale = !registrationSnapshotMap["spring-agoura"] || registrationSnapshotMap["spring-agoura"].lastUpdated < springCountFreshCutoff;
  const paliSpringCountIsStale = !registrationSnapshotMap["spring-pali"] || registrationSnapshotMap["spring-pali"].lastUpdated < springCountFreshCutoff;
  const agouraSpringCount = agouraSpringCountIsStale && agouraSummary?.playerCount ? agouraSummary.playerCount : (countsMap["spring-agoura"] || 0);
  const paliSpringCount = paliSpringCountIsStale && paliSummary?.playerCount ? paliSummary.playerCount : (countsMap["spring-pali"] || 0);

  const cleanupCount =
    (springSummary?.playersMissingRegion || 0) +
    (springSummary?.playersMissingDivision || 0) +
    (springSummary?.playersMissingPracticeDay || 0);

  const agouraRosterGroups = (springSummary?.rosterGroups || []).filter(
    (group: any) => group.regionKey === "agoura"
  );
  const paliRosterGroups = (springSummary?.rosterGroups || []).filter(
    (group: any) => group.regionKey === "pali"
  );

  const agouraGroupsByDay = useMemo(() => {
    return agouraRosterGroups.reduce((acc: Record<string, any[]>, group: any) => {
      (acc[group.practiceDay] ||= []).push(group);
      return acc;
    }, {});
  }, [agouraRosterGroups]);

  const paliGroupsByDay = useMemo(() => {
    return paliRosterGroups.reduce((acc: Record<string, any[]>, group: any) => {
      (acc[group.practiceDay] ||= []).push(group);
      return acc;
    }, {});
  }, [paliRosterGroups]);

  const priorityTasks = [...openAgouraTasks, ...openPaliTasks]
    .sort((a: any, b: any) => {
      const priorityScore = { high: 0, medium: 1, low: 2 } as Record<string, number>;
      const dueA = a.dueDate || "9999-99-99";
      const dueB = b.dueDate || "9999-99-99";
      if (dueA !== dueB) return dueA.localeCompare(dueB);
      return priorityScore[a.priority] - priorityScore[b.priority];
    })
    .slice(0, 6);

  const toggleRosterSection = (key: string) => {
    setExpandedRosterSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Spring League Ops</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onNavigate("aspire-families")}>
            <Users className="h-4 w-4 mr-2" />
            Family CRM
          </Button>
          <Button variant="outline" onClick={() => onNavigate("aspire-coach-hub")}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Coach Hub
          </Button>
        </div>
      </div>

      <Card className="border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 shadow-[0_0_40px_rgba(245,158,11,0.04)]">
        <CardContent className="p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-rose-400/35 bg-gradient-to-br from-rose-500/28 via-red-500/12 to-slate-950 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-rose-100/90">Agoura spring</div>
              <div className="text-3xl font-semibold mt-2 text-white">{agouraSpringCount}</div>
              <div className="mt-1 text-sm text-zinc-300">{agouraSpringCountIsStale ? "Live CRM count" : "Registrations tracked"}</div>
            </div>
            <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/28 via-orange-500/12 to-slate-950 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-amber-100/90">Pali spring</div>
              <div className="text-3xl font-semibold mt-2 text-white">{paliSpringCount}</div>
              <div className="mt-1 text-sm text-zinc-300">{paliSpringCountIsStale ? "Live CRM count" : "Registrations tracked"}</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/28 via-teal-500/12 to-slate-950 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/90">Players mapped</div>
              <div className="text-3xl font-semibold mt-2 text-white">{springSummary?.totalPlayers ?? "-"}</div>
              <div className="mt-1 text-sm text-zinc-300">{springSummary?.totalFamilies ?? 0} families</div>
            </div>
            <div className="rounded-2xl border border-cyan-400/35 bg-gradient-to-br from-cyan-500/26 via-sky-500/12 to-slate-950 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/90">Needs cleanup</div>
              <div className="text-3xl font-semibold mt-2 text-white">{cleanupCount}</div>
              <div className="mt-1 text-sm text-zinc-300">{openTaskCount} open ops tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {((countsMap["spring-agoura"] || 0) + (countsMap["spring-pali"] || 0) > 0) && (springSummary?.totalPlayers || 0) === 0 && (
        <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <CardTitle>Registration counts exist, but roster data is not normalized yet</CardTitle>
                <CardDescription>
                  Spring totals are showing from the registration counter layer, but there are currently no Spring enrollments
                  mapped into the families and enrollments tables. That means rosters, grouping, and staffing views are still
                  missing their source-of-truth layer.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <RegionOpsCard
          title="Agoura"
          registeredCount={agouraSpringCount}
          regionSummary={agouraSummary}
          openTaskCount={openAgouraTasks.length}
          nextView="aspire-families"
          taskView="aspire-agoura"
          onNavigate={onNavigate}
        />
        <RegionOpsCard
          title="Pali"
          registeredCount={paliSpringCount}
          regionSummary={paliSummary}
          openTaskCount={openPaliTasks.length}
          nextView="aspire-families"
          taskView="aspire-pali"
          onNavigate={onNavigate}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agoura roster builder</CardTitle>
            <CardDescription>
              Tap a practice day to open just that roster slice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!springSummary ? (
              <p className="text-sm text-muted-foreground">Loading Agoura roster groups...</p>
            ) : agouraRosterGroups.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No Agoura roster groups yet.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(agouraGroupsByDay)
                  .sort(([a], [b]) => comparePracticeDayLabels(a, b))
                  .map(([day, groups]) => (
                    <RosterDaySection
                      key={`agoura-${day}`}
                      day={day}
                      groups={groups}
                      expanded={!!expandedRosterSections[`agoura-${day}`]}
                      onToggle={() => toggleRosterSection(`agoura-${day}`)}
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pali roster builder</CardTitle>
            <CardDescription>
              Same structure, without forcing you through one giant scroll.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!springSummary ? (
              <p className="text-sm text-muted-foreground">Loading Pali roster groups...</p>
            ) : paliRosterGroups.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No Pali roster groups yet.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(paliGroupsByDay)
                  .sort(([a], [b]) => comparePracticeDayLabels(a, b))
                  .map(([day, groups]) => (
                    <RosterDaySection
                      key={`pali-${day}`}
                      day={day}
                      groups={groups}
                      expanded={!!expandedRosterSections[`pali-${day}`]}
                      onToggle={() => toggleRosterSection(`pali-${day}`)}
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Roster cleanup queue</CardTitle>
            <CardDescription>
              These are the records most likely to break grouping, staffing, or schedule communication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!springSummary ? (
              <p className="text-sm text-muted-foreground">Loading spring roster summary...</p>
            ) : springSummary.missingAssignments.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Nice, there are no obvious missing region, division, or practice day assignments right now.
              </div>
            ) : (
              <div className="space-y-3">
                {springSummary.missingAssignments.map((item: any) => (
                  <div key={`${item.familyName}-${item.childName}`} className="rounded-lg border p-3">
                    <div className="font-medium">{item.childName}</div>
                    <div className="text-sm text-muted-foreground">{item.familyName}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">{item.regionLabel}</Badge>
                      {item.missing.map((field: string) => (
                        <Badge key={field} variant="destructive">
                          Missing {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next ops follow-ups</CardTitle>
            <CardDescription>
              The most important remaining actions across both regions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {priorityTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open Spring League tasks right now.</p>
            ) : (
              <div className="space-y-3">
                {priorityTasks.map((task: any) => (
                  <div key={task._id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {task.subProject === "spring-agoura" ? "Agoura" : "Pali"}
                          {task.assignedTo?.name ? ` · ${task.assignedTo.name}` : " · Unassigned"}
                        </div>
                      </div>
                      <Badge variant={task.priority === "high" ? "destructive" : "outline"}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {task.dueDate || "No due date set"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="spring-agoura"
          title="Agoura Spring backlog"
          description="Execution tasks for the Agoura side of Spring League"
          headerExtra={
            <div className="flex items-center gap-1.5 bg-green-900/50 text-green-400 px-2 py-1 rounded-full text-sm font-medium">
              <Users className="w-3.5 h-3.5" />
              {agouraSpringCount} live
            </div>
          }
        />
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="spring-pali"
          title="Pali Spring backlog"
          description="Execution tasks for the Pali side of Spring League"
          headerExtra={
            <div className="flex items-center gap-1.5 bg-green-900/50 text-green-400 px-2 py-1 rounded-full text-sm font-medium">
              <Users className="w-3.5 h-3.5" />
              {paliSpringCount} live
            </div>
          }
        />
      </div>

    </div>
  );
}
