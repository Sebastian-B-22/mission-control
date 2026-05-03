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
  const miniCampAvailability = useQuery(api.camp.getTrialDayAvailability, {});
  const miniCampRegistrations = useQuery(api.camp.listTrialDayRegistrations, {}) ?? [];

  const regions = useMemo(() => campStats?.byRegion || [], [campStats]);
  const miniCampReserved = useMemo(
    () => (miniCampAvailability || []).reduce((sum: number, session: any) => sum + (session.reserved || 0), 0),
    [miniCampAvailability]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Camps</h1>
      </div>

      <Card className="border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 shadow-[0_0_40px_rgba(52,211,153,0.05)]">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/30 via-teal-500/14 to-slate-950 p-3 shadow-[0_0_0_1px_rgba(52,211,153,0.08)]">
              <div className="text-xs uppercase tracking-wide text-emerald-100/90">Paid camp families</div>
              <div className="text-2xl font-bold mt-1 text-white">{campStats?.totalFamilies ?? 0}</div>
            </div>
            <div className="rounded-xl border border-amber-400/35 bg-gradient-to-br from-amber-500/30 via-orange-500/14 to-slate-950 p-3 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]">
              <div className="text-xs uppercase tracking-wide text-amber-100/90">Pending registrations</div>
              <div className="text-2xl font-bold mt-1 text-white">{campStats?.pendingCount ?? 0}</div>
            </div>
            <div className="rounded-xl border border-cyan-400/35 bg-gradient-to-br from-cyan-500/28 via-sky-500/14 to-slate-950 p-3 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]">
              <div className="text-xs uppercase tracking-wide text-cyan-100/90">Configured weeks</div>
              <div className="text-2xl font-bold mt-1 text-white">{campStats?.totalConfiguredWeeks ?? 0}</div>
              <div className="text-xs text-cyan-100/65 mt-1">of {campStats?.plannedWeekCount ?? 0} planned camp weeks</div>
            </div>
            <div className="rounded-xl border border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-500/28 via-violet-500/14 to-slate-950 p-3 shadow-[0_0_0_1px_rgba(217,70,239,0.08)]">
              <div className="text-xs uppercase tracking-wide text-fuchsia-100/90">Revenue</div>
              <div className="text-2xl font-bold mt-1 text-white">${campStats?.totalRevenue ?? 0}</div>
            </div>
            <div className="rounded-xl border border-rose-400/35 bg-gradient-to-br from-rose-500/30 via-orange-500/14 to-slate-950 p-3 shadow-[0_0_0_1px_rgba(251,113,133,0.08)]">
              <div className="text-xs uppercase tracking-wide text-rose-100/90">Mini Camp May 17</div>
              <div className="text-2xl font-bold mt-1 text-white">{miniCampReserved}</div>
              <div className="text-xs text-rose-100/65 mt-1">free trial reservations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-500/20 bg-orange-500/[0.04]">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-orange-300/90 mb-2">Free trial event</div>
              <CardTitle>Mini Camp - May 17, Brookside</CardTitle>
              <CardDescription className="mt-1">
                Live reservations from the registration form. These also sync into Family CRM as Mini Camp enrollments.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-300 border-orange-500/20">
              {miniCampReserved} confirmed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(miniCampAvailability || []).map((session: any) => (
              <div key={session.session} className="rounded-xl border bg-background/60 p-4">
                <div className="font-semibold">{session.session}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {session.reserved}/{session.capacity} reserved - {session.remaining} open
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border bg-background/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left p-2">Player</th>
                  <th className="text-left p-2">Parent</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Session</th>
                  <th className="text-left p-2">Emergency</th>
                </tr>
              </thead>
              <tbody>
                {miniCampRegistrations.map((registration: any) => (
                  <tr key={registration._id} className="border-b last:border-0">
                    <td className="p-2 font-medium">{registration.childFirstName} {registration.childLastName}</td>
                    <td className="p-2">{registration.parentFirstName} {registration.parentLastName}<div className="text-xs text-muted-foreground">{registration.email}</div></td>
                    <td className="p-2">{registration.phone}</td>
                    <td className="p-2">{registration.session}</td>
                    <td className="p-2">{registration.emergencyContactName}<div className="text-xs text-muted-foreground">{registration.emergencyContactPhone}</div></td>
                  </tr>
                ))}
                {miniCampRegistrations.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={5}>No mini camp registrations yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {regions.map((region: any) => {
          const isAgoura = region.regionKey === "agoura";
          const tone = isAgoura
            ? "border-rose-400/30 bg-gradient-to-br from-rose-500/22 via-red-500/10 to-slate-950 shadow-[0_0_0_1px_rgba(251,113,133,0.08)]"
            : "border-amber-400/30 bg-gradient-to-br from-amber-500/24 via-orange-500/12 to-slate-950 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]";
          const badgeTone = isAgoura
            ? "bg-rose-500/18 text-rose-100 border-rose-400/30"
            : "bg-amber-500/18 text-amber-100 border-amber-400/30";

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
