"use client";

interface MemoryFilterBarProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
}

const TYPE_FILTERS = [
  { value: "all", label: "All", icon: "📚" },
  { value: "memory", label: "Memories", icon: "🧠" },
  { value: "note", label: "Notes", icon: "📝" },
  { value: "conversation", label: "Conversations", icon: "💬" },
];

const CATEGORY_FILTERS = [
  { value: "all", label: "All Categories" },
  { value: "Daily Memories", label: "Daily Memories" },
  { value: "Long-Term Memory", label: "Long-Term Memory" },
  { value: "Knowledge Base", label: "Knowledge Base" },
  { value: "Projects", label: "Projects" },
  { value: "Notes & Guides", label: "Notes & Guides" },
  { value: "Conversations", label: "Conversations" },
];

export function MemoryFilterBar({
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: MemoryFilterBarProps) {
  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="space-y-3">
      {/* Type Filters */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t.value}
            onClick={() => onTypeChange(t.value)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              selectedType === t.value
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Category + Date Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Category selector */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 cursor-pointer"
        >
          {CATEGORY_FILTERS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Date from */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          />
        </div>

        {/* Date to */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          />
        </div>

        {/* Clear dates */}
        {hasDateFilter && (
          <button
            onClick={() => {
              onDateFromChange("");
              onDateToChange("");
            }}
            className="text-xs text-amber-600 hover:text-amber-800 transition-colors underline-offset-2 hover:underline"
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}
