"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

const objectives = [
  "Lifelong love of learning",
  "Growth mindset",
  "Emotional mastery",
  "Healthy habits & routines",
  "Engaged experiential learning",
];

export function HomeschoolObjectives() {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-amber-700 font-semibold whitespace-nowrap">
            <Target className="h-4 w-4" />
            <span>Objectives:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {objectives.map((obj, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-white border border-amber-200 rounded-full text-sm text-amber-900"
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
