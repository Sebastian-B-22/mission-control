"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatGender(gender?: string) {
  if (!gender) return "Unknown";
  const normalized = gender.trim().toLowerCase();
  if (normalized === "boy" || normalized === "boys" || normalized === "male") return "Boy";
  if (normalized === "girl" || normalized === "girls" || normalized === "female") return "Girl";
  return gender;
}

function formatProgramLabel(program?: string) {
  if (program === "spring_league") return "Spring League";
  if (program === "pdp") return "PDP";
  if (program === "mini_camp") return "Mini Camp";
  return program || "Program";
}

function formatRegionLabel(region?: string) {
  if (region === "agoura") return "Agoura";
  if (region === "pali") return "Pali";
  return region || "Region TBD";
}

function formatPracticeDay(day?: string) {
  if (!day) return "Practice TBD";
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function RosterAssignmentRow({ enrollment }: { enrollment: any }) {
  const updateAssignment = useMutation(api.camp.updateEnrollmentRosterAssignment);
  const [assignedGroup, setAssignedGroup] = useState(enrollment.assignedGroup || "");
  const [saving, setSaving] = useState(false);

  async function save(status = assignedGroup.trim() ? "assigned" : "paid_unassigned") {
    setSaving(true);
    try {
      await updateAssignment({
        enrollmentId: enrollment._id,
        assignedGroup: assignedGroup.trim() || undefined,
        status,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b last:border-0 align-top">
      <td className="p-3">
        <div className="font-medium">{enrollment.child.firstName} {enrollment.child.lastName}</div>
        <div className="text-xs text-muted-foreground">
          {enrollment.child.dob || "DOB missing"} · {formatGender(enrollment.child.gender)}
        </div>
      </td>
      <td className="p-3">
        <div>{enrollment.parent.firstName} {enrollment.parent.lastName}</div>
        <div className="text-xs text-muted-foreground">{enrollment.parent.phone}</div>
        <div className="text-xs text-muted-foreground">{enrollment.parent.email}</div>
      </td>
      <td className="p-3">
        <div>{formatProgramLabel(enrollment.program)} · {formatRegionLabel(enrollment.region)}</div>
        <div className="text-xs text-muted-foreground">{enrollment.season || "season TBD"}</div>
      </td>
      <td className="p-3">
        <Badge variant="outline">{enrollment.division || "Division TBD"}</Badge>
        <div className="text-xs text-muted-foreground mt-2">{formatPracticeDay(enrollment.practiceDay)}</div>
      </td>
      <td className="p-3 min-w-[220px]">
        <div className="flex gap-2">
          <Input
            value={assignedGroup}
            onChange={(event) => setAssignedGroup(event.target.value)}
            placeholder="e.g. 8U Tue Gio"
            className="h-8"
          />
          <Button size="sm" onClick={() => save()} disabled={saving}>
            {saving ? "Saving" : "Assign"}
          </Button>
        </div>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => save("needs_review")} disabled={saving}>
            Needs review
          </Button>
          <Button size="sm" variant="outline" onClick={() => save("waitlist")} disabled={saving}>
            Waitlist
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function RosterAssignmentQueue({
  program,
  title,
  description,
  eyebrow,
}: {
  program: "spring_league" | "pdp";
  title: string;
  description: string;
  eyebrow: string;
}) {
  const [statusFilter, setStatusFilter] = useState("paid_unassigned");
  const statusArg = statusFilter === "all" ? undefined : statusFilter;
  const rows = useQuery(api.camp.getEnrollmentReviewQueue, {
    program,
    status: statusArg,
  }) ?? [];

  const rosterQueue = useMemo(
    () => [...rows].sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)),
    [rows]
  );

  return (
    <Card className="border-sky-400/25 bg-gradient-to-br from-sky-500/14 via-blue-500/8 to-slate-950">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-sky-300/90 mb-2">{eyebrow}</div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge variant="outline" className="bg-sky-500/10 text-sky-200 border-sky-400/25">
            {rosterQueue.length} shown
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ["paid_unassigned", "Unassigned"],
            ["needs_review", "Needs review"],
            ["waitlist", "Waitlist"],
            ["assigned", "Assigned"],
            ["all", `All ${program === "pdp" ? "PDP" : "Spring"}`],
          ].map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={statusFilter === value ? "default" : "outline"}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border bg-background/45">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left p-3">Player</th>
                <th className="text-left p-3">Parent</th>
                <th className="text-left p-3">Program</th>
                <th className="text-left p-3">Division/day</th>
                <th className="text-left p-3">Assignment</th>
              </tr>
            </thead>
            <tbody>
              {rosterQueue.map((enrollment: any) => (
                <RosterAssignmentRow key={enrollment._id} enrollment={enrollment} />
              ))}
              {rosterQueue.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-muted-foreground" colSpan={5}>
                    No players in this status yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
