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
  DialogTrigger,
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
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  "not-started": "bg-gray-500",
  "planning": "bg-blue-500",
  "in-progress": "bg-yellow-500",
  "done": "bg-green-500",
  "idea": "bg-purple-500",
  "planned": "bg-blue-500",
};

const STATUS_LABELS: Record<string, string> = {
  "not-started": "Not Started",
  "planning": "Planning",
  "in-progress": "In Progress",
  "done": "Done",
  "idea": "Idea",
  "planned": "Planned",
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
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newIdeaContent, setNewIdeaContent] = useState("");
  const [newIdeaPriority, setNewIdeaPriority] = useState("nice-to-have");

  const rooms = useQuery(api.homeRemodel.getRooms, { userId }) || [];
  const stats = useQuery(api.homeRemodel.getStats, { userId });
  const milestones = useQuery(api.homeRemodel.getMilestones, { userId }) || [];
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

  const selectedRoomData = rooms.find((r) => r._id === selectedRoom);

  // Calculate days until move
  const moveDate = new Date("2027-01-15");
  const today = new Date();
  const daysUntilMove = Math.ceil((moveDate.getTime() - today.getTime()) / 86400000);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Home className="h-7 w-7 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Home Remodel</h1>
            <p className="text-sm text-muted-foreground">
              Joey's childhood home - January 2027 move
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Calendar className="h-4 w-4 mr-2" />
          {daysUntilMove} days until move
        </Badge>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.roomsComplete}/{stats.roomsTotal}</div>
              <p className="text-xs text-muted-foreground">Rooms Complete</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.tasksByStatus.done}/{stats.tasksTotal}</div>
              <p className="text-xs text-muted-foreground">Tasks Done</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.tasksByStatus.inProgress}</div>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.ideasTotal}</div>
              <p className="text-xs text-muted-foreground">Ideas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.milestonesComplete}/{stats.milestonesTotal}</div>
              <p className="text-xs text-muted-foreground">Milestones</p>
            </CardContent>
          </Card>
        </div>
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
              const isPast = new Date(m.targetDate) < today;
              return (
                <button
                  key={m._id}
                  onClick={() => toggleMilestone({ milestoneId: m._id, completed: !m.completed })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    m.completed
                      ? "bg-green-100 border-green-300 text-green-800"
                      : isPast
                      ? "bg-red-50 border-red-200 text-red-700"
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

      {/* Main Content: Rooms + Detail */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Room List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Rooms ({rooms.length})
          </h3>
          {rooms.map((room) => {
            const roomTasks = tasks.filter(t => t.roomId === room._id);
            return (
              <button
                key={room._id}
                onClick={() => setSelectedRoom(room._id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedRoom === room._id
                    ? "bg-orange-50 border-orange-300"
                    : "hover:bg-zinc-50 border-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{room.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[room.status]}`} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {room.vision && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {room.vision}
                  </p>
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
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedRoomData.name}</CardTitle>
                    <Select
                      value={selectedRoomData.status}
                      onValueChange={(v) => updateRoom({ roomId: selectedRoomData._id, status: v })}
                    >
                      <SelectTrigger className="w-[140px]">
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
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Vision</label>
                    <Textarea
                      placeholder="What do you want this room to become?"
                      value={selectedRoomData.vision || ""}
                      onChange={(e) => updateRoom({ roomId: selectedRoomData._id, vision: e.target.value })}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Current State</label>
                    <Textarea
                      placeholder="What's it like now?"
                      value={selectedRoomData.currentState || ""}
                      onChange={(e) => updateRoom({ roomId: selectedRoomData._id, currentState: e.target.value })}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tasks */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Tasks</CardTitle>
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
                        className="flex items-center gap-3 p-2 rounded border bg-zinc-50"
                      >
                        <Select
                          value={task.status}
                          onValueChange={(v) => updateTask({ taskId: task._id, status: v })}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="idea">Idea</SelectItem>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className={`flex-1 text-sm ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </span>
                        {task.assignee && (
                          <Badge variant="outline" className="text-xs">
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
                    ))
                  )}

                  {showAddTask && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="New task..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTaskTitle.trim()) {
                            createTask({ userId, roomId: selectedRoom!, title: newTaskTitle.trim() });
                            setNewTaskTitle("");
                            setShowAddTask(false);
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newTaskTitle.trim()) {
                            createTask({ userId, roomId: selectedRoom!, title: newTaskTitle.trim() });
                            setNewTaskTitle("");
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
                  {roomIdeas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No ideas yet - brainstorm away!</p>
                  ) : (
                    roomIdeas.filter(i => !i.promoted).map((idea) => (
                      <div
                        key={idea._id}
                        className="flex items-start gap-3 p-2 rounded border bg-yellow-50/50"
                      >
                        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm">{idea.content}</p>
                          {idea.sourceUrl && (
                            <a href={idea.sourceUrl} target="_blank" className="text-xs text-blue-500 hover:underline">
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
                        <Button
                          size="sm"
                          onClick={() => {
                            if (newIdeaContent.trim()) {
                              createIdea({
                                userId,
                                roomId: selectedRoom!,
                                content: newIdeaContent.trim(),
                                priority: newIdeaPriority,
                              });
                              setNewIdeaContent("");
                              setShowAddIdea(false);
                            }
                          }}
                        >
                          Add Idea
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
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Select a room to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
