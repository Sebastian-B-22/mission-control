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

interface QuickWinsCardProps {
  userId: Id<"users">;
  date: string;
}

export function QuickWinsCard({ userId, date }: QuickWinsCardProps) {
  const [task, setTask] = useState("");

  const quickWins = useQuery(api.familyMeeting.getQuickWins, { userId, date }) || [];
  const addQuickWin = useMutation(api.familyMeeting.addQuickWin);
  const toggleQuickWin = useMutation(api.familyMeeting.toggleQuickWin);
  const deleteQuickWin = useMutation(api.familyMeeting.deleteQuickWin);
  const carryOverUnchecked = useMutation(api.familyMeeting.carryOverUncheckedQuickWins);

  const previousDate = useMemo(() => {
    const current = new Date(`${date}T00:00:00`);
    current.setDate(current.getDate() - 1);
    return current.toISOString().split("T")[0];
  }, [date]);

  const completed = quickWins.filter((q) => q.completed).length;

  const handleAdd = async () => {
    if (!task.trim()) return;
    await addQuickWin({ userId, date, task: task.trim() });
    setTask("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Wins</CardTitle>
        <CardDescription>{completed}/{quickWins.length} complete • resets daily</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="space-y-2">
          {quickWins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quick wins yet.</p>
          ) : (
            quickWins.map((item) => (
              <div key={item._id} className="flex items-center gap-2 p-2 border rounded-lg">
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
