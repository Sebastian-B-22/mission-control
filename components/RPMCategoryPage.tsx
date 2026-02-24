"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, CheckCircle2 } from "lucide-react";

interface RPMCategoryPageProps {
  categoryId: Id<"rpmCategories">;
}

export function RPMCategoryPage({ categoryId }: RPMCategoryPageProps) {
  const [newTaskText, setNewTaskText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const category = useQuery(api.rpm.getCategoryById, { id: categoryId });
  const accomplishments = useQuery(api.rpm.getMonthlyAccomplishmentsByCategory, { categoryId });

  // Brain dump tasks (we'll use a simple array stored in category for now)
  // TODO: Create a proper brainDumpTasks table if needed
  const [brainDumpTasks, setBrainDumpTasks] = useState<string[]>([]);

  if (!category) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading category...</p>
      </div>
    );
  }

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    setBrainDumpTasks([...brainDumpTasks, newTaskText.trim()]);
    setNewTaskText("");
    setIsAdding(false);
  };

  const handleDeleteTask = (index: number) => {
    setBrainDumpTasks(brainDumpTasks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.role && (
          <p className="text-lg text-muted-foreground mt-1">{category.role}</p>
        )}
      </div>

      {/* Purpose Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Purpose</CardTitle>
        </CardHeader>
        <CardContent>
          {category.purpose ? (
            <p className="text-gray-700 leading-relaxed">{category.purpose}</p>
          ) : (
            <p className="text-muted-foreground italic">No purpose defined yet</p>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Yearly Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Yearly Goals</CardTitle>
          </CardHeader>
          <CardContent>
            {category.yearlyGoals.length > 0 ? (
              <ul className="space-y-2">
                {category.yearlyGoals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">●</span>
                    <span className="text-gray-700">{goal}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No yearly goals defined yet</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Focus / Needle Movers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Needle Movers</CardTitle>
          </CardHeader>
          <CardContent>
            {category.monthlyFocus.length > 0 ? (
              <ul className="space-y-2">
                {category.monthlyFocus.map((focus, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">●</span>
                    <span className="text-gray-700">{focus}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No monthly focus defined yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* This Month's Accomplishments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This Month&apos;s Accomplishments</CardTitle>
        </CardHeader>
        <CardContent>
          {!accomplishments ? (
            <p className="text-muted-foreground italic">Loading accomplishments...</p>
          ) : accomplishments.count === 0 ? (
            <p className="text-muted-foreground italic">No completed Quick Wins or 5 to Thrive items yet this month.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">{accomplishments.count} completed item{accomplishments.count === 1 ? "" : "s"}</p>
              <ul className="space-y-2">
                {accomplishments.items.map((item, index) => (
                  <li key={`${item.source}-${item.completedAt}-${index}`} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-700">{item.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.completedAt).toLocaleString("en-US", {
                          timeZone: "America/Los_Angeles",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {item.source === "quick-win" ? " • Quick Win" : " • 5 to Thrive"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brain Dump Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Brain Dump</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add Task Input */}
          {isAdding && (
            <div className="flex gap-2">
              <Input
                placeholder="Quick thought or task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                autoFocus
              />
              <Button onClick={handleAddTask} size="sm">
                Add
              </Button>
              <Button 
                onClick={() => {
                  setIsAdding(false);
                  setNewTaskText("");
                }}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Task List */}
          {brainDumpTasks.length > 0 ? (
            <div className="space-y-2">
              {brainDumpTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                >
                  <span className="flex-1 text-sm text-gray-700">{task}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => handleDeleteTask(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                No quick thoughts yet. Add tasks as they come to mind!
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            💡 Use this for quick captures - thoughts, ideas, tasks that relate to this life area. 
            You can organize them into proper projects later.
          </p>
        </CardContent>
      </Card>

      {/* Edit Category Button */}
      <div className="flex justify-end">
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Category
        </Button>
      </div>
    </div>
  );
}
