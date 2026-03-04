"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface MemorySearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  resultCount?: number;
}

export function MemorySearchBar({ onSearch, initialValue = "", resultCount }: MemorySearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search as user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setValue(newVal);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(newVal);
    }, 300);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch(value);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Search memories, notes, conversations..."
          className="w-full pl-12 pr-24 py-3.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-sm text-base"
          autoComplete="off"
        />

        {/* Result count */}
        {resultCount !== undefined && (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
            {resultCount} {resultCount === 1 ? "file" : "files"}
          </span>
        )}

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
