"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Search, BookOpen, Gamepad2, FlaskConical, Monitor, Dumbbell, Package, Lightbulb, Calculator, Microscope, Palette, Globe, Heart, Brain, Sparkles, ChevronLeft, Music, PenLine, Megaphone, Mic } from "lucide-react";

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
  book: "text-green-500 bg-green-500/10",
  game: "text-purple-500 bg-purple-500/10",
  kit: "text-yellow-500 bg-yellow-500/10",
  digital: "text-blue-500 bg-blue-500/10",
  equipment: "text-teal-500 bg-teal-500/10",
  supply: "text-orange-500 bg-orange-500/10",
  membership: "text-pink-500 bg-pink-500/10",
};

// Category definitions with icons and colors
const categories = [
  { id: "math", name: "Math", icon: Calculator, color: "bg-blue-500", description: "Math games, manipulatives & curriculum" },
  { id: "reading", name: "Reading", icon: BookOpen, color: "bg-green-500", description: "Books, graphic novels & reading materials" },
  { id: "writing", name: "Writing", icon: PenLine, color: "bg-emerald-600", description: "Writing curriculum, spelling & composition" },
  { id: "science", name: "Science", icon: Microscope, color: "bg-yellow-500", description: "Experiments, kits & nature study" },
  { id: "history", name: "History", icon: Globe, color: "bg-amber-600", description: "History curriculum, books & timelines" },
  { id: "art", name: "Art", icon: Palette, color: "bg-pink-500", description: "Art supplies, crafts & creative materials" },
  { id: "pe", name: "PE & Sports", icon: Dumbbell, color: "bg-teal-500", description: "Sports equipment, games & fitness" },
  { id: "language", name: "Language", icon: Megaphone, color: "bg-red-500", description: "Italian, Spanish & language learning" },
  { id: "life-skills", name: "Life Skills", icon: Heart, color: "bg-orange-500", description: "Cooking, character & practical skills" },
  { id: "critical-thinking", name: "Critical Thinking", icon: Brain, color: "bg-purple-500", description: "Chess, logic games & problem solving" },
  { id: "magic", name: "Magic", icon: Sparkles, color: "bg-indigo-500", description: "Card tricks, illusions & performance" },
  { id: "music", name: "Music", icon: Music, color: "bg-rose-500", description: "Instruments, DJ equipment & music learning" },
  { id: "public-speaking", name: "Public Speaking", icon: Mic, color: "bg-cyan-500", description: "Presentation, debate & communication skills" },
];

export function HomeschoolResourcesView() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForgotten, setShowForgotten] = useState(false);

  // @ts-ignore - API types need regeneration
  const searchResults = useQuery(
    (api as any).homeschool?.searchResources,
    searchTerm.length >= 2 ? { searchTerm } : "skip"
  );

  // @ts-ignore - API types need regeneration
  const categoryResources = useQuery(
    (api as any).homeschool?.getResources,
    selectedCategory ? { category: selectedCategory, limit: 100 } : "skip"
  );

  // @ts-ignore - API types need regeneration
  const forgottenResources = useQuery(
    (api as any).homeschool?.getForgottenResources,
    showForgotten ? { daysSinceUsed: 60 } : "skip"
  );

  // Determine what to display and sort alphabetically
  const unsortedResources = showForgotten
    ? forgottenResources
    : searchTerm.length >= 2
    ? searchResults
    : categoryResources;
  
  const displayResources = unsortedResources
    ? [...unsortedResources].sort((a: any, b: any) => 
        (a.name || '').localeCompare(b.name || ''))
    : unsortedResources;

  // If showing category browser (no category selected and no search/forgotten)
  if (!selectedCategory && searchTerm.length < 2 && !showForgotten) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Resource Library</h1>
          <p className="text-muted-foreground mt-1">
            Browse by subject to find games, books, kits & equipment
          </p>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search all resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowForgotten(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            Forgotten Resources (60+ days)
          </button>
        </div>

        {/* Category Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex items-start gap-4 p-4 bg-card border rounded-lg hover:border-amber-500 transition-all text-left group"
              >
                <div className={`p-3 rounded-lg ${cat.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-amber-500 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Show resources for selected category or search/forgotten
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setSearchTerm("");
            setShowForgotten(false);
          }}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">
            {showForgotten 
              ? "Forgotten Resources" 
              : selectedCategory 
                ? categories.find(c => c.id === selectedCategory)?.name || selectedCategory
                : "Search Results"
            }
          </h1>
          <p className="text-muted-foreground mt-1">
            {showForgotten 
              ? "Resources not used in 60+ days - time to revisit!"
              : searchTerm.length >= 2
                ? `Searching for "${searchTerm}"`
                : categories.find(c => c.id === selectedCategory)?.description
            }
          </p>
        </div>
      </div>

      {/* Search within category */}
      {selectedCategory && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${categories.find(c => c.id === selectedCategory)?.name || 'resources'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {displayResources?.length || 0} resources found
      </div>

      {/* Results Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {!displayResources || displayResources.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {displayResources === undefined ? "Loading..." : "No resources found"}
          </div>
        ) : (
          displayResources.map((resource: any) => (
            <div
              key={resource._id}
              className="bg-card border rounded-lg p-4 hover:border-amber-500/50 transition-colors"
            >
              {/* Header with type icon */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${typeColors[resource.type] || "bg-muted"}`}>
                  {typeIcons[resource.type] || <Package className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{resource.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {resource.type}
                    {resource.series && ` • ${resource.series}`}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {resource.subjects && resource.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {resource.subjects.slice(0, 4).map((subject: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-muted rounded text-xs"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              {(resource.location || resource.notes) && (
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  {resource.location && <p>📍 {resource.location}</p>}
                  {resource.notes && <p className="mt-1 italic">{resource.notes}</p>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
