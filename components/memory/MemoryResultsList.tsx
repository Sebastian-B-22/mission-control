"use client";

import { ChevronRight } from "lucide-react";

export interface SearchResult {
  id: string;
  title: string;
  type: "memory" | "note" | "conversation";
  category: string;
  date: string;
  snippet: string;
  path: string;
  matches: number;
}

interface MemoryResultsListProps {
  results: SearchResult[];
  query: string;
  onSelectFile: (path: string) => void;
  groupByCategory?: boolean;
}

function getTypeIcon(type: string): string {
  switch (type) {
    case "memory": return "🧠";
    case "note": return "📝";
    case "conversation": return "💬";
    default: return "📄";
  }
}

function getTypeBadgeStyle(type: string): string {
  switch (type) {
    case "memory":
      return "bg-purple-50 text-purple-700 border border-purple-200";
    case "note":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "conversation":
      return "bg-green-50 text-green-700 border border-green-200";
    default:
      return "bg-gray-50 text-gray-600 border border-gray-200";
  }
}

function formatDate(dateStr: string): string {
  try {
    // Parse as a local date to avoid timezone shifts
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateStr;
  }
}

/** Highlight search terms in text */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || query.trim() === "") {
    return <span>{text}</span>;
  }

  const words = query
    .toLowerCase()
    .split(" ")
    .filter((w) => w.length > 2);

  if (words.length === 0) return <span>{text}</span>;

  // Build a regex that matches any of the query words
  const escapedWords = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escapedWords.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-100 text-amber-800 rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** Get breadcrumb segments from a file path */
function PathBreadcrumb({ filePath }: { filePath: string }) {
  const parts = filePath.split("/").filter(Boolean);
  if (parts.length <= 1) return <span className="text-gray-400 text-xs">{filePath}</span>;

  return (
    <span className="text-gray-400 text-xs">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1 text-gray-300">/</span>}
          <span className={i === parts.length - 1 ? "text-gray-500 font-medium" : ""}>
            {part}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Single result card */
function ResultCard({
  result,
  query,
  onClick,
}: {
  result: SearchResult;
  query: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:bg-amber-50 hover:border-amber-200 transition-all group shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{getTypeIcon(result.type)}</span>
            <h3 className="text-sm font-semibold text-gray-800 group-hover:text-amber-700 transition-colors truncate">
              <HighlightedText text={result.title} query={query} />
            </h3>
          </div>

          {/* File path breadcrumb */}
          <div className="mb-2">
            <PathBreadcrumb filePath={result.path} />
          </div>

          {/* Snippet */}
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2.5">
            <HighlightedText text={result.snippet} query={query} />
          </p>

          {/* Metadata tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getTypeBadgeStyle(result.type)}`}>
              {result.type}
            </span>
            <span className="text-xs text-gray-400">{formatDate(result.date)}</span>
            {result.matches > 0 && (
              <span className="text-xs text-amber-600 font-medium">
                {result.matches} {result.matches === 1 ? "match" : "matches"}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 text-gray-300 group-hover:text-amber-400 transition-colors mt-1">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}

/** Category group heading */
const CATEGORY_ICONS: Record<string, string> = {
  "Daily Memories": "🗓️",
  "Long-Term Memory": "🧠",
  "Knowledge Base": "📚",
  "Projects": "🚀",
  "Notes & Guides": "📝",
  "Conversations": "💬",
};

export function MemoryResultsList({
  results,
  query,
  onSelectFile,
  groupByCategory = true,
}: MemoryResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-1">No results found</h3>
        <p className="text-sm text-gray-400">Try different search terms or adjust your filters</p>
      </div>
    );
  }

  if (!groupByCategory) {
    return (
      <div className="space-y-2">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            query={query}
            onClick={() => onSelectFile(result.path)}
          />
        ))}
      </div>
    );
  }

  // Group by category
  const grouped: Record<string, SearchResult[]> = {};
  const categoryOrder = [
    "Daily Memories",
    "Long-Term Memory",
    "Knowledge Base",
    "Projects",
    "Notes & Guides",
    "Conversations",
  ];

  results.forEach((r) => {
    const cat = r.category || "Notes & Guides";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  });

  // Sort categories by order, then any extras
  const sortedCategories = [
    ...categoryOrder.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !categoryOrder.includes(c)),
  ];

  return (
    <div className="space-y-6">
      {sortedCategories.map((category) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{CATEGORY_ICONS[category] || "📁"}</span>
            <h3 className="text-sm font-semibold text-gray-700">{category}</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {grouped[category].length}
            </span>
          </div>
          <div className="space-y-2">
            {grouped[category].map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                query={query}
                onClick={() => onSelectFile(result.path)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
