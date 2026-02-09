"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

const objectives = [
  "Lifelong love of learning",
  "Growth mindset",
  "Emotional mastery",
  "Healthy habits & routines",
  "Learn by doing",
  "Cultivate creativity & wonder",
];

export function HomeschoolObjectives() {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="py-2">
        <div className="flex items-start gap-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-amber-700 font-semibold whitespace-nowrap pt-1">
            <Target className="h-4 w-4" />
            <span>Objectives:</span>
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {objectives.map((obj, i) => (
              <span
                key={i}
                className="px-4 py-1.5 bg-white border border-amber-200 rounded-full text-sm text-amber-900 font-medium whitespace-nowrap"
              >
                {obj}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
