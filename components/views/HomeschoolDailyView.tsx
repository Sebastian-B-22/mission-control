"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  BookOpen, 
  Gamepad2, 
  Monitor, 
  Dumbbell, 
  FlaskConical, 
  ChevronLeft, 
  ChevronRight,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState, useMemo } from "react";

interface HomeschoolDailyViewProps {
  userId: Id<"users">;
}

// March Monthly Focus - activities should suggest these
const monthlyFocusResources = {
  health: [
    "Blood and Guts Human Body",
    "The Way We Work", 
    "Einstein Human Body Kit",
    "Brains On Its Alive",
  ],
  nutrition: [
    "Cooking / Meal Prep",
    "Kids Herb Book",
  ],
  italian: [
    "Rosetta Stone Italian",
    "Jag Alskar Dig",
  ],
  economics: [
    "Tuttle Twins series",
    "Miller Moguls series",
    "Cashflow for Kids",
    "Investing for Kids",
  ],
  history: [
    "Liberty Kids",
    "Story of the World Vol 1",
    "Story of the World Vol 2",
  ],
};

// Map activities to what monthly focus they support
const activityToMonthlyFocus: Record<string, string[]> = {
  "health/body study": ["health", "nutrition"],
  "health": ["health"],
  "body": ["health"],
  "cooking": ["nutrition", "health"],
  "meal prep": ["nutrition"],
  "smoothie": ["nutrition"],
  "italian": ["italian"],
  "rosetta stone": ["italian"],
  "learning block": ["health", "economics", "history"],
  "tuttle": ["economics"],
  "compound interest": ["economics"],
  "math academy": ["math"],
  "math": ["math"],
};

// General subject mapping for non-focus activities  
const activityToSubjects: Record<string, string[]> = {
  "writing with skill": ["writing"],
  "membean": ["writing"],
  "spelling": ["writing"],
  "yoga": ["pe"],
  "dance": ["pe"],
  "sprinting": ["pe"],
  "juggling": ["pe"],
  "ninja": ["pe"],
  "rock climbing": ["pe"],
  "boxing": ["pe"],
  "jiu-jitsu": ["pe"],
  "pe with joey": ["pe"],
  "magic": ["magic"],
  "outschool drawing": ["art"],
  "passion projects": ["art", "music", "critical-thinking"],
};

const typeIcons: Record<string, React.ReactNode> = {
  book: <BookOpen className="w-3 h-3" />,
  game: <Gamepad2 className="w-3 h-3" />,
  digital: <Monitor className="w-3 h-3" />,
  kit: <FlaskConical className="w-3 h-3" />,
  equipment: <Dumbbell className="w-3 h-3" />,
};

const subjectColors: Record<string, string> = {
  math: "bg-blue-100 text-blue-700",
  reading: "bg-green-100 text-green-700",
  writing: "bg-emerald-100 text-emerald-700",
  science: "bg-yellow-100 text-yellow-700",
  history: "bg-amber-100 text-amber-700",
  art: "bg-pink-100 text-pink-700",
  pe: "bg-teal-100 text-teal-700",
  music: "bg-rose-100 text-rose-700",
  language: "bg-red-100 text-red-700",
  "life-skills": "bg-orange-100 text-orange-700",
  "critical-thinking": "bg-purple-100 text-purple-700",
  magic: "bg-indigo-100 text-indigo-700",
  health: "bg-red-100 text-red-700",
  nutrition: "bg-lime-100 text-lime-700",
  italian: "bg-green-100 text-green-700",
  economics: "bg-emerald-100 text-emerald-700",
};

function getMonthlyFocusAreas(activity: string): string[] {
  const lowerActivity = activity.toLowerCase();
  for (const [key, areas] of Object.entries(activityToMonthlyFocus)) {
    if (lowerActivity.includes(key)) {
      return areas;
    }
  }
  return [];
}

function getSubjects(activity: string): string[] {
  const lowerActivity = activity.toLowerCase();
  for (const [key, subjects] of Object.entries(activityToSubjects)) {
    if (lowerActivity.includes(key)) {
      return subjects;
    }
  }
  return [];
}

export function HomeschoolDailyView({ userId }: HomeschoolDailyViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  
  const dayOfWeek = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const dateStr = selectedDate.toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "long", 
    day: "numeric" 
  });
  
  // Get schedule for this day
  const scheduleBlocks = useQuery(api.weeklySchedule.getScheduleByDay, { 
    userId, 
    dayOfWeek: dayOfWeek as any 
  });
  
  // Sort blocks by start time
  const sortedBlocks = useMemo(() => {
    if (!scheduleBlocks) return [];
    return [...scheduleBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [scheduleBlocks]);
  
  // Fetch resources for suggestions
  const mathResources = useQuery(api.homeschool.getResources, { category: "math", limit: 30 });
  const scienceResources = useQuery(api.homeschool.getResources, { category: "science", limit: 30 });
  const readingResources = useQuery(api.homeschool.getResources, { category: "reading", limit: 30 });
  const historyResources = useQuery(api.homeschool.getResources, { category: "history", limit: 30 });
  const lifeSkillsResources = useQuery(api.homeschool.getResources, { category: "life-skills", limit: 30 });
  
  // Get monthly-focus-aligned suggestions
  const getSmartSuggestions = (activity: string) => {
    const focusAreas = getMonthlyFocusAreas(activity);
    const suggestions: string[] = [];
    
    // First, add monthly focus resources
    focusAreas.forEach(area => {
      const areaResources = monthlyFocusResources[area as keyof typeof monthlyFocusResources];
      if (areaResources) {
        suggestions.push(...areaResources);
      }
    });
    
    // For math, add some rotating games
    if (activity.toLowerCase().includes("math")) {
      const mathGames = mathResources?.filter(r => r.type === "game").slice(0, 3) || [];
      suggestions.push(...mathGames.map(r => r.name));
    }
    
    // For learning blocks, pull from multiple areas
    if (activity.toLowerCase().includes("learning block")) {
      suggestions.push(
        "Tuttle Twins series",
        "Blood and Guts Human Body", 
        "Story of the World Vol 1",
        "Einstein Human Body Kit"
      );
    }
    
    return [...new Set(suggestions)].slice(0, 5);
  };
  
  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };
  
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };
  
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const hasSuggestions = (activity: string) => {
    return getMonthlyFocusAreas(activity).length > 0 || 
           getSubjects(activity).length > 0 ||
           activity.toLowerCase().includes("learning block") ||
           activity.toLowerCase().includes("math");
  };

  return (
    <div className="space-y-4">
      {/* Header - compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Schedule</h1>
          <p className="text-sm text-muted-foreground">A & R Academy</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToPreviousDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant={isToday ? "default" : "outline"} 
            size="sm" 
            onClick={goToToday}
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Date display - compact */}
      <div className="text-center py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border">
        <p className="text-lg font-semibold text-amber-800">{dateStr}</p>
        {isToday && <p className="text-xs text-amber-600">✨ Today</p>}
      </div>
      
      {/* Schedule blocks - COMPACT */}
      <div className="space-y-1">
        {sortedBlocks.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              No schedule for this day
            </CardContent>
          </Card>
        ) : (
          sortedBlocks.map((block) => {
            const focusAreas = getMonthlyFocusAreas(block.activity);
            const subjects = getSubjects(block.activity);
            const showSuggestions = hasSuggestions(block.activity);
            const isExpanded = expandedBlocks.has(block._id);
            const suggestions = isExpanded ? getSmartSuggestions(block.activity) : [];
            
            return (
              <div 
                key={block._id} 
                className={`border rounded-lg bg-zinc-900 transition-all ${showSuggestions ? "cursor-pointer hover:bg-zinc-800" : ""}`}
                onClick={() => showSuggestions && toggleBlockExpanded(block._id)}
              >
                {/* Main row - very compact */}
                <div className="flex items-center gap-3 px-3 py-2">
                  {/* Time - smaller */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[90px]">
                    <Clock className="w-3 h-3" />
                    <span>{block.startTime} - {block.endTime}</span>
                  </div>
                  
                  {/* Activity */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-medium text-sm">{block.activity}</span>
                    {showSuggestions && (
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-zinc-400 ml-auto" />
                    ) : showSuggestions ? (
                      <ChevronDown className="w-3 h-3 text-zinc-400 ml-auto" />
                    ) : null}
                  </div>
                </div>
                
                {/* Notes + tags row - if present */}
                {(block.notes || focusAreas.length > 0 || subjects.length > 0) && (
                  <div className="px-3 pb-2 flex flex-wrap items-center gap-1">
                    {block.notes && (
                      <span className="text-xs text-muted-foreground mr-2">{block.notes}</span>
                    )}
                    {focusAreas.map(area => (
                      <Badge 
                        key={area} 
                        variant="secondary" 
                        className={`text-[10px] px-1.5 py-0 ${subjectColors[area] || "bg-zinc-800"}`}
                      >
                        {area}
                      </Badge>
                    ))}
                    {subjects.map(subject => (
                      <Badge 
                        key={subject} 
                        variant="secondary" 
                        className={`text-[10px] px-1.5 py-0 ${subjectColors[subject] || "bg-zinc-800"}`}
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Expanded suggestions */}
                {isExpanded && suggestions.length > 0 && (
                  <div className="px-3 pb-3 border-t bg-zinc-800/50">
                    <p className="text-xs font-medium text-amber-700 py-2">
                      📚 March Focus Suggestions:
                    </p>
                    <div className="space-y-1">
                      {suggestions.map((resource, i) => (
                        <div 
                          key={i} 
                          className="flex items-center gap-2 text-xs bg-zinc-900 rounded px-2 py-1"
                        >
                          <BookOpen className="w-3 h-3 text-amber-600" />
                          <span>{resource}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
