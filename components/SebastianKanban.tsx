"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, MessageSquare, UserCheck } from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────

type SebastianTask = {
  _id: Id<"sebastianTasks">;
  userId: Id<"users">;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  category: string;
  assignedTo?: string;
  agentNotes?: string;
  lastUpdatedBy?: string;
  createdAt: number;
  completedAt?: number;
};

type Assignee = "all" | "corinne" | "sebastian" | "scout" | "maven" | "compass" | "james";

// ─── Assignee Config ──────────────────────────────────────────────────────

const ASSIGNEE_CONFIG: Record<string, {
  label: string;
  emoji: string;
  color: string;       // Tailwind bg for badge
  textColor: string;   // Tailwind text for badge
  border: string;      // Left border color for card
}> = {
  sebastian: {
    label: "Sebastian",
    emoji: "⚡",
    color: "bg-amber-500/20",
    textColor: "text-amber-400",
    border: "border-l-amber-500",
  },
  corinne: {
    label: "Corinne",
    emoji: "👑",
    color: "bg-purple-500/20",
    textColor: "text-purple-400",
    border: "border-l-purple-500",
  },
  scout: {
    label: "Scout",
    emoji: "🔍",
    color: "bg-blue-500/20",
    textColor: "text-blue-400",
    border: "border-l-blue-500",
  },
  maven: {
    label: "Maven",
    emoji: "✍️",
    color: "bg-green-500/20",
    textColor: "text-green-400",
    border: "border-l-green-500",
  },
  compass: {
    label: "Compass",
    emoji: "🧭",
    color: "bg-teal-500/20",
    textColor: "text-teal-400",
    border: "border-l-teal-500",
  },
  james: {
    label: "James",
    emoji: "🤝",
    color: "bg-orange-500/20",
    textColor: "text-orange-400",
    border: "border-l-orange-500",
  },
};

// ─── Assignee Badge ───────────────────────────────────────────────────────

function AssigneeBadge({ assignedTo }: { assignedTo?: string }) {
  if (!assignedTo) return null;
  const config = ASSIGNEE_CONFIG[assignedTo];
  if (!config) {
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">
        {assignedTo}
      </span>
    );
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${config.color} ${config.textColor} font-medium`}>
      {config.emoji} {config.label}
    </span>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────

interface KanbanColumnProps {
  title: string;
  status: "backlog" | "todo" | "in-progress" | "done";
  tasks: SebastianTask[];
  onMoveTask: (taskId: Id<"sebastianTasks">, newStatus: string) => void;
  onDeleteTask: (taskId: Id<"sebastianTasks">) => void;
  onAssignToSebastian: (taskId: Id<"sebastianTasks">) => void;
}

function KanbanColumn({
  title,
  status,
  tasks,
  onMoveTask,
  onDeleteTask,
  onAssignToSebastian,
}: KanbanColumnProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400";
      case "medium":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getCardBorderColor = (task: SebastianTask) => {
    // Assignee color takes priority over priority color
    if (task.assignedTo && ASSIGNEE_CONFIG[task.assignedTo]) {
      return `border-l-4 ${ASSIGNEE_CONFIG[task.assignedTo].border}`;
    }
    // Fall back to priority color
    switch (task.priority) {
      case "high":
        return "border-l-4 border-l-red-500";
      case "medium":
        return "border-l-4 border-l-amber-500";
      default:
        return "border-l-4 border-l-gray-600";
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "infrastructure": return "🔧";
      case "hta":            return "🏠";
      case "aspire":         return "⚽";
      case "agent-squad":    return "🤖";
      case "skills":         return "🎯";
      default:               return "📋";
    }
  };

  const columnHeaderColor = {
    backlog:     "text-gray-400",
    todo:        "text-blue-400",
    "in-progress": "text-amber-400",
    done:        "text-green-400",
  }[status];

  return (
    <Card className="flex-1 min-w-[280px] bg-gray-900/60 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className={`text-base font-semibold ${columnHeaderColor}`}>
          {title}
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            ({tasks.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 opacity-50">
            Empty
          </p>
        ) : (
          tasks.map((task) => (
            <Card
              key={task._id}
              className={`group hover:shadow-md transition-shadow bg-gray-800/80 border-gray-700 ${getCardBorderColor(task)}`}
            >
              <CardContent className="p-3 space-y-2">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm">{getCategoryEmoji(task.category)}</span>
                      <h4 className="font-semibold text-sm text-gray-100 leading-tight">
                        {task.title}
                      </h4>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-500 hover:text-red-400 shrink-0"
                    onClick={() => onDeleteTask(task._id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Assignee + priority badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <AssigneeBadge assignedTo={task.assignedTo} />
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.lastUpdatedBy && (
                    <span className="text-xs text-gray-600">
                      by {task.lastUpdatedBy}
                    </span>
                  )}
                </div>

                {/* Agent notes */}
                {task.agentNotes && (
                  <div className="flex items-start gap-1.5 bg-gray-700/50 rounded p-2">
                    <MessageSquare className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                      {task.agentNotes}
                    </p>
                  </div>
                )}

                {/* Action row */}
                <div className="flex items-center gap-2">
                  <Select
                    value={status}
                    onValueChange={(newStatus) => onMoveTask(task._id, newStatus)}
                  >
                    <SelectTrigger className="h-7 text-xs bg-gray-700 border-gray-600 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* "Assign to Sebastian" quick action - shown when not assigned to Sebastian */}
                  {task.assignedTo !== "sebastian" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => onAssignToSebastian(task._id)}
                      title="Assign to Sebastian"
                    >
                      <UserCheck className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────

const FILTER_OPTIONS: { value: Assignee; label: string; emoji: string }[] = [
  { value: "all",       label: "All",      emoji: "🌐" },
  { value: "corinne",   label: "Corinne",  emoji: "👑" },
  { value: "sebastian", label: "Sebastian",emoji: "⚡" },
  { value: "scout",     label: "Scout",    emoji: "🔍" },
  { value: "maven",     label: "Maven",    emoji: "✍️" },
];

function AssigneeFilter({
  active,
  onChange,
}: {
  active: Assignee;
  onChange: (v: Assignee) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
            active === opt.value
              ? "bg-amber-500 text-black font-semibold"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          }`}
        >
          {opt.emoji} {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Kanban Component ────────────────────────────────────────────────

export function SebastianKanban({ userId }: { userId: Id<"users"> }) {
  const [isAddingTask, setIsAddingTask]   = useState(false);
  const [newTaskTitle, setNewTaskTitle]   = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskCategory, setNewTaskCategory] = useState("infrastructure");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("sebastian");
  const [assigneeFilter, setAssigneeFilter] = useState<Assignee>("all");

  const tasks = useQuery(api.sebastianTasks.getSebastianTasks, { userId }) || [];
  const addTask    = useMutation(api.sebastianTasks.createSebastianTask);
  const updateTask = useMutation(api.sebastianTasks.updateSebastianTask);
  const deleteTask = useMutation(api.sebastianTasks.deleteSebastianTask);

  // Apply assignee filter
  const filteredTasks = assigneeFilter === "all"
    ? tasks
    : tasks.filter((t) => t.assignedTo === assigneeFilter);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    await addTask({
      userId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      status: "todo",
      priority: newTaskPriority,
      category: newTaskCategory,
      assignedTo: newTaskAssignedTo || undefined,
      lastUpdatedBy: "corinne",
    });

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskCategory("infrastructure");
    setNewTaskAssignedTo("sebastian");
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

  const handleAssignToSebastian = async (taskId: Id<"sebastianTasks">) => {
    await updateTask({
      id: taskId,
      assignedTo: "sebastian",
      lastUpdatedBy: "corinne",
    });
  };

  const backlogTasks    = filteredTasks.filter((t) => t.status === "backlog");
  const todoTasks       = filteredTasks.filter((t) => t.status === "todo");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in-progress");
  const doneTasks       = filteredTasks.filter((t) => t.status === "done");

  // Stats
  const totalTasks   = tasks.length;
  const sebastianTasks = tasks.filter((t) => t.assignedTo === "sebastian").length;
  const inProgress   = tasks.filter((t) => t.status === "in-progress").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Shared task board - humans &amp; AI working together
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">{totalTasks} total</span>
            <span className="text-xs text-amber-400">⚡ {sebastianTasks} Sebastian</span>
            <span className="text-xs text-blue-400">🔄 {inProgress} in progress</span>
          </div>
        </div>
        <Button onClick={() => setIsAddingTask(true)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Assignee filter */}
      <AssigneeFilter active={assigneeFilter} onChange={setAssigneeFilter} />

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumn
          title="Backlog"
          status="backlog"
          tasks={backlogTasks}
          onMoveTask={handleMoveTask}
          onDeleteTask={handleDeleteTask}
          onAssignToSebastian={handleAssignToSebastian}
        />
        <KanbanColumn
          title="To Do"
          status="todo"
          tasks={todoTasks}
          onMoveTask={handleMoveTask}
          onDeleteTask={handleDeleteTask}
          onAssignToSebastian={handleAssignToSebastian}
        />
        <KanbanColumn
          title="In Progress"
          status="in-progress"
          tasks={inProgressTasks}
          onMoveTask={handleMoveTask}
          onDeleteTask={handleDeleteTask}
          onAssignToSebastian={handleAssignToSebastian}
        />
        <KanbanColumn
          title="Done"
          status="done"
          tasks={doneTasks}
          onMoveTask={handleMoveTask}
          onDeleteTask={handleDeleteTask}
          onAssignToSebastian={handleAssignToSebastian}
        />
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Add New Task</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a task and assign it to yourself, an agent, or the team
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Review Aspire Spring registrations"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="bg-gray-800 border-gray-600 text-gray-100"
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional details..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={2}
                className="bg-gray-800 border-gray-600 text-gray-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-gray-300">Assign To</Label>
                <Select value={newTaskAssignedTo} onValueChange={setNewTaskAssignedTo}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corinne">👑 Corinne</SelectItem>
                    <SelectItem value="sebastian">⚡ Sebastian</SelectItem>
                    <SelectItem value="scout">🔍 Scout</SelectItem>
                    <SelectItem value="maven">✍️ Maven</SelectItem>
                    <SelectItem value="compass">🧭 Compass</SelectItem>
                    <SelectItem value="james">🤝 James</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-gray-300">Priority</Label>
                <Select
                  value={newTaskPriority}
                  onValueChange={(val) => setNewTaskPriority(val as "low" | "medium" | "high")}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600">
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
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-300">Category</Label>
              <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTask(false)} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
