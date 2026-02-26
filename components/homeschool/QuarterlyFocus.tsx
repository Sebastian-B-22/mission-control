"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Target, Plane, Calendar, CheckSquare } from "lucide-react";

export function QuarterlyFocus() {
  const currentQuarter = useQuery(api.homeschool.getCurrentQuarter);
  const monthlyFocus = useQuery(
    api.homeschool.getMonthlyFocus,
    currentQuarter ? { quarterId: currentQuarter._id } : "skip"
  );

  // Get current month's focus
  const now = new Date();
  const currentMonthStr = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const currentMonthFocus = monthlyFocus?.find(m => 
    m.month.toLowerCase().includes(currentMonthStr.toLowerCase()) ||
    m.month.includes(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  );

  if (!currentQuarter) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Current Focus
        </h2>
        <p className="text-gray-400">No quarterly focus set. Plan your quarter!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Current Focus
      </h2>

      {/* Quarter Theme */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
            {currentQuarter.name}
          </h3>
        </div>
        <p className="text-lg text-white font-medium">{currentQuarter.theme}</p>
        
        {/* Trip tie-in */}
        {currentQuarter.tripTieIn && (
          <div className="flex items-center gap-2 mt-2 text-sm text-blue-300">
            <Plane className="w-4 h-4" />
            <span>{currentQuarter.tripTieIn}</span>
          </div>
        )}
      </div>

      {/* Quarter Objectives */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Quarter Objectives</h4>
        <ul className="space-y-2">
          {currentQuarter.objectives.map((objective, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-300">{objective}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Monthly Focus */}
      {currentMonthFocus && (
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <h4 className="text-sm font-semibold text-green-400">
              This Month: {currentMonthFocus.theme}
            </h4>
          </div>
          <ul className="space-y-1 ml-4">
            {currentMonthFocus.objectives.slice(0, 4).map((obj, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                {obj}
              </li>
            ))}
          </ul>
          
          {/* Key Resources for this month */}
          {currentMonthFocus.keyResources.length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-gray-500">Key Resources: </span>
              <span className="text-xs text-gray-400">
                {currentMonthFocus.keyResources.join(", ")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
