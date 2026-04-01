"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Lightbulb, Sun, Moon, X } from "lucide-react";

interface HomeschoolPlanningViewProps {
  userId: string;
}

const SUBJECTS = [
  "Math",
  "Language Arts",
  "Science",
  "Italian",
  "History",
  "PE",
  "Art",
  "Life Skills",
  "Critical Thinking",
  "Entrepreneurship",
  "Free Choice",
];

const METHODS = [
  "Lesson",
  "Practice",
  "Living Books",
  "Project",
  "Review/Assessment",
  "Hands-On Activity",
  "Field Trip",
  "Co-op Class",
  "Digital/Online",
];

const PHILOSOPHY_TIPS = [
  "Short lessons (20-30 min) beat long grinds",
  "Mastery before moving on",
  "Movement breaks every 45 minutes",
  "Living books > textbooks when possible",
  "Follow the child's interests and energy",
  "One new concept per lesson is plenty",
  "Real-world application > abstract theory",
  "Quality conversation > worksheets",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const KIDS = ["Anthony", "Roma", "Both"];

export function HomeschoolPlanningView({ userId }: HomeschoolPlanningViewProps) {
  const [warmMode, setWarmMode] = useState(false);
  
  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);
  const getWeekStart = (offset: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Get to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + offset * 7);
    return monday;
  };

  const weekStart = getWeekStart(weekOffset);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  // Day selector
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const selectedDate = new Date(weekStart);
  selectedDate.setDate(weekStart.getDate() + selectedDayIndex);
  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  // Kid selector
  const [selectedKid, setSelectedKid] = useState<string>("Both");

  // Philosophy tip rotation (changes weekly)
  const tipIndex = weekOffset % PHILOSOPHY_TIPS.length;

  // Form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [materials, setMaterials] = useState("");
  const [notes, setNotes] = useState("");

  // Queries
  const blocks = useQuery(api.homeschool.getPlanningBlocks, {
    date: selectedDateStr,
    kid: selectedKid,
  });

  // Mutations
  const createBlock = useMutation(api.homeschool.createPlanningBlock);

  const handleSubmit = async () => {
    if (!title || !subject || !startTime || !duration) {
      alert("Please fill in all required fields");
      return;
    }

    await createBlock({
      date: selectedDateStr,
      kid: selectedKid,
      title,
      subject,
      methods: selectedMethods,
      startTime,
      duration: parseInt(duration),
      materials: materials || undefined,
      notes: notes || undefined,
    });

    // Reset form
    setTitle("");
    setSubject("");
    setSelectedMethods([]);
    setStartTime("");
    setDuration("");
    setMaterials("");
    setNotes("");
  };

  const toggleMethod = (method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const formatWeekLabel = () => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    return `Week of ${weekStart.toLocaleDateString("en-US", options)}`;
  };

  // Theme colors
  const bgCard = warmMode ? "bg-amber-50/10" : "bg-zinc-950";
  const bgTip = warmMode ? "bg-amber-100/20 border-amber-500/30" : "bg-zinc-800 border-zinc-700";
  const textPrimary = warmMode ? "text-amber-900" : "text-zinc-100";
  const textSecondary = warmMode ? "text-amber-700" : "text-zinc-400";
  const accentButton = warmMode ? "bg-amber-600 hover:bg-amber-700" : "bg-zinc-700 hover:bg-zinc-600";
  const accentBadge = warmMode ? "bg-amber-200/50 text-amber-900" : "bg-zinc-700 text-zinc-300";
  const inputBg = warmMode ? "bg-white/70" : "bg-zinc-800";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Homeschool Planning</h2>
          <p className="text-sm text-muted-foreground">Plan lessons, blocks, and activities</p>
        </div>
        
        {/* Warm Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWarmMode(!warmMode)}
          className="gap-2"
        >
          {warmMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {warmMode ? "Dark Mode" : "Warm Mode"}
        </Button>
      </div>

      {/* Week Navigation */}
      <Card className={bgCard}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(weekOffset - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev Week
            </Button>
            <span className={`font-semibold ${textPrimary}`}>{formatWeekLabel()}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              Next Week
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Philosophy Tip Box */}
      <Card className={`${bgTip} border-2`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className={warmMode ? "h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" : "h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"} />
            <p className={`${warmMode ? "text-amber-900" : "text-amber-200"} font-medium`}>
              {PHILOSOPHY_TIPS[tipIndex]}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Day Selector (Mon-Fri) */}
      <div className="flex gap-2">
        {DAYS.map((day, index) => (
          <Button
            key={day}
            variant={selectedDayIndex === index ? "default" : "outline"}
            onClick={() => setSelectedDayIndex(index)}
            className={selectedDayIndex === index ? "" : warmMode ? "bg-amber-100/10 hover:bg-amber-100/20" : ""}
          >
            {day}
          </Button>
        ))}
      </div>

      {/* Kid Selector */}
      <div className="flex gap-2">
        {KIDS.map((kid) => (
          <Button
            key={kid}
            variant={selectedKid === kid ? "default" : "outline"}
            onClick={() => setSelectedKid(kid)}
            className={selectedKid === kid ? "" : warmMode ? "bg-amber-100/10 hover:bg-amber-100/20" : ""}
          >
            {kid}
          </Button>
        ))}
      </div>

      {/* Existing Blocks List */}
      <Card className={bgCard}>
        <CardHeader>
          <CardTitle className={textPrimary}>
            Planned for {DAYS[selectedDayIndex]} ({selectedKid})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!blocks || blocks.length === 0 ? (
            <p className={textSecondary}>No blocks planned for this day yet.</p>
          ) : (
            <div className="space-y-3">
              {blocks.map((block: any) => (
                <div
                  key={block._id}
                  className={`p-4 rounded-lg border ${warmMode ? "bg-white/50 border-amber-300/30" : "bg-zinc-800 border-zinc-700"}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${textPrimary}`}>
                          {block.startTime}
                        </span>
                        <span className={textSecondary}>·</span>
                        <span className={textSecondary}>{block.duration} min</span>
                      </div>
                      <h4 className={`font-semibold ${textPrimary}`}>{block.title}</h4>
                      <p className={`text-sm ${textSecondary}`}>{block.subject}</p>
                      {block.methods && block.methods.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {block.methods.map((method: string) => (
                            <Badge key={method} variant="secondary" className={accentBadge}>
                              {method}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {block.materials && (
                        <p className={`text-sm mt-2 ${textSecondary}`}>
                          <strong>Materials:</strong> {block.materials}
                        </p>
                      )}
                      {block.notes && (
                        <p className={`text-sm mt-1 ${textSecondary}`}>
                          <strong>Notes:</strong> {block.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Block Form */}
      <Card className={bgCard}>
        <CardHeader>
          <CardTitle className={textPrimary}>Add Planning Block</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className={textPrimary}>Topic/Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Multiplication practice"
              className={inputBg}
            />
          </div>

          <div>
            <Label htmlFor="subject" className={textPrimary}>Subject *</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className={inputBg}>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className={textPrimary}>Method Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {METHODS.map((method) => (
                <Badge
                  key={method}
                  variant={selectedMethods.includes(method) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    selectedMethods.includes(method)
                      ? ""
                      : warmMode
                      ? "bg-amber-100/10 hover:bg-amber-100/20"
                      : "hover:bg-zinc-700"
                  }`}
                  onClick={() => toggleMethod(method)}
                >
                  {method}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime" className={textPrimary}>Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputBg}
              />
            </div>
            <div>
              <Label htmlFor="duration" className={textPrimary}>Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                className={inputBg}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="materials" className={textPrimary}>Materials Needed</Label>
            <Input
              id="materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="Whiteboard, markers, worksheet"
              className={inputBg}
            />
          </div>

          <div>
            <Label htmlFor="notes" className={textPrimary}>Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context or reminders"
              className={inputBg}
            />
          </div>

          <Button onClick={handleSubmit} className={`w-full ${accentButton}`}>
            Add Block
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
