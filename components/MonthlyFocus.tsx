"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, ArrowRight } from "lucide-react";

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

const focusAreas = [
  { emoji: "🏃", text: "Sprinting Program (PepSpeed) - PRIORITY START", topics: ["P.E."] },
  { emoji: "📊", text: "CGM Experiment (starting now!)", topics: ["Health", "Nutrition"] },
  { emoji: "🫀", text: "Health & Body Systems + Einstein Human Body Kit", topics: ["Science"] },
  { emoji: "🍎", text: "Nutrition Science + Smoothie experiments for Anthony", topics: ["Nutrition"] },
  { emoji: "📚", text: "Finish Tuttle Twins Vol 2 + Liberty Kids series", topics: ["History"] },
  { emoji: "🇮🇹", text: "Italian 10-15 min daily (kids requested!)", topics: ["Language"] },
  { emoji: "💰", text: "Compound Interest daily (Day 35→65)", topics: ["Financial Literacy"] },
  { emoji: "🏠", text: "Raising Healthy Families 1x/week", topics: ["Life Skills"] },
  { emoji: "🔬", text: "Blood and Guts experiments", topics: ["Science", "Health"] },
  { emoji: "🏇", text: "Horseback riding weekly", topics: ["P.E."] },
];

const upNext = [
  { emoji: "🤠", text: "Texas history prep (April trip)", topics: ["History"] },
  { emoji: "📃", text: "Origami restart", topics: ["Art"] },
  { emoji: "🏛️", text: "Nixon Museum field trip", topics: ["Civics", "History"] },
  { emoji: "🪂", text: "iFly field trip", topics: ["P.E.", "Science"] },
];

export function MonthlyFocus() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle>March Focus</CardTitle>
          </div>
          <CardDescription>Current learning themes & priorities</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {focusAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-lg">{area.emoji}</span>
                <div className="flex-1">
                  <span className="pt-0.5">{area.text}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {area.topics.map((topic) => (
                      <span
                        key={topic}
                        className={`text-xs px-2 py-0.5 rounded-full ${topicColors[topic] || "bg-gray-500/20 text-gray-400"}`}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Up Next (April)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {upNext.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-lg">{item.emoji}</span>
                <div className="flex-1">
                  <span className="pt-0.5">{item.text}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.topics.map((topic) => (
                      <span
                        key={topic}
                        className={`text-xs px-2 py-0.5 rounded-full ${topicColors[topic] || "bg-gray-500/20 text-gray-400"}`}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
