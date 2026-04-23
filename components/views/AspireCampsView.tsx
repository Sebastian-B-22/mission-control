"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";

interface AspireCampsViewProps {
  userId: Id<"users">;
}

export function AspireCampsView({ userId }: AspireCampsViewProps) {
  const campStats = useQuery(api.camp.getStats, {});

  const regions = useMemo(() => campStats?.byRegion || [], [campStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Camps</h1>
        <p className="text-muted-foreground mt-1">
          Camp ops should be broken down by actual location lanes. Agoura and Pali should not blur into one generic camp bucket.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
              <div className="text-xs uppercase tracking-wide text-emerald-300/90">Paid camp families</div>
              <div className="text-2xl font-bold mt-1">{campStats?.totalFamilies ?? 0}</div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3">
              <div className="text-xs uppercase tracking-wide text-amber-300/90">Pending registrations</div>
              <div className="text-2xl font-bold mt-1">{campStats?.pendingCount ?? 0}</div>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-3">
              <div className="text-xs uppercase tracking-wide text-sky-300/90">Configured weeks</div>
              <div className="text-2xl font-bold mt-1">{campStats?.totalConfiguredWeeks ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">of {campStats?.plannedWeekCount ?? 0} planned camp weeks</div>
            </div>
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.05] p-3">
              <div className="text-xs uppercase tracking-wide text-purple-300/90">Revenue</div>
              <div className="text-2xl font-bold mt-1">${campStats?.totalRevenue ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {regions.map((region: any) => {
          const isAgoura = region.regionKey === "agoura";
          const tone = isAgoura
            ? "border-red-500/20 bg-red-500/[0.05]"
            : "border-amber-500/20 bg-amber-500/[0.05]";
          const badgeTone = isAgoura
            ? "bg-red-500/10 text-red-300 border-red-500/20"
            : "bg-amber-500/10 text-amber-300 border-amber-500/20";

          return (
            <Card key={region.regionKey} className={tone}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
                      {region.locationLabel}
                    </div>
                    <CardTitle>{region.regionLabel} camp weeks</CardTitle>
                    <CardDescription className="mt-1">
                      {region.configuredWeekCount} configured week{region.configuredWeekCount === 1 ? "" : "s"}, {region.weekCount} total lane slot{region.weekCount === 1 ? "" : "s"}.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={badgeTone}>
                    {region.totalRegistered} registered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {region.weeks.map((week: any) => (
                    <div key={week.weekId} className="rounded-xl border bg-background/60 p-4 space-y-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">{week.weekLabel}</div>
                        <div className="font-semibold mt-1">{week.label}</div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={badgeTone}>{week.shortLabel}</Badge>
                        {week.configured ? (
                          <Badge variant="secondary">{week.totalRegistered} registered</Badge>
                        ) : (
                          <Badge variant="outline">Planning lane</Badge>
                        )}
                      </div>

                      {week.configured ? (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Weekly spots used: {week.weeklyUsed}</div>
                          <div>Daily spots used: {week.dailyUsed}</div>
                          <div>Displayed open spots: {week.displaySpots}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          This lane exists now so camps are modeled as 4 Agoura weeks plus 2 Pali weeks, even before Pali dates are finalized.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="camps-agoura"
          title="Agoura camp tasks"
          description="Use this for the Agoura camp weeks, staffing, supplies, and parent follow-up."
        />
        <ProjectTaskList
          userId={userId}
          project="aspire"
          subProject="camps-pali"
          title="Pali camp tasks"
          description="Use this for the Pali camp weeks, staffing, supplies, and parent follow-up."
        />
      </div>
    </div>
  );
}
