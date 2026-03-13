// Shared category color mappings for RPM categories
// Used across PersonalOverview, ProfessionalOverview, FiveToThrive, QuickWins, etc.

export const CATEGORY_COLORS: Record<string, { border: string; badge: string; bg: string }> = {
  // Personal RPM (cool/calm palette)
  "Raising Resilient Humans": {
    border: "border-l-4 border-l-purple-500",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    bg: "bg-purple-50",
  },
  "Financial Independence & Freedom": {
    border: "border-l-4 border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    bg: "bg-emerald-50",
  },
  "Home Haven & Sanctuary": {
    border: "border-l-4 border-l-teal-500",
    badge: "bg-teal-100 text-teal-800 border-teal-300",
    bg: "bg-teal-50",
  },
  "Bangin' Ass Body": {
    border: "border-l-4 border-l-red-500",
    badge: "bg-red-100 text-red-800 border-red-300",
    bg: "bg-red-50",
  },
  "Extraordinary Friendships": {
    border: "border-l-4 border-l-sky-500",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
    bg: "bg-sky-50",
  },
  "Phenomenal Relationship": {
    border: "border-l-4 border-l-pink-500",
    badge: "bg-pink-100 text-pink-800 border-pink-300",
    bg: "bg-pink-50",
  },

  // Professional RPM (warm/bold palette)
  "Bad Ass Business Owner": {
    border: "border-l-4 border-l-yellow-500",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-400",
    bg: "bg-yellow-50",
  },
  "HTA Empire Builder": {
    border: "border-l-4 border-l-lime-500",
    badge: "bg-lime-100 text-lime-800 border-lime-400",
    bg: "bg-lime-50",
  },
  "Staff Empowerment & Kickass Workplace": {
    border: "border-l-4 border-l-slate-300",
    badge: "bg-white text-slate-700 border-slate-300",
    bg: "bg-slate-50",
  },
  "Marketing & Networking Genius": {
    border: "border-l-4 border-l-orange-500",
    badge: "bg-orange-100 text-orange-800 border-orange-400",
    bg: "bg-orange-50",
  },
  "Operational Systems Guru": {
    border: "border-l-4 border-l-amber-700",
    badge: "bg-amber-100 text-amber-900 border-amber-400",
    bg: "bg-amber-50",
  },
  "Program Innovation & Excellence": {
    border: "border-l-4 border-l-gray-400",
    badge: "bg-gray-100 text-gray-700 border-gray-400",
    bg: "bg-gray-50",
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
