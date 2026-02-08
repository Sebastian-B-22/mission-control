"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WeeklyScheduleProps {
  userId: Id<"users">;
}

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export function WeeklySchedule({ userId }: WeeklyScheduleProps) {
  const schedule = useQuery(api.weeklySchedule.getWeeklySchedule, { userId });
  const createBlock = useMutation(api.weeklySchedule.createScheduleBlock);
  const deleteBlock = useMutation(api.weeklySchedule.deleteScheduleBlock);

  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");
  const [newBlock, setNewBlock] = useState({
    startTime: "09:00",
    endTime: "10:00",
    activity: "",
    notes: "",
  });

  const handleAddBlock = async () => {
    if (newBlock.activity.trim()) {
      await createBlock({
        userId,
        dayOfWeek: selectedDay,
        startTime: newBlock.startTime,
        endTime: newBlock.endTime,
        activity: newBlock.activity,
        notes: newBlock.notes || undefined,
      });
      setNewBlock({
        startTime: "09:00",
        endTime: "10:00",
        activity: "",
        notes: "",
      });
      setIsAddingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId: Id<"weeklySchedule">) => {
    await deleteBlock({ id: blockId });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!schedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Your homeschool routine</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Daily time blocks & routines</CardDescription>
            </div>
            <Button onClick={() => setIsAddingBlock(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {DAYS.map((day) => (
              <div key={day.key} className="border-b pb-4 last:border-b-0">
                <h3 className="font-semibold text-lg mb-3">{day.label}</h3>
                {schedule[day.key].length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No activities scheduled
                  </p>
                ) : (
                  <div className="space-y-2">
                    {schedule[day.key].map((block: any) => (
                      <div
                        key={block._id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                      >
                        <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {formatTime(block.startTime)} - {formatTime(block.endTime)}
                            </span>
                            <span className="text-sm">•</span>
                            <span className="text-sm font-semibold">
                              {block.activity}
                            </span>
                          </div>
                          {block.notes && (
                            <p className="text-xs text-muted-foreground">
                              {block.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBlock(block._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Block Dialog */}
      <Dialog open={isAddingBlock} onOpenChange={setIsAddingBlock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Schedule Block</DialogTitle>
            <DialogDescription>
              Add an activity to your weekly schedule
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={selectedDay}
                onValueChange={(value) => setSelectedDay(value as DayOfWeek)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.key} value={day.key}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newBlock.startTime}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newBlock.endTime}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, endTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Activity</Label>
              <Input
                placeholder="e.g., Morning Math, PE with Joey..."
                value={newBlock.activity}
                onChange={(e) =>
                  setNewBlock({ ...newBlock, activity: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Additional details..."
                value={newBlock.notes}
                onChange={(e) =>
                  setNewBlock({ ...newBlock, notes: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingBlock(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBlock}>Add Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
