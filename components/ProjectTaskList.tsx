"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, User, Calendar, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ProjectTaskListProps {
  userId: Id<"users">;
  project: "hta" | "aspire" | "homeschool";
  subProject: string;
  title: string;
  description: string;
  showAssignments?: boolean;
  showStatus?: boolean;
  showDueDate?: boolean;
}

export function ProjectTaskList({
  userId,
  project,
  subProject,
  title,
  description,
  showAssignments = true,
  showStatus = true,
  showDueDate = true,
}: ProjectTaskListProps) {
  const [newTask, setNewTask] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("unassigned");
  const [expandedTaskId, setExpandedTaskId] = useState<Id<"projectTasks"> | null>(null);

  // Queries
  const tasks = useQuery(api.projectTasks.getTasksByProject, {
    userId,
    project,
    subProject,
  });
  const teamMembers = useQuery(api.teamMembers.getTeamMembers, { userId });

  // Mutations
  const createTask = useMutation(api.projectTasks.createTask);
  const updateTask = useMutation(api.projectTasks.updateTask);
  const deleteTask = useMutation(api.projectTasks.deleteTask);

  const handleAddTask = async () => {
    if (newTask.trim()) {
      const order = tasks ? tasks.length : 0;
      await createTask({
        userId,
        project,
        subProject,
        title: newTask,
        assignedToId: newTaskAssignee !== "unassigned"
          ? (newTaskAssignee as Id<"teamMembers">)
          : undefined,
        status: "todo",
        priority: "medium",
        order,
      });
      setNewTask("");
      setNewTaskAssignee("unassigned");
    }
  };

  const handleToggleTask = async (taskId: Id<"projectTasks">, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    await updateTask({
      id: taskId,
      status: newStatus,
    });
  };

  const handleDeleteTask = async (taskId: Id<"projectTasks">) => {
    await deleteTask({ id: taskId });
  };

  const handleChangeAssignee = async (
    taskId: Id<"projectTasks">,
    assignedToId: string
  ) => {
    await updateTask({
      id: taskId,
      assignedToId: assignedToId !== "unassigned" ? (assignedToId as Id<"teamMembers">) : undefined,
    });
  };

  const handleChangeStatus = async (
    taskId: Id<"projectTasks">,
    status: "todo" | "in_progress" | "done"
  ) => {
    await updateTask({
      id: taskId,
      status,
    });
  };

  const handleChangeDueDate = async (
    taskId: Id<"projectTasks">,
    dueDate: string
  ) => {
    await updateTask({
      id: taskId,
      dueDate: dueDate || undefined,
    });
  };

  const handleUpdateDescription = async (
    taskId: Id<"projectTasks">,
    description: string
  ) => {
    await updateTask({
      id: taskId,
      description: description || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "done":
        return "Completed";
      case "in_progress":
        return "In Progress";
      default:
        return "Not Started";
    }
  };

  if (tasks === undefined || teamMembers === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Task Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            {showAssignments && (
              <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleAddTask} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="space-y-2">
          {activeTasks.length === 0 && completedTasks.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              No tasks yet. Add your first task above!
            </p>
          )}

          {activeTasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
            >
              <Checkbox
                checked={false}
                onCheckedChange={() => handleToggleTask(task._id, task.status)}
              />
              <div className="flex-1 space-y-1">
                <span className="block">{task.title}</span>
                {showAssignments && task.assignedTo && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{task.assignedTo.name}</span>
                  </div>
                )}
              </div>
              {showAssignments && (
                <Select
                  value={task.assignedToId || "unassigned"}
                  onValueChange={(value) => handleChangeAssignee(task._id, value)}
                >
                  <SelectTrigger className="w-[100px] h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <SelectValue placeholder="Assign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTask(task._id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Completed</h4>
            {completedTasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 group"
              >
                <Checkbox
                  checked={true}
                  onCheckedChange={() => handleToggleTask(task._id, task.status)}
                />
                <div className="flex-1 space-y-1">
                  <span className="block line-through text-muted-foreground">
                    {task.title}
                  </span>
                  {task.assignedTo && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{task.assignedTo.name}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(task._id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Task Summary */}
        {tasks.length > 0 && (
          <div className="pt-2 border-t text-sm text-muted-foreground">
            {completedTasks.length} of {tasks.length} completed
          </div>
        )}
      </CardContent>
    </Card>
  );
}
