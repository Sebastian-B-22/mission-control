"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle, Circle, Clock, BookOpen, Monitor, SkipForward } from "lucide-react";
import { useState } from "react";

const subjectColors: Record<string, string> = {
  "Math": "bg-blue-500/20 border-blue-500 text-blue-300",
  "Critical Thinking": "bg-purple-500/20 border-purple-500 text-purple-300",
  "Language Arts": "bg-green-500/20 border-green-500 text-green-300",
  "Italian": "bg-red-500/20 border-red-500 text-red-300",
  "Life Skills": "bg-orange-500/20 border-orange-500 text-orange-300",
  "PE": "bg-teal-500/20 border-teal-500 text-teal-300",
  "Science": "bg-yellow-500/20 border-yellow-500 text-yellow-300",
  "Art": "bg-pink-500/20 border-pink-500 text-pink-300",
  "History": "bg-amber-700/20 border-amber-700 text-amber-300",
  "Typing": "bg-gray-500/20 border-gray-500 text-gray-300",
  "Entrepreneurship": "bg-yellow-600/20 border-yellow-600 text-yellow-300",
  "Free Choice": "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500 text-pink-300",
};

export function TodaySchedule() {
  const today = new Date().toISOString().split("T")[0];
  const schedule = useQuery(api.homeschool.getScheduleForDate, { date: today });
  const markComplete = useMutation(api.homeschool.markBlockComplete);
  const skipBlock = useMutation(api.homeschool.skipBlock);
  
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  if (!schedule) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Today's Schedule
        </h2>
        <p className="text-gray-400">No schedule set for today. Generate from template?</p>
      </div>
    );
  }

  const completedCount = schedule.blocks.filter(b => b.completed).length;
  const totalCount = schedule.blocks.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleToggleComplete = async (blockId: string, currentlyCompleted: boolean) => {
    await markComplete({
      date: today,
      blockId,
      completed: !currentlyCompleted,
    });
  };

  const handleSkip = async (blockId: string, reason: string) => {
    await skipBlock({
      date: today,
      blockId,
      reason,
    });
    setExpandedBlock(null);
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Today's Schedule
        </h2>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">
            {completedCount}/{totalCount} complete
          </div>
          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {schedule.blocks.map((block) => {
          const colorClass = subjectColors[block.subject] || "bg-gray-500/20 border-gray-500 text-gray-300";
          const isExpanded = expandedBlock === block.id;
          
          return (
            <div
              key={block.id}
              className={`relative border rounded-lg p-4 transition-all ${
                block.completed 
                  ? "bg-green-900/20 border-green-700 opacity-75" 
                  : block.skipped
                  ? "bg-gray-700/30 border-gray-600 opacity-50"
                  : colorClass
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(block.id, block.completed || false)}
                  className="flex-shrink-0 hover:scale-110 transition-transform"
                  disabled={block.skipped}
                >
                  {block.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 hover:text-white" />
                  )}
                </button>

                {/* Time */}
                <div className="flex-shrink-0 text-sm font-mono text-gray-400 w-24">
                  {block.startTime} - {block.endTime}
                </div>

                {/* Subject & Activity */}
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${block.completed ? "line-through text-gray-500" : "text-white"}`}>
                      {block.subject}
                    </span>
                    {block.activity && (
                      <>
                        <span className="text-gray-500">•</span>
                        <span className={`text-sm ${block.completed ? "line-through text-gray-500" : "text-gray-300"}`}>
                          {block.activity}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Resources */}
                  {block.resourceNames && block.resourceNames.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <BookOpen className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400">
                        {block.resourceNames.join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {block.notes && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      {block.notes}
                    </div>
                  )}
                </div>

                {/* Digital indicator */}
                {block.activity?.includes("Synthesis") || 
                 block.activity?.includes("Math Academy") ||
                 block.activity?.includes("Rosetta Stone") ||
                 block.activity?.includes("Outschool") ||
                 block.activity?.includes("Typing") ||
                 block.activity?.includes("Wonder Math") ? (
                  <Monitor className="w-4 h-4 text-blue-400 flex-shrink-0" title="Digital/Online" />
                ) : null}

                {/* Skip button */}
                {!block.completed && !block.skipped && (
                  <button
                    onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
                    className="flex-shrink-0 p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-gray-300"
                    title="Skip this block"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                )}

                {block.skipped && (
                  <span className="text-xs text-gray-500 italic">
                    Skipped{block.skipReason ? `: ${block.skipReason}` : ""}
                  </span>
                )}
              </div>

              {/* Skip reason input */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-600 flex gap-2">
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    className="flex-grow bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSkip(block.id, (e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleSkip(block.id, "")}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white"
                  >
                    Skip
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
