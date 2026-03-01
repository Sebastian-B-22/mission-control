"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useCallback } from "react";
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
  ChevronUp,
  Zap,
  X,
  Dices,
  MessageCircle,
  Laptop,
  BookMarked
} from "lucide-react";
import { useState, useMemo } from "react";

interface HomeschoolDailyViewProps {
  userId: Id<"users">;
}

// Convert 24h time to 12h format (07:00 → 7:00 AM)
function formatTime12h(time24: string): string {
  const [hourStr, minute] = time24.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minute} ${ampm}`;
}

// Specific resources for each subject/topic - what to actually DO
const subjectToResources: Record<string, { resource: string; activity: string; noExpand?: boolean }> = {
  // Core subjects
  "shakespeare": { resource: "How to Teach Your Children Shakespeare", activity: "Recite a passage together" },
  "health": { resource: "Einstein Human Body Kit", activity: "Body system activity" },
  "body study": { resource: "Einstein Human Body Kit + Blood and Guts", activity: "Body system deep dive" },
  "tuttle twins": { resource: "Tuttle Twins book/episode", activity: "Discuss the economics/civics lesson" },
  "financial literacy": { resource: "Easy Profit game", activity: "Play one round" },
  "civics": { resource: "Tuttle Twins series", activity: "Citizenship/government discussion" },
  "life skills": { resource: "How to Be a Person / Manners book", activity: "15 min online class or book chapter" },
  "italian": { resource: "Rosetta Stone Italian", activity: "15 min Italian session" },
  // "rosetta stone" removed - "italian" handles this to avoid duplicates
  "math": { resource: "Math Academy", activity: "Complete 1 lesson" },
  "writing": { resource: "Writing With Skill", activity: "Review today's assignment" },
  "history": { resource: "Story of the World", activity: "Read 1 chapter + narration" },
  "science": { resource: "Blood and Guts Human Body", activity: "Science experiment" },
  "economics": { resource: "How to Turn $100 into $1,000,000", activity: "Money concepts discussion" },
  "reading": { resource: "Current read-aloud", activity: "Read 20 minutes" },
  "vocab": { resource: "Membean", activity: "15 min vocabulary practice" },
  "spelling": { resource: "Spelling Safari", activity: "Spelling practice online" },
  "comprehension": { resource: "Teach Tales", activity: "Reading comprehension activity" },
  // PE/Movement - no expand needed, Joey's got it
  "sprinting": { resource: "PEP Speed Program", activity: "", noExpand: true },
  "juggling": { resource: "Juggling practice", activity: "", noExpand: true },
  "yoga": { resource: "Cosmic Kids Yoga", activity: "", noExpand: true },
  "dance party": { resource: "Dance playlist", activity: "", noExpand: true },
  "pe with joey": { resource: "March theme: Throwing & Rolling Games", activity: "", noExpand: true },
  // Blocks that don't need suggestions
  "wonder math": { resource: "", activity: "", noExpand: true },
  "mom work": { resource: "", activity: "", noExpand: true },
  "synthesis": { resource: "", activity: "", noExpand: true },
  // Car learning - podcasts
  "car learning": { resource: "🎧 Podcast time!", activity: "Greeking Out, Homeschool History, Brains On, The Past and the Curious" },
  // Cooking
  "cooking": { resource: "Recipe time!", activity: "Hummus, Coconut Cashew Milk, Bread, or Peanut Butter" },
  "meal prep": { resource: "Recipe time!", activity: "Hummus, Coconut Cashew Milk, Bread, or Peanut Butter" },
};

// Games to suggest for quick practice (only games we actually have!)
const mathGames = [
  "Math Dice", "Sum Swamp", "Money Bags", "Giant Yard Dice (Yardzee)", "Matharon", 
  "Math Tac Toe", "Shut The Box", "Yahtzee", "Uno", "Skip-Bo", "Phase 10", 
  "Easy Profit Game", "Super Math Spy", "Outnumbered", "Mountain Raiders", 
  "Clumsy Thief Candy Shop", "Clumsy Thief Money", "Math War Multiplication", 
  "Mathological Liar", "Math Rush", "Rummikub"
];
const vocabGames = [
  "Scrabble", "Bananagrams", "Wordical", "Word on the Street", "Upwords", 
  "Scattergories", "Letter Tycoon", "Taboo", "Codenames", "Tapple", 
  "Super Big Boggle", "Vocabulicious", "Quiddler", "Story Cubes", 
  "Blurt", "Tall Tales", "Blank Slate", "Catch Phrase"
];

// Podcasts we love
const podcasts = [
  "Greeking Out",
  "Homeschool History", 
  "Dead Funny History (from You're Dead to Me)",
  "The Rest is History",
  "The Past and the Curious",
  "Brains On"
];

// March 2026 Monthly Focus - aligned with actual March objectives & projects
// Update this monthly based on MonthlyFocus.tsx
const marchFocusAreas = {
  // March Objectives
  cgm: {
    resources: ["CGM Experiment Journal", "Glucose Monitoring App"],
    activities: ["Healthy eating discussion", "Track glucose levels", "Food journal"],
  },
  italian: {
    resources: ["Rosetta Stone Italian"],
    activities: ["Italian practice 15 min", "Italian vocabulary game"],
  },
  sprinting: {
    resources: ["Sprint Training Video", "Stopwatch App"],
    activities: ["Sprint drills at park", "Time trial practice"],
  },
  // March Projects  
  businessCreation: {
    resources: ["Tuttle Twins series", "Miller Moguls series"],
    activities: ["Brainstorm business ideas", "Create simple product"],
  },
  mathFluency: {
    resources: ["Math Academy", "Prodigy", "Math Dice"],
    activities: ["Math facts practice", "Mental math challenge"],
  },
  // Standard subjects with 1 best suggestion
  math: {
    resources: ["Math Academy"],
    activities: ["Math facts warm-up"],
  },
  writing: {
    resources: ["Writing With Skill"],
    activities: ["Journal prompt"],
  },
  reading: {
    resources: ["Current read-aloud book"],
    activities: ["Read aloud 20 min"],
  },
  pe: {
    resources: ["Yoga video", "Dance party playlist"],
    activities: ["Movement break"],
  },
  magic: {
    resources: ["Magic practice cards"],
    activities: ["Learn new trick"],
  },
  science: {
    resources: ["Blood and Guts Human Body", "Einstein Human Body Kit"],
    activities: ["Science experiment"],
  },
};

// Map activities to March focus areas (update monthly)
const activityToMarchFocus: Record<string, string> = {
  // March specific
  "cgm": "cgm",
  "glucose": "cgm",
  "italian": "italian",
  "rosetta": "italian",
  "sprint": "sprinting",
  "running": "sprinting",
  "tuttle": "businessCreation",
  "business": "businessCreation",
  // Standard subjects
  "math": "mathFluency",
  "academy": "mathFluency",
  "membean": "writing",
  "spelling": "writing",
  "writing": "writing",
  "reading": "reading",
  "yoga": "pe",
  "dance": "pe",
  "ninja": "pe",
  "boxing": "pe",
  "jiu-jitsu": "pe",
  "magic": "magic",
  "science": "science",
  "body": "science",
  "learning block": "mathFluency", // Default for general learning
};

// General subject mapping for non-focus activities  
const activityToSubjects: Record<string, string[]> = {
  // Reading & Writing
  "journal": ["reading", "writing"],
  "reading": ["reading"],
  "read-aloud": ["reading"],
  "writing with skill": ["writing"],
  "membean": ["vocabulary"],
  "spelling safari": ["writing"],
  "spelling": ["writing"],
  // Math
  "math academy": ["math"],
  "math": ["math"],
  "synthesis": ["math", "writing", "critical-thinking", "teamwork", "public-speaking"],
  "wonder math": ["math"],
  // PE / Movement
  "yoga": ["pe"],
  "dance": ["pe"],
  "sprinting": ["pe"],
  "juggling": ["pe"],
  "ninja": ["pe"],
  "rock climbing": ["pe"],
  "boxing": ["pe"],
  "jiu-jitsu": ["pe"],
  "pe with joey": ["pe"],
  "horseback": ["pe"],
  "soccer": ["pe"],
  // Life Skills
  "chores": ["life-skills"],
  "cooking": ["life-skills"],
  "meal prep": ["life-skills"],
  "life skills": ["life-skills"],
  // History & Science
  "car learning": ["history", "science"],
  "health/body": ["health", "science"],
  "body study": ["health", "science"],
  // Arts & Special
  "magic": ["magic"],
  "outschool drawing": ["art"],
  "drawing": ["art"],
  "passion projects": ["art", "music", "critical-thinking"],
  // Language
  "italian": ["italian", "language"],
  "rosetta stone": ["italian", "language"],
  // Financial Literacy
  "compound interest": ["financial-literacy", "reading"],
  // Learning Blocks - core subjects
  "learning block": ["math", "reading", "science", "history"],
};

const typeIcons: Record<string, React.ReactNode> = {
  book: <BookOpen className="w-3 h-3" />,
  game: <Gamepad2 className="w-3 h-3" />,
  digital: <Monitor className="w-3 h-3" />,
  kit: <FlaskConical className="w-3 h-3" />,
  equipment: <Dumbbell className="w-3 h-3" />,
};

const subjectColors: Record<string, string> = {
  math: "bg-blue-600 text-white",
  reading: "bg-green-600 text-white",
  writing: "bg-emerald-600 text-white",
  vocabulary: "bg-cyan-600 text-white",
  science: "bg-yellow-500 text-black",
  history: "bg-amber-500 text-black",
  art: "bg-pink-500 text-white",
  pe: "bg-teal-500 text-white",
  music: "bg-rose-500 text-white",
  language: "bg-red-500 text-white",
  "life-skills": "bg-orange-500 text-white",
  "critical-thinking": "bg-purple-500 text-white",
  "teamwork": "bg-indigo-500 text-white",
  "public-speaking": "bg-fuchsia-500 text-white",
  "financial-literacy": "bg-lime-500 text-black",
  magic: "bg-indigo-500 text-white",
  health: "bg-red-600 text-white",
  nutrition: "bg-lime-600 text-black",
  italian: "bg-green-500 text-white",
  economics: "bg-emerald-500 text-white",
};

// getMonthlyFocusAreas removed - now using getSmartSuggestion for March-specific suggestions

function getSubjects(activity: string): string[] {
  const lowerActivity = activity.toLowerCase();
  const allSubjects: string[] = [];
  
  // Collect ALL matching subjects, not just the first
  for (const [key, subjects] of Object.entries(activityToSubjects)) {
    if (lowerActivity.includes(key)) {
      for (const subject of subjects) {
        if (!allSubjects.includes(subject)) {
          allSubjects.push(subject);
        }
      }
    }
  }
  
  return allSubjects;
}

export function HomeschoolDailyView({ userId }: HomeschoolDailyViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [showCrazyDayRescue, setShowCrazyDayRescue] = useState(false);
  const [rescuePlan, setRescuePlan] = useState<{
    mathGame: string;
    vocabGame: string;
    onlineOption: string;
    botProject: string;
    bookSuggestion: string;
    sickDayPodcast: string;
    sickDayVideo: string;
  } | null>(null);
  const [recapNotes, setRecapNotes] = useState("");
  const [recapSaving, setRecapSaving] = useState(false);

  // Format date for Convex queries
  const dateStr = selectedDate.toLocaleDateString("en-US", { 
    weekday: "long", 
    year: "numeric",
    month: "long", 
    day: "numeric" 
  });
  const dateKey = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD

  // Get existing recap for this date
  const existingRecap = useQuery(api.dailyRecap.getRecap, { userId, date: dateKey });
  const saveRecapMutation = useMutation(api.dailyRecap.saveRecap);

  // Update local state when recap loads
  useEffect(() => {
    if (existingRecap?.notes !== undefined) {
      setRecapNotes(existingRecap.notes);
    } else {
      setRecapNotes("");
    }
  }, [existingRecap, dateKey]);

  // Debounced save function
  const saveRecap = useCallback(async (notes: string) => {
    if (!notes.trim()) return;
    setRecapSaving(true);
    try {
      await saveRecapMutation({ userId, date: dateKey, notes });
    } finally {
      setRecapSaving(false);
    }
  }, [userId, dateKey, saveRecapMutation]);
  
  // Crazy Day Rescue - quick homeschool survival kit
  const generateRescuePlan = () => {
    const rescueMathGames = mathGames; // Use full list from resources
    const rescueVocabGames = vocabGames; // Use full list from resources
    const onlineOptions = [
      "Synthesis Math (teamwork + strategy)",
      "Math Academy (adaptive practice)", 
      "Teach Tales (reading comprehension)",
      "Spelling Safari (spelling practice)",
      "Membean (vocabulary building)",
      "Prodigy (math game)",
      "Life Skills video (15 min class)"
    ];
    const botProjects = [
      "James + Compass: Design a business idea together",
      "James + Compass: Story collaboration - James writes, Compass illustrates",
      "James + Compass: Trivia challenge - each bot asks 5 questions",
      "James + Compass: Create a comic strip together",
      "James + Compass: Science experiment design challenge",
      "James + Compass: Build a mini lesson to teach each other something"
    ];
    const bookSuggestions = [
      "Read a chapter of current read-aloud",
      "Pick a Sir Cumference math adventure",
      "Grab a Who Was/What Was book",
      "Read a National Geographic magazine",
      "Way of the Warrior Kid (any volume)",
      "Daulaire's Book of Greek Myths",
      "I Survived series (pick one)",
      "Magic Misfits (any volume)",
      "Percy Jackson Lightning Thief",
      "Diary of a Wimpy Kid",
      "Story of the World chapter",
      "Astrophysics for Young People in a Hurry",
      "Spy School series (pick one)",
      "Dog Man (quick graphic novel)",
      "Treasury of Greek Mythology",
      "Tales from Japan",
      "Words Are CATegorical book (grammar fun)",
      "Time Flies history book",
      "Tuttle Twins book",
      "Will's Words (Shakespeare vocabulary)"
    ];
    const sickDayOptions = [
      "Mark Rober video (science + engineering)",
      "Tuttle Twins episode",
      "National Geographic documentary",
      "🎧 Greeking Out podcast",
      "🎧 Homeschool History podcast",
      "🎧 Dead Funny History podcast",
      "🎧 The Rest is History podcast",
      "🎧 The Past and the Curious podcast",
      "🎧 Brains On podcast"
    ];

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    // Pick one podcast and one video for sick day
    const sickPodcasts = sickDayOptions.filter(o => o.includes("🎧"));
    const sickVideos = sickDayOptions.filter(o => !o.includes("🎧"));
    
    setRescuePlan({
      mathGame: pick(rescueMathGames),
      vocabGame: pick(rescueVocabGames),
      onlineOption: pick(onlineOptions),
      botProject: pick(botProjects),
      bookSuggestion: pick(bookSuggestions),
      sickDayPodcast: pick(sickPodcasts),
      sickDayVideo: pick(sickVideos),
    });
    setShowCrazyDayRescue(true);
  };
  
  const dayOfWeek = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  
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
  
  // Parse notes field and return specific suggestions for each topic mentioned
  const getBlockSuggestions = (activity: string, notes?: string): Array<{ topic: string; resource: string; activity: string }> => {
    const suggestions: Array<{ topic: string; resource: string; activity: string }> = [];
    const lowerActivity = activity.toLowerCase();
    
    // Skip suggestions for certain blocks entirely
    const skipBlocks = ["wonder math", "mom work", "breakfast", "lunch", "chores", "screen time", "free time", "passion project"];
    if (skipBlocks.some(skip => lowerActivity.includes(skip))) {
      return [];
    }
    
    // Combine activity + notes to check - use word boundaries to avoid false matches
    const content = ` ${activity} ${notes || ""} `.toLowerCase();
    
    // Helper: check if keyword exists as a word (not substring)
    const hasWord = (text: string, word: string) => {
      // Match word boundaries - handles "pe" not matching "shakespeare"
      const regex = new RegExp(`[\\s,;:]+${word}[\\s,;:]+|^${word}[\\s,;:]+|[\\s,;:]+${word}$`, 'i');
      return regex.test(` ${text} `);
    };
    
    // Check each subject we have resources for
    for (const [keyword, suggestion] of Object.entries(subjectToResources)) {
      if (hasWord(content, keyword)) {
        // Skip if noExpand is set and no meaningful content
        if (suggestion.noExpand && !suggestion.resource && !suggestion.activity) {
          continue;
        }
        // Only add if there's actual content to show
        if (suggestion.resource || suggestion.activity) {
          suggestions.push({
            topic: keyword.charAt(0).toUpperCase() + keyword.slice(1),
            resource: suggestion.resource,
            activity: suggestion.activity,
          });
        }
      }
    }
    
    // If it's a "learning block" with no specific matches, add default core subjects
    if (lowerActivity.includes("learning block") && suggestions.length === 0) {
      suggestions.push(
        { topic: "Math", resource: "Math Academy", activity: "Complete 1 lesson" },
        { topic: "Vocab", resource: "Membean", activity: "15 min vocabulary" }
      );
    }
    
    return suggestions;
  };
  
  // Old function for backward compatibility - checks if block has suggestions
  const getSmartSuggestion = (activity: string, notes?: string): { resource: string; activity: string } | null => {
    const suggestions = getBlockSuggestions(activity, notes);
    if (suggestions.length === 0) return null;
    return { resource: suggestions[0].resource, activity: suggestions[0].activity };
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

  // Suggestion availability now determined by getSmartSuggestion returning non-null

  return (
    <div className="space-y-4">
      {/* Header - compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Homeschool Daily Schedule</h1>
          <p className="text-sm text-muted-foreground">A & R Academy</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateRescuePlan}
            className="bg-red-950/50 border-red-800 hover:bg-red-900/50 text-red-300 text-xs"
          >
            🆘 Crazy Day
          </Button>
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
      </div>
      
      {/* Crazy Day Rescue Plan */}
      {showCrazyDayRescue && rescuePlan && (
        <Card className="bg-gradient-to-r from-red-950/50 to-orange-950/50 border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-red-400">
                🆘 Crazy Day Rescue Plan
              </h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={generateRescuePlan} className="text-xs h-7 px-2">
                  🔄 Shuffle
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCrazyDayRescue(false)} className="h-7 px-2">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Pick 2-3 of these and call it a win! 💪
            </p>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-zinc-900 rounded-lg p-2.5 border border-zinc-800">
                <div className="flex items-center gap-2 text-amber-500 font-medium text-xs mb-1">
                  <Dices className="w-3 h-3" />
                  Math Game
                </div>
                <p className="text-xs text-zinc-300">{rescuePlan.mathGame}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-2.5 border border-zinc-800">
                <div className="flex items-center gap-2 text-green-500 font-medium text-xs mb-1">
                  <Dices className="w-3 h-3" />
                  Vocab Game
                </div>
                <p className="text-xs text-zinc-300">{rescuePlan.vocabGame}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-2.5 border border-zinc-800">
                <div className="flex items-center gap-2 text-blue-500 font-medium text-xs mb-1">
                  <Laptop className="w-3 h-3" />
                  Online
                </div>
                <p className="text-xs text-zinc-300">{rescuePlan.onlineOption}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-2.5 border border-zinc-800">
                <div className="flex items-center gap-2 text-purple-500 font-medium text-xs mb-1">
                  <MessageCircle className="w-3 h-3" />
                  Bot Project
                </div>
                <p className="text-xs text-zinc-300">{rescuePlan.botProject}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-2.5 border border-zinc-800">
                <div className="flex items-center gap-2 text-pink-500 font-medium text-xs mb-1">
                  <BookMarked className="w-3 h-3" />
                  Reading
                </div>
                <p className="text-xs text-zinc-300">{rescuePlan.bookSuggestion}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-2.5 border border-zinc-800">
                <div className="flex items-center gap-2 text-red-400 font-medium text-xs mb-1">
                  🤒 Sick Day Video
                </div>
                <p className="text-xs text-zinc-300">{rescuePlan.sickDayVideo}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-2.5 border border-zinc-800 md:col-span-2">
                <div className="flex items-center gap-2 text-red-400 font-medium text-xs mb-1">
                  🤒 Sick Day Podcast
                </div>
                <p className="text-xs text-zinc-300">{rescuePlan.sickDayPodcast}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Date display - compact */}
      <div className="text-center py-2 bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg border border-amber-800/50">
        <p className="text-lg font-semibold text-amber-500">{dateStr}</p>
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
            const subjects = getSubjects(block.activity);
            const allSuggestions = getBlockSuggestions(block.activity, block.notes);
            // Show expandable if has suggestions OR has notes with Options
            const hasOptionsNotes = block.notes?.toLowerCase().includes("options:");
            const showSuggestions = allSuggestions.length > 0 || hasOptionsNotes;
            const isExpanded = expandedBlocks.has(block._id);
            
            return (
              <div 
                key={block._id} 
                className={`border rounded-lg bg-zinc-900 transition-all ${showSuggestions ? "cursor-pointer hover:bg-zinc-800" : ""}`}
                onClick={() => showSuggestions && toggleBlockExpanded(block._id)}
              >
                {/* Main row - very compact */}
                <div className="flex items-center gap-3 px-3 py-2">
                  {/* Time - 12h format */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[120px]">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime12h(block.startTime)} - {formatTime12h(block.endTime)}</span>
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
                
                {/* Tags row - always visible when present */}
                {subjects.length > 0 && (
                  <div className="px-3 pb-2 flex flex-wrap items-center gap-1">
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
                
                {/* Notes - only show when expanded */}
                {isExpanded && block.notes && !hasOptionsNotes && (
                  <div className="px-3 pb-2">
                    <span className="text-xs text-muted-foreground">{block.notes}</span>
                  </div>
                )}
                
                {/* Options list - special formatting for "Options:" notes */}
                {isExpanded && hasOptionsNotes && (
                  <div className="px-3 pb-3 border-t border-zinc-700 bg-zinc-800/50">
                    <p className="text-xs font-medium text-purple-400 py-2">
                      🎨 Choose an activity:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {block.notes?.replace(/options:\s*/i, "").split(",").map((option, i) => (
                        <Badge key={i} variant="secondary" className="bg-purple-900/50 text-purple-200 text-xs">
                          {option.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Expanded suggestions - shows resource + activity for each topic in notes */}
                {isExpanded && allSuggestions.length > 0 && (
                  <div className="px-3 pb-3 border-t border-zinc-700 bg-zinc-800/50">
                    <p className="text-xs font-medium text-amber-500 py-2">
                      📋 Today's Plan:
                    </p>
                    <div className="space-y-2">
                      {allSuggestions.map((s, i) => (
                        <div key={i} className="bg-zinc-900 rounded p-2">
                          <div className="text-xs font-medium text-amber-400 mb-1">{s.topic}</div>
                          <div className="flex items-center gap-2 text-xs text-zinc-300">
                            <BookOpen className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span>{s.resource}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                            <Lightbulb className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            <span>{s.activity}</span>
                          </div>
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

      {/* Daily Notes / Recap Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              📝 Daily Recap
              <span className="text-xs text-muted-foreground">What did we actually do?</span>
            </h3>
            {recapSaving && (
              <span className="text-xs text-amber-500">Saving...</span>
            )}
            {existingRecap && !recapSaving && (
              <span className="text-xs text-green-500">✓ Saved</span>
            )}
          </div>
          <textarea 
            value={recapNotes}
            onChange={(e) => setRecapNotes(e.target.value)}
            onBlur={() => saveRecap(recapNotes)}
            placeholder="Notes on what we accomplished, changes from the plan, ideas for next time..."
            className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-300 placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              💡 These notes help plan next week and track progress over time
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => saveRecap(recapNotes)}
              disabled={recapSaving || !recapNotes.trim()}
              className="text-xs h-7"
            >
              Save Notes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
