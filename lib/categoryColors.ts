// Shared category color mappings for RPM categories
// Used across PersonalOverview, ProfessionalOverview, FiveToThrive, QuickWins, etc.

export const CATEGORY_COLORS: Record<string, { border: string; badge: string; bg: string }> = {
  // Personal RPM (distinct colors for dark mode)
  "Raising Resilient Humans": {
    border: "border-l-4 border-l-purple-500",
    badge: "bg-purple-900/30 text-purple-300 border-purple-500/50",
    bg: "bg-purple-950",
  },
  "Financial Independence & Freedom": {
    border: "border-l-4 border-l-emerald-500",
    badge: "bg-emerald-900/30 text-emerald-300 border-emerald-500/50",
    bg: "bg-emerald-950",
  },
  "Home Haven & Sanctuary": {
    border: "border-l-4 border-l-amber-500",
    badge: "bg-amber-900/30 text-amber-300 border-amber-500/50",
    bg: "bg-amber-950",
  },
  "Bangin' Ass Body": {
    border: "border-l-4 border-l-orange-500",
    badge: "bg-orange-900/30 text-orange-300 border-orange-500/50",
    bg: "bg-orange-950",
  },
  "Extraordinary Friendships": {
    border: "border-l-4 border-l-sky-500",
    badge: "bg-sky-900/30 text-sky-300 border-sky-500/50",
    bg: "bg-sky-950",
  },
  "Phenomenal Relationship": {
    border: "border-l-4 border-l-pink-500",
    badge: "bg-pink-900/30 text-pink-300 border-pink-500/50",
    bg: "bg-pink-950",
  },

  // Professional RPM (distinct colors - no two similar)
  "Bad Ass Business Owner": {
    border: "border-l-4 border-l-rose-500",
    badge: "bg-rose-900/30 text-rose-300 border-rose-500/50",
    bg: "bg-rose-950",
  },
  "HTA Empire Builder": {
    border: "border-l-4 border-l-indigo-500",
    badge: "bg-indigo-900/30 text-indigo-300 border-indigo-500/50",
    bg: "bg-indigo-950",
  },
  "Staff Empowerment & Kickass Workplace": {
    border: "border-l-4 border-l-cyan-500",
    badge: "bg-cyan-900/30 text-cyan-300 border-cyan-500/50",
    bg: "bg-cyan-950",
  },
  "Marketing & Networking Genius": {
    border: "border-l-4 border-l-yellow-500",
    badge: "bg-yellow-900/30 text-yellow-300 border-yellow-500/50",
    bg: "bg-yellow-950",
  },
  "Operational Systems Guru": {
    border: "border-l-4 border-l-blue-500",
    badge: "bg-blue-900/30 text-blue-300 border-blue-500/50",
    bg: "bg-blue-950",
  },
  "Program Innovation & Excellence": {
    border: "border-l-4 border-l-fuchsia-500",
    badge: "bg-fuchsia-900/30 text-fuchsia-300 border-fuchsia-500/50",
    bg: "bg-fuchsia-950",
  },
};

export const DEFAULT_CATEGORY_COLORS = {
  border: "border-l-4 border-l-gray-500",
  badge: "bg-gray-100 text-gray-800 border-gray-300",
  bg: "bg-gray-50",
};

export function getCategoryColor(categoryName: string | undefined): { border: string; badge: string; bg: string } {
  if (!categoryName) return DEFAULT_CATEGORY_COLORS;
  return CATEGORY_COLORS[categoryName] || DEFAULT_CATEGORY_COLORS;
}
