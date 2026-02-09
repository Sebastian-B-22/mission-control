"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

interface FiveToThriveProps {
  userId: Id<"users">;
  date: string; // YYYY-MM-DD format
}

export function FiveToThrive({ userId, date }: FiveToThriveProps) {
  const [newTask, setNewTask] = useState("");

  // Query
  const fiveToThrive = useQuery(api.daily.getFiveToThrive, {
    userId,
    date,
  });

  // Mutations
  const saveFiveToThrive = useMutation(api.daily.saveFiveToThrive);
  const toggleTask = useMutation(api.daily.toggleFiveToThriveTask);

  const tasks = fiveToThrive?.tasks || [];

  const handleAddTask = async () => {
    if (newTask.trim() && tasks.length < 5) {
      const updatedTasks = [
        ...tasks,
        {
          text: newTask,
          completed: false,
        },
      ];

      await saveFiveToThrive({
        userId,
        date,
        tasks: updatedTasks,
      });

      setNewTask("");
    }
  };

  const handleToggleTask = async (index: number) => {
    if (!fiveToThrive) return;

    await toggleTask({
      id: fiveToThrive._id,
      taskIndex: index,
      completed: !tasks[index].completed,
    });
  };

  const handleDeleteTask = async (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);

    await saveFiveToThrive({
      userId,
      date,
      tasks: updatedTasks,
    });
  };

  const handleClearAll = async () => {
    await saveFiveToThrive({
      userId,
      date,
      tasks: [],
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>5 to Thrive</CardTitle>
            <CardDescription>
              {completedCount} of {tasks.length} completed
              {tasks.length < 5 && ` • ${5 - tasks.length} slots remaining`}
            </CardDescription>
          </div>
          {tasks.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Task Input */}
        {tasks.length < 5 && (
          <div className="flex gap-2">
            <Input
              placeholder="Add your must-do for today..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleAddTask} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        )}

        {tasks.length === 5 && (
          <div className="text-sm text-muted-foreground italic">
            All 5 slots filled! Complete or delete a task to add more.
          </div>
        )}

        {/* Task List */}
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              No tasks yet. Add your top 5 priorities for today!
            </p>
          ) : (
            tasks.map((task, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {index + 1}
                </div>
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleTask(index)}
                />
                <span
                  className={`flex-1 ${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.text}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
