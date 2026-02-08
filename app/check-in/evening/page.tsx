"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const habitCategories = [
  {
    name: "CLARITY",
    description: "I knew my 'why' and lived intentionally today",
  },
  {
    name: "PRODUCTIVITY",
    description: "I worked on things that mattered most today",
  },
  {
    name: "ENERGY",
    description: "I managed my mental and physical energy well",
  },
  {
    name: "INFLUENCE",
    description: "I helped or treated others well today",
  },
  {
    name: "NECESSITY",
    description: "I felt it was necessary to be my best and made success a 'must'",
  },
  {
    name: "COURAGE",
    description: "I shared my real self, thoughts, and feelings today",
  },
];

export default function EveningCheckInPage() {
  const router = useRouter();
  const [oneThingDone, setOneThingDone] = useState<boolean | null>(null);
  const [reflection, setReflection] = useState("");
  const [appreciated, setAppreciated] = useState("");
  const [learned, setLearned] = useState("");
  const [wins, setWins] = useState("");
  const [habitScores, setHabitScores] = useState<Record<string, number>>({});

  const handleScoreClick = (habit: string, score: number) => {
    setHabitScores((prev) => ({ ...prev, [habit]: score }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Save to Convex
    // const today = new Date().toISOString().split('T')[0];
    // await createCheckIn({
    //   userId,
    //   date: today,
    //   type: "evening",
    //   responses: { oneThingDone, reflection, appreciated, learned, wins }
    // });
    // await saveHabitScores({ userId, date: today, ...habitScores });

    router.push("/dashboard");
  };

  const allHabitsScored = habitCategories.every(
    (habit) => habitScores[habit.name] !== undefined
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Evening Reflection 🌙</CardTitle>
          <CardDescription>
            Let's celebrate today and learn from it. How did you show up?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ONE THING Review */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">
                Did your ONE THING get done? *
              </Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={oneThingDone === true ? "default" : "outline"}
                  size="lg"
                  onClick={() => setOneThingDone(true)}
                  className="flex-1"
                >
                  Yes! ✅
                </Button>
                <Button
                  type="button"
                  variant={oneThingDone === false ? "default" : "outline"}
                  size="lg"
                  onClick={() => setOneThingDone(false)}
                  className="flex-1"
                >
                  Not quite
                </Button>
              </div>
              
              {oneThingDone !== null && (
                <Textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder={
                    oneThingDone
                      ? "What made it possible? Celebrate this win!"
                      : "What got in the way? What will you do differently tomorrow?"
                  }
                  rows={2}
                  className="mt-2"
                />
              )}
            </div>

            {/* Reflection Questions */}
            <div className="space-y-2">
              <Label htmlFor="appreciated" className="text-base font-medium">
                A moment that I really appreciated today was...
              </Label>
              <Textarea
                id="appreciated"
                value={appreciated}
                onChange={(e) => setAppreciated(e.target.value)}
                placeholder="A moment of gratitude..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="learned" className="text-base font-medium">
                Something I learned or realized today was...
              </Label>
              <Textarea
                id="learned"
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                placeholder="An insight or learning..."
                rows={3}
              />
            </div>

            {/* Daily Habits Scorecard */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Daily Habits Scorecard *
                </h3>
                <p className="text-sm text-muted-foreground">
                  Rate yourself 1-5 on each habit (1 = needs work, 5 = crushed it)
                </p>
              </div>

              {habitCategories.map((habit) => (
                <div key={habit.name} className="space-y-2">
                  <div>
                    <Label className="font-semibold">{habit.name}</Label>
                    <p className="text-sm text-muted-foreground">
                      {habit.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleScoreClick(habit.name, score)}
                        className={cn(
                          "flex-1 py-3 px-2 rounded-lg border-2 transition-all font-semibold",
                          habitScores[habit.name] === score
                            ? "border-amber-500 bg-amber-50 text-amber-900"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Wins */}
            <div className="space-y-2">
              <Label htmlFor="wins" className="text-base font-medium">
                Quick wins or learnings to remember
              </Label>
              <Textarea
                id="wins"
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="Any other wins or insights you want to capture..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={oneThingDone === null || !allHabitsScored}
              >
                Complete Evening Check-In
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
            </div>

            {(!allHabitsScored || oneThingDone === null) && (
              <p className="text-sm text-center text-muted-foreground">
                Please answer all required questions to complete your check-in
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
