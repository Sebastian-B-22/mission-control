"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";

export function MavenVerificationDashboard() {
  const stats = useQuery(api.contentVerification.getVerificationStats, {});

  if (!stats) {
    return (
      <Card className="bg-gray-900/60 border-gray-800">
        <CardContent className="p-4 text-sm text-gray-400">Loading verification stats...</CardContent>
      </Card>
    );
  }

  const topIssues = stats.commonIssues.slice(0, 2);
  const latestTrend = stats.weeklyTrend[stats.weeklyTrend.length - 1];

  return (
    <div className="grid gap-2 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wide text-gray-500">Verification</div>
        <p className="mt-1 text-lg font-semibold text-green-400">{stats.passRate}%</p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wide text-gray-500">Common issues</div>
        <p className="mt-1 text-xs text-amber-300">
          {topIssues.length === 0 ? "None" : topIssues.map((i: any) => `${i.issue} (${i.count})`).join(" • ")}
        </p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wide text-gray-500">Tone drift</div>
        <p className={`mt-1 text-lg font-semibold ${stats.toneDrift >= 70 ? "text-green-400" : "text-amber-400"}`}>{stats.toneDrift}</p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wide text-gray-500">Trend</div>
        <p className="mt-1 text-lg font-semibold text-gray-200">{latestTrend ? `${latestTrend.passRate}%` : "-"}</p>
      </div>
    </div>
  );
}
