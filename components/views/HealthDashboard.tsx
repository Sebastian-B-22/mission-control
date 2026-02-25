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

// Score ring component
function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 85) return "#F59E0B";
    if (s >= 70) return "#F59E0B";
    if (s >= 50) return "#EAB308";
    return "#EF4444";
  };

  const color = getColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#E5E7EB"
          fill="none"
        />
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
        <span className="text-4xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground">Today's Score</span>
        {score === 100 && (
          <Badge className="mt-1 bg-amber-500">✓ Perfect Day!</Badge>
        )}
      </div>
    </div>
  );
}

// Calendar day cell
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
  const isPerfect = health?.isPerfectDay;

  const getBackgroundColor = () => {
    if (!health) return "bg-gray-50";
    if (isPerfect) return "bg-amber-500 text-white";
    if (score >= 85) return "bg-amber-100";
    if (score >= 70) return "bg-orange-100";
    if (score >= 50) return "bg-yellow-100";
    return "bg-red-50";
  };

  return (
    <button
      onClick={onClick}
      className={`aspect-square w-full rounded-lg flex flex-col items-center justify-center text-sm transition-all hover:ring-2 hover:ring-amber-300 ${getBackgroundColor()} ${isToday ? "ring-2 ring-amber-500" : ""}`}
    >
      <span className={`font-medium ${isPerfect ? "text-white" : ""}`}>{day}</span>
      {isPerfect && <Check className="h-3 w-3" />}
      {health && !isPerfect && (
        <span className="text-xs opacity-70">{score}</span>
      )}
    </button>
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
    const startDay = firstDay.getDay(); // 0 = Sunday

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Sync last 7 days
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-amber-500" />
            Health Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Track your health like a pro. Every perfect day counts!
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isWhoopConnected ? (
            <>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Whoop"}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                <Unplug className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} className="bg-amber-600 hover:bg-amber-700">
              <Zap className="h-4 w-4 mr-2" />
              Connect Whoop
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Score + Progress */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Ring */}
            <div className="flex justify-center">
              <ScoreRing score={monthStats?.todayScore ?? 0} />
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              {/* Sleep */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-blue-500" />
                    Sleep
                  </span>
                  <span className="font-medium">
                    {monthStats?.todaySleep ?? 0}h / {healthGoals?.sleepGoalHours ?? 7}h
                  </span>
                </div>
                <Progress
                  value={sleepProgress}
                  className="h-3"
                  // @ts-ignore - custom color
                  indicatorClassName={sleepProgress >= 100 ? "bg-green-500" : "bg-blue-500"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {sleepProgress >= 100 ? "✓ 33 points" : `${Math.floor(sleepProgress * 0.33)} points`}
                </p>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <Footprints className="h-4 w-4 text-amber-500" />
                    Steps
                  </span>
                  <span className="font-medium">
                    {(monthStats?.todaySteps ?? 0).toLocaleString()} / {(healthGoals?.stepsGoal ?? 3500).toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={stepsProgress}
                  className="h-3"
                  // @ts-ignore
                  indicatorClassName={stepsProgress >= 100 ? "bg-green-500" : "bg-amber-500"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stepsProgress >= 100 ? "✓ 33 points" : `${Math.floor(stepsProgress * 0.33)} points`}
                </p>
                <p className="text-xs text-amber-600 mt-1 italic">
                  🍎 Apple Health integration coming soon (steps)
                </p>
              </div>

              {/* Active Calories */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    Active Calories
                  </span>
                  <span className="font-medium">
                    {monthStats?.todayCalories ?? 0} / {healthGoals?.caloriesGoal ?? 350}
                  </span>
                </div>
                <Progress
                  value={caloriesProgress}
                  className="h-3"
                  // @ts-ignore
                  indicatorClassName={caloriesProgress >= 100 ? "bg-green-500" : "bg-red-500"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {caloriesProgress >= 100 ? "✓ 34 points" : `${Math.floor(caloriesProgress * 0.34)} points`}
                </p>
              </div>
            </div>

            {/* Manual Steps Entry */}
            <Button
              variant="outline"
              className="w-full"
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
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
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
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
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
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Perfect (100)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-100" />
                <span>85+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-100" />
                <span>70-84</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-50" />
                <span>No data</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Perfect Days */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Perfect Days</p>
                <p className="text-3xl font-bold text-amber-600">
                  {monthStats?.perfectDays ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {healthGoals?.perfectDaysGoal ?? 20} this month
                </p>
              </div>
              <Trophy className="h-8 w-8 text-amber-200" />
            </div>
            <Progress
              value={((monthStats?.perfectDays ?? 0) / (healthGoals?.perfectDaysGoal ?? 20)) * 100}
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold text-green-600">
                  {monthStats?.streak ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(monthStats?.streak ?? 0) === 1 ? "day" : "days"} in a row
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        {/* Goal Level */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Goal Level</p>
                <p className="text-3xl font-bold">{currentLevel.label}</p>
                <p className="text-xs text-muted-foreground">
                  {currentLevel.target} perfect days/month
                </p>
              </div>
              <Target className="h-8 w-8 text-gray-200" />
            </div>
          </CardContent>
        </Card>

        {/* Days Remaining */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days Left</p>
                <p className="text-3xl font-bold">
                  {(monthStats?.daysInMonth ?? 30) - (monthStats?.daysPassed ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  to hit {healthGoals?.perfectDaysGoal ?? 20} perfect days
                </p>
              </div>
              <Calendar className="h-8 w-8 text-gray-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Progression */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
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
                    ? "bg-amber-100 ring-2 ring-amber-500"
                    : level.level < (healthGoals?.currentLevel ?? 1)
                    ? "bg-green-50"
                    : "bg-gray-50"
                }`}
              >
                <p className="font-semibold">{level.label}</p>
                <p className="text-2xl font-bold text-amber-600">{level.target}</p>
                <p className="text-xs text-muted-foreground">perfect days/month</p>
                {level.level < (healthGoals?.currentLevel ?? 1) && (
                  <Badge variant="secondary" className="mt-2">
                    <Check className="h-3 w-3 mr-1" /> Completed
                  </Badge>
                )}
                {level.level === (healthGoals?.currentLevel ?? 1) && (
                  <Badge className="mt-2 bg-amber-500">Current Goal</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Steps Entry Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Steps</DialogTitle>
            <DialogDescription>
              Enter your step count for {selectedDate}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="e.g., 5000"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDate(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSteps} disabled={!stepsInput}>
              Save Steps
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
