"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";
import { WorkSurfacePageHeader, WorkSurfaceStatCard } from "@/components/work-surface";

interface AspireCampsViewProps {
  userId: Id<"users">;
}

type MiniCampAvailabilitySession = {
  session: string;
  capacity: number;
  reserved: number;
  remaining: number;
};

type MiniCampRegistration = {
  _id: string;
  session?: string;
  childFirstName: string;
  childLastName: string;
  dateOfBirth?: string;
  gender?: string;
  parentFirstName: string;
  parentLastName: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

type CampRegionWeek = {
  weekId: string;
  weekLabel: string;
  label: string;
  shortLabel: string;
  configured: boolean;
  totalRegistered: number;
  weeklyUsed: number;
  dailyUsed: number;
  displaySpots: number;
  dailySlots: number;
  dayAvailability?: Array<{
    date: string;
    reserved: number;
    remaining: number;
    capacity: number;
    isFull: boolean;
    campers?: Array<{
      childName: string;
      parentName?: string;
      gender: string;
      ageGroup: string;
      age?: number;
      email?: string;
      phone?: string;
    }>;
    genderBreakdown?: Array<{ gender: string; count: number }>;
    ageGroupBreakdown?: Array<{ ageGroup: string; count: number }>;
  }>;
};

type CampRegionSummary = {
  regionKey: string;
  regionLabel: string;
  locationLabel: string;
  configuredWeekCount: number;
  weekCount: number;
  totalRegistered: number;
  weeks: CampRegionWeek[];
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "America/Los_Angeles",
});

function formatCampDay(date: string) {
  const parsed = new Date(date + "T12:00:00");
  if (Number.isNaN(parsed.getTime())) return date;
  return dayFormatter.format(parsed);
}

function calculateAgeOnDate(dateOfBirth?: string, eventDate = "2026-05-17") {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth}T12:00:00`);
  const event = new Date(`${eventDate}T12:00:00`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(event.getTime())) return null;

  let age = event.getFullYear() - birth.getFullYear();
  const monthDiff = event.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && event.getDate() < birth.getDate())) age -= 1;
  return age;
}

function formatGender(gender?: string) {
  if (!gender) return "Unknown";
  const normalized = gender.trim().toLowerCase();
  if (normalized === "boy" || normalized === "boys" || normalized === "male") return "Boy";
  if (normalized === "girl" || normalized === "girls" || normalized === "female") return "Girl";
  return gender;
}

function CountPills({
  items,
  labelKey,
}: {
  items?: Array<Record<string, string | number>>;
  labelKey: string;
}) {
  if (!items || items.length === 0) {
    return <span className="text-xs text-muted-foreground">No breakdown yet</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const label = String(item[labelKey] || "Unknown");
        const count = Number(item.count || 0);
        return (
          <span key={label} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/90">
            <span>{label}</span>
            <span className="rounded-full bg-white/10 px-1.5 font-semibold">{count}</span>
          </span>
        );
      })}
    </div>
  );
}

export function AspireCampsView({ userId }: AspireCampsViewProps) {
  const campStats = useQuery(api.camp.getStats, {});
  const miniCampAvailability = useQuery(api.camp.getTrialDayAvailability, {});
  const rawMiniCampRegistrations = useQuery(api.camp.listTrialDayRegistrations, {});
  const miniCampRegistrations = useMemo(
    () => (rawMiniCampRegistrations ?? []) as MiniCampRegistration[],
    [rawMiniCampRegistrations]
  );

  const regions = useMemo(() => (campStats?.byRegion || []) as CampRegionSummary[], [campStats]);
  const miniCampReserved = useMemo(
    () => ((miniCampAvailability || []) as MiniCampAvailabilitySession[]).reduce((sum, session) => sum + (session.reserved || 0), 0),
    [miniCampAvailability]
  );
  const miniCampRegistrationsBySession = useMemo(() => {
    const bySession: Record<string, MiniCampRegistration[]> = {};
    for (const registration of miniCampRegistrations) {
      const session = registration.session || "Unassigned";
      bySession[session] = bySession[session] || [];
      bySession[session].push(registration);
    }
    for (const session of Object.keys(bySession)) {
      bySession[session].sort((a, b) =>
        `${a.childLastName} ${a.childFirstName}`.localeCompare(`${b.childLastName} ${b.childFirstName}`)
      );
    }
    return bySession;
  }, [miniCampRegistrations]);

  const getSessionBreakdown = (registrations: MiniCampRegistration[]) => {
    const ageCounts: Record<string, number> = {};
    const genderCounts: Record<string, number> = {};

    for (const registration of registrations) {
      const age = calculateAgeOnDate(registration.dateOfBirth);
      const ageLabel = age === null ? "Unknown" : String(age);
      const genderLabel = formatGender(registration.gender);
      ageCounts[ageLabel] = (ageCounts[ageLabel] || 0) + 1;
      genderCounts[genderLabel] = (genderCounts[genderLabel] || 0) + 1;
    }

    const ageBreakdown = Object.entries(ageCounts)
      .sort(([a], [b]) => (a === "Unknown" ? 1 : b === "Unknown" ? -1 : Number(a) - Number(b)))
      .map(([age, count]) => ({ age, count }));

    const genderBreakdown = Object.entries(genderCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([gender, count]) => ({ gender, count }));

    const preferredAgeRows = [["5", "6"], ["7", "8"], ["10", "11"]];
    const usedAges = new Set(preferredAgeRows.flat());
    const ageRows: Array<Array<{ age: string; count: number }>> = preferredAgeRows
      .map((row) => row.flatMap((age) => {
        const match = ageBreakdown.find((item) => item.age === age);
        return match ? [match] : [];
      }))
      .filter((row) => row.length > 0);
    const otherAges = ageBreakdown.filter((item) => !usedAges.has(item.age));
    if (otherAges.length > 0) ageRows.push(otherAges);

    return { ageBreakdown, ageRows, genderBreakdown };
  };

  return (
    <div className="space-y-6">
      <WorkSurfacePageHeader
        title="Camps"
        description="Summer camp weeks, Mini Camp rosters, open spots, and camp-specific task follow-up."
      />

      <Card className="border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 shadow-[0_0_40px_rgba(52,211,153,0.05)]">
        <CardContent className="p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <WorkSurfaceStatCard
              label="Paid camp families"
              value={campStats?.totalFamilies ?? 0}
              tone="success"
              size="compact"
              className="border-emerald-400/35 bg-gradient-to-br from-emerald-500/30 via-teal-500/14 to-slate-950"
            />
            <WorkSurfaceStatCard
              label="Incomplete checkouts"
              value={campStats?.pendingCount ?? 0}
              description="Started but not paid"
              tone="warning"
              size="compact"
              className="border-amber-400/35 bg-gradient-to-br from-amber-500/30 via-orange-500/14 to-slate-950"
            />
            <WorkSurfaceStatCard
              label="Configured weeks"
              value={campStats?.totalConfiguredWeeks ?? 0}
              description={`of ${campStats?.plannedWeekCount ?? 0} planned camp weeks`}
              tone="info"
              size="compact"
              className="border-cyan-400/35 bg-gradient-to-br from-cyan-500/28 via-sky-500/14 to-slate-950"
            />
            <WorkSurfaceStatCard
              label="Revenue"
              value={moneyFormatter.format(campStats?.totalRevenue ?? 0)}
              tone="accent"
              size="compact"
              className="border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-500/28 via-violet-500/14 to-slate-950"
            />
            <WorkSurfaceStatCard
              label="Mini Camp May 17"
              value={miniCampReserved}
              description="Free trial reservations"
              tone="danger"
              size="compact"
              className="border-rose-400/35 bg-gradient-to-br from-rose-500/30 via-orange-500/14 to-slate-950"
            />
          </div>
        </CardContent>
      </Card>


      <details className="group rounded-xl border border-orange-500/20 bg-orange-500/[0.04]">
        <summary className="list-none cursor-pointer p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-orange-300/90 mb-2">Free trial event</div>
              <div className="text-2xl font-semibold leading-none tracking-tight">Mini Camp - May 17, Brookside</div>
              <p className="text-sm text-muted-foreground mt-2">
                Tap to open session rosters, age/gender breakdowns, and parent contact details.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-500/10 text-orange-300 border-orange-500/20">
                {miniCampReserved} confirmed
              </Badge>
              <span className="text-sm text-muted-foreground group-open:hidden">Show</span>
              <span className="text-sm text-muted-foreground hidden group-open:inline">Hide</span>
            </div>
          </div>
        </summary>
        <div className="px-6 pb-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Live reservations from the registration form. These also sync into Family CRM as Mini Camp enrollments.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {((miniCampAvailability || []) as MiniCampAvailabilitySession[]).map((session) => {
              const sessionRegistrations = miniCampRegistrationsBySession[session.session] || [];
              const breakdown = getSessionBreakdown(sessionRegistrations);

              return (
                <details key={session.session} className="group/session rounded-xl border bg-background/60">
                  <summary className="list-none cursor-pointer p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{session.session}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {session.reserved}/{session.capacity} reserved - {session.remaining} open
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-300 border-orange-500/20">
                        View roster
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="rounded-lg bg-black/20 p-3">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-200/85">
                          Age breakdown
                        </div>
                        <div className="space-y-2">
                          {breakdown.ageBreakdown.length > 0 ? breakdown.ageRows.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex flex-wrap gap-2">
                              {row.map(({ age, count }) => (
                                <span key={age} className="inline-flex min-w-20 items-center justify-between gap-1 rounded-full border border-orange-400/25 bg-orange-500/10 px-2.5 py-1 text-orange-50">
                                  <span className="font-semibold">Age {age}</span>
                                  <span className="rounded-full bg-orange-400/20 px-1.5 font-bold text-white">{count}</span>
                                </span>
                              ))}
                            </div>
                          )) : <span>No ages yet</span>}
                        </div>
                      </div>
                      <div className="rounded-lg bg-black/20 p-3">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200/85">
                          Gender breakdown
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {breakdown.genderBreakdown.length > 0 ? breakdown.genderBreakdown.map(({ gender, count }) => {
                            const isGirl = gender.toLowerCase() === "girl";
                            return (
                              <span
                                key={gender}
                                className={isGirl
                                  ? "inline-flex items-center gap-1 rounded-full border border-pink-400/30 bg-pink-500/15 px-2.5 py-1 text-pink-50"
                                  : "inline-flex items-center gap-1 rounded-full border border-sky-400/25 bg-sky-500/10 px-2.5 py-1 text-sky-50"
                                }
                              >
                                <span className="font-semibold">{gender}</span>
                                <span className={isGirl
                                  ? "rounded-full bg-pink-400/25 px-1.5 font-bold text-white"
                                  : "rounded-full bg-sky-400/20 px-1.5 font-bold text-white"
                                }>{count}</span>
                              </span>
                            );
                          }) : <span>No genders yet</span>}
                        </div>
                      </div>
                    </div>
                  </summary>

                  <div className="border-t px-4 pb-4 pt-3">
                    <div className="overflow-x-auto rounded-xl border bg-background/50">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left p-2">Player</th>
                            <th className="text-left p-2">Age</th>
                            <th className="text-left p-2">Gender</th>
                            <th className="text-left p-2">Parent</th>
                            <th className="text-left p-2">Phone</th>
                            <th className="text-left p-2">Emergency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionRegistrations.map((registration) => {
                            const age = calculateAgeOnDate(registration.dateOfBirth);
                            return (
                              <tr key={registration._id} className="border-b last:border-0">
                                <td className="p-2 font-medium">{registration.childFirstName} {registration.childLastName}</td>
                                <td className="p-2">{age ?? "-"}</td>
                                <td className="p-2">{formatGender(registration.gender)}</td>
                                <td className="p-2">{registration.parentFirstName} {registration.parentLastName}<div className="text-xs text-muted-foreground">{registration.email}</div></td>
                                <td className="p-2">{registration.phone}</td>
                                <td className="p-2">{registration.emergencyContactName}<div className="text-xs text-muted-foreground">{registration.emergencyContactPhone}</div></td>
                              </tr>
                            );
                          })}
                          {sessionRegistrations.length === 0 && (
                            <tr>
                              <td className="p-4 text-center text-muted-foreground" colSpan={6}>No registrations for this session yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </details>

      <div className="grid gap-4 xl:grid-cols-2">
        {regions.map((region) => {
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
                      {region.configuredWeekCount} camp week{region.configuredWeekCount === 1 ? "" : "s"}, 40 spots per day.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={badgeTone}>
                    {region.totalRegistered} registered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {region.weeks.map((week) => (
                    <details key={week.weekId} className="group/week rounded-xl border bg-background/60">
                      <summary className="list-none cursor-pointer p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-muted-foreground">{week.weekLabel}</div>
                              <div className="font-semibold mt-1">{week.label}</div>
                            </div>
                            <span className="text-xs text-muted-foreground group-open/week:hidden">Show days</span>
                            <span className="hidden text-xs text-muted-foreground group-open/week:inline">Hide days</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={badgeTone}>{week.shortLabel}</Badge>
                            {week.configured ? (
                              <>
                                <Badge variant="secondary">{week.totalRegistered} registered</Badge>
                                <Badge variant="outline">{week.displaySpots} lowest open day</Badge>
                              </>
                            ) : (
                              <Badge variant="outline">Planning lane</Badge>
                            )}
                          </div>

                          {week.configured ? (
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>Daily capacity: {week.dailySlots} spots</div>
                              <div>Busiest day registered: {week.dailyUsed}</div>
                              <div>Lowest open day: {week.displaySpots}</div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              This lane exists now so camps are modeled as 4 Agoura weeks plus 2 Pali weeks, even before Pali dates are finalized.
                            </div>
                          )}
                        </div>
                      </summary>

                      {week.configured && (
                        <div className="border-t border-white/10 px-4 pb-4 pt-3">
                          <div className="grid gap-2">
                            {(week.dayAvailability || []).map((day) => (
                              <details key={day.date} className="group/day rounded-lg bg-black/20 text-sm">
                                <summary className="list-none cursor-pointer px-3 py-2">
                                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                                    <div>
                                      <div className="font-medium text-white/90">{formatCampDay(day.date)}</div>
                                      <div className="text-xs text-muted-foreground group-open/day:hidden">Tap for age group + gender</div>
                                    </div>
                                    <div className="text-muted-foreground">{day.reserved} registered</div>
                                    <Badge variant="outline" className={day.isFull ? "border-red-400/40 bg-red-500/15 text-red-100" : badgeTone}>
                                      {day.remaining} open
                                    </Badge>
                                  </div>
                                </summary>

                                <div className="border-t border-white/10 px-3 pb-3 pt-2">
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Age groups</div>
                                      <CountPills items={day.ageGroupBreakdown} labelKey="ageGroup" />
                                    </div>
                                    <div>
                                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Gender</div>
                                      <CountPills items={day.genderBreakdown} labelKey="gender" />
                                    </div>
                                  </div>

                                  <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-white/10 text-muted-foreground">
                                          <th className="p-2 text-left">Player</th>
                                          <th className="p-2 text-left">Age group</th>
                                          <th className="p-2 text-left">Gender</th>
                                          <th className="p-2 text-left">Parent</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(day.campers || []).map((camper) => (
                                          <tr key={`${day.date}-${camper.childName}-${camper.parentName || ""}`} className="border-b border-white/5 last:border-0">
                                            <td className="p-2 font-medium text-white/90">
                                              {camper.childName || "Unknown"}
                                              {camper.age !== undefined && <div className="text-[11px] text-muted-foreground">Age {camper.age}</div>}
                                            </td>
                                            <td className="p-2">{camper.ageGroup}</td>
                                            <td className="p-2">{camper.gender}</td>
                                            <td className="p-2">
                                              {camper.parentName || "-"}
                                              {camper.phone && <div className="text-[11px] text-muted-foreground">{camper.phone}</div>}
                                            </td>
                                          </tr>
                                        ))}
                                        {(!day.campers || day.campers.length === 0) && (
                                          <tr>
                                            <td className="p-3 text-center text-muted-foreground" colSpan={4}>No registrations for this day yet.</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      )}
                    </details>
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
