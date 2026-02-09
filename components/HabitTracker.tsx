"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface HabitTrackerProps {
  userId: Id<"users">;
  date: string; // YYYY-MM-DD format
}

export function HabitTracker({ userId, date }: HabitTrackerProps) {
  // Queries
  const dailyHabits = useQuery(api.habitTemplates.getDailyHabits, {
    userId,
    date,
  });

  // Mutations
  const toggleHabit = useMutation(api.habitTemplates.toggleDailyHabit);
  const populateHabits = useMutation(api.habitTemplates.populateDailyHabits);

  // Auto-populate habits for today if they don't exist
  const handlePopulateHabits = async () => {
    await populateHabits({ userId, date });
  };

  const handleToggleHabit = async (habitId: Id<"dailyHabits">, completed: boolean) => {
    await toggleHabit({ id: habitId, completed: !completed });
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
            Load Today's Habits
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completed = dailyHabits.filter((h) => h.completed).length;
  const total = dailyHabits.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Habit Tracker</CardTitle>
        <CardDescription>
          {completed} of {total} completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dailyHabits.map((habit) => (
            <div
              key={habit._id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={habit.completed}
                onCheckedChange={() =>
                  handleToggleHabit(habit._id, habit.completed)
                }
              />
              <div className="flex items-center gap-2 flex-1">
                {habit.template?.icon && (
                  <span className="text-lg">{habit.template.icon}</span>
                )}
                <span
                  className={habit.completed ? "line-through text-muted-foreground" : ""}
                >
                  {habit.template?.name || "Unknown habit"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
