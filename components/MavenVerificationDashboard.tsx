"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MavenVerificationDashboard() {
  const stats = useQuery(api.contentVerification.getVerificationStats, {});

  if (!stats) {
    return (
      <Card className="bg-gray-900/60 border-gray-800">
        <CardContent className="p-4 text-sm text-gray-400">Loading verification stats...</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-300">Verification Pass Rate</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold text-green-400">{stats.passRate}%</p></CardContent>
      </Card>

      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-300">Common Issues</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {stats.commonIssues.length === 0 ? (
            <p className="text-sm text-gray-400">No major issues yet</p>
          ) : stats.commonIssues.map((i) => (
            <p key={i.issue} className="text-sm text-amber-300">• {i.issue} ({i.count})</p>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-300">Tone Drift</CardTitle></CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${stats.toneDrift >= 70 ? "text-green-400" : "text-amber-400"}`}>{stats.toneDrift}</p>
          <p className="text-xs text-gray-500">Avg of last 10 tone scores</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-300">Weekly Trend</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {stats.weeklyTrend.map((d) => (
            <div key={d.dayOffset} className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Day {d.dayOffset + 1}</span>
              <span className="text-gray-300">{d.passRate}% ({d.count})</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
