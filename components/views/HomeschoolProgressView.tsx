"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  BookOpen,
  Calculator,
  Globe,
  Gamepad2,
  Brain,
  RefreshCw
} from "lucide-react";

// Platform icons and colors
const platformConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  "math-academy": {
    icon: <Calculator className="h-4 w-4" />,
    color: "bg-blue-500",
    label: "Math Academy",
  },
  "rosetta-stone": {
    icon: <Globe className="h-4 w-4" />,
    color: "bg-green-500",
    label: "Rosetta Stone",
  },
  "synthesis": {
    icon: <Gamepad2 className="h-4 w-4" />,
    color: "bg-purple-500",
    label: "Synthesis",
  },
  "membean": {
    icon: <Brain className="h-4 w-4" />,
    color: "bg-yellow-500",
    label: "Membean",
  },
  "typing-com": {
    icon: <BookOpen className="h-4 w-4" />,
    color: "bg-pink-500",
    label: "Typing",
  },
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface ProgressCardProps {
  studentName: string;
  platforms: Array<{
    platform: string;
    todayCompleted: boolean;
    weeklyMinutes: number;
    lastActivity: number;
    level?: string;
    details?: any;
  }>;
  }

function StudentProgressCard({ studentName, platforms }: ProgressCardProps) {
  const completedCount = platforms.filter(p => p.todayCompleted).length;
  const totalPlatforms = platforms.length;
  const allDone = completedCount === totalPlatforms && totalPlatforms > 0;
  
  return (
    <Card className={allDone ? "border-green-500 border-2" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {studentName}
            {allDone && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          </CardTitle>
          <Badge variant={allDone ? "default" : "secondary"}>
            {completedCount}/{totalPlatforms} done
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {platforms.map((p) => {
            const config = platformConfig[p.platform] || {
              icon: <BookOpen className="h-4 w-4" />,
              color: "bg-gray-500",
              label: p.platform,
            };
            
            return (
              <div
                key={p.platform}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  p.todayCompleted 
                    ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800" 
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${config.color} text-white flex-shrink-0`}>
                    {config.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-900 dark:text-white">{config.label || p.platform}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {p.level || "No progress yet"}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatMinutes(p.weeklyMinutes)} this week
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatRelativeTime(p.lastActivity)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {platforms.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No progress data yet</p>
              <p className="text-sm">Run the scraper to sync data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformDetailsCard({ platform, details }: { platform: string; details: any }) {
  if (!details) return null;
  
  const config = platformConfig[platform];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {config?.icon}
          {config?.label || platform} Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {platform === "math-academy" && (
            <>
              <div>XP Today: <span className="font-medium">{details.xpToday || 0}</span></div>
              <div>XP This Week: <span className="font-medium">{details.xpThisWeek || 0}</span></div>
              <div>Total XP: <span className="font-medium">{details.totalXP || 0}</span></div>
              <div>Topics: <span className="font-medium">{details.completedTopics || 0}</span></div>
            </>
          )}
          {platform === "rosetta-stone" && (
            <>
              <div>Language: <span className="font-medium">{details.language || "Unknown"}</span></div>
              <div>Unit: <span className="font-medium">{details.currentUnit || 0}</span></div>
              <div>Lesson: <span className="font-medium">{details.currentLesson || 0}</span></div>
              <div>Today: <span className="font-medium">{formatMinutes(details.minutesToday || 0)}</span></div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomeschoolProgressView() {
  const allProgress = useQuery(api.homeschoolProgress.getAllProgress);
  
  if (!allProgress) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }
  
  const students = ["Anthony", "Roma", "Family"];
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Homeschool Progress</h1>
          <p className="text-gray-500">Daily completion tracking across all platforms</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Sync Now
        </Button>
      </div>
      
      {/* Detailed Progress */}
      <div className="grid md:grid-cols-2 gap-6">
        {students.map((studentName) => {
          const studentProgress = allProgress[studentName];
          const platforms = studentProgress
            ? Object.entries(studentProgress).map(([platform, data]: [string, any]) => ({
                platform,
                ...data,
              }))
            : [];
          
          return (
            <StudentProgressCard
              key={studentName}
              studentName={studentName}
              platforms={platforms}
            />
          );
        })}
      </div>
      
      {/* Platform Details */}
      {Object.entries(allProgress).some(([_, platforms]: [string, any]) => 
        Object.values(platforms).some((p: any) => p.details)
      ) && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Platform Details</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {students.map((student) => {
              const studentProgress = allProgress[student];
              if (!studentProgress) return null;
              
              return Object.entries(studentProgress).map(([platform, data]: [string, any]) => (
                <div key={`${student}-${platform}`}>
                  <div className="text-xs text-gray-500 mb-1">{student}</div>
                  <PlatformDetailsCard platform={platform} details={data.details} />
                </div>
              ));
            })}
          </div>
        </div>
      )}
      
      {/* Alerts */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-4 w-4" />
            Attention Needed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-orange-700">
            {students.map((student) => {
              const studentProgress = allProgress[student];
              
              if (!studentProgress) {
                return (
                  <div key={student} className="flex items-center gap-2 mb-1">
                    <span>{student}:</span> No data synced yet
                  </div>
                );
              }
              
              // Check for platforms with no recent activity
              const stale = Object.entries(studentProgress)
                .filter(([_, data]: [string, any]) => {
                  const daysSinceActivity = (Date.now() - data.lastActivity) / 86400000;
                  return daysSinceActivity > 3;
                })
                .map(([platform]) => platformConfig[platform]?.label || platform);
              
              if (stale.length > 0) {
                return (
                  <div key={student} className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{student}:</span> 
                    {stale.join(", ")} - no activity in 3+ days
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
