"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, ChevronRight, Plus, X, Lightbulb } from "lucide-react";

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

const METHOD_TAGS = [
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
  "Follow the child's curiosity",
  "Nature study feeds the soul",
  "Narration builds comprehension",
  "Excellence, not perfection",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatWeekLabel(date: Date): string {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `Week of ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

interface PlanningViewProps {
  warmMode: boolean;
}

export function PlanningView({ warmMode }: PlanningViewProps) {
  const [currentWeek, setCurrentWeek] = useState(getWeekStart(new Date()));
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Monday
  const [selectedKid, setSelectedKid] = useState<"Anthony" | "Roma" | "Both">("Both");
  const [showForm, setShowForm] = useState(false);
  const [currentTip] = useState(PHILOSOPHY_TIPS[Math.floor(Math.random() * PHILOSOPHY_TIPS.length)]);

  const [formData, setFormData] = useState({
    topic: "",
    subject: "",
    methods: [] as string[],
    duration: "",
    materials: "",
    notes: "",
  });

  const createPlanningBlock = useMutation(api.homeschool.createPlanningBlock);

  const selectedDate = new Date(currentWeek);
  selectedDate.setDate(currentWeek.getDate() + selectedDay);
  const dateString = selectedDate.toISOString().split("T")[0];

  const planningBlocks = useQuery(api.homeschool.getPlanningBlocks, { 
    date: dateString,
    kid: selectedKid === "Both" ? undefined : selectedKid,
  });

  const prevWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  };

  const nextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  };

  const toggleMethod = (method: string) => {
    setFormData(prev => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter(m => m !== method)
        : [...prev.methods, method]
    }));
  };

  const handleAddBlock = async () => {
    if (!formData.topic || !formData.subject) return;

    await createPlanningBlock({
      date: dateString,
      kid: selectedKid === "Both" ? undefined : selectedKid,
      topic: formData.topic,
      subject: formData.subject,
      methods: formData.methods,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      materials: formData.materials || undefined,
      notes: formData.notes || undefined,
    });

    // Reset form
    setFormData({
      topic: "",
      subject: "",
      methods: [],
      duration: "",
      materials: "",
      notes: "",
    });
    setShowForm(false);
  };

  const bgClass = warmMode ? "bg-amber-50" : "bg-gray-800/50";
  const borderClass = warmMode ? "border-amber-200" : "border-gray-700";
  const textClass = warmMode ? "text-gray-800" : "text-white";
  const secondaryTextClass = warmMode ? "text-gray-600" : "text-gray-400";
  const buttonClass = warmMode 
    ? "bg-green-700 hover:bg-green-800 text-white" 
    : "bg-purple-600 hover:bg-purple-500 text-white";
  const inputClass = warmMode
    ? "bg-white border-amber-300 text-gray-800"
    : "bg-gray-700 border-gray-600 text-white";

  return (
    <div className={`rounded-xl p-6 border ${bgClass} ${borderClass}`}>
      {/* Philosophy Tip */}
      <div className={`mb-6 p-4 rounded-lg ${warmMode ? "bg-yellow-50 border-yellow-200" : "bg-blue-900/20 border-blue-700"} border`}>
        <div className="flex items-start gap-3">
          <Lightbulb className={`w-5 h-5 mt-0.5 flex-shrink-0 ${warmMode ? "text-green-800" : "text-blue-400"}`} />
          <p className={`text-sm italic ${warmMode ? "text-gray-700" : "text-blue-200"}`}>
            {currentTip}
          </p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevWeek}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${warmMode ? "hover:bg-amber-100" : "hover:bg-gray-700"} transition-colors`}
        >
          <ChevronLeft className={`w-4 h-4 ${secondaryTextClass}`} />
          <span className={secondaryTextClass}>Prev Week</span>
        </button>

        <h3 className={`text-lg font-semibold ${textClass}`}>
          {formatWeekLabel(currentWeek)}
        </h3>

        <button
          onClick={nextWeek}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${warmMode ? "hover:bg-amber-100" : "hover:bg-gray-700"} transition-colors`}
        >
          <span className={secondaryTextClass}>Next Week</span>
          <ChevronRight className={`w-4 h-4 ${secondaryTextClass}`} />
        </button>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {DAYS.map((day, index) => (
          <button
            key={day}
            onClick={() => setSelectedDay(index)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedDay === index
                ? warmMode
                  ? "bg-green-700 text-white"
                  : "bg-purple-600 text-white"
                : warmMode
                ? "bg-white border border-amber-200 text-gray-700 hover:bg-amber-50"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Kid Selector */}
      <div className="flex gap-2 mb-6">
        {(["Anthony", "Roma", "Both"] as const).map((kid) => (
          <button
            key={kid}
            onClick={() => setSelectedKid(kid)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedKid === kid
                ? warmMode
                  ? "bg-orange-600 text-white"
                  : "bg-green-600 text-white"
                : warmMode
                ? "bg-white border border-amber-200 text-gray-700 hover:bg-amber-50"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {kid}
          </button>
        ))}
      </div>

      {/* Existing Blocks */}
      <div className="mb-6 space-y-3">
        {planningBlocks && planningBlocks.length > 0 ? (
          planningBlocks.map((block) => (
            <div
              key={block._id}
              className={`p-4 rounded-lg border ${
                warmMode ? "bg-white border-amber-200" : "bg-gray-700/50 border-gray-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={`font-semibold ${textClass}`}>{block.topic}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm ${secondaryTextClass}`}>{block.subject}</span>
                    {block.duration && (
                      <>
                        <span className={secondaryTextClass}>•</span>
                        <span className={`text-sm ${secondaryTextClass}`}>{block.duration} min</span>
                      </>
                    )}
                    {block.kid && (
                      <>
                        <span className={secondaryTextClass}>•</span>
                        <span className={`text-sm ${secondaryTextClass}`}>{block.kid}</span>
                      </>
                    )}
                  </div>
                  {block.methods && block.methods.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {block.methods.map((method) => (
                        <span
                          key={method}
                          className={`text-xs px-2 py-1 rounded ${
                            warmMode
                              ? "bg-yellow-100 text-green-800"
                              : "bg-purple-900/30 text-purple-300"
                          }`}
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  )}
                  {block.materials && (
                    <p className={`text-sm mt-2 ${secondaryTextClass}`}>
                      Materials: {block.materials}
                    </p>
                  )}
                  {block.notes && (
                    <p className={`text-sm mt-1 italic ${secondaryTextClass}`}>
                      {block.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className={`text-center py-8 ${secondaryTextClass}`}>
            No lessons planned for this day yet
          </p>
        )}
      </div>

      {/* Add Block Button / Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${buttonClass} transition-colors`}
        >
          <Plus className="w-5 h-5" />
          Add Lesson Block
        </button>
      ) : (
        <div className={`p-4 rounded-lg border ${warmMode ? "bg-white border-amber-300" : "bg-gray-700 border-gray-600"}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className={`font-semibold ${textClass}`}>New Lesson Block</h4>
            <button
              onClick={() => setShowForm(false)}
              className={`p-1 rounded ${warmMode ? "hover:bg-amber-100" : "hover:bg-gray-600"}`}
            >
              <X className={`w-4 h-4 ${secondaryTextClass}`} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Topic */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                Topic/Lesson Title *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                placeholder="e.g., Multiplication tables, Shakespeare sonnets"
              />
            </div>

            {/* Subject */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
              >
                <option value="">Select subject...</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Method Tags */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                Methods
              </label>
              <div className="flex flex-wrap gap-2">
                {METHOD_TAGS.map((method) => (
                  <button
                    key={method}
                    onClick={() => toggleMethod(method)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      formData.methods.includes(method)
                        ? warmMode
                          ? "bg-green-700 text-white"
                          : "bg-purple-600 text-white"
                        : warmMode
                        ? "bg-amber-100 text-gray-700 hover:bg-amber-200"
                        : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                placeholder="e.g., 20"
              />
            </div>

            {/* Materials */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                Materials Needed
              </label>
              <input
                type="text"
                value={formData.materials}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                placeholder="e.g., Whiteboard, math manipulatives, Story of the World"
              />
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleAddBlock}
              disabled={!formData.topic || !formData.subject}
              className={`w-full px-4 py-2 rounded-lg ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              Add Block
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
