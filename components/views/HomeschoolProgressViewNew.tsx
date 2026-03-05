"use client";

import { useState } from "react";
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
    activities: ["Tuttle Twins", "Story of the World"],
    icon: "🌍",
    color: "bg-amber-500",
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
    activities: ["Piano", "Singing", "Listening", "Other"],
    icon: "🎵",
    color: "bg-indigo-500",
  },
  financial: {
    label: "Financial Literacy",
    activities: ["Money Management", "Budgeting", "Investing", "Other"],
    icon: "💵",
    color: "bg-emerald-500",
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
  
  const stats = useQuery(api.homeschoolActivities.getDashboardStats, {
    userId,
    date: selectedDate,
  });

  // Mutations
  const logActivity = useMutation(api.homeschoolActivities.logActivity);
  const toggleActivity = useMutation(api.homeschoolActivities.toggleActivity);
  const quickLog = useMutation(api.homeschoolActivities.quickLog);
  const dedupeForDate = useMutation(api.activitiesAdmin.dedupeForDate);

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
      await quickLog({
        userId,
        date: selectedDate,
        student: selectedStudent,
        category,
        activity,
      });
      setQuickAddMessage(`Logged: ${activity}`);
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
        
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Auto-tracked Platforms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Math Academy */}
            <div className="p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Math Academy</span>
              </div>
              {autoProgress?.Anthony?.["math-academy"] && (
                <div className="text-sm space-y-1">
                  <p>Anthony: {autoProgress.Anthony["math-academy"].level}</p>
                  <p className="text-muted-foreground">
                    {autoProgress.Anthony["math-academy"].details?.xpToday || 0} XP today
                  </p>
                </div>
              )}
              {autoProgress?.Roma?.["math-academy"] && (
                <div className="text-sm space-y-1 mt-2 pt-2 border-t">
                  <p>Roma: {autoProgress.Roma["math-academy"].level}</p>
                  <p className="text-muted-foreground">
                    {autoProgress.Roma["math-academy"].details?.xpToday || 0} XP today
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
              {autoProgress?.Anthony?.membean && (
                <div className="text-sm space-y-1">
                  <p>Anthony: {autoProgress.Anthony.membean.level}</p>
                  <p className="text-muted-foreground">
                    {autoProgress.Anthony.membean.weeklyMinutes || 0}m this week
                  </p>
                </div>
              )}
              {autoProgress?.Roma?.membean && (
                <div className="text-sm space-y-1 mt-2 pt-2 border-t">
                  <p>Roma: {autoProgress.Roma.membean.level}</p>
                  <p className="text-muted-foreground">
                    {autoProgress.Roma.membean.weeklyMinutes || 0}m this week
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
              {autoProgress?.Family?.["rosetta-stone"] && (
                <div className="text-sm space-y-1">
                  <p>Family: {autoProgress.Family["rosetta-stone"].level}</p>
                  <p className="text-muted-foreground">
                    {autoProgress.Family["rosetta-stone"].weeklyMinutes || 0}m this week
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
            <p className="text-sm text-muted-foreground mb-3">
              Click to log as completed for {selectedStudent === "both" ? "both kids" : selectedStudent}:
            </p>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Click to log as completed for {selectedStudent === "both" ? "both kids" : selectedStudent}:
              </p>
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
                Clean duplicates (today)
              </Button>
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
          
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    {config.label}
                  </span>
                  {categoryActivities.length > 0 && (
                    <Badge variant={completed === categoryActivities.length ? "default" : "secondary"}>
                      {completed}/{categoryActivities.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activities logged</p>
                ) : (
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
                          <p className={`text-sm ${act.completed ? "line-through text-muted-foreground" : ""}`}>
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
                )}
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
