"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Home,
  Plus,
  CheckCircle2,
  Clock,
  Lightbulb,
  Target,
  DollarSign,
  ChevronRight,
  Trash2,
  Sparkles,
  Calendar,
  User,
  ArrowRight,
  Filter,
  FileText,
  Image,
  AlertCircle,
  Hammer,
} from "lucide-react";

// Status colors for room cards (background) - explicit colors for dark mode
const ROOM_STATUS_BG: Record<string, string> = {
  "not-started": "bg-zinc-200 border-zinc-400 text-zinc-900",
  "planning": "bg-blue-100 border-blue-400 text-blue-900",
  "in-progress": "bg-amber-100 border-amber-400 text-amber-900",
  "done": "bg-green-100 border-green-400 text-green-900",
};

const ROOM_STATUS_BADGE: Record<string, string> = {
  "not-started": "bg-zinc-600 text-white",
  "planning": "bg-blue-600 text-white",
  "in-progress": "bg-amber-500 text-white",
  "done": "bg-green-600 text-white",
};

const STATUS_LABELS: Record<string, string> = {
  "not-started": "Not Started",
  "planning": "Planning",
  "in-progress": "In Progress",
  "done": "Done",
  "idea": "Idea",
  "planned": "Planned",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  "idea": "bg-purple-100 text-purple-700 border-purple-200",
  "planned": "bg-blue-100 text-blue-700 border-blue-200",
  "in-progress": "bg-amber-100 text-amber-700 border-amber-200",
  "done": "bg-green-100 text-green-700 border-green-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  "must-have": "bg-red-100 text-red-800 border-red-200",
  "nice-to-have": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "dream": "bg-purple-100 text-purple-800 border-purple-200",
  "high": "bg-red-100 text-red-800 border-red-200",
  "medium": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "low": "bg-gray-100 text-gray-800 border-gray-200",
};

export function HomeRemodelView({ userId }: { userId: Id<"users"> }) {
  const [selectedRoom, setSelectedRoom] = useState<Id<"homeRemodelRooms"> | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskRoom, setNewTaskRoom] = useState<string>("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");
  const [newIdeaContent, setNewIdeaContent] = useState("");
  const [newIdeaPriority, setNewIdeaPriority] = useState("nice-to-have");
  const [newIdeaSourceUrl, setNewIdeaSourceUrl] = useState("");
  const [uploadingIdea, setUploadingIdea] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("rooms");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [beforeMoveOnly, setBeforeMoveOnly] = useState(false);

  const rooms = useQuery(api.homeRemodel.getRooms, { userId }) || [];
  const stats = useQuery(api.homeRemodel.getStats, { userId });
  const milestones = useQuery(api.homeRemodel.getMilestones, { userId }) || [];
  const allTasks = useQuery(api.homeRemodel.getAllTasks, { userId }) || [];
  const allIdeas = useQuery(api.homeRemodel.getIdeas, { userId }) || [];

  const tasks = useQuery(
    api.homeRemodel.getTasks,
    selectedRoom ? { roomId: selectedRoom } : "skip"
  ) || [];

  const roomIdeas = useQuery(
    api.homeRemodel.getIdeas,
    selectedRoom ? { userId, roomId: selectedRoom } : "skip"
  ) || [];

  const seedRooms = useMutation(api.homeRemodel.seedRooms);
  const createTask = useMutation(api.homeRemodel.createTask);
  const updateTask = useMutation(api.homeRemodel.updateTask);
  const deleteTask = useMutation(api.homeRemodel.deleteTask);
  const createIdea = useMutation(api.homeRemodel.createIdea);
  const promoteIdea = useMutation(api.homeRemodel.promoteIdeaToTask);
  const deleteIdea = useMutation(api.homeRemodel.deleteIdea);
  const updateRoom = useMutation(api.homeRemodel.updateRoom);
  const toggleMilestone = useMutation(api.homeRemodel.toggleMilestone);
  const generateUploadUrl = useMutation(api.homeRemodel.generateUploadUrl);
  const updateIdeaImage = useMutation(api.homeRemodel.updateIdeaImage);

  // Upload image for idea
  const handleIdeaImageUpload = async (ideaId: string, file: File) => {
    setUploadingIdea(ideaId);
    try {
      const uploadUrl = await generateUploadUrl({});
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateIdeaImage({ ideaId: ideaId as Id<"homeRemodelIdeas">, storageId });
    } finally {
      setUploadingIdea(null);
    }
  };

  const selectedRoomData = rooms.find((r) => r._id === selectedRoom);

  // Calculate days until move
  const moveDate = new Date("2027-01-15");
  const today = new Date();
  const daysUntilMove = Math.ceil((moveDate.getTime() - today.getTime()) / 86400000);

  // Next milestone
  const nextMilestone = milestones.find(m => !m.completed && new Date(m.targetDate) > today);
  const daysToNextMilestone = nextMilestone 
    ? Math.ceil((new Date(nextMilestone.targetDate).getTime() - today.getTime()) / 86400000)
    : null;

  // Filter tasks
  const filteredTasks = allTasks.filter(t => {
    if (assigneeFilter !== "all" && t.assignee !== assigneeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (beforeMoveOnly && t.dueDate && new Date(t.dueDate) > moveDate) return false;
    return true;
  });

  // This week's tasks
  const nextWeek = new Date(today.getTime() + 7 * 86400000);
  const thisWeekTasks = allTasks.filter(t => 
    t.status === "in-progress" || 
    (t.dueDate && new Date(t.dueDate) <= nextWeek && t.status !== "done")
  );

  // Budget calculations
  const totalEstimated = rooms.reduce((s, r) => s + (r.budgetEstimate || 0), 0) +
    allTasks.reduce((s, t) => s + (t.estimatedCost || 0), 0);
  const totalSpent = rooms.reduce((s, r) => s + (r.budgetActual || 0), 0) +
    allTasks.reduce((s, t) => s + (t.actualCost || 0), 0);

  // Room progress (tasks done / total tasks)
  const getRoomProgress = (roomId: Id<"homeRemodelRooms">) => {
    const roomTasks = allTasks.filter(t => t.roomId === roomId);
    if (roomTasks.length === 0) return 0;
    const done = roomTasks.filter(t => t.status === "done").length;
    return Math.round((done / roomTasks.length) * 100);
  };

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Home className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Home Remodel Tracker</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Track your remodel progress room by room. Set up your rooms to get started!
        </p>
        <Button onClick={() => seedRooms({ userId })} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Set Up Rooms
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Hammer className="h-7 w-7 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Home Remodel</h1>
            <p className="text-sm text-muted-foreground">
              Joey's childhood home - January 2027 move
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {/* Quick Add Button */}
          <Button variant="outline" onClick={() => setShowQuickAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add Task
          </Button>
          {/* Countdown */}
          <Badge className="text-lg px-4 py-2 bg-red-500 text-white border-red-600">
            <Calendar className="h-4 w-4 mr-2" />
            {daysUntilMove} days until move
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-blue-700">{stats?.roomsComplete || 0}/{stats?.roomsTotal || 0}</div>
            <p className="text-xs text-blue-600">Rooms Done</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-green-700">{stats?.tasksByStatus.done || 0}/{stats?.tasksTotal || 0}</div>
            <p className="text-xs text-green-600">Tasks Done</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-amber-700">{stats?.tasksByStatus.inProgress || 0}</div>
            <p className="text-xs text-amber-600">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-purple-700">{stats?.ideasTotal || 0}</div>
            <p className="text-xs text-purple-600">Ideas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-emerald-700">
              ${totalEstimated.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600">Est. Budget</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-rose-700">
              ${totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-rose-600">Spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Milestone Alert */}
      {nextMilestone && daysToNextMilestone !== null && daysToNextMilestone <= 30 && (
        <Card className="bg-amber-50 border-amber-300">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-800">
              Next milestone in {daysToNextMilestone} days: {nextMilestone.title}
            </span>
            <span className="text-sm text-amber-600 ml-auto">
              {new Date(nextMilestone.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </CardContent>
        </Card>
      )}

      {/* This Week */}
      {thisWeekTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              This Week ({thisWeekTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {thisWeekTasks.slice(0, 8).map((t) => {
                const room = rooms.find(r => r._id === t.roomId);
                return (
                  <Badge 
                    key={t._id} 
                    variant="outline" 
                    className={TASK_STATUS_COLORS[t.status]}
                  >
                    {room?.name}: {t.title}
                  </Badge>
                );
              })}
              {thisWeekTasks.length > 8 && (
                <Badge variant="outline">+{thisWeekTasks.length - 8} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Timeline to Move-In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {milestones.map((m) => {
              const isPast = new Date(m.targetDate) < today && !m.completed;
              return (
                <button
                  key={m._id}
                  onClick={() => toggleMilestone({ milestoneId: m._id, completed: !m.completed })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    m.completed
                      ? "bg-green-100 border-green-300 text-green-800"
                      : isPast
                      ? "bg-red-100 border-red-300 text-red-700"
                      : "bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {m.completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  <span>{m.title}</span>
                  <span className="text-xs opacity-70">
                    {new Date(m.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Rooms / All Tasks / Ideas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="tasks">All Tasks ({allTasks.length})</TabsTrigger>
          <TabsTrigger value="ideas">Ideas ({allIdeas.filter(i => !i.promoted).length})</TabsTrigger>
        </TabsList>

        {/* ROOMS TAB */}
        <TabsContent value="rooms" className="mt-4">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Room List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Rooms ({rooms.length})
              </h3>
              {rooms.map((room) => {
                const progress = getRoomProgress(room._id);
                const roomTaskCount = allTasks.filter(t => t.roomId === room._id).length;
                return (
                  <button
                    key={room._id}
                    onClick={() => setSelectedRoom(room._id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedRoom === room._id
                        ? "ring-2 ring-orange-400 " + ROOM_STATUS_BG[room.status]
                        : ROOM_STATUS_BG[room.status]
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{room.name}</span>
                      <Badge className={`text-xs ${ROOM_STATUS_BADGE[room.status]}`}>
                        {STATUS_LABELS[room.status]}
                      </Badge>
                    </div>
                    {roomTaskCount > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{progress}% complete</span>
                          <span>{roomTaskCount} tasks</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}
                    {room.budgetEstimate && (
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${room.budgetEstimate.toLocaleString()} budget
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Room Detail */}
            <div className="md:col-span-2 space-y-4">
              {selectedRoomData ? (
                <>
                  {/* Room Header */}
                  <Card className={ROOM_STATUS_BG[selectedRoomData.status]}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle>{selectedRoomData.name}</CardTitle>
                        <Select
                          value={selectedRoomData.status}
                          onValueChange={(v) => updateRoom({ roomId: selectedRoomData._id, status: v })}
                        >
                          <SelectTrigger className={`w-[140px] ${ROOM_STATUS_BADGE[selectedRoomData.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not-started">Not Started</SelectItem>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Vision</label>
                          <Textarea
                            placeholder="What do you want this room to become?"
                            value={selectedRoomData.vision || ""}
                            onChange={(e) => updateRoom({ roomId: selectedRoomData._id, vision: e.target.value })}
                            className="mt-1 bg-white/50"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Current State</label>
                          <Textarea
                            placeholder="What's it like now?"
                            value={selectedRoomData.currentState || ""}
                            onChange={(e) => updateRoom({ roomId: selectedRoomData._id, currentState: e.target.value })}
                            className="mt-1 bg-white/50"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Budget Estimate ($)</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={selectedRoomData.budgetEstimate || ""}
                            onChange={(e) => updateRoom({ roomId: selectedRoomData._id, budgetEstimate: Number(e.target.value) || 0 })}
                            className="mt-1 bg-white/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Actual Spent ($)</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={selectedRoomData.budgetActual || ""}
                            onChange={(e) => updateRoom({ roomId: selectedRoomData._id, budgetActual: Number(e.target.value) || 0 })}
                            className="mt-1 bg-white/50"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tasks */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Tasks ({tasks.length})</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => setShowAddTask(true)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tasks yet</p>
                      ) : (
                        tasks.map((task) => (
                          <div
                            key={task._id}
                            className={`flex items-center gap-3 p-2 rounded border ${TASK_STATUS_COLORS[task.status]}`}
                          >
                            <Select
                              value={task.status}
                              onValueChange={(v) => updateTask({ taskId: task._id, status: v })}
                            >
                              <SelectTrigger className="w-[110px] h-7 text-xs bg-white/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="idea">Idea</SelectItem>
                                <SelectItem value="planned">Planned</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className={`flex-1 text-sm ${task.status === "done" ? "line-through opacity-60" : ""}`}>
                              {task.title}
                            </span>
                            {task.assignee && (
                              <Badge variant="outline" className="text-xs bg-white/50">
                                <User className="h-3 w-3 mr-1" />
                                {task.assignee}
                              </Badge>
                            )}
                            {task.estimatedCost && (
                              <span className="text-xs text-muted-foreground">
                                ${task.estimatedCost}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => deleteTask({ taskId: task._id })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}

                      {showAddTask && (
                        <div className="flex gap-2 mt-2 p-2 bg-zinc-50 rounded">
                          <Input
                            placeholder="New task..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newTaskTitle.trim()) {
                                createTask({ 
                                  userId, 
                                  roomId: selectedRoom!, 
                                  title: newTaskTitle.trim(),
                                  assignee: newTaskAssignee || undefined,
                                });
                                setNewTaskTitle("");
                                setNewTaskAssignee("");
                                setShowAddTask(false);
                              }
                            }}
                            autoFocus
                            className="flex-1"
                          />
                          <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Who?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="corinne">Corinne</SelectItem>
                              <SelectItem value="joey">Joey</SelectItem>
                              <SelectItem value="contractor">Contractor</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (newTaskTitle.trim()) {
                                createTask({ 
                                  userId, 
                                  roomId: selectedRoom!, 
                                  title: newTaskTitle.trim(),
                                  assignee: newTaskAssignee || undefined,
                                });
                                setNewTaskTitle("");
                                setNewTaskAssignee("");
                                setShowAddTask(false);
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Ideas */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          Ideas & Inspiration
                        </CardTitle>
                        <Button size="sm" variant="outline" onClick={() => setShowAddIdea(true)}>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Add Idea
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {roomIdeas.filter(i => !i.promoted).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No ideas yet - brainstorm away!</p>
                      ) : (
                        roomIdeas.filter(i => !i.promoted).map((idea) => (
                          <div
                            key={idea._id}
                            className="flex flex-col gap-2 p-3 rounded border bg-yellow-100 border-yellow-300 text-yellow-900"
                          >
                            <div className="flex items-start gap-3">
                              <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm">{idea.content}</p>
                                {idea.sourceUrl && (
                                  <a href={idea.sourceUrl} target="_blank" className="text-xs text-blue-600 hover:underline">
                                    View inspiration
                                  </a>
                                )}
                              </div>
                              <Badge className={`text-xs ${PRIORITY_COLORS[idea.priority || "nice-to-have"]}`}>
                                {idea.priority || "nice-to-have"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => promoteIdea({ ideaId: idea._id, roomId: selectedRoom! })}
                              >
                                <ArrowRight className="h-3 w-3 mr-1" />
                                To Task
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => deleteIdea({ ideaId: idea._id })}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            {/* Image display and upload */}
                            <div className="flex items-center gap-2 ml-7">
                              {idea.imageUrl ? (
                                <a href={idea.imageUrl} target="_blank" className="block">
                                  <img 
                                    src={idea.imageUrl} 
                                    alt="Inspiration" 
                                    className="h-20 w-auto rounded border border-yellow-300 hover:opacity-80 transition"
                                  />
                                </a>
                              ) : (
                                <label className="flex items-center gap-1 text-xs text-yellow-700 cursor-pointer hover:text-yellow-900">
                                  <Image className="h-3 w-3" />
                                  {uploadingIdea === idea._id ? "Uploading..." : "Add photo"}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleIdeaImageUpload(idea._id, file);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        ))
                      )}

                      {showAddIdea && (
                        <div className="flex flex-col gap-2 mt-2 p-3 border rounded bg-white">
                          <Textarea
                            placeholder="Describe your idea..."
                            value={newIdeaContent}
                            onChange={(e) => setNewIdeaContent(e.target.value)}
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Select value={newIdeaPriority} onValueChange={setNewIdeaPriority}>
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="must-have">Must Have</SelectItem>
                                <SelectItem value="nice-to-have">Nice to Have</SelectItem>
                                <SelectItem value="dream">Dream</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              placeholder="Link (Pinterest, etc.)" 
                              className="flex-1"
                              value={newIdeaSourceUrl}
                              onChange={(e) => setNewIdeaSourceUrl(e.target.value)}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                if (newIdeaContent.trim()) {
                                  createIdea({
                                    userId,
                                    roomId: selectedRoom!,
                                    content: newIdeaContent.trim(),
                                    priority: newIdeaPriority,
                                    sourceUrl: newIdeaSourceUrl || undefined,
                                  });
                                  setNewIdeaContent("");
                                  setNewIdeaSourceUrl("");
                                  setShowAddIdea(false);
                                }
                              }}
                            >
                              Add
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowAddIdea(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Home className="h-12 w-12 mb-4 opacity-30" />
                  <p>Select a room to view details</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ALL TASKS TAB */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-base">All Tasks</CardTitle>
                <div className="flex gap-2 ml-auto">
                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="w-[120px] h-8">
                      <User className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="corinne">Corinne</SelectItem>
                      <SelectItem value="joey">Joey</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px] h-8">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="idea">Ideas</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant={beforeMoveOnly ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setBeforeMoveOnly(!beforeMoveOnly)}
                  >
                    Before Move Only
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tasks match your filters</p>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map((task) => {
                    const room = rooms.find(r => r._id === task.roomId);
                    return (
                      <div
                        key={task._id}
                        className={`flex items-center gap-3 p-2 rounded border ${TASK_STATUS_COLORS[task.status]}`}
                      >
                        <Badge variant="outline" className="bg-white/50 min-w-[100px]">
                          {room?.name}
                        </Badge>
                        <Select
                          value={task.status}
                          onValueChange={(v) => updateTask({ taskId: task._id, status: v })}
                        >
                          <SelectTrigger className="w-[110px] h-7 text-xs bg-white/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="idea">Idea</SelectItem>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className={`flex-1 text-sm ${task.status === "done" ? "line-through opacity-60" : ""}`}>
                          {task.title}
                        </span>
                        {task.assignee && (
                          <Badge variant="outline" className="text-xs bg-white/50">
                            <User className="h-3 w-3 mr-1" />
                            {task.assignee}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => deleteTask({ taskId: task._id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IDEAS TAB */}
        <TabsContent value="ideas" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                All Ideas & Inspiration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allIdeas.filter(i => !i.promoted).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No ideas yet - select a room and start brainstorming!</p>
              ) : (
                <div className="space-y-2">
                  {allIdeas.filter(i => !i.promoted).map((idea) => {
                    const room = rooms.find(r => r._id === idea.roomId);
                    return (
                      <div
                        key={idea._id}
                        className="flex items-start gap-3 p-2 rounded border bg-yellow-50/50 border-yellow-200"
                      >
                        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                        {room && (
                          <Badge variant="outline" className="bg-white/50">
                            {room.name}
                          </Badge>
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{idea.content}</p>
                        </div>
                        <Badge className={`text-xs ${PRIORITY_COLORS[idea.priority || "nice-to-have"]}`}>
                          {idea.priority}
                        </Badge>
                        {idea.roomId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => promoteIdea({ ideaId: idea._id, roomId: idea.roomId! })}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            To Task
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => deleteIdea({ ideaId: idea._id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Add Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Room</label>
              <Select value={newTaskRoom} onValueChange={setNewTaskRoom}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select room..." />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Task</label>
              <Input
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Assignee</label>
              <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Who's responsible?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corinne">Corinne</SelectItem>
                  <SelectItem value="joey">Joey</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full"
              disabled={!newTaskRoom || !newTaskTitle.trim()}
              onClick={() => {
                if (newTaskRoom && newTaskTitle.trim()) {
                  createTask({
                    userId,
                    roomId: newTaskRoom as Id<"homeRemodelRooms">,
                    title: newTaskTitle.trim(),
                    assignee: newTaskAssignee || undefined,
                  });
                  setNewTaskTitle("");
                  setNewTaskRoom("");
                  setNewTaskAssignee("");
                  setShowQuickAdd(false);
                }
              }}
            >
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
