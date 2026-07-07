"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCategoryColor } from "@/lib/categoryColors";
import { WorkSurfaceEmptyState, WorkSurfacePageHeader } from "@/components/work-surface";

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

  const categoryColor = getCategoryColor(category.name);

  return (
    <div className="space-y-6">
      <WorkSurfacePageHeader
        title={category.name}
        description={category.role || "RPM category"}
        action={<Badge className={categoryColor.badge} variant="outline">RPM</Badge>}
      />

      {/* Purpose Section */}
      <Card className={[categoryColor.border, categoryColor.surface].join(" ")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Purpose</CardTitle>
          <CardDescription>The reason this lane exists.</CardDescription>
        </CardHeader>
        <CardContent>
          {category.purpose ? (
            <p className="text-base leading-relaxed text-foreground">{category.purpose}</p>
          ) : (
            <p className="text-muted-foreground italic">No purpose defined yet</p>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Yearly Goals */}
        <Card className="border-line bg-surface-1/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Yearly Goals</CardTitle>
            <CardDescription>The outcomes that make the year successful.</CardDescription>
          </CardHeader>
          <CardContent>
            {category.yearlyGoals.length > 0 ? (
              <ul className="space-y-2.5">
                {category.yearlyGoals.map((goal: any, i: any) => (
                  <li key={i} className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2.5">
                    <span className="text-sm leading-relaxed text-foreground">{goal}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <WorkSurfaceEmptyState
                icon={<span className="block h-2 w-2 rounded-full bg-amber-400" />}
                title="No yearly goals yet"
                description="Add the outcomes that should stay visible when you open this category."
                className="min-h-[118px]"
              />
            )}
          </CardContent>
        </Card>

        {/* Monthly Focus / Needle Movers */}
        <Card className="border-line bg-surface-1/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Needle Movers</CardTitle>
            <CardDescription>The few moves that matter right now.</CardDescription>
          </CardHeader>
          <CardContent>
            {category.monthlyFocus.length > 0 ? (
              <ul className="space-y-2.5">
                {category.monthlyFocus.map((focus: any, i: any) => (
                  <li key={i} className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2.5">
                    <span className="text-sm leading-relaxed text-foreground">{focus}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <WorkSurfaceEmptyState
                icon={<span className="block h-2 w-2 rounded-full bg-rose-400" />}
                title="No monthly needle movers yet"
                description="Add the current actions that would move this category forward."
                className="min-h-[118px]"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* This Month's Accomplishments */}
      <Card className="border-emerald-400/25 bg-emerald-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">This Month&apos;s Accomplishments</CardTitle>
          <CardDescription>Completed Quick Wins and 5 to Thrive items tied to this lane.</CardDescription>
        </CardHeader>
        <CardContent>
          {!accomplishments ? (
            <p className="text-muted-foreground italic">Loading accomplishments...</p>
          ) : accomplishments.count === 0 ? (
            <WorkSurfaceEmptyState
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />}
              title="No completions yet this month"
              description="Finished Quick Wins and 5 to Thrive items will collect here automatically."
              className="min-h-[118px] border-emerald-400/20 bg-emerald-950/20"
            />
          ) : (
            <div className="space-y-3">
              <ul className="space-y-2">
                {accomplishments.items.map((item: any, index: any) => (
                  <li key={`${item.source}-${item.completedAt}-${index}`} className="flex items-start gap-3 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-sm text-foreground">{item.text}</p>
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
      <Card className="border-line bg-surface-1/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Brain Dump</CardTitle>
            <CardDescription>Quick captures that belong in this category.</CardDescription>
          </div>
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
                  className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg group hover:bg-muted transition-colors"
                >
                  <span className="flex-1 text-sm text-foreground">{task}</span>
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
            <WorkSurfaceEmptyState
              icon={<Plus className="h-5 w-5" />}
              title="No quick thoughts yet"
              description="Capture loose ideas here, then organize them into projects later."
              className="min-h-[118px]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
