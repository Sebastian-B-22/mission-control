"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface HabitTrackerProps {
  userId: Id<"users">;
  date: string; // YYYY-MM-DD format
}

type DailyHabitWithTemplate = Doc<"dailyHabits"> & {
  template: Doc<"habitTemplates"> | null;
};

export function HabitTracker({ userId, date }: HabitTrackerProps) {
  const supplementItems = ["Longevity mix", "Morning Blueprint pills", "Afternoon Blueprint pills"];
  const workoutItems = ["Lift weights", "HIIT", "Walk", "Yoga", "Dance", "Jiujitsu", "Hike"];
  const supplementStorageKey = `mission-control-supplements-${date}`;
  const [supplementOpen, setSupplementOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [supplements, setSupplements] = useState<Record<string, boolean>>({});

  // Queries
  const dailyHabits = useQuery(api.habitTemplates.getDailyHabits, {
    userId,
    date,
  });
  // Mutations
  const toggleHabit = useMutation(api.habitTemplates.toggleDailyHabit);
  const populateHabits = useMutation(api.habitTemplates.populateDailyHabits);
  const setWorkoutTypes = useMutation(api.habitTemplates.setDailyHabitWorkoutTypes);

  // Auto-populate habits for today if they don't exist
  const handlePopulateHabits = async () => {
    await populateHabits({ userId, date });
  };

  const handleToggleHabit = async (habitId: Id<"dailyHabits">, completed: boolean) => {
    await toggleHabit({ id: habitId, completed: !completed });
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        setSupplements(JSON.parse(window.localStorage.getItem(supplementStorageKey) || "{}"));
      } catch {
        setSupplements({});
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [supplementStorageKey]);

  const sortedDailyHabits = useMemo(() => {
    return [...((dailyHabits || []) as DailyHabitWithTemplate[])].sort((a, b) => {
      return (a.template?.order ?? 99) - (b.template?.order ?? 99);
    });
  }, [dailyHabits]);

  const supplementDoneCount = supplementItems.filter((item) => supplements[item]).length;
  const supplementsComplete = supplementDoneCount === supplementItems.length;

  const toggleWorkout = async (item: string, habit: DailyHabitWithTemplate) => {
    const workoutTypes = habit.workoutTypes || [];
    const next = workoutTypes.includes(item)
      ? workoutTypes.filter((type: string) => type !== item)
      : [...workoutTypes, item];

    await setWorkoutTypes({ id: habit._id, workoutTypes: next });
  };

  const toggleSupplement = async (item: string, habitId: Id<"dailyHabits">) => {
    const next = { ...supplements, [item]: !supplements[item] };
    setSupplements(next);
    window.localStorage.setItem(supplementStorageKey, JSON.stringify(next));

    const nextComplete = supplementItems.every((name) => next[name]);
    await toggleHabit({ id: habitId, completed: nextComplete });
  };

  if (!dailyHabits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Habit Tracker</CardTitle>
          <CardDescription>Your daily habits</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  // If no habits for today, show button to populate
  if (dailyHabits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Habit Tracker</CardTitle>
          <CardDescription>Your daily habits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No habits loaded for today yet.
          </p>
          <Button onClick={handlePopulateHabits}>
            Load Today&apos;s Habits
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completed = sortedDailyHabits.filter((h) => h.completed).length;
  const total = sortedDailyHabits.length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Habit Tracker</CardTitle>
        <CardDescription>
          {completed} of {total} completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {sortedDailyHabits.map((habit) => {
            const habitName = habit.template?.name || "Unknown habit";
            const isSupplements = habitName.toLowerCase().includes("supplement");
            const isWorkout = habitName.toLowerCase().startsWith("workout");
            const workoutTypes = habit.workoutTypes || [];
            const workoutComplete = workoutTypes.length > 0;

            return (
            <div
              key={habit._id}
              className="rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSupplements ? supplementsComplete : isWorkout ? workoutComplete : habit.completed}
                  onCheckedChange={() =>
                    isSupplements
                      ? setSupplementOpen((open) => !open)
                      : isWorkout
                        ? setWorkoutOpen((open) => !open)
                        : handleToggleHabit(habit._id, habit.completed)
                  }
                />
                <div className="flex flex-1 items-center gap-2">
                  {habit.template?.icon && (
                    <span className="text-lg">{habit.template.icon}</span>
                  )}
                  <span
                    className={(isSupplements ? supplementsComplete : isWorkout ? workoutComplete : habit.completed) ? "line-through text-muted-foreground" : ""}
                  >
                    {isWorkout ? "Workout" : habitName}
                  </span>
                </div>
                {isWorkout && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Log workout"
                    onClick={() => setWorkoutOpen((open) => !open)}
                  >
                    {workoutOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                )}
                {isSupplements && (
                  <Button variant="ghost" size="sm" onClick={() => setSupplementOpen((open) => !open)}>
                    {supplementDoneCount}/{supplementItems.length}
                    {supplementOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                  </Button>
                )}
              </div>

              {isWorkout && workoutOpen && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {workoutItems.map((item) => (
                    <label key={item} className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2 text-sm">
                      <Checkbox
                        checked={workoutTypes.includes(item)}
                        onCheckedChange={() => toggleWorkout(item, habit)}
                      />
                      <span className={workoutTypes.includes(item) ? "line-through text-muted-foreground" : ""}>{item}</span>
                    </label>
                  ))}
                </div>
              )}

              {isSupplements && supplementOpen && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {supplementItems.map((item) => (
                    <label key={item} className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2 text-sm">
                      <Checkbox
                        checked={Boolean(supplements[item])}
                        onCheckedChange={() => toggleSupplement(item, habit._id)}
                      />
                      <span className={supplements[item] ? "line-through text-muted-foreground" : ""}>{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
