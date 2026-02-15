"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GripVertical, Trash2 } from "lucide-react";
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

type SebastianTask = {
  _id: Id<"sebastianTasks">;
  userId: Id<"users">;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  category: string;
  createdAt: number;
  completedAt?: number;
};

interface KanbanColumnProps {
  title: string;
  status: "backlog" | "todo" | "in-progress" | "done";
  tasks: SebastianTask[];
  onMoveTask: (taskId: Id<"sebastianTasks">, newStatus: string) => void;
  onDeleteTask: (taskId: Id<"sebastianTasks">) => void;
}

function KanbanColumn({ title, status, tasks, onMoveTask, onDeleteTask }: KanbanColumnProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500";
      case "medium":
        return "border-l-4 border-l-amber-500";
      default:
        return "border-l-4 border-l-gray-300";
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "infrastructure":
        return "🔧";
      case "hta":
        return "🏠";
      case "aspire":
        return "⚽";
      case "agent-squad":
        return "🤖";
      case "skills":
        return "🎯";
      default:
        return "📋";
    }
  };

  return (
    <Card className="flex-1 min-w-[280px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          {title}
          <span className="ml-2 text-sm text-muted-foreground">({tasks.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>
        ) : (
          tasks.map((task) => (
            <Card key={task._id} className={`group hover:shadow-md transition-shadow ${getPriorityColor(task.priority)}`}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{getCategoryEmoji(task.category)}</span>
                      <h4 className="font-semibold text-sm">{task.title}</h4>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => onDeleteTask(task._id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={status}
                    onValueChange={(newStatus) => onMoveTask(task._id, newStatus)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    task.priority === "high" 
                      ? "bg-red-100 text-red-800" 
                      : task.priority === "medium"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function SebastianKanban({ userId }: { userId: Id<"users"> }) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskCategory, setNewTaskCategory] = useState("infrastructure");

  const tasks = useQuery(api.sebastianTasks.getSebastianTasks, { userId }) || [];
  const addTask = useMutation(api.sebastianTasks.createSebastianTask);
  const updateTask = useMutation(api.sebastianTasks.updateSebastianTask);
  const deleteTask = useMutation(api.sebastianTasks.deleteSebastianTask);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    await addTask({
      userId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      status: "backlog",
      priority: newTaskPriority,
      category: newTaskCategory,
    });

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskCategory("infrastructure");
    setIsAddingTask(false);
  };

  const handleMoveTask = async (taskId: Id<"sebastianTasks">, newStatus: string) => {
    await updateTask({
      id: taskId,
      status: newStatus as "backlog" | "todo" | "in-progress" | "done",
    });
  };

  const handleDeleteTask = async (taskId: Id<"sebastianTasks">) => {
    await deleteTask({ id: taskId });
  };

  const backlogTasks = tasks.filter((t) => t.status === "backlog");
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Tracking work that moves us closer to our goals
          </p>
        </div>
        <Button onClick={() => setIsAddingTask(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumn
          title="Backlog"
          status="backlog"
          tasks={backlogTasks}
          onMoveTask={handleMoveTask}
          onDeleteTask={handleDeleteTask}
        />
        <KanbanColumn
          title="To Do"
          status="todo"
          tasks={todoTasks}
          onMoveTask={handleMoveTask}
          onDeleteTask={handleDeleteTask}
        />
        <KanbanColumn
          title="In Progress"
          status="in-progress"
          tasks={inProgressTasks}
          onMoveTask={handleMoveTask}
          onDeleteTask={handleDeleteTask}
        />
        <KanbanColumn
          title="Done"
          status="done"
          tasks={doneTasks}
          onMoveTask={handleMoveTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task for Sebastian's workboard
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Set up Google Calendar integration"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional details about this task..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infrastructure">🔧 Infrastructure</SelectItem>
                    <SelectItem value="hta">🏠 HTA</SelectItem>
                    <SelectItem value="aspire">⚽ Aspire</SelectItem>
                    <SelectItem value="agent-squad">🤖 Agent Squad</SelectItem>
                    <SelectItem value="skills">🎯 Skills</SelectItem>
                    <SelectItem value="other">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTaskPriority}
                  onValueChange={(val) => setNewTaskPriority(val as "low" | "medium" | "high")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTask(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
