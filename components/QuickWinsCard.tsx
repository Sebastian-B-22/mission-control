"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRightLeft, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategoryColor } from "@/lib/categoryColors";
import { groupByCategory } from "@/lib/groupByCategory";

interface QuickWinsCardProps {
  userId: Id<"users">;
  date: string;
}

export function QuickWinsCard({ userId, date }: QuickWinsCardProps) {
  const [task, setTask] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"rpmCategories"> | undefined>(undefined);

  const quickWins = useQuery(api.familyMeeting.getQuickWins, { userId, date }) || [];
  const rpmCategoriesQuery = useQuery(api.rpm.getCategoriesByUser, { userId });
  const rpmCategories = useMemo(() => rpmCategoriesQuery ?? [], [rpmCategoriesQuery]);
  const addQuickWin = useMutation(api.familyMeeting.addQuickWin);
  const toggleQuickWin = useMutation(api.familyMeeting.toggleQuickWin);
  const deleteQuickWin = useMutation(api.familyMeeting.deleteQuickWin);
  const carryOverUnchecked = useMutation(api.familyMeeting.carryOverUncheckedQuickWins);

  const previousDate = useMemo(() => {
    const current = new Date(`${date}T00:00:00`);
    current.setDate(current.getDate() - 1);
    return current.toISOString().split("T")[0];
  }, [date]);

  const completed = quickWins.filter((q: any) => q.completed).length;
  const categoryNameById = useMemo(
    () => new Map(rpmCategories.map((category: any) => [category._id, category.name])),
    [rpmCategories]
  );

  // Group quick wins by category for display
  const groupedQuickWins = useMemo(
    () => groupByCategory(quickWins, rpmCategories),
    [quickWins, rpmCategories]
  );

  const handleAdd = async () => {
    if (!task.trim()) return;
    await addQuickWin({ userId, date, task: task.trim(), categoryId: selectedCategoryId });
    setTask("");
    setSelectedCategoryId(undefined);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Wins</CardTitle>
        <CardDescription>{completed}/{quickWins.length} complete • resets daily</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add a quick task..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Select
            value={selectedCategoryId ?? "none"}
            onValueChange={(value) =>
              setSelectedCategoryId(value === "none" ? undefined : (value as Id<"rpmCategories">))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional: Link to an RPM category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {rpmCategories.map((category: any) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Wins - Grouped by Category */}
        <div className="space-y-4">
          {quickWins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quick wins yet.</p>
          ) : (
            groupedQuickWins.map((group) => (
              <div key={group.categoryId ?? "uncategorized"} className="space-y-2">
                {/* Category header - only show if there's a category */}
                {group.categoryName && (
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getCategoryColor(group.categoryName).badge}`}
                    >
                      {group.categoryName}
                    </span>
                  </div>
                )}
                {!group.categoryName && groupedQuickWins.length > 1 && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground font-medium">Uncategorized</span>
                  </div>
                )}
                {/* Items in this category */}
                {group.items.map((item: any) => (
                  <div
                    key={item._id}
                    className={`flex items-center gap-2 p-2 border rounded-lg ${group.categoryName ? getCategoryColor(group.categoryName).border : ""}`}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleQuickWin({ id: item._id, completed: !item.completed })}
                    />
                    <span className={`flex-1 text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.task}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => deleteQuickWin({ id: item._id })}>
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => carryOverUnchecked({ userId, fromDate: previousDate, toDate: date })}
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Carry over unchecked from yesterday
        </Button>
      </CardContent>
    </Card>
  );
}
