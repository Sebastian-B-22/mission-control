"use client";

import { TodaySchedule } from "./TodaySchedule";
import { WeeklyOverview } from "./WeeklyOverview";
import { QuarterlyFocus } from "./QuarterlyFocus";
import { ResourceBrowser } from "./ResourceBrowser";
import { PlanningView } from "./PlanningView";
import { GraduationCap, Plus, RefreshCw, Sun } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

type Tab = "plan" | "today" | "week";

export function HomeschoolDashboard() {
  const generateWeek = useMutation(api.seedHomeschool.generateWeekFromTemplate);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [warmMode, setWarmMode] = useState(false);

  const handleGenerateWeek = async () => {
    setGenerating(true);
    try {
      const monday = getMonday(new Date());
      await generateWeek({ weekStartDate: monday });
    } finally {
      setGenerating(false);
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const bgClass = warmMode ? "bg-gradient-to-br from-amber-50 to-orange-50" : "";
  const textClass = warmMode ? "text-gray-800" : "text-white";
  const secondaryTextClass = warmMode ? "text-gray-600" : "text-gray-400";

  return (
    <div className={`space-y-6 ${bgClass} ${warmMode ? "p-6 rounded-xl" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${textClass} flex items-center gap-3`}>
            <GraduationCap className={`w-8 h-8 ${warmMode ? "text-green-700" : "text-purple-400"}`} />
            Homeschool Dashboard
          </h1>
          <p className={`${secondaryTextClass} mt-1`}>{formattedDate}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setWarmMode(!warmMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              warmMode
                ? "bg-green-700 hover:bg-green-800 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-white"
            }`}
            title="Toggle warm mode"
          >
            <Sun className="w-4 h-4" />
            {warmMode ? "Warm" : "Dark"}
          </button>
          <button
            onClick={handleGenerateWeek}
            disabled={generating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              warmMode
                ? "bg-green-700 hover:bg-green-800 disabled:bg-green-900 text-white"
                : "bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            Generate This Week
          </button>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            warmMode
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}>
            <Plus className="w-4 h-4" />
            Plan Quarter
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab("plan")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === "plan"
              ? warmMode
                ? "bg-green-700 text-white"
                : "bg-purple-600 text-white"
              : warmMode
              ? "text-gray-700 hover:bg-amber-100"
              : "text-gray-400 hover:bg-gray-700"
          }`}
        >
          📝 Plan
        </button>
        <button
          onClick={() => setActiveTab("today")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === "today"
              ? warmMode
                ? "bg-green-700 text-white"
                : "bg-purple-600 text-white"
              : warmMode
              ? "text-gray-700 hover:bg-amber-100"
              : "text-gray-400 hover:bg-gray-700"
          }`}
        >
          ✅ Today
        </button>
        <button
          onClick={() => setActiveTab("week")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === "week"
              ? warmMode
                ? "bg-green-700 text-white"
                : "bg-purple-600 text-white"
              : warmMode
              ? "text-gray-700 hover:bg-amber-100"
              : "text-gray-400 hover:bg-gray-700"
          }`}
        >
          📊 Week
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "plan" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PlanningView warmMode={warmMode} />
          </div>
          <div className="space-y-6">
            <QuarterlyFocus />
            <ResourceBrowser />
          </div>
        </div>
      )}

      {activeTab === "today" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TodaySchedule />
          </div>
          <div className="space-y-6">
            <QuarterlyFocus />
            <ResourceBrowser />
          </div>
        </div>
      )}

      {activeTab === "week" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <WeeklyOverview />
          </div>
          <div className="space-y-6">
            <QuarterlyFocus />
            <ResourceBrowser />
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat label="This Week" value="--" subtext="blocks completed" color="blue" />
        <QuickStat label="This Month" value="--" subtext="learning hours" color="green" />
        <QuickStat label="Resources" value="50+" subtext="in library" color="purple" />
        <QuickStat label="Streak" value="--" subtext="days in a row" color="orange" />
      </div>
    </div>
  );
}

function QuickStat({ 
  label, 
  value, 
  subtext, 
  color 
}: { 
  label: string; 
  value: string; 
  subtext: string; 
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-900/30 border-blue-700 text-blue-400",
    green: "bg-green-900/30 border-green-700 text-green-400",
    purple: "bg-purple-900/30 border-purple-700 text-purple-400",
    orange: "bg-orange-900/30 border-orange-700 text-orange-400",
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <div className="text-xs uppercase tracking-wide opacity-75">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs opacity-75">{subtext}</div>
    </div>
  );
}
