"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Calendar, CheckCircle, Circle, AlertCircle } from "lucide-react";

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeeklyOverview() {
  const today = new Date();
  const mondayDate = getMonday(today);
  const weekSchedule = useQuery(api.homeschool.getWeekSchedule, { weekStart: mondayDate });

  if (!weekSchedule) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          This Week
        </h2>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        This Week
      </h2>

      <div className="grid grid-cols-5 gap-2">
        {weekSchedule.slice(1, 6).map(({ date, schedule }) => {
          const dayDate = new Date(date + "T12:00:00");
          const dayNum = dayDate.getDay();
          const isToday = date === todayStr;
          const isPast = date < todayStr;
          
          const totalBlocks = schedule?.blocks.length || 0;
          const completedBlocks = schedule?.blocks.filter(b => b.completed).length || 0;
          const skippedBlocks = schedule?.blocks.filter(b => b.skipped).length || 0;
          
          const hasSchedule = !!schedule;
          const allDone = totalBlocks > 0 && completedBlocks === totalBlocks;
          const partialDone = completedBlocks > 0 && completedBlocks < totalBlocks;

          return (
            <div
              key={date}
              className={`rounded-lg p-3 border transition-all ${
                isToday
                  ? "bg-blue-900/30 border-blue-500"
                  : isPast
                  ? "bg-gray-800/30 border-gray-700"
                  : "bg-gray-800/50 border-gray-700"
              }`}
            >
              {/* Day header */}
              <div className="text-center mb-2">
                <div className={`text-xs font-medium ${isToday ? "text-blue-400" : "text-gray-500"}`}>
                  {dayNames[dayNum]}
                </div>
                <div className={`text-lg font-bold ${isToday ? "text-white" : "text-gray-400"}`}>
                  {dayDate.getDate()}
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col items-center gap-1">
                {!hasSchedule ? (
                  <div className="flex items-center gap-1 text-gray-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs">No plan</span>
                  </div>
                ) : allDone ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Done!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {partialDone ? (
                      <div className="text-yellow-400">
                        <Circle className="w-4 h-4" fill="currentColor" strokeWidth={0} style={{ clipPath: `inset(0 ${100 - (completedBlocks/totalBlocks)*100}% 0 0)` }} />
                      </div>
                    ) : (
                      <Circle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-xs text-gray-400">
                      {completedBlocks}/{totalBlocks}
                    </span>
                  </div>
                )}

                {/* Mini progress bar */}
                {hasSchedule && totalBlocks > 0 && (
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all ${allDone ? "bg-green-500" : "bg-blue-500"}`}
                      style={{ width: `${(completedBlocks / totalBlocks) * 100}%` }}
                    />
                  </div>
                )}

                {/* Subjects preview */}
                {hasSchedule && (
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {schedule.blocks.slice(0, 3).map((block, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          block.completed
                            ? "bg-green-500"
                            : block.skipped
                            ? "bg-gray-500"
                            : "bg-gray-600"
                        }`}
                        title={block.subject}
                      />
                    ))}
                    {schedule.blocks.length > 3 && (
                      <span className="text-xs text-gray-500">+{schedule.blocks.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
