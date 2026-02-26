"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, BookOpen, Gamepad2, FlaskConical, Monitor, Dumbbell, Package, Lightbulb, Filter } from "lucide-react";
import { useState } from "react";

const typeIcons: Record<string, React.ReactNode> = {
  book: <BookOpen className="w-4 h-4" />,
  game: <Gamepad2 className="w-4 h-4" />,
  kit: <FlaskConical className="w-4 h-4" />,
  digital: <Monitor className="w-4 h-4" />,
  equipment: <Dumbbell className="w-4 h-4" />,
  supply: <Package className="w-4 h-4" />,
  membership: <Lightbulb className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  book: "text-green-400",
  game: "text-purple-400",
  kit: "text-yellow-400",
  digital: "text-blue-400",
  equipment: "text-teal-400",
  supply: "text-orange-400",
  membership: "text-pink-400",
};

export function ResourceBrowser() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showForgotten, setShowForgotten] = useState(false);

  const searchResults = useQuery(
    api.homeschool.searchResources,
    searchTerm.length >= 2 ? { searchTerm } : "skip"
  );

  const allResources = useQuery(api.homeschool.getResources, {
    type: selectedType || undefined,
    category: selectedCategory || undefined,
    limit: 50,
  });

  const forgottenResources = useQuery(
    api.homeschool.getForgottenResources,
    showForgotten ? { daysSinceUsed: 60 } : "skip"
  );

  const displayResources = showForgotten
    ? forgottenResources
    : searchTerm.length >= 2
    ? searchResults
    : allResources;

  const categories = [
    "math", "reading", "science", "history", "art", "pe", 
    "language", "life-skills", "critical-thinking", "entrepreneurship"
  ];

  const types = ["book", "game", "kit", "digital", "equipment", "membership"];

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" />
        Resource Library
      </h2>

      {/* Search & Filters */}
      <div className="space-y-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Type filters */}
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                selectedType === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              <span className={typeColors[type]}>{typeIcons[type]}</span>
              {type}
            </button>
          ))}
          
          {/* Forgotten toggle */}
          <button
            onClick={() => setShowForgotten(!showForgotten)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              showForgotten
                ? "bg-amber-600 text-white"
                : "bg-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            <Lightbulb className="w-3 h-3" />
            Forgotten (60+ days)
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {!displayResources || displayResources.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">
            {searchTerm.length >= 2 
              ? "No resources found" 
              : "Type to search or select a filter"}
          </p>
        ) : (
          displayResources.map((resource) => (
            <div
              key={resource._id}
              className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer group"
            >
              {/* Type icon */}
              <div className={`flex-shrink-0 ${typeColors[resource.type] || "text-gray-400"}`}>
                {typeIcons[resource.type] || <Package className="w-4 h-4" />}
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="text-sm text-white font-medium truncate">
                  {resource.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{resource.category}</span>
                  {resource.series && (
                    <>
                      <span>•</span>
                      <span className="text-gray-600">{resource.series}</span>
                    </>
                  )}
                  {resource.lastUsed && (
                    <>
                      <span>•</span>
                      <span className="text-gray-600">
                        Last: {new Date(resource.lastUsed).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex-shrink-0 flex gap-1">
                {resource.isDigital && (
                  <span className="px-1.5 py-0.5 bg-blue-900/50 text-blue-400 text-xs rounded">
                    digital
                  </span>
                )}
                {resource.tags?.includes("favorite") && (
                  <span className="px-1.5 py-0.5 bg-yellow-900/50 text-yellow-400 text-xs rounded">
                    ★
                  </span>
                )}
              </div>

              {/* Add to schedule button (hidden until hover) */}
              <button className="flex-shrink-0 opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-all">
                + Add
              </button>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {displayResources && displayResources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500 text-center">
          Showing {displayResources.length} resources
          {showForgotten && " (not used in 60+ days)"}
        </div>
      )}
    </div>
  );
}
