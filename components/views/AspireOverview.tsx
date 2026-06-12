"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { WorkSurfaceEmptyState, WorkSurfacePageHeader, WorkSurfaceStatCard } from "@/components/work-surface";
import { ArrowRight, Calendar, CheckCircle2 } from "lucide-react";

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
  badgeVariant: "success" | "warning" | "danger" | "info" | "accent";
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
      tone: "accent" as const,
    },
    {
      label: "Agoura Spring",
      value: agouraSpringCount,
      sub: agouraSpringCountIsStale ? "Live CRM count" : "Registrations tracked",
      tone: "danger" as const,
    },
    {
      label: "Pali Spring",
      value: paliSpringCount,
      sub: paliSpringCountIsStale ? "Live CRM count" : "Registrations tracked",
      tone: "brand" as const,
    },
    {
      label: "Camp registrations",
      value: campRegistrationsTracked || countsMap.camps || 0,
      sub: campLaneStats.length ? "Across active camp lanes" : "Camp pipeline tracked",
      tone: "success" as const,
    },
    {
      label: "Open tasks",
      value: openTasks.length,
      sub: "Across Aspire operations",
      tone: "info" as const,
    },
    {
      label: "Needs attention",
      value: urgentTasks.length,
      sub: urgentTasks.length === 0 ? "No active fire right now" : `${springTaskCount} spring, ${campTaskCount} camp`,
      tone: urgentTasks.length === 0 ? "success" as const : "warning" as const,
    },
  ];

  const navCards: NavCard[] = [
    {
      title: "Family CRM",
      description: "Parent records, contact details, kids, and enrolled programs. This is the people system, not the registration scoreboard.",
      view: "aspire-families",
      buttonLabel: "Open Family CRM",
      eyebrow: "People system",
      badgeVariant: "accent",
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
      badgeVariant: "danger",
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
      badgeVariant: "info",
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
      badgeVariant: "success",
      stats: campLaneStats.length
        ? campLaneStats.map(
            (region) => `${region.regionLabel}: ${region.configuredWeekCount}/${region.weekCount} weeks, ${region.totalRegistered} registered`
          )
        : [`${countsMap.camps || 0} camp registrations tracked`],
    },
  ];

  return (
    <div className="space-y-6">
      <WorkSurfacePageHeader
        title="Aspire Operations"
        description="CRM, registrations, rosters, staffing, and tasks each have their own lane."
        action={(
          <Badge variant="outline" className="w-fit px-3 py-1 text-sm">
          {openTasks.length} open Aspire task{openTasks.length === 1 ? "" : "s"}
          </Badge>
        )}
      />

      <Card className="border-line bg-surface-0 shadow-[0_0_40px_rgba(245,158,11,0.04)]">
        <CardContent className="p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metricCards.map((card) => (
              <WorkSurfaceStatCard
                key={card.label}
                label={card.label}
                value={card.value}
                description={card.sub}
                tone={card.tone}
              />
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
            <WorkSurfaceEmptyState
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="No open Aspire tasks right now"
              description="The next priorities will surface here when there is something active to sort."
              className="min-h-[120px]"
            />
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
          <Card key={card.title} className="h-full rounded-xl border-line bg-card shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">{card.eyebrow}</div>
                  <CardTitle className="text-ink">{card.title}</CardTitle>
                  <CardDescription className="mt-1 text-ink-soft">{card.description}</CardDescription>
                </div>
                <Badge variant={card.badgeVariant}>Lane</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {card.stats && card.stats.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {card.stats.map((stat) => (
                    <div key={stat} className="rounded-md border border-line bg-surface-2/70 px-3 py-2 text-sm text-ink-soft">
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
