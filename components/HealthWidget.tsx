"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Flame, Moon, Footprints, Zap } from "lucide-react";
import { useState } from "react";

interface HealthWidgetProps {
  userId: Id<"users">;
}

// Get color based on score
function getScoreColor(score: number): string {
  if (score === 100) return "#f59e0b"; // gold/amber for perfect
  if (score >= 85) return "#ec4899"; // bright pink for 85+
  if (score >= 70) return "#a855f7"; // purple for 70-84
  if (score >= 50) return "#3b82f6"; // blue for 50-70
  return "#71717a"; // zinc-500 for <50
}

// Gradient score ring component - Don't Die style
function ScoreRing({ score, size = 120, showLabel = true }: { score: number; size?: number; showLabel?: boolean }) {
  // Scale stroke width based on size
  const strokeWidth = size <= 40 ? 3 : size <= 60 ? 5 : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  // Perfect day: checkmark
  const isPerfect = score === 100;
  
  // Get color based on score
  const ringColor = getScoreColor(score);

  // Scale font size based on ring size
  const getFontSize = () => {
    if (size <= 40) return 'text-xs';
    if (size <= 60) return 'text-sm';
    if (size <= 100) return 'text-xl';
    return 'text-3xl';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle - dark */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#27272a"
          fill="none"
        />
        {/* Progress circle - solid color based on score */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={ringColor}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isPerfect ? (
          <>
            <span className={`${getFontSize()} font-bold text-amber-500`}>✓</span>
            {showLabel && <span className="text-xs text-zinc-400 mt-1">Perfect</span>}
          </>
        ) : (
          <>
            <span className={`${getFontSize()} font-bold text-zinc-100`}>
              {score}
            </span>
            {showLabel && <span className="text-xs text-zinc-400 mt-1">Score</span>}
          </>
        )}
      </div>
    </div>
  );
}

// Week preview rings
function WeekPreview({ userId }: { userId: Id<"users"> }) {
  const today = new Date();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthHealth = useQuery(api.health.getMonthHealth, { userId, yearMonth });

  const healthByDate: Record<string, { healthScore: number }> = {};
  if (monthHealth) {
    for (const h of monthHealth) {
      healthByDate[h.date] = { healthScore: h.healthScore };
    }
  }

  return (
    <div className="flex items-center justify-between mb-4 px-1">
      {weekDates.map((date, i) => {
        const health = healthByDate[date];
        const score = health?.healthScore ?? 0;
        const isToday = i === 6;
        const dayLabel = ['T', 'F', 'S', 'S', 'M', 'T', 'W'][i];
        return (
          <div key={date} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-zinc-500">{dayLabel}</span>
            <div className={`${isToday ? 'ring-2 ring-pink-500 rounded-full' : ''}`}>
              <ScoreRing score={score} size={32} showLabel={false} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HealthWidget({ userId }: HealthWidgetProps) {
  const [syncing, setSyncing] = useState(false);
  const monthStats = useQuery(api.health.getMonthStats, { userId });
  const isWhoopConnected = useQuery(api.health.isWhoopConnected, { userId });
  const healthGoals = useQuery(api.health.getHealthGoals, { userId });

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
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="animate-pulse flex items-center justify-center h-32">
            <Heart className="h-8 w-8 text-zinc-700 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format sleep duration
  const formatSleep = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m > 0 ? `${m}m` : ''}`;
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-purple-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between text-zinc-100">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-purple-400" />
            Health Score
          </div>
          {isWhoopConnected ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <Zap className="h-3 w-3 mr-1" />
              {syncing ? "Syncing..." : "Sync"}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleConnect} 
              className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
            >
              Connect Whoop
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Week Preview */}
        <WeekPreview userId={userId} />

        {/* Hero Score Ring */}
        <div className="flex justify-center mb-4">
          <ScoreRing score={monthStats.todayScore} size={140} />
        </div>

        {/* Three Metric Pills */}
        <div className="flex items-center justify-center gap-3">
          {/* Sleep Pill */}
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-full border border-zinc-700">
            <Moon className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-zinc-100 font-medium">
              {monthStats.todaySleep ? formatSleep(monthStats.todaySleep) : '0h'}
              <span className="text-zinc-500 ml-1">
                /{healthGoals?.sleepGoalHours ?? 7}h
              </span>
            </span>
          </div>

          {/* Steps Pill */}
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-full border border-zinc-700">
            <Footprints className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-zinc-100 font-medium">
              {monthStats.todaySteps ? Math.round(monthStats.todaySteps / 1000) : 0}
              <span className="text-zinc-500 ml-0.5">K</span>
              <span className="text-zinc-500 ml-1">
                /{Math.round((healthGoals?.stepsGoal ?? 3500) / 1000)}K
              </span>
            </span>
          </div>

          {/* Calories Pill */}
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-full border border-zinc-700">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-zinc-100 font-medium">
              {monthStats.todayCalories ?? 0}
              <span className="text-zinc-500 ml-1">
                /{healthGoals?.caloriesGoal ?? 350}
              </span>
            </span>
          </div>
        </div>

        {/* Streak indicator */}
        {monthStats.streak > 0 && (
          <div className="text-center mt-4">
            <span className="text-xs text-zinc-400">
              🔥 {monthStats.streak} day streak
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
