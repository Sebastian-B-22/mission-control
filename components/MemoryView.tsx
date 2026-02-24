"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, AlertCircle, LayoutGrid, List } from "lucide-react";
import { MemorySearchBar } from "@/components/memory/MemorySearchBar";
import { MemoryFilterBar } from "@/components/memory/MemoryFilterBar";
import { MemoryResultsList, SearchResult } from "@/components/memory/MemoryResultsList";
import { MemoryContentModal } from "@/components/memory/MemoryContentModal";

type ViewMode = "grouped" | "flat";

export function MemoryView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [totalCount, setTotalCount] = useState(0);

  const performSearch = useCallback(
    async (q: string, type: string, category: string, from: string, to: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ q });
        if (type && type !== "all") params.set("type", type);
        if (from) params.set("dateFrom", from);
        if (to) params.set("dateTo", to);

        const response = await fetch(`/api/memory/search?${params}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Search failed");
          setResults([]);
          return;
        }

        let allResults: SearchResult[] = data.results || [];

        // Apply category filter client-side (category is derived from path)
        if (category && category !== "all") {
          allResults = allResults.filter((r) => r.category === category);
        }

        setResults(allResults);
        setTotalCount(data.count || 0);
      } catch {
        setError("Could not connect to Memory API. Is the server running on the Mac mini?");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Trigger search whenever any filter changes
  useEffect(() => {
    performSearch(query, selectedType, selectedCategory, dateFrom, dateTo);
  }, [query, selectedType, selectedCategory, dateFrom, dateTo, performSearch]);

  // Initial load
  useEffect(() => {
    performSearch("", "all", "all", "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedResults = results;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Brain className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Memory Search</h1>
            <p className="text-sm text-gray-500">
              Search everything Sebastian remembers — daily notes, long-term memory, knowledge base
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <MemorySearchBar
          onSearch={setQuery}
          initialValue={query}
          resultCount={displayedResults.length}
        />
      </div>

      {/* Filters Row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <MemoryFilterBar
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 self-start flex-shrink-0">
          <button
            onClick={() => setViewMode("grouped")}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "grouped"
                ? "bg-white shadow-sm text-amber-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Group by category"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("flat")}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "flat"
                ? "bg-white shadow-sm text-amber-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Flat list"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status / Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">{error}</p>
            <p className="text-xs text-red-500 mt-1">
              Run:{" "}
              <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono">
                cd ~/.openclaw/workspace/memory-api && node server.js
              </code>
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Searching workspace...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Results summary */}
          {!error && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {query ? (
                  <>
                    <span className="font-medium text-gray-600">{displayedResults.length}</span>{" "}
                    {displayedResults.length === 1 ? "result" : "results"} for &quot;
                    <span className="font-medium text-amber-600">{query}</span>&quot;
                    {totalCount !== displayedResults.length && (
                      <span className="ml-1">
                        (filtered from {totalCount})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-medium text-gray-600">{displayedResults.length}</span>{" "}
                    {displayedResults.length === 1 ? "file" : "files"}
                  </>
                )}
              </p>
            </div>
          )}

          <MemoryResultsList
            results={displayedResults}
            query={query}
            onSelectFile={setSelectedFile}
            groupByCategory={viewMode === "grouped"}
          />
        </>
      )}

      {/* Content Modal */}
      {selectedFile && (
        <MemoryContentModal
          filePath={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
