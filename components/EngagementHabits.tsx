"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Flame,
  MessageCircle,
  Share,
  Heart,
  PenSquare,
  Plus,
  Settings,
  CheckCircle2,
  Target,
  TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type ActivityType = "comment" | "post" | "reply" | "like" | "share";

const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: typeof MessageCircle; color: string }> = {
  comment: { label: "Comment", icon: MessageCircle, color: "text-blue-400" },
  post: { label: "Post", icon: PenSquare, color: "text-green-400" },
  reply: { label: "Reply", icon: MessageCircle, color: "text-purple-400" },
  like: { label: "Like", icon: Heart, color: "text-red-400" },
  share: { label: "Share", icon: Share, color: "text-amber-400" },
};

const PLATFORM_OPTIONS = [
  { value: "x", label: "𝕏 / Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "other", label: "Other" },
];

// ─── Component ────────────────────────────────────────────────────────────

interface EngagementHabitsProps {
  userId: Id<"users">;
}

export function EngagementHabits({ userId }: EngagementHabitsProps) {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [logType, setLogType] = useState<ActivityType>("comment");
  const [logPlatform, setLogPlatform] = useState("x");
  const [logCount, setLogCount] = useState(1);

  // Queries
  const stats = useQuery(api.engagementHabits.getEngagementStats, { userId });
  const todayActivities = useQuery(api.engagementHabits.getTodayActivities, { userId });

  // Mutations
  const logActivity = useMutation(api.engagementHabits.logActivity);
  const logMultiple = useMutation(api.engagementHabits.logMultipleActivities);
  const updateSettings = useMutation(api.engagementHabits.updateSettings);

  // Settings state
  const [settingsMin, setSettingsMin] = useState(stats?.dailyGoalMin ?? 3);
  const [settingsMax, setSettingsMax] = useState(stats?.dailyGoalMax ?? 5);

  if (!stats) {
    return (
      <Card className="border-gray-700 bg-gray-900/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = Math.min(100, (stats.todayCount / stats.dailyGoalMin) * 100);
  const isGoalMet = stats.todayCount >= stats.dailyGoalMin;
  const isExceeding = stats.todayCount >= stats.dailyGoalMax;

  const handleQuickLog = async (type: ActivityType) => {
    await logActivity({
      userId,
      type,
      platform: "x",
    });
  };

  const handleLogMultiple = async () => {
    if (logCount > 1) {
      await logMultiple({
        userId,
        type: logType,
        platform: logPlatform,
        count: logCount,
      });
    } else {
      await logActivity({
        userId,
        type: logType,
        platform: logPlatform,
      });
    }
    setShowLogDialog(false);
    setLogCount(1);
  };

  const handleSaveSettings = async () => {
    await updateSettings({
      userId,
      dailyGoalMin: settingsMin,
      dailyGoalMax: settingsMax,
    });
    setShowSettingsDialog(false);
  };

  return (
    <>
      <Card className="border-gray-700 bg-gray-900/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Engagement Habits
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200"
                onClick={() => {
                  setSettingsMin(stats.dailyGoalMin);
                  setSettingsMax(stats.dailyGoalMax);
                  setShowSettingsDialog(true);
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black gap-1"
                onClick={() => setShowLogDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Log
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Today's Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">Today&apos;s Goal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${isGoalMet ? "text-green-400" : "text-gray-200"}`}>
                  {stats.todayCount}
                </span>
                <span className="text-sm text-gray-500">/ {stats.dailyGoalMin}-{stats.dailyGoalMax}</span>
                {isGoalMet && <CheckCircle2 className="h-4 w-4 text-green-400" />}
              </div>
            </div>
            <Progress 
              value={progressPercent} 
              className={`h-3 ${isExceeding ? "bg-green-900" : isGoalMet ? "bg-green-900/50" : "bg-gray-800"}`}
            />
            <p className="text-xs text-gray-500 text-center">
              {isExceeding 
                ? "🎉 Crushing it today!" 
                : isGoalMet 
                  ? "✅ Goal reached! Keep going?" 
                  : `${stats.dailyGoalMin - stats.todayCount} more to hit your goal`}
            </p>
          </div>

          {/* Streak & Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Streak */}
            <div className="bg-gray-800/60 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className={`h-5 w-5 ${stats.streak > 0 ? "text-orange-500" : "text-gray-600"}`} />
                <span className={`text-2xl font-bold ${stats.streak > 0 ? "text-orange-400" : "text-gray-500"}`}>
                  {stats.streak}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Day Streak</p>
            </div>

            {/* Days This Week */}
            <div className="bg-gray-800/60 rounded-lg p-3 text-center">
              <span className="text-2xl font-bold text-blue-400">{stats.activeDaysThisWeek}</span>
              <span className="text-lg text-gray-500">/7</span>
              <p className="text-xs text-gray-500 mt-1">Days This Week</p>
            </div>

            {/* Total All Time */}
            <div className="bg-gray-800/60 rounded-lg p-3 text-center">
              <span className="text-2xl font-bold text-purple-400">{stats.totalEngagements}</span>
              <p className="text-xs text-gray-500 mt-1">Total</p>
            </div>
          </div>

          {/* Week Visual */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">This Week</p>
            <div className="flex gap-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => {
                const dayData = stats.weekTotals[i];
                const isToday = i === new Date().getDay();
                return (
                  <div
                    key={day}
                    className={`flex-1 rounded-lg p-2 text-center transition-all ${
                      dayData?.metGoal
                        ? "bg-green-600/30 border border-green-600/50"
                        : dayData?.count > 0
                          ? "bg-amber-600/20 border border-amber-600/30"
                          : "bg-gray-800/40 border border-gray-700/30"
                    } ${isToday ? "ring-2 ring-amber-500/50" : ""}`}
                  >
                    <p className={`text-xs font-medium ${isToday ? "text-amber-400" : "text-gray-400"}`}>{day}</p>
                    <p className={`text-sm font-bold ${
                      dayData?.metGoal ? "text-green-400" : dayData?.count > 0 ? "text-amber-400" : "text-gray-600"
                    }`}>
                      {dayData?.count ?? 0}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">Quick Log</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(ACTIVITY_CONFIG) as ActivityType[]).map((type) => {
                const config = ACTIVITY_CONFIG[type];
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className={`border-gray-700 hover:border-gray-600 gap-1 ${config.color}`}
                    onClick={() => handleQuickLog(type)}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Today's Activities */}
          {todayActivities && todayActivities.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Today&apos;s Activities</p>
              <div className="flex flex-wrap gap-1.5">
                {todayActivities.map((activity) => {
                  const config = ACTIVITY_CONFIG[activity.type as ActivityType];
                  return (
                    <Badge
                      key={activity._id}
                      variant="outline"
                      className={`text-xs border-gray-700 ${config?.color || "text-gray-400"}`}
                    >
                      {config?.label || activity.type} • {activity.platform}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Activity Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Log Engagement</DialogTitle>
            <DialogDescription className="text-gray-400">
              Record your social media engagement
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Activity Type</Label>
              <Select value={logType} onValueChange={(v) => setLogType(v as ActivityType)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACTIVITY_CONFIG) as ActivityType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {ACTIVITY_CONFIG[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Platform</Label>
              <Select value={logPlatform} onValueChange={setLogPlatform}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Count</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                  onClick={() => setLogCount(Math.max(1, logCount - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={logCount}
                  onChange={(e) => setLogCount(parseInt(e.target.value) || 1)}
                  className="w-20 text-center bg-gray-800 border-gray-600 text-gray-100"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                  onClick={() => setLogCount(Math.min(20, logCount + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleLogMultiple} className="bg-amber-500 hover:bg-amber-600 text-black">
              Log {logCount} {logCount > 1 ? `${logType}s` : logType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Engagement Settings</DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure your daily engagement goals
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Daily Goal Range</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Minimum</p>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={settingsMin}
                    onChange={(e) => setSettingsMin(parseInt(e.target.value) || 1)}
                    className="bg-gray-800 border-gray-600 text-gray-100"
                  />
                </div>
                <span className="text-gray-500 pt-5">to</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Maximum</p>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={settingsMax}
                    onChange={(e) => setSettingsMax(parseInt(e.target.value) || 5)}
                    className="bg-gray-800 border-gray-600 text-gray-100"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Recommended: 3-5 engagements per day for consistent growth
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="bg-amber-500 hover:bg-amber-600 text-black">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
