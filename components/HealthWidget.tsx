"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, Flame, Moon, Footprints, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";

interface HealthWidgetProps {
  userId: Id<"users">;
}

// Health score ring component
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  // Color based on score
  const getColor = (s: number) => {
    if (s >= 85) return "#F59E0B"; // Gold for 85+
    if (s >= 70) return "#F59E0B"; // Orange for 70-84
    if (s >= 50) return "#EAB308"; // Yellow for 50-69
    return "#EF4444"; // Red for < 50
  };

  const color = getColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#E5E7EB"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        {score === 100 && <span className="text-xs">✓ Perfect</span>}
      </div>
    </div>
  );
}

export function HealthWidget({ userId }: HealthWidgetProps) {
  const [syncing, setSyncing] = useState(false);
  const monthStats = useQuery(api.health.getMonthStats, { userId });
  const isWhoopConnected = useQuery(api.health.isWhoopConnected, { userId });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/auth/whoop/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("Sync failed");
    } catch (e) {
      console.error("Sync error:", e);
    }
    setSyncing(false);
  };

  const handleConnect = () => {
    window.location.href = `/api/auth/whoop?userId=${userId}`;
  };

  if (!monthStats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse flex items-center justify-center h-32">
            <Heart className="h-8 w-8 text-gray-300 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const perfectDaysPercent = Math.min(
    (monthStats.perfectDays / monthStats.perfectDaysGoal) * 100,
    100
  );

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-amber-500" />
            Health Score
          </div>
          {isWhoopConnected ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              {syncing ? "Syncing..." : "Sync"}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleConnect} className="text-xs">
              Connect Whoop
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Score Ring */}
          <ScoreRing score={monthStats.todayScore} />

          {/* Stats */}
          <div className="flex-1 space-y-3">
            {/* Perfect Days */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Perfect Days
                </span>
                <span className="font-semibold">
                  {monthStats.perfectDays}/{monthStats.perfectDaysGoal}
                </span>
              </div>
              <Progress value={perfectDaysPercent} className="h-2" />
            </div>

            {/* Current Streak */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Current Streak
              </span>
              <span className="font-semibold text-green-600">
                {monthStats.streak} {monthStats.streak === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Today's Metrics (mini) */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <div className="text-center">
                <Moon className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                <p className="text-xs text-muted-foreground">Sleep</p>
                <p className="text-sm font-semibold">
                  {monthStats.todaySleep ? `${monthStats.todaySleep}h` : "-"}
                </p>
              </div>
              <div className="text-center">
                <Footprints className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                <p className="text-xs text-muted-foreground">Steps</p>
                <p className="text-sm font-semibold">
                  {monthStats.todaySteps?.toLocaleString() || "-"}
                </p>
              </div>
              <div className="text-center">
                <Flame className="h-4 w-4 mx-auto text-red-500 mb-1" />
                <p className="text-xs text-muted-foreground">Calories</p>
                <p className="text-sm font-semibold">
                  {monthStats.todayCalories?.toLocaleString() || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
