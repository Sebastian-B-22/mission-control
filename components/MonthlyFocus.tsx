"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Lightbulb } from "lucide-react";

type MonthlyFocusMode = "overview" | "page";

type FocusItem = {
  emoji: string;
  text: string;
  topics: string[];
};

type FocusGroup = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  items: FocusItem[];
};

const topicColors: Record<string, string> = {
  "P.E.": "bg-green-500/20 text-green-400",
  "Health": "bg-pink-500/20 text-pink-400",
  "Nutrition": "bg-orange-500/20 text-orange-400",
  "Science": "bg-blue-500/20 text-blue-400",
  "History": "bg-amber-500/20 text-amber-400",
  "Language": "bg-purple-500/20 text-purple-400",
  "Financial Literacy": "bg-emerald-500/20 text-emerald-400",
  "Life Skills": "bg-rose-500/20 text-rose-400",
  "Writing": "bg-indigo-500/20 text-indigo-400",
  "Art": "bg-fuchsia-500/20 text-fuchsia-400",
  "Civics": "bg-cyan-500/20 text-cyan-400",
};

const focusGroups: FocusGroup[] = [
  {
    id: "movement",
    title: "Movement & coordination",
    description: "Athletic confidence, body control, and active field experiences.",
    emoji: "🏃",
    items: [
      { emoji: "🏃", text: "Sprinting Program (PepSpeed)", topics: ["P.E."] },
      { emoji: "🏇", text: "Horseback riding", topics: ["P.E."] },
      { emoji: "🤹", text: "Juggling practice", topics: ["P.E."] },
      { emoji: "🪂", text: "iFly field trip", topics: ["P.E.", "Science"] },
    ],
  },
  {
    id: "health",
    title: "Health & human body",
    description: "Nutrition, physiology, and family wellness woven into real life.",
    emoji: "🫀",
    items: [
      { emoji: "📊", text: "CGM Experiment", topics: ["Health", "Nutrition"] },
      { emoji: "🫀", text: "Health & Body Systems + Einstein Human Body Kit", topics: ["Science"] },
      { emoji: "🍎", text: "Nutrition Science + Smoothie experiments for Anthony", topics: ["Nutrition"] },
      { emoji: "🏠", text: "Raising Healthy Families 1x/week", topics: ["Life Skills"] },
      { emoji: "🔬", text: "Blood and Guts experiments", topics: ["Science", "Health"] },
    ],
  },
  {
    id: "culture",
    title: "Stories, culture & real-world skills",
    description: "History, language, money, and civics in one cleaner lane.",
    emoji: "📚",
    items: [
      { emoji: "📚", text: "Finish Tuttle Twins Vol 2 + Liberty Kids series", topics: ["History"] },
      { emoji: "🇮🇹", text: "Italian 10-15 min daily (kids requested!)", topics: ["Language"] },
      { emoji: "💰", text: "Compound Interest daily (Day 55→85)", topics: ["Financial Literacy"] },
      { emoji: "🏛️", text: "Nixon Museum field trip", topics: ["Civics", "History"] },
    ],
  },
];

const upNext: FocusItem[] = [
  { emoji: "📃", text: "Origami restart", topics: ["Art"] },
  { emoji: "🚀", text: "California Science Center field trip", topics: ["Science"] },
  { emoji: "🦕", text: "Natural History Museum field trip", topics: ["Science", "History"] },
];

function TopicBadge({ topic }: { topic: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${topicColors[topic] || "bg-gray-500/20 text-gray-400"}`}
    >
      {topic}
    </span>
  );
}

function FocusGroupCard({ group, compact }: { group: FocusGroup; compact: boolean }) {
  const visibleItems = compact ? group.items.slice(0, 3) : group.items;
  const hiddenCount = group.items.length - visibleItems.length;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="text-2xl">{group.emoji}</span>
        <div>
          <h3 className="font-semibold text-white">{group.title}</h3>
          <p className="text-sm text-zinc-400">{group.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        {visibleItems.map((item) => (
          <div key={item.text} className="flex items-start gap-2 text-sm">
            <span className="text-base leading-5">{item.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-zinc-100">{item.text}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {item.topics.map((topic) => (
                  <TopicBadge key={topic} topic={topic} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {compact && hiddenCount > 0 && (
        <p className="mt-3 text-xs text-zinc-500">+ {hiddenCount} more in this theme</p>
      )}
    </div>
  );
}

export function MonthlyFocus({ mode = "page" }: { mode?: MonthlyFocusMode }) {
  const compact = mode === "overview";
  const totalItems = focusGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle>April Focus</CardTitle>
          </div>
          <CardDescription>
            Organized by theme so the month feels like a plan, not a wall of bullets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1">
              {focusGroups.length} themes
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1">
              {totalItems} active priorities
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {focusGroups.map((group) => (
              <FocusGroupCard key={group.id} group={group} compact={compact} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Up Next (May)</CardTitle>
          </div>
          <CardDescription>Queued ideas once April’s main lanes feel settled.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {upNext.map((item) => (
              <div key={item.text} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{item.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-100">{item.text}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.topics.map((topic) => (
                        <TopicBadge key={topic} topic={topic} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
