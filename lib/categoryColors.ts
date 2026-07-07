// Shared category color mappings for RPM categories
// Used across PersonalOverview, ProfessionalOverview, FiveToThrive, QuickWins, etc.

type CategoryColor = {
  border: string;
  badge: string;
  bg: string;
  surface: string;
};

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  // Personal RPM (distinct colors for dark mode)
  "Raising Resilient Humans": {
    border: "border-l-4 border-l-purple-500",
    badge: "bg-purple-900/30 text-purple-300 border-purple-500/50",
    bg: "bg-purple-950",
    surface: "border-purple-500/20 bg-purple-950/20",
  },
  "Financial Independence & Freedom": {
    border: "border-l-4 border-l-emerald-500",
    badge: "bg-emerald-900/30 text-emerald-300 border-emerald-500/50",
    bg: "bg-emerald-950",
    surface: "border-emerald-500/20 bg-emerald-950/20",
  },
  "Home Haven & Sanctuary": {
    border: "border-l-4 border-l-blue-500",
    badge: "bg-blue-900/30 text-blue-300 border-blue-500/50",
    bg: "bg-blue-950",
    surface: "border-blue-500/20 bg-blue-950/20",
  },
  "Bangin' Ass Body": {
    border: "border-l-4 border-l-red-500",
    badge: "bg-red-900/30 text-red-300 border-red-500/50",
    bg: "bg-red-950",
    surface: "border-red-500/20 bg-red-950/20",
  },
  "Extraordinary Friendships": {
    border: "border-l-4 border-l-sky-500",
    badge: "bg-sky-900/30 text-sky-300 border-sky-500/50",
    bg: "bg-sky-950",
    surface: "border-sky-500/20 bg-sky-950/20",
  },
  "Phenomenal Relationship": {
    border: "border-l-4 border-l-pink-500",
    badge: "bg-pink-900/30 text-pink-300 border-pink-500/50",
    bg: "bg-pink-950",
    surface: "border-pink-500/20 bg-pink-950/20",
  },

  // Professional RPM (distinct colors - no two similar)
  "Bad Ass Business Owner": {
    border: "border-l-4 border-l-orange-500",
    badge: "bg-orange-900/30 text-orange-300 border-orange-500/50",
    bg: "bg-orange-950",
    surface: "border-orange-500/20 bg-orange-950/20",
  },
  "HTA Empire Builder": {
    border: "border-l-4 border-l-indigo-500",
    badge: "bg-indigo-900/30 text-indigo-300 border-indigo-500/50",
    bg: "bg-indigo-950",
    surface: "border-indigo-500/20 bg-indigo-950/20",
  },
  "Staff Empowerment & Kickass Workplace": {
    border: "border-l-4 border-l-cyan-500",
    badge: "bg-cyan-900/30 text-cyan-300 border-cyan-500/50",
    bg: "bg-cyan-950",
    surface: "border-cyan-500/20 bg-cyan-950/20",
  },
  "Marketing & Networking Genius": {
    border: "border-l-4 border-l-yellow-500",
    badge: "bg-yellow-900/30 text-yellow-300 border-yellow-500/50",
    bg: "bg-yellow-950",
    surface: "border-yellow-500/20 bg-yellow-950/20",
  },
  "Operational Systems Guru": {
    border: "border-l-4 border-l-blue-500",
    badge: "bg-blue-900/30 text-blue-300 border-blue-500/50",
    bg: "bg-blue-950",
    surface: "border-blue-500/20 bg-blue-950/20",
  },
  "Program Innovation & Excellence": {
    border: "border-l-4 border-l-fuchsia-500",
    badge: "bg-fuchsia-900/30 text-fuchsia-300 border-fuchsia-500/50",
    bg: "bg-fuchsia-950",
    surface: "border-fuchsia-500/20 bg-fuchsia-950/20",
  },
};

export const DEFAULT_CATEGORY_COLORS = {
  border: "border-l-4 border-l-gray-500",
  badge: "bg-zinc-900/60 text-zinc-300 border-zinc-700",
  bg: "bg-zinc-950",
  surface: "border-zinc-800 bg-zinc-950/60",
};

export function getCategoryColor(categoryName: string | undefined): CategoryColor {
  if (!categoryName) return DEFAULT_CATEGORY_COLORS;
  return CATEGORY_COLORS[categoryName] || DEFAULT_CATEGORY_COLORS;
}
