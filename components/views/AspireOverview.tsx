"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { ArrowRight, Calendar } from "lucide-react";

interface AspireOverviewProps {
  userId: Id<"users">;
  onNavigate: (view: string) => void;
}

type NavCard = {
  title: string;
  description: string;
  view: string;
  buttonLabel: string;
  stats?: string[];
  tone: string;
  badgeTone: string;
  statTone: string;
  eyebrow: string;
};

const SUBPROJECT_LABELS: Record<string, string> = {
  ops: "Aspire Ops",
  pali: "Pali",
  agoura: "Agoura",
  "spring-agoura": "Spring Agoura",
  "spring-pali": "Spring Pali",
  "camps-agoura": "Camps Agoura",
  "camps-pali": "Camps Pali",
  "pdp-agoura": "PDP Agoura",
  "pdp-pali": "PDP Pali",
  "7v7-agoura": "7v7 Agoura",
  "7v7-pali": "7v7 Pali",
};

export function AspireOverview({ userId, onNavigate }: AspireOverviewProps) {
  const counts = useQuery(api.registrations.getAllCounts) || [];
  const familyStats = useQuery(api.families.getStats);
  const springSummary = useQuery(api.families.getSpringLeagueSummary);
  const campStats = useQuery(api.camp.getStats, {});
  const tasks = useQuery(api.projectTasks.getTasksByProject, {
    userId,
    project: "aspire",
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
  const agouraRegion = springSummary?.byRegion?.find((region: any) => region.regionKey === "agoura");
  const paliRegion = springSummary?.byRegion?.find((region: any) => region.regionKey === "pali");
  const agouraSpringCountIsStale = !registrationSnapshotMap["spring-agoura"] || registrationSnapshotMap["spring-agoura"].lastUpdated < springCountFreshCutoff;
  const paliSpringCountIsStale = !registrationSnapshotMap["spring-pali"] || registrationSnapshotMap["spring-pali"].lastUpdated < springCountFreshCutoff;
  const agouraSpringCount = agouraSpringCountIsStale && agouraRegion?.playerCount ? agouraRegion.playerCount : (countsMap["spring-agoura"] || 0);
  const paliSpringCount = paliSpringCountIsStale && paliRegion?.playerCount ? paliRegion.playerCount : (countsMap["spring-pali"] || 0);

  const openTasks = useMemo(
    () => tasks.filter((task: any) => task.status !== "done"),
    [tasks]
  );

  const urgentTasks = useMemo(() => {
    const priorityScore = { high: 0, medium: 1, low: 2 } as Record<string, number>;

    return [...openTasks]
      .sort((a: any, b: any) => {
        const dueA = a.dueDate || "9999-99-99";
        const dueB = b.dueDate || "9999-99-99";
        if (dueA !== dueB) return dueA.localeCompare(dueB);
        return (priorityScore[a.priority] ?? 99) - (priorityScore[b.priority] ?? 99);
      })
      .slice(0, 6);
  }, [openTasks]);

  const campLaneStats = useMemo(() => {
    if (!campStats?.byRegion) return [];
    return campStats.byRegion.map((region: any) => ({
      regionKey: region.regionKey,
      regionLabel: region.regionLabel,
      configuredWeekCount: region.configuredWeekCount || 0,
      weekCount: region.weekCount || 0,
      totalRegistered: region.totalRegistered || 0,
    }));
  }, [campStats]);

  const springTaskCount = useMemo(
    () => openTasks.filter((task: any) => String(task.subProject || "").includes("spring")).length,
    [openTasks]
  );

  const campTaskCount = useMemo(
    () => openTasks.filter((task: any) => String(task.subProject || "").includes("camp")).length,
    [openTasks]
  );

  const campRegistrationsTracked = useMemo(
    () => campLaneStats.reduce((sum, lane) => sum + lane.totalRegistered, 0),
    [campLaneStats]
  );

  const metricCards = [
    {
      label: "Families in CRM",
      value: familyStats?.totalFamilies ?? "-",
      sub: "Parent and player records",
      tone: "border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-500/28 via-violet-500/12 to-slate-950",
      labelTone: "text-fuchsia-100/90",
    },
    {
      label: "Agoura Spring",
      value: agouraSpringCount,
      sub: agouraSpringCountIsStale ? "Live CRM count" : "Registrations tracked",
      tone: "border-rose-400/35 bg-gradient-to-br from-rose-500/28 via-red-500/12 to-slate-950",
      labelTone: "text-rose-100/90",
    },
    {
      label: "Pali Spring",
      value: paliSpringCount,
      sub: paliSpringCountIsStale ? "Live CRM count" : "Registrations tracked",
      tone: "border-amber-400/35 bg-gradient-to-br from-amber-500/28 via-orange-500/12 to-slate-950",
      labelTone: "text-amber-100/90",
    },
    {
      label: "Camp registrations",
      value: campRegistrationsTracked || countsMap.camps || 0,
      sub: campLaneStats.length ? "Across active camp lanes" : "Camp pipeline tracked",
      tone: "border-emerald-400/35 bg-gradient-to-br from-emerald-500/28 via-teal-500/12 to-slate-950",
      labelTone: "text-emerald-100/90",
    },
    {
      label: "Open tasks",
      value: openTasks.length,
      sub: "Across Aspire operations",
      tone: "border-cyan-400/35 bg-gradient-to-br from-cyan-500/26 via-sky-500/12 to-slate-950",
      labelTone: "text-cyan-100/90",
    },
    {
      label: "Needs attention",
      value: urgentTasks.length,
      sub: urgentTasks.length === 0 ? "No active fire right now" : `${springTaskCount} spring, ${campTaskCount} camp`,
      tone: "border-violet-400/35 bg-gradient-to-br from-violet-500/24 via-indigo-500/12 to-slate-950",
      labelTone: "text-violet-100/90",
    },
  ];

  const navCards: NavCard[] = [
    {
      title: "Family CRM",
      description: "Parent records, contact details, kids, and enrolled programs. This is the people system, not the registration scoreboard.",
      view: "aspire-families",
      buttonLabel: "Open Family CRM",
      eyebrow: "People system",
      tone: "border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/24 via-violet-500/12 to-slate-950 shadow-[0_0_0_1px_rgba(217,70,239,0.08)]",
      badgeTone: "border-fuchsia-400/30 bg-fuchsia-500/18 text-fuchsia-100",
      statTone: "border-fuchsia-400/20 bg-slate-950/40 text-fuchsia-50",
      stats: familyStats
        ? [
            `${familyStats.totalFamilies} total families`,
            `${familyStats.springLeagueFamilies} spring families in CRM`,
            `${familyStats.campFamilies} camp families in CRM`,
            `${familyStats.pdpFamilies} PDP families in CRM`,
          ]
        : undefined,
    },
    {
      title: "Spring League ops",
      description: "Location-specific registrations, roster pressure, division mix, and the cleanup queue for Agoura and Pali.",
      view: "aspire-spring",
      buttonLabel: "Open Spring Ops",
      eyebrow: "Live roster pressure",
      tone: "border-rose-400/30 bg-gradient-to-br from-rose-500/26 via-orange-500/12 to-slate-950 shadow-[0_0_0_1px_rgba(251,113,133,0.08)]",
      badgeTone: "border-rose-400/30 bg-rose-500/18 text-rose-100",
      statTone: "border-rose-400/20 bg-slate-950/40 text-rose-50",
      stats: [
        `${agouraSpringCount} Agoura ${agouraSpringCountIsStale ? "live" : "registration"} count`,
        `${paliSpringCount} Pali ${paliSpringCountIsStale ? "live" : "registration"} count`,
      ],
    },
    {
      title: "Coach staffing",
      description: "Coach Hub should answer coverage, certs, and who still needs a nudge before the week starts.",
      view: "aspire-coach-hub",
      buttonLabel: "Open Coach Staffing",
      eyebrow: "Coverage + compliance",
      tone: "border-cyan-400/30 bg-gradient-to-br from-cyan-500/24 via-sky-500/12 to-slate-950 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]",
      badgeTone: "border-cyan-400/30 bg-cyan-500/18 text-cyan-100",
      statTone: "border-cyan-400/20 bg-slate-950/40 text-cyan-50",
      stats: [
        `${springTaskCount} spring-linked tasks`,
        `${campTaskCount} camp-linked tasks`,
      ],
    },
    {
      title: "Camps + Mini Camp",
      description: "Summer camp ops plus the May 17 free Mini Camp registration list and session counts.",
      view: "aspire-camps",
      buttonLabel: "Open Camps + Mini Camp",
      eyebrow: "Week-by-week delivery",
      tone: "border-emerald-400/30 bg-gradient-to-br from-emerald-500/26 via-teal-500/12 to-slate-950 shadow-[0_0_0_1px_rgba(52,211,153,0.08)]",
      badgeTone: "border-emerald-400/30 bg-emerald-500/18 text-emerald-100",
      statTone: "border-emerald-400/20 bg-slate-950/40 text-emerald-50",
      stats: campLaneStats.length
        ? campLaneStats.map(
            (region) => `${region.regionLabel}: ${region.configuredWeekCount}/${region.weekCount} weeks, ${region.totalRegistered} registered`
          )
        : [`${countsMap.camps || 0} camp registrations tracked`],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aspire Operations</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            This should work like an operating cockpit. CRM, registrations, rosters, staffing, and tasks each need their own lane.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-sm px-3 py-1">
          {openTasks.length} open Aspire task{openTasks.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <Card className="border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 shadow-[0_0_40px_rgba(245,158,11,0.04)]">
        <CardContent className="p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metricCards.map((card) => (
              <div key={card.label} className={`rounded-2xl border p-4 ${card.tone}`}>
                <div className={`text-[11px] uppercase tracking-[0.18em] ${card.labelTone}`}>{card.label}</div>
                <div className="mt-2 text-3xl font-semibold text-white">{card.value}</div>
                <div className="mt-1 text-sm text-zinc-300">{card.sub}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-400/30 bg-gradient-to-br from-rose-500/16 via-red-500/10 to-zinc-950 shadow-[0_0_30px_rgba(244,63,94,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">What needs attention first</CardTitle>
          <CardDescription className="text-zinc-300">
            The most urgent open items across Aspire right now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {urgentTasks.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-black/25 p-4 text-sm text-zinc-200">No open Aspire tasks right now. Nice.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {urgentTasks.map((task: any) => (
                <div
                  key={task._id}
                  className="flex flex-col gap-2 rounded-xl border border-white/8 bg-black/25 p-3"
                >
                  <div>
                    <div className="font-medium text-white">{task.title}</div>
                    <div className="text-sm text-zinc-300">
                      {SUBPROJECT_LABELS[task.subProject] || task.subProject}
                      {task.assignedTo?.name ? ` · ${task.assignedTo.name}` : " · Unassigned"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant={task.priority === "high" ? "destructive" : "outline"}>
                      {task.priority}
                    </Badge>
                    {task.dueDate ? (
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {task.dueDate}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No due date</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {navCards.map((card) => (
          <Card key={card.title} className={`h-full rounded-2xl ${card.tone}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-300/75 mb-2">{card.eyebrow}</div>
                  <CardTitle className="text-white">{card.title}</CardTitle>
                  <CardDescription className="mt-1 text-zinc-300">{card.description}</CardDescription>
                </div>
                <Badge variant="outline" className={card.badgeTone}>Lane</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {card.stats && card.stats.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {card.stats.map((stat) => (
                    <div key={stat} className={`rounded-lg border px-3 py-2 text-sm ${card.statTone}`}>
                      {stat}
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => onNavigate(card.view)} className="w-full sm:w-auto">
                {card.buttonLabel}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProjectTaskList
        userId={userId}
        project="aspire"
        subProject="ops"
        title="Aspire task log"
        description="Drop anything here that needs done across Aspire before sorting it into a more specific lane."
      />
    </div>
  );
}
