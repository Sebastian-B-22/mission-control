"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Camera,
  Calculator,
  Globe,
  Brain,
} from "lucide-react";
import HomeschoolMonthlyPDF from "@/components/HomeschoolMonthlyPDF";

interface HomeschoolProgressViewNewProps {
  userId: Id<"users">;
}

// Activity categories configuration
const CATEGORIES = {
  writing: {
    label: "Language Arts",
    activities: ["Writing with Skill", "Membean", "Spelling", "Italian", "Rosetta Stone"],
    icon: "✍️",
    color: "bg-blue-500",
  },
  history: {
    label: "History",
    activities: [],
    icon: "🌍",
    color: "bg-amber-500",
  },
  financial: {
    label: "Financial Literacy",
    activities: ["Tuttle Twins (Supply & Demand)"],
    icon: "💵",
    color: "bg-emerald-500",
  },
  math: {
    label: "Math",
    activities: ["Math Academy", "Wonder Math"],
    icon: "🔢",
    color: "bg-purple-500",
  },
  literature: {
    label: "Literature",
    activities: ["Shakespeare", "Read Aloud", "Reading"],
    icon: "📖",
    color: "bg-rose-500",
  },
  science: {
    label: "Science",
    activities: ["Experiment", "Nature", "Other"],
    icon: "🧪",
    color: "bg-sky-500",
  },
  art: {
    label: "Art",
    activities: ["Drawing", "Painting", "Craft", "Other"],
    icon: "🎨",
    color: "bg-pink-500",
  },
  music: {
    label: "Music",
    activities: ["Drum Lesson", "Drum Practice", "Drumeo", "Piano", "Singing", "Listening", "Other"],
    icon: "🎵",
    color: "bg-indigo-500",
  },
  "life-skills": {
    label: "Life Skills",
    activities: ["Cooking", "Organization", "Money Management"],
    icon: "🛠️",
    color: "bg-teal-500",
  },
  pe: {
    label: "PE",
    activities: [
      "Soccer",
      "Jiu-jitsu",
      "Boxing",
      "Ninja Academy",
      "Rock Climbing",
      "Indoor Skydiving",
      "Sprinting",
      "Juggling",
      "Drawing",
    ],
    icon: "🏃",
    color: "bg-green-500",
  },
};

type AutoProgressMap = Record<string, Record<string, any>>;

function getLatestAutoSync(progress: AutoProgressMap | null | undefined): number | null {
  if (!progress) return null;

  let latest: number | null = null;
  for (const student of Object.values(progress)) {
    for (const platform of Object.values(student || {})) {
      const scrapedAt = typeof platform?.scrapedAt === "number" ? platform.scrapedAt : null;
      if (scrapedAt && (!latest || scrapedAt > latest)) {
        latest = scrapedAt;
      }
    }
  }

  return latest;
}

function formatAutoSyncTime(timestamp: number | null | undefined): string {
  if (!timestamp) return "not synced yet";

  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

export function HomeschoolProgressViewNew({ userId }: HomeschoolProgressViewNewProps) {
  const getPstDateKey = () => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // en-CA yields YYYY-MM-DD
    return fmt.format(new Date());
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    return getPstDateKey();
  });
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");
  const [selectedStudent, setSelectedStudent] = useState<"anthony" | "roma" | "both">("both");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddMessage, setQuickAddMessage] = useState<string | null>(null);

  // Queries
  const activities = useQuery(api.homeschoolActivities.getActivitiesByDate, {
    userId,
    date: selectedDate,
  });
  
  const autoProgress = useQuery(api.homeschoolProgress.getAllProgress, {});
  const [serverAutoProgress, setServerAutoProgress] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadServerProgress = async () => {
      try {
        const res = await fetch(`/api/homeschool-progress?t=${Date.now()}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setServerAutoProgress(data);
      } catch (error) {
        console.error("Failed to load server homeschool progress", error);
      }
    };

    loadServerProgress();
    return () => {
      cancelled = true;
    };
  }, []);
  
  const resolvedAutoProgress = serverAutoProgress || autoProgress;
  const latestAutoSync = getLatestAutoSync(resolvedAutoProgress);
  const autoSyncIsStale = latestAutoSync ? Date.now() - latestAutoSync > 6 * 60 * 60 * 1000 : true;
  
  const stats = useQuery(api.homeschoolActivities.getDashboardStats, {
    userId,
    date: selectedDate,
  });

  // Mutations
  const logActivity = useMutation(api.homeschoolActivities.logActivity);
  const toggleActivity = useMutation(api.homeschoolActivities.toggleActivity);
  const quickLog = useMutation(api.homeschoolActivities.quickLog);
  const dedupeForDate = useMutation(api.activitiesAdmin.dedupeForDate);
  const rebuildFromRecap = useMutation(api.activitiesAdmin.rebuildFromRecap);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatPstDateKey = (d: Date) => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(d);
  };

  const navigateDate = (direction: number) => {
    const current = new Date(selectedDate + "T12:00:00");
    current.setDate(current.getDate() + direction);
    setSelectedDate(formatPstDateKey(current));
  };

  const isToday = selectedDate === getPstDateKey();

  const handleQuickLog = async (category: string, activity: string) => {
    try {
      setQuickAddMessage(null);
      const result = await quickLog({
        userId,
        date: selectedDate,
        student: selectedStudent,
        category,
        activity,
      });
      const label = result?.activity || activity;
      setQuickAddMessage(result?.toggled ? `Updated: ${label}` : `Logged: ${label}`);
    } catch (e: any) {
      console.error("Quick add failed", e);
      setQuickAddMessage(e?.message || "Quick add failed");
    }
  };

  const handleToggle = async (id: Id<"homeschoolActivities">, completed: boolean) => {
    await toggleActivity({ id, completed: !completed });
  };

  // Group activities by category
  const activitiesByCategory = activities?.reduce((acc, act) => {
    if (!acc[act.category]) acc[act.category] = [];
    acc[act.category].push(act);
    return acc;
  }, {} as Record<string, typeof activities>) || {};

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📚 Homeschool Progress
          </h1>
          <p className="text-muted-foreground">Track daily learning activities</p>
        </div>
        
        {/* Date Navigator + Monthly PDF */}
        <div className="flex items-center gap-2">
          <HomeschoolMonthlyPDF userId={userId} />
          <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg min-w-[140px] text-center">
            <span className="font-medium">{formatDate(selectedDate)}</span>
            {isToday && <Badge className="ml-2" variant="secondary">Today</Badge>}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigateDate(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 dark:bg-green-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.today.completed || 0}/{stats?.today.total || 0}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 dark:bg-blue-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.week.completed || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 dark:bg-purple-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anthony</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats?.byStudent.anthony.completed || 0}/{stats?.byStudent.anthony.total || 0}
                </p>
              </div>
              <span className="text-2xl">👦</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-pink-50 dark:bg-pink-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Roma</p>
                <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {stats?.byStudent.roma.completed || 0}/{stats?.byStudent.roma.total || 0}
                </p>
              </div>
              <span className="text-2xl">👧</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-tracked Platforms */}
      <Card className={autoSyncIsStale ? "border-amber-500/40" : undefined}>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Auto-tracked Platforms
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Last sync {formatAutoSyncTime(latestAutoSync)}.
                {autoSyncIsStale ? " This section only changes when the background scraper runs." : " Fresh enough to trust for today."}
              </p>
            </div>
            <Badge variant={autoSyncIsStale ? "secondary" : "outline"}>
              {autoSyncIsStale ? "Needs refresh" : "Fresh"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Math Academy */}
            <div className="p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Math Academy</span>
              </div>
              {resolvedAutoProgress?.Anthony?.["math-academy"] && (
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <p>Anthony: {resolvedAutoProgress.Anthony["math-academy"].level}</p>
                    {resolvedAutoProgress.Anthony["math-academy"].todayCompleted && (
                      <Badge variant="outline">Done today</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {resolvedAutoProgress.Anthony["math-academy"].details?.xpToday || 0} XP today • synced {formatAutoSyncTime(resolvedAutoProgress.Anthony["math-academy"].scrapedAt)}
                  </p>
                </div>
              )}
              {resolvedAutoProgress?.Roma?.["math-academy"] && (
                <div className="text-sm space-y-1 mt-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <p>Roma: {resolvedAutoProgress.Roma["math-academy"].level}</p>
                    {resolvedAutoProgress.Roma["math-academy"].todayCompleted && (
                      <Badge variant="outline">Done today</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {resolvedAutoProgress.Roma["math-academy"].details?.xpToday || 0} XP today • synced {formatAutoSyncTime(resolvedAutoProgress.Roma["math-academy"].scrapedAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Membean */}
            <div className="p-4 rounded-lg border bg-yellow-50/50 dark:bg-yellow-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Membean</span>
              </div>
              {resolvedAutoProgress?.Anthony?.membean && (
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <p>Anthony: {resolvedAutoProgress.Anthony.membean.level}</p>
                    {resolvedAutoProgress.Anthony.membean.todayCompleted && (
                      <Badge variant="outline">Done today</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {resolvedAutoProgress.Anthony.membean.weeklyMinutes || 0}m this week • synced {formatAutoSyncTime(resolvedAutoProgress.Anthony.membean.scrapedAt)}
                  </p>
                </div>
              )}
              {resolvedAutoProgress?.Roma?.membean && (
                <div className="text-sm space-y-1 mt-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <p>Roma: {resolvedAutoProgress.Roma.membean.level}</p>
                    {resolvedAutoProgress.Roma.membean.todayCompleted && (
                      <Badge variant="outline">Done today</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {resolvedAutoProgress.Roma.membean.weeklyMinutes || 0}m this week • synced {formatAutoSyncTime(resolvedAutoProgress.Roma.membean.scrapedAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Rosetta Stone */}
            <div className="p-4 rounded-lg border bg-green-50/50 dark:bg-green-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-green-500" />
                <span className="font-medium">Rosetta Stone</span>
              </div>
              {resolvedAutoProgress?.Family?.["rosetta-stone"] && (
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <p>Family: {resolvedAutoProgress.Family["rosetta-stone"].level}</p>
                    {resolvedAutoProgress.Family["rosetta-stone"].todayCompleted && (
                      <Badge variant="outline">Done today</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {resolvedAutoProgress.Family["rosetta-stone"].weeklyMinutes || 0}m this week • synced {formatAutoSyncTime(resolvedAutoProgress.Family["rosetta-stone"].scrapedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Filter + Quick Add */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Log for:</span>
          <div className="flex gap-1">
            {(["anthony", "roma", "both"] as const).map((student) => (
              <Button
                key={student}
                variant={selectedStudent === student ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStudent(student)}
              >
                {student === "both" ? "Both" : student === "anthony" ? "👦 Anthony" : "👧 Roma"}
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={() => { setShowQuickAdd(!showQuickAdd); setQuickAddMessage(null); }} variant="outline" type="button">
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </Button>
      </div>

      {/* Quick Add Panel */}
      {showQuickAdd && (
        <Card className="border-2 border-dashed border-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Click to log as completed for {selectedStudent === "both" ? "both kids" : selectedStudent}:
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      setQuickAddMessage(null);
                      const res = await dedupeForDate({ userId, date: selectedDate });
                      setQuickAddMessage(`Cleaned duplicates (deleted ${res.deleted}).`);
                    } catch (e: any) {
                      setQuickAddMessage(e?.message || "Failed to clean duplicates");
                    }
                  }}
                >
                  Clean duplicates
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!confirm(`Rebuild activities for ${selectedDate} from your recap? This will reset the list for that day.`)) return;
                    try {
                      setQuickAddMessage(null);
                      const res = await rebuildFromRecap({ userId, date: selectedDate });
                      setQuickAddMessage(`Rebuilt from recap. Cleared ${res.cleared.deleted}, imported ${res.imported.inserted ?? 0}.`);
                    } catch (e: any) {
                      setQuickAddMessage(e?.message || "Failed to rebuild from recap");
                    }
                  }}
                >
                  Rebuild from recap
                </Button>
              </div>
            </div>
            {quickAddMessage && (
              <p className="text-xs text-muted-foreground mb-3">{quickAddMessage}</p>
            )}
            <div className="space-y-4">
              {Object.entries(CATEGORIES).map(([key, config]) => (
                <div key={key}>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <span>{config.icon}</span>
                    {config.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {config.activities.map((activity) => (
                      <Button
                        key={activity}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickLog(key, activity)}
                        className="hover:bg-green-100 dark:hover:bg-green-900/30"
                      >
                        {activity}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Activities by Category */}
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(CATEGORIES).map(([key, config]) => {
          const categoryActivities = activitiesByCategory[key] || [];
          const completed = categoryActivities.filter(a => a.completed).length;
          
          // Don't render empty categories
          if (categoryActivities.length === 0) {
            return null;
          }
          
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    {config.label}
                  </span>
                  <Badge variant={completed === categoryActivities.length ? "default" : "secondary"}>
                    {completed}/{categoryActivities.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryActivities.map((act) => (
                      <div
                        key={act._id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Checkbox
                          checked={act.completed}
                          onCheckedChange={() => handleToggle(act._id, act.completed)}
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${act.completed ? "text-muted-foreground" : ""}`}>
                            {act.activity}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {act.student === "both" ? "Both" : act.student}
                            {act.durationMinutes && ` • ${act.durationMinutes}m`}
                          </p>
                        </div>
                        {act.mediaUrl && (
                          <Camera className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly Summary (when on weekly tab) */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              This Week by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {Object.entries(CATEGORIES).map(([key, config]) => (
                <div key={key} className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-2xl">{config.icon}</span>
                  <p className="text-xl font-bold mt-1">
                    {stats.week.byCategory[key] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
