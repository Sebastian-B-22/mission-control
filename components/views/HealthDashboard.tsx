"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Heart,
  Flame,
  Moon,
  Footprints,
  TrendingUp,
  Zap,
  ChevronLeft,
  ChevronRight,
  Check,
  Target,
  Trophy,
  Calendar,
  RefreshCw,
  Unplug,
} from "lucide-react";

interface HealthDashboardProps {
  userId: Id<"users">;
}

// Get color based on score - matches Don't Die color scheme
function getScoreColor(score: number): string {
  if (score === 100) return "#f59e0b"; // gold/amber for perfect
  if (score >= 85) return "#ec4899"; // bright pink for 85+
  if (score >= 70) return "#a855f7"; // purple for 70-84
  if (score >= 50) return "#3b82f6"; // blue for 50-70
  return "#71717a"; // zinc-500 for <50
}

// Get text color class based on score
function getScoreTextClass(score: number): string {
  if (score === 100) return "text-amber-500";
  if (score >= 85) return "text-pink-500";
  if (score >= 70) return "text-purple-400";
  if (score >= 50) return "text-blue-500";
  return "text-zinc-500";
}

// Score ring component - Don't Die style with score-based colors
function ScoreRing({ 
  score, 
  size = 180, 
  showLabel = true,
}: { 
  score: number; 
  size?: number; 
  showLabel?: boolean;
}) {
  // Scale stroke width based on size
  const strokeWidth = size <= 40 ? 3 : size <= 60 ? 5 : size <= 100 ? 8 : 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const isPerfect = score === 100;
  const ringColor = getScoreColor(score);

  // Scale font size based on ring size
  const getFontSize = () => {
    if (size <= 40) return 'text-xs';
    if (size <= 60) return 'text-sm';
    if (size <= 100) return 'text-xl';
    return 'text-4xl';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#27272a"
          fill="none"
        />
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
            {showLabel && <span className="text-sm text-zinc-400">Perfect</span>}
          </>
        ) : (
          <>
            <span className={`${getFontSize()} font-bold ${getScoreTextClass(score)}`}>
              {score}
            </span>
            {showLabel && <span className="text-sm text-zinc-500">Today's Score</span>}
          </>
        )}
      </div>
    </div>
  );
}

// Mini score ring for calendar
function MiniScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  return <ScoreRing score={score} size={size} showLabel={false} />;
}

// Calendar day cell with mini rings
function CalendarDay({
  date,
  health,
  isToday,
  onClick,
}: {
  date: Date;
  health?: { healthScore: number; isPerfectDay: boolean };
  isToday: boolean;
  onClick: () => void;
}) {
  const day = date.getDate();
  const score = health?.healthScore ?? 0;
  const hasData = !!health;

  return (
    <button
      onClick={onClick}
      className={`aspect-square w-full rounded-lg flex flex-col items-center justify-center transition-all hover:bg-zinc-800 ${
        isToday ? "ring-2 ring-pink-500" : ""
      }`}
    >
      <div className="text-xs text-zinc-400 mb-1">{day}</div>
      {hasData ? (
        <MiniScoreRing score={score} size={36} />
      ) : (
        <div className="w-9 h-9 rounded-full border-2 border-zinc-800 flex items-center justify-center">
          <span className="text-xs text-zinc-700">-</span>
        </div>
      )}
    </button>
  );
}

// Week preview
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
    <div className="flex items-center justify-between mb-4 px-2">
      {weekDates.map((date, i) => {
        const health = healthByDate[date];
        const score = health?.healthScore ?? 0;
        const isToday = i === 6;
        const dayLabel = ['T', 'F', 'S', 'S', 'M', 'T', 'W'][i]; // Show day labels for the week
        
        return (
          <div key={date} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-zinc-500">{dayLabel}</span>
            <div className={`${isToday ? 'ring-2 ring-pink-500 rounded-full' : ''}`}>
              <MiniScoreRing score={score} size={32} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HealthDashboard({ userId }: HealthDashboardProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [syncing, setSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [stepsInput, setStepsInput] = useState("");

  const monthStats = useQuery(api.health.getMonthStats, { userId });
  const isWhoopConnected = useQuery(api.health.isWhoopConnected, { userId });
  const healthGoals = useQuery(api.health.getHealthGoals, { userId });

  const yearMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
  const monthHealth = useQuery(api.health.getMonthHealth, { userId, yearMonth });

  const updateSteps = useMutation(api.health.updateSteps);
  const disconnectWhoop = useMutation(api.health.disconnectWhoop);

  // Create health lookup by date
  const healthByDate: Record<string, { healthScore: number; isPerfectDay: boolean }> = {};
  if (monthHealth) {
    for (const h of monthHealth) {
      healthByDate[h.date] = { healthScore: h.healthScore, isPerfectDay: h.isPerfectDay };
    }
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/auth/whoop/sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, days: 7 }),
      });
    } catch (e) {
      console.error("Sync error:", e);
    }
    setSyncing(false);
  };

  const handleConnect = () => {
    window.location.href = `/api/auth/whoop?userId=${userId}`;
  };

  const handleDisconnect = async () => {
    if (confirm("Are you sure you want to disconnect Whoop?")) {
      await disconnectWhoop({ userId });
    }
  };

  const handleSaveSteps = async () => {
    if (!selectedDate || !stepsInput) return;
    await updateSteps({
      userId,
      date: selectedDate,
      steps: parseInt(stepsInput),
    });
    setSelectedDate(null);
    setStepsInput("");
  };

  const calendarDays = generateCalendarDays();
  const today = new Date().toISOString().split("T")[0];

  // Calculate progress toward goals
  const sleepProgress = monthStats?.todaySleep
    ? Math.min((monthStats.todaySleep / (healthGoals?.sleepGoalHours ?? 7)) * 100, 100)
    : 0;
  const stepsProgress = monthStats?.todaySteps
    ? Math.min((monthStats.todaySteps / (healthGoals?.stepsGoal ?? 3500)) * 100, 100)
    : 0;
  const caloriesProgress = monthStats?.todayCalories
    ? Math.min((monthStats.todayCalories / (healthGoals?.caloriesGoal ?? 350)) * 100, 100)
    : 0;

  // Goal level progression
  const goalLevels = [
    { level: 1, target: 20, label: "Starter" },
    { level: 2, target: 25, label: "Committed" },
    { level: 3, target: 30, label: "Champion" },
  ];
  const currentLevel = goalLevels.find((l) => l.target === (healthGoals?.perfectDaysGoal ?? 20)) || goalLevels[0];

  // Format sleep
  const formatSleep = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m > 0 ? `${m}m` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-zinc-100">
            <Heart className="h-6 w-6 text-purple-400" />
            Health Dashboard
          </h2>
          <p className="text-zinc-400 mt-1">
            Track your health like a pro. Every perfect day counts!
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isWhoopConnected ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSync} 
                disabled={syncing}
                className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Whoop"}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDisconnect}
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <Unplug className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} className="bg-purple-600 hover:bg-purple-700">
              <Zap className="h-4 w-4 mr-2" />
              Connect Whoop
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Score + Progress */}
        <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Week Preview */}
            <WeekPreview userId={userId} />

            {/* Score Ring */}
            <div className="flex justify-center">
              <ScoreRing score={monthStats?.todayScore ?? 0} />
            </div>

            {/* Metric Pills */}
            <div className="space-y-3">
              {/* Sleep */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Sleep</p>
                    <p className="text-lg font-semibold text-zinc-100">
                      {monthStats?.todaySleep ? formatSleep(monthStats.todaySleep) : '0h'}
                      <span className="text-sm text-zinc-500 ml-1">
                        / {healthGoals?.sleepGoalHours ?? 7}h
                      </span>
                    </p>
                  </div>
                </div>
                <Progress
                  value={sleepProgress}
                  className="h-2 w-20"
                />
              </div>

              {/* Steps */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700">
                <div className="flex items-center gap-3">
                  <Footprints className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Steps</p>
                    <p className="text-lg font-semibold text-zinc-100">
                      {monthStats?.todaySteps?.toLocaleString() ?? '0'}
                      <span className="text-sm text-zinc-500 ml-1">
                        / {(healthGoals?.stepsGoal ?? 3500).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
                <Progress
                  value={stepsProgress}
                  className="h-2 w-20"
                />
              </div>

              {/* Active Calories */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700">
                <div className="flex items-center gap-3">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Active Calories</p>
                    <p className="text-lg font-semibold text-zinc-100">
                      {monthStats?.todayCalories ?? 0}
                      <span className="text-sm text-zinc-500 ml-1">
                        / {healthGoals?.caloriesGoal ?? 350}
                      </span>
                    </p>
                  </div>
                </div>
                <Progress
                  value={caloriesProgress}
                  className="h-2 w-20"
                />
              </div>
            </div>

            {/* Manual Steps Entry */}
            <Button
              variant="outline"
              className="w-full bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              onClick={() => {
                setSelectedDate(today);
                setStepsInput(monthStats?.todaySteps?.toString() ?? "");
              }}
            >
              <Footprints className="h-4 w-4 mr-2" />
              Log Steps Manually
            </Button>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                <Calendar className="h-5 w-5" />
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                  className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-zinc-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, i) => (
                <div key={i}>
                  {date ? (
                    <CalendarDay
                      date={date}
                      health={healthByDate[date.toISOString().split("T")[0]]}
                      isToday={date.toISOString().split("T")[0] === today}
                      onClick={() => {
                        const dateStr = date.toISOString().split("T")[0];
                        setSelectedDate(dateStr);
                        const health = monthHealth?.find((h) => h.date === dateStr);
                        setStepsInput(health?.steps?.toString() ?? "");
                      }}
                    />
                  ) : (
                    <div className="aspect-square" />
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-amber-500 flex items-center justify-center">
                  <span className="text-amber-500 text-xs">✓</span>
                </div>
                <span className="text-zinc-400">Perfect (100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-pink-500 flex items-center justify-center">
                  <span className="text-pink-500 text-xs">85</span>
                </div>
                <span className="text-zinc-400">Great (85+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500 flex items-center justify-center">
                  <span className="text-purple-400 text-xs">70</span>
                </div>
                <span className="text-zinc-400">Good (70-84)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                  <span className="text-blue-400 text-xs">50</span>
                </div>
                <span className="text-zinc-400">Fair (50-69)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-zinc-700 flex items-center justify-center">
                  <span className="text-zinc-600 text-xs">-</span>
                </div>
                <span className="text-zinc-400">No data</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Perfect Days */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Perfect Days</p>
                <p className="text-3xl font-bold text-amber-500">
                  {monthStats?.perfectDays ?? 0}
                </p>
                <p className="text-xs text-zinc-500">
                  of {healthGoals?.perfectDaysGoal ?? 20} this month
                </p>
              </div>
              <Trophy className="h-8 w-8 text-amber-500/30" />
            </div>
            <Progress
              value={((monthStats?.perfectDays ?? 0) / (healthGoals?.perfectDaysGoal ?? 20)) * 100}
              className="mt-3 h-2 bg-zinc-800"
            />
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Current Streak</p>
                <p className="text-3xl font-bold text-green-400">
                  {monthStats?.streak ?? 0}
                </p>
                <p className="text-xs text-zinc-500">
                  {(monthStats?.streak ?? 0) === 1 ? "day" : "days"} in a row
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-zinc-700" />
            </div>
          </CardContent>
        </Card>

        {/* Goal Level */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Goal Level</p>
                <p className="text-3xl font-bold text-zinc-100">{currentLevel.label}</p>
                <p className="text-xs text-zinc-500">
                  {currentLevel.target} perfect days/month
                </p>
              </div>
              <Target className="h-8 w-8 text-zinc-700" />
            </div>
          </CardContent>
        </Card>

        {/* Days Remaining */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Days Left</p>
                <p className="text-3xl font-bold text-zinc-100">
                  {(monthStats?.daysInMonth ?? 30) - (monthStats?.daysPassed ?? 0)}
                </p>
                <p className="text-xs text-zinc-500">
                  to hit {healthGoals?.perfectDaysGoal ?? 20} perfect days
                </p>
              </div>
              <Calendar className="h-8 w-8 text-zinc-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Progression */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
            <Target className="h-5 w-5" />
            Goal Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            {goalLevels.map((level, i) => (
              <div
                key={level.level}
                className={`flex-1 p-4 rounded-lg text-center ${
                  level.level === (healthGoals?.currentLevel ?? 1)
                    ? "bg-zinc-800 ring-2 ring-purple-500"
                    : level.level < (healthGoals?.currentLevel ?? 1)
                    ? "bg-zinc-800/50"
                    : "bg-zinc-800/30"
                }`}
              >
                <p className="font-semibold text-zinc-100">{level.label}</p>
                <p className="text-2xl font-bold text-purple-400">{level.target}</p>
                <p className="text-xs text-zinc-500">perfect days/month</p>
                {level.level < (healthGoals?.currentLevel ?? 1) && (
                  <Badge variant="secondary" className="mt-2 bg-green-900 text-green-300">
                    <Check className="h-3 w-3 mr-1" /> Completed
                  </Badge>
                )}
                {level.level === (healthGoals?.currentLevel ?? 1) && (
                  <Badge className="mt-2 bg-purple-600">Current Goal</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Steps Entry Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Log Steps</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter your step count for {selectedDate}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="e.g., 5000"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedDate(null)}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSteps} 
              disabled={!stepsInput}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Save Steps
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
