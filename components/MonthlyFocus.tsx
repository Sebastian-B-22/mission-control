"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, ArrowRight } from "lucide-react";

const focusAreas = [
  { emoji: "🏃", text: "Sprinting Program (PepSpeed) - PRIORITY START" },
  { emoji: "📊", text: "CGM Experiment (starting now!)" },
  { emoji: "🫀", text: "Health & Body Systems + Einstein Human Body Kit" },
  { emoji: "🍎", text: "Nutrition Science + Smoothie experiments for Anthony" },
  { emoji: "📚", text: "Finish Tuttle Twins Vol 2 + Liberty Kids series" },
  { emoji: "🇮🇹", text: "Italian 10-15 min daily (kids requested!)" },
  { emoji: "💰", text: "Compound Interest daily (Day 35→65)" },
  { emoji: "🏠", text: "Raising Healthy Families 1x/week" },
  { emoji: "🔬", text: "Blood and Guts experiments" },
  { emoji: "🏇", text: "Horseback riding weekly" },
];

const upNext = [
  { emoji: "🤠", text: "Texas history prep (April trip)" },
  { emoji: "📃", text: "Origami restart" },
  { emoji: "🏛️", text: "Nixon Museum field trip" },
  { emoji: "🪂", text: "iFly field trip" },
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Up Next (April)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {upNext.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-lg">{item.emoji}</span>
                <span className="pt-0.5">{item.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
