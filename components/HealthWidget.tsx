"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Flame, Moon, Footprints, Zap } from "lucide-react";
import { useMemo, useState } from "react";

interface HealthWidgetProps {
  userId: Id<"users">;
}

// Get color based on score
function getScoreColor(score: number): string {
  if (score === 100) return "#f59e0b"; // gold/amber for perfect
  if (score >= 85) return "#ec4899"; // bright pink for 85+
  if (score >= 70) return "#22c55e"; // green for 70-84
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
  // Use local date to avoid timezone issues
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Get current month and previous month (for when week spans month boundary)
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYearMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  
  // Check if any weekDates are from previous month
  const needsPrevMonth = weekDates.some(d => d.startsWith(prevYearMonth.slice(0, 7)));
  
  const currentMonthHealth = useQuery(api.health.getMonthHealth, { userId, yearMonth: currentYearMonth });
  const prevMonthHealth = useQuery(
    api.health.getMonthHealth, 
    needsPrevMonth ? { userId, yearMonth: prevYearMonth } : "skip"
  );

  const healthByDate: Record<string, { healthScore: number }> = {};
  if (currentMonthHealth) {
    for (const h of currentMonthHealth) {
      healthByDate[h.date] = { healthScore: h.healthScore };
    }
  }
  if (prevMonthHealth) {
    for (const h of prevMonthHealth) {
      healthByDate[h.date] = { healthScore: h.healthScore };
    }
  }

  // Get ring color class based on score (matching the score ring colors)
  const getRingColorClass = (score: number): string => {
    if (score === 0) return 'ring-zinc-600';
    if (score === 100) return 'ring-yellow-500';
    if (score >= 85) return 'ring-pink-500';
    if (score >= 70) return 'ring-green-500';
    if (score >= 50) return 'ring-blue-500';
    return 'ring-zinc-500';
  };

  return (
    <div className="flex items-center justify-between mb-4 px-1">
      {weekDates.map((date, i) => {
        const health = healthByDate[date];
        const score = health?.healthScore ?? 0;
        const isToday = i === 6;
        // Get actual day abbreviation from the date
        // Parse as local date to avoid timezone shift
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const [year, month, day] = date.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        const dayLabel = dayNames[localDate.getDay()];
        return (
          <div key={date} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-zinc-500">{dayLabel}</span>
            <div className={`${isToday ? `ring-2 ${getRingColorClass(score)} rounded-full` : ''}`}>
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
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);
  const monthStats = useQuery(api.health.getMonthStats, { userId });
  const latestHealth = useQuery(api.health.getLatestHealthOnOrBefore, { userId, date: today });
  const isWhoopConnected = useQuery(api.health.isWhoopConnected, { userId });
  const healthGoals = useQuery(api.health.getHealthGoals, { userId });

  // Debug logging
  console.log('[HealthWidget] userId:', userId);
  console.log('[HealthWidget] monthStats:', monthStats);

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

  const displayHealth = latestHealth && (!monthStats.todayScore || monthStats.todayScore === 0)
    ? latestHealth
    : null;
  const displayScore = displayHealth?.healthScore ?? monthStats.todayScore;
  const displaySleep = displayHealth?.sleepHours ?? monthStats.todaySleep;
  const displaySteps = displayHealth?.steps ?? monthStats.todaySteps;
  const displayCalories = displayHealth?.activeCalories ?? monthStats.todayCalories;
  const isShowingLatest = Boolean(displayHealth && displayHealth.date !== today);
  const latestDateLabel = displayHealth
    ? new Date(`${displayHealth.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between text-zinc-100">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-purple-400" />
            Health Score
            {isShowingLatest && latestDateLabel ? (
              <span className="text-xs font-normal text-zinc-500">Latest: {latestDateLabel}</span>
            ) : null}
          </div>
          {/* Whoop syncs automatically via Open Wearables - no manual connection needed */}
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Week Preview */}
        <WeekPreview userId={userId} />

        {/* Hero Score Ring */}
        <div className="flex justify-center mb-4">
          <ScoreRing score={displayScore} size={140} />
        </div>

        {/* Three Metric Pills */}
        <div className="flex items-center justify-center gap-3">
          {/* Sleep Pill - gold when goal met */}
          {(() => {
            const sleepGoal = healthGoals?.sleepGoalHours ?? 7;
            const isComplete = (displaySleep ?? 0) >= sleepGoal;
            return (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${
                isComplete 
                  ? 'bg-gradient-to-r from-yellow-600/30 to-amber-500/30 border-yellow-500/50' 
                  : 'bg-zinc-800 border-zinc-700'
              }`}>
                <Moon className={`h-4 w-4 ${isComplete ? 'text-yellow-400' : 'text-blue-400'}`} />
                <span className="text-sm text-zinc-100 font-medium">
                  {displaySleep ? formatSleep(displaySleep) : '0h'}
                  <span className={isComplete ? 'text-yellow-400/70 ml-1' : 'text-zinc-500 ml-1'}>
                    /{sleepGoal}h
                  </span>
                </span>
              </div>
            );
          })()}

          {/* Steps Pill - gold when goal met */}
          {(() => {
            const stepsGoal = healthGoals?.stepsGoal ?? 3500;
            const isComplete = (displaySteps ?? 0) >= stepsGoal;
            return (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${
                isComplete 
                  ? 'bg-gradient-to-r from-yellow-600/30 to-amber-500/30 border-yellow-500/50' 
                  : 'bg-zinc-800 border-zinc-700'
              }`}>
                <Footprints className={`h-4 w-4 ${isComplete ? 'text-yellow-400' : 'text-purple-400'}`} />
                <span className="text-sm text-zinc-100 font-medium">
                  {displaySteps ? Math.round(displaySteps / 1000) : 0}
                  <span className={isComplete ? 'text-yellow-400/70 ml-0.5' : 'text-zinc-500 ml-0.5'}>K</span>
                  <span className={isComplete ? 'text-yellow-400/70 ml-1' : 'text-zinc-500 ml-1'}>
                    /{Math.round(stepsGoal / 1000)}K
                  </span>
                </span>
              </div>
            );
          })()}

          {/* Calories Pill - gold when goal met */}
          {(() => {
            const caloriesGoal = healthGoals?.caloriesGoal ?? 350;
            const isComplete = (displayCalories ?? 0) >= caloriesGoal;
            return (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${
                isComplete 
                  ? 'bg-gradient-to-r from-yellow-600/30 to-amber-500/30 border-yellow-500/50' 
                  : 'bg-zinc-800 border-zinc-700'
              }`}>
                <Flame className={`h-4 w-4 ${isComplete ? 'text-yellow-400' : 'text-orange-400'}`} />
                <span className="text-sm text-zinc-100 font-medium">
                  {displayCalories ?? 0}
                  <span className={isComplete ? 'text-yellow-400/70 ml-1' : 'text-zinc-500 ml-1'}>
                    /{caloriesGoal}
                  </span>
                </span>
              </div>
            );
          })()}
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
