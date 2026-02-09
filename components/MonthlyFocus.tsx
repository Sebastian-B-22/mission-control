"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

const focusAreas = [
  { emoji: "🏃", text: "Health & Body Systems" },
  { emoji: "🍎", text: "Nutrition Science" },
  { emoji: "📊", text: "CGM Experiment" },
  { emoji: "🩸", text: "Blood Work Analysis" },
  { emoji: "🇮🇹", text: "Italian Language" },
  { emoji: "🖨️", text: "3D Printing & Design" },
  { emoji: "🤹", text: "New Skills: Juggling, origami, horseback riding" },
  { emoji: "📚", text: "Tuttle Twins American History Volume 2" },
  { emoji: "💰", text: "Compound Interest (daily)" },
];

export function MonthlyFocus() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <CardTitle>Monthly Focus</CardTitle>
        </div>
        <CardDescription>Current learning themes</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {focusAreas.map((area, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-lg">{area.emoji}</span>
              <span className="pt-0.5">{area.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
