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
  ChevronDown,
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
  ShoppingCart,
  ExternalLink,
} from "lucide-react";

// Status colors for room cards (background) - explicit colors for dark mode
const ROOM_STATUS_BG: Record<string, string> = {
  "not-started": "bg-zinc-950 border-zinc-800 text-zinc-100",
  "planning": "bg-blue-950/50 border-blue-700/40 text-blue-100",
  "in-progress": "bg-amber-950/40 border-amber-700/40 text-amber-100",
  "done": "bg-green-950/40 border-green-700/40 text-green-100",
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
  "idea": "bg-purple-950/40 text-purple-100 border-purple-700/40",
  "planned": "bg-blue-950/40 text-blue-100 border-blue-700/40",
  "in-progress": "bg-amber-950/40 text-amber-100 border-amber-700/40",
  "done": "bg-green-950/40 text-green-100 border-green-700/40",
};

const PRIORITY_COLORS: Record<string, string> = {
  "must-have": "bg-red-950/40 text-red-100 border-red-700/40",
  "nice-to-have": "bg-yellow-950/40 text-yellow-100 border-yellow-700/40",
  "dream": "bg-purple-950/40 text-purple-100 border-purple-700/40",
  "high": "bg-red-950/40 text-red-100 border-red-700/40",
  "medium": "bg-yellow-950/40 text-yellow-100 border-yellow-700/40",
  "low": "bg-zinc-900 text-zinc-200 border-zinc-700",
};

const BLANK_CANVAS_KEYWORDS = [
  "declutter",
  "clutter",
  "junk",
  "dumpster",
  "dump",
  "demo",
  "donate",
  "marketplace",
  "sell",
  "pickup",
  "claimed",
  "furniture",
  "books",
  "clear",
  "cleanup",
  "shed",
];

const PRIORITY_PROJECT_KEYWORDS = [
  "bathroom",
  "bath",
  "kitchen",
  "window",
  "roof",
  "yard",
  "shed",
  "gym",
  "paint",
  "cabinet",
  "vanity",
];

const DECISION_KEYWORDS = [
  "decide",
  "decision",
  "measure",
  "quote",
  "budget",
  "deadline",
  "finance",
  "car",
  "window",
  "roof",
  "vanity",
  "cabinet",
  "bathroom",
  "kitchen",
];

const SOURCE_KEYWORDS = [
  "wayfair",
  "costco",
  "marketplace",
  "quote",
  "vendor",
  "window",
  "roof",
  "vanity",
  "cabinet",
  "paint",
  "fixture",
  "material",
];

function includesAnyKeyword(value: string | undefined, keywords: string[]) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

// Budget Breakdown Component
function BudgetBreakdown({ 
  userId, 
  roomId, 
  roomBudgetEstimate,
  roomBudgetActual,
  onUpdateRoom 
}: { 
  userId: Id<"users">;
  roomId: Id<"homeRemodelRooms">;
  roomBudgetEstimate?: number;
  roomBudgetActual?: number;
  onUpdateRoom: (est: number, act: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCost, setNewItemCost] = useState("");
  const [newItemLink, setNewItemLink] = useState("");

  const budgetItems = useQuery(api.homeRemodel.getBudgetItems, { roomId }) || [];
  const createBudgetItem = useMutation(api.homeRemodel.createBudgetItem);
  const updateBudgetItem = useMutation(api.homeRemodel.updateBudgetItem);
  const deleteBudgetItem = useMutation(api.homeRemodel.deleteBudgetItem);

  const totalEstimated = budgetItems.reduce((s, i) => s + (i.estimatedCost || 0), 0);
  const totalActual = budgetItems.reduce((s, i) => s + (i.actualCost || 0), 0);

  return (
    <Card className="border-emerald-500/25 bg-emerald-500/[0.06] shadow-none">
      <CardHeader className="pb-2">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-base flex items-center gap-2 text-emerald-100">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Budget
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-emerald-200">
              ${totalEstimated.toLocaleString()} est / ${totalActual.toLocaleString()} spent
            </span>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-emerald-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-emerald-400" />
            )}
          </div>
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2">
          {/* Budget Items */}
          {budgetItems.length === 0 ? (
            <p className="text-sm text-emerald-200">No items yet - add furniture, fixtures, materials...</p>
          ) : (
            budgetItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-2 rounded border border-emerald-700/30 bg-zinc-950/80 p-2"
              >
                <input
                  type="checkbox"
                  checked={item.purchased}
                  onChange={(e) => updateBudgetItem({ itemId: item._id, purchased: e.target.checked })}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className={`flex-1 text-sm text-zinc-100 ${item.purchased ? 'line-through opacity-60' : ''}`}>
                  {item.name}
                </span>
                {item.link && (
                  <a href={item.link} target="_blank" className="text-emerald-400 hover:text-emerald-300">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Input
                  type="number"
                  placeholder="Est $"
                  value={item.estimatedCost || ""}
                  onChange={(e) => updateBudgetItem({ itemId: item._id, estimatedCost: Number(e.target.value) || 0 })}
                  className="h-7 w-20 border-emerald-700/30 bg-zinc-900 text-xs text-zinc-100"
                />
                <Input
                  type="number"
                  placeholder="Actual $"
                  value={item.actualCost || ""}
                  onChange={(e) => updateBudgetItem({ itemId: item._id, actualCost: Number(e.target.value) || 0 })}
                  className="h-7 w-20 border-emerald-700/30 bg-zinc-900 text-xs text-zinc-100"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => deleteBudgetItem({ itemId: item._id })}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}

          {/* Add Item Form */}
          {showAddItem ? (
            <div className="flex gap-2 rounded border border-emerald-700/30 bg-zinc-950/80 p-2">
              <Input
                placeholder="Item name (e.g., King bed)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 border-emerald-700/30 bg-zinc-900 text-sm text-zinc-100"
                autoFocus
              />
              <Input
                type="number"
                placeholder="Est $"
                value={newItemCost}
                onChange={(e) => setNewItemCost(e.target.value)}
                className="w-20 border-emerald-700/30 bg-zinc-900 text-sm text-zinc-100"
              />
              <Input
                placeholder="Link (optional)"
                value={newItemLink}
                onChange={(e) => setNewItemLink(e.target.value)}
                className="w-32 border-emerald-700/30 bg-zinc-900 text-sm text-zinc-100"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (newItemName.trim()) {
                    createBudgetItem({
                      userId,
                      roomId,
                      name: newItemName.trim(),
                      estimatedCost: Number(newItemCost) || undefined,
                      link: newItemLink || undefined,
                    });
                    setNewItemName("");
                    setNewItemCost("");
                    setNewItemLink("");
                    setShowAddItem(false);
                  }
                }}
              >
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddItem(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddItem(true)}
              className="w-full border-emerald-700/40 text-emerald-300 hover:bg-emerald-500/10"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Item
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

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
  const [activeTab, setActiveTab] = useState("plan");
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

  const openTasks = allTasks.filter((t) => t.status !== "done");
  const openIdeas = allIdeas.filter((i) => !i.promoted);
  const blankCanvasTasks = openTasks.filter((t) => includesAnyKeyword(t.title, BLANK_CANVAS_KEYWORDS));
  const priorityProjectTasks = openTasks.filter((t) => includesAnyKeyword(t.title, PRIORITY_PROJECT_KEYWORDS));
  const decisionTasks = openTasks.filter((t) => includesAnyKeyword(t.title, DECISION_KEYWORDS));
  const sourcingIdeas = openIdeas.filter((idea) =>
    includesAnyKeyword(`${idea.content} ${idea.sourceUrl || ""}`, SOURCE_KEYWORDS)
  );
  const decisionIdeas = openIdeas.filter((idea) =>
    includesAnyKeyword(`${idea.content} ${idea.sourceUrl || ""}`, DECISION_KEYWORDS)
  );
  const quoteTasks = openTasks.filter((t) => includesAnyKeyword(t.title, ["quote", "window", "roof", "vanity", "cabinet"]));
  const quoteIdeas = openIdeas.filter((idea) =>
    includesAnyKeyword(`${idea.content} ${idea.sourceUrl || ""}`, ["quote", "wayfair", "costco", "window", "roof", "vanity", "cabinet"])
  );

  const topBudgetRooms = [...rooms]
    .sort((a, b) => (b.budgetEstimate || 0) - (a.budgetEstimate || 0))
    .slice(0, 6);

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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Card className="border-blue-500/25 bg-blue-500/[0.06] shadow-none">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-blue-100">{stats?.roomsComplete || 0}/{stats?.roomsTotal || 0}</div>
            <p className="text-xs text-blue-300">Rooms Done</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/25 bg-green-500/[0.06] shadow-none">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-green-100">{stats?.tasksByStatus.done || 0}/{stats?.tasksTotal || 0}</div>
            <p className="text-xs text-green-300">Tasks Done</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/25 bg-amber-500/[0.06] shadow-none">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-amber-100">{stats?.tasksByStatus.inProgress || 0}</div>
            <p className="text-xs text-amber-300">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/25 bg-purple-500/[0.06] shadow-none">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-purple-100">{stats?.ideasTotal || 0}</div>
            <p className="text-xs text-purple-300">Ideas</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/25 bg-emerald-500/[0.06] shadow-none">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-emerald-100">
              ${totalEstimated.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-300">Est. Budget</p>
          </CardContent>
        </Card>
        <Card className="border-rose-500/25 bg-rose-500/[0.06] shadow-none">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-rose-100">
              ${totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-rose-300">Spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Milestone Alert */}
      {nextMilestone && daysToNextMilestone !== null && daysToNextMilestone <= 30 && (
        <Card className="border-amber-500/25 bg-amber-500/[0.06] shadow-none">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <span className="font-medium text-amber-100">
              Next milestone in {daysToNextMilestone} days: {nextMilestone.title}
            </span>
            <span className="ml-auto text-sm text-amber-300">
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
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    m.completed
                      ? "bg-green-950/40 border-green-700/40 text-green-100"
                      : isPast
                      ? "bg-red-950/40 border-red-700/40 text-red-100"
                      : "bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-900"
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

      {/* Tabs: Plan / Rooms / Tasks / Budget / Ideas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto flex-wrap gap-1 border border-zinc-800 bg-zinc-950/80 p-1">
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="tasks">All Tasks ({allTasks.length})</TabsTrigger>
          <TabsTrigger value="budget">Budget + Quotes</TabsTrigger>
          <TabsTrigger value="ideas">Ideas ({allIdeas.filter(i => !i.promoted).length})</TabsTrigger>
        </TabsList>

        {/* PLAN TAB */}
        <TabsContent value="plan" className="mt-4 space-y-6">
          <Card className="border-orange-500/25 bg-orange-500/[0.06] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-orange-100">
                <Home className="h-4 w-4 text-orange-400" />
                Remodel game plan
              </CardTitle>
              <p className="text-sm text-orange-200/80">
                The goal is a blank canvas first, then the highest-leverage renovations, then sourcing and polish.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-orange-500/20 bg-black/20 p-4">
                <div className="text-sm font-semibold text-orange-100">1. Blank canvas first</div>
                <p className="mt-2 text-sm text-zinc-300">Clear inherited items, junk, books, and anything blocking clean decision-making.</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-black/20 p-4">
                <div className="text-sm font-semibold text-amber-100">2. Priority projects</div>
                <p className="mt-2 text-sm text-zinc-300">Bathrooms, kitchen refresh, windows, roof, yard, and the shed-to-gym conversion.</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-black/20 p-4">
                <div className="text-sm font-semibold text-emerald-100">3. Source smart</div>
                <p className="mt-2 text-sm text-zinc-300">Measure first, then compare Wayfair, Costco, Marketplace, and contractor quotes.</p>
              </div>
              <div className="rounded-xl border border-fuchsia-500/20 bg-black/20 p-4">
                <div className="text-sm font-semibold text-fuchsia-100">4. Family logistics</div>
                <p className="mt-2 text-sm text-zinc-300">Use deadlines for claimed furniture and make pickup, shipping, sell, or donate decisions fast.</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-sky-500/25 bg-sky-500/[0.06] shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-sky-100">Blank Canvas Before Move-In</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {blankCanvasTasks.length > 0 ? blankCanvasTasks.slice(0, 8).map((task) => {
                  const room = rooms.find((r) => r._id === task.roomId);
                  return (
                    <div key={task._id} className="flex items-center gap-3 rounded-lg border border-sky-500/15 bg-black/20 p-3">
                      <Badge variant="outline" className="border-white/10 bg-black/20 text-zinc-200 min-w-[96px]">
                        {room?.name || "General"}
                      </Badge>
                      <span className="flex-1 text-sm text-zinc-100">{task.title}</span>
                      <Badge className={TASK_STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                    </div>
                  );
                }) : (
                  <div className="rounded-lg border border-dashed border-sky-500/20 bg-black/20 p-4 text-sm text-zinc-300">
                    Add declutter, donate, junk haul, furniture deadline, or demo-day tasks here first.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-500/25 bg-amber-500/[0.06] shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-100">Priority Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {priorityProjectTasks.length > 0 ? priorityProjectTasks.slice(0, 8).map((task) => {
                  const room = rooms.find((r) => r._id === task.roomId);
                  return (
                    <div key={task._id} className="flex items-center gap-3 rounded-lg border border-amber-500/15 bg-black/20 p-3">
                      <Badge variant="outline" className="border-white/10 bg-black/20 text-zinc-200 min-w-[96px]">
                        {room?.name || "General"}
                      </Badge>
                      <span className="flex-1 text-sm text-zinc-100">{task.title}</span>
                      <Badge className={TASK_STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                    </div>
                  );
                }) : (
                  <div className="rounded-lg border border-dashed border-amber-500/20 bg-black/20 p-4 text-sm text-zinc-300">
                    Add bathroom, kitchen, roof, window, yard, or shed priorities so they stay front and center.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-violet-500/25 bg-violet-500/[0.06] shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-violet-100">Decisions Needed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...decisionTasks.slice(0, 5), ...decisionIdeas.slice(0, 3)].length > 0 ? (
                  <div className="space-y-2">
                    {decisionTasks.slice(0, 5).map((task) => {
                      const room = rooms.find((r) => r._id === task.roomId);
                      return (
                        <div key={task._id} className="rounded-lg border border-violet-500/15 bg-black/20 p-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-white/10 bg-black/20 text-zinc-200">{room?.name || "General"}</Badge>
                            <Badge className={TASK_STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                          </div>
                          <div className="mt-2 text-sm text-zinc-100">{task.title}</div>
                        </div>
                      );
                    })}
                    {decisionIdeas.slice(0, 3).map((idea) => {
                      const room = rooms.find((r) => r._id === idea.roomId);
                      return (
                        <div key={idea._id} className="rounded-lg border border-violet-500/15 bg-black/20 p-3">
                          <div className="flex items-center gap-2">
                            {room ? <Badge variant="outline" className="border-white/10 bg-black/20 text-zinc-200">{room.name}</Badge> : null}
                            <Badge className={PRIORITY_COLORS[idea.priority || "nice-to-have"]}>{idea.priority || "nice-to-have"}</Badge>
                          </div>
                          <div className="mt-2 text-sm text-zinc-100">{idea.content}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-violet-500/20 bg-black/20 p-4 text-sm text-zinc-300">
                    Use this for quotes to compare, measurements to grab, budget calls, and any yes-no decisions blocking progress.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/25 bg-emerald-500/[0.06] shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-emerald-100">This Week + Sourcing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-300">This week</div>
                  <div className="space-y-2">
                    {thisWeekTasks.length > 0 ? thisWeekTasks.slice(0, 6).map((task) => {
                      const room = rooms.find((r) => r._id === task.roomId);
                      return (
                        <div key={task._id} className="flex items-center gap-3 rounded-lg border border-emerald-500/15 bg-black/20 p-3">
                          <Badge variant="outline" className="border-white/10 bg-black/20 text-zinc-200 min-w-[96px]">{room?.name || "General"}</Badge>
                          <span className="flex-1 text-sm text-zinc-100">{task.title}</span>
                        </div>
                      );
                    }) : <p className="text-sm text-zinc-300">No this-week tasks yet.</p>}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-300">Sourcing and quote leads</div>
                  <div className="space-y-2">
                    {sourcingIdeas.length > 0 ? sourcingIdeas.slice(0, 4).map((idea) => {
                      const room = rooms.find((r) => r._id === idea.roomId);
                      return (
                        <div key={idea._id} className="rounded-lg border border-emerald-500/15 bg-black/20 p-3">
                          <div className="flex items-center gap-2">
                            {room ? <Badge variant="outline" className="border-white/10 bg-black/20 text-zinc-200">{room.name}</Badge> : null}
                            <Badge className={PRIORITY_COLORS[idea.priority || "nice-to-have"]}>{idea.priority || "nice-to-have"}</Badge>
                          </div>
                          <div className="mt-2 text-sm text-zinc-100">{idea.content}</div>
                          {idea.sourceUrl ? (
                            <a href={idea.sourceUrl} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200">
                              <ExternalLink className="h-3 w-3" />
                              Open source
                            </a>
                          ) : null}
                        </div>
                      );
                    }) : <p className="text-sm text-zinc-300">Add links for vanity options, paint ideas, Marketplace finds, and vendor research.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                  <Card className="border-zinc-800 bg-zinc-950/90 shadow-none">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{selectedRoomData.name}</CardTitle>
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
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-zinc-300">Vision</label>
                          <Textarea
                            placeholder="What do you want this room to become?"
                            value={selectedRoomData.vision || ""}
                            onChange={(e) => updateRoom({ roomId: selectedRoomData._id, vision: e.target.value })}
                            className="mt-1 border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-300">Current State</label>
                          <Textarea
                            placeholder="What's it like now?"
                            value={selectedRoomData.currentState || ""}
                            onChange={(e) => updateRoom({ roomId: selectedRoomData._id, currentState: e.target.value })}
                            className="mt-1 border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Budget Breakdown */}
                  <BudgetBreakdown 
                    userId={userId}
                    roomId={selectedRoom!}
                    roomBudgetEstimate={selectedRoomData.budgetEstimate}
                    roomBudgetActual={selectedRoomData.budgetActual}
                    onUpdateRoom={(est, act) => updateRoom({ 
                      roomId: selectedRoomData._id, 
                      budgetEstimate: est,
                      budgetActual: act 
                    })}
                  />

                  {/* Tasks */}
                  <Card className="border-zinc-800 bg-zinc-950/90 shadow-none">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-white">Tasks ({tasks.length})</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => setShowAddTask(true)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {tasks.length === 0 ? (
                        <p className="text-sm text-zinc-400">No tasks yet</p>
                      ) : (
                        tasks.map((task) => (
                          <div
                            key={task._id}
                            className={`flex items-center gap-3 rounded border p-2 ${TASK_STATUS_COLORS[task.status]}`}
                          >
                            <Select
                              value={task.status}
                              onValueChange={(v) => updateTask({ taskId: task._id, status: v })}
                            >
                              <SelectTrigger className="h-7 w-[110px] border-white/10 bg-black/20 text-xs">
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
                              <Badge variant="outline" className="border-white/10 bg-black/20 text-xs text-zinc-200">
                                <User className="h-3 w-3 mr-1" />
                                {task.assignee}
                              </Badge>
                            )}
                            {task.estimatedCost && (
                              <span className="text-xs text-zinc-300">
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
                        <div className="mt-2 flex gap-2 rounded border border-zinc-800 bg-zinc-900 p-2">
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
                  <Card className="border-amber-500/25 bg-amber-500/[0.06] shadow-none">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2 text-amber-100">
                          <Lightbulb className="h-4 w-4 text-amber-400" />
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
                        <p className="text-sm text-amber-200">No ideas yet - brainstorm away!</p>
                      ) : (
                        roomIdeas.filter(i => !i.promoted).map((idea) => (
                          <div
                            key={idea._id}
                            className="flex flex-col gap-2 rounded border border-amber-700/30 bg-zinc-950/80 p-3 text-amber-50"
                          >
                            <div className="flex items-start gap-3">
                              <Lightbulb className="mt-0.5 h-4 w-4 text-amber-400" />
                              <div className="flex-1">
                                <p className="text-sm">{idea.content}</p>
                                {idea.sourceUrl && (
                                  <a href={idea.sourceUrl} target="_blank" className="text-xs text-blue-300 hover:underline">
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
                            <div className="ml-7 flex items-center gap-2">
                              {idea.imageUrl ? (
                                <a href={idea.imageUrl} target="_blank" className="block">
                                  <img 
                                    src={idea.imageUrl} 
                                    alt="Inspiration" 
                                    className="h-20 w-auto rounded border border-amber-700/30 transition hover:opacity-80"
                                  />
                                </a>
                              ) : (
                                <label className="flex cursor-pointer items-center gap-1 text-xs text-amber-300 hover:text-amber-100">
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
                        <div className="mt-2 flex flex-col gap-2 rounded border border-zinc-800 bg-zinc-900 p-3">
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
                        className={`flex items-center gap-3 rounded border p-2 ${TASK_STATUS_COLORS[task.status]}`}
                      >
                        <Badge variant="outline" className="min-w-[100px] border-white/10 bg-black/20 text-zinc-200">
                          {room?.name}
                        </Badge>
                        <Select
                          value={task.status}
                          onValueChange={(v) => updateTask({ taskId: task._id, status: v })}
                        >
                          <SelectTrigger className="h-7 w-[110px] border-white/10 bg-black/20 text-xs">
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
                          <Badge variant="outline" className="border-white/10 bg-black/20 text-xs text-zinc-200">
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

        {/* BUDGET TAB */}
        <TabsContent value="budget" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <Card className="border-emerald-500/25 bg-emerald-500/[0.06] shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-emerald-100">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  Budget by room
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topBudgetRooms.length > 0 ? topBudgetRooms.map((room) => (
                  <div key={room._id} className="rounded-lg border border-emerald-500/15 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-zinc-100">{room.name}</div>
                        <div className="text-xs text-zinc-400">{STATUS_LABELS[room.status]}</div>
                      </div>
                      <div className="text-right text-sm text-zinc-200">
                        <div>${(room.budgetEstimate || 0).toLocaleString()} est</div>
                        <div className="text-xs text-zinc-400">${(room.budgetActual || 0).toLocaleString()} spent</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-zinc-300">No room budgets added yet.</p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-cyan-500/25 bg-cyan-500/[0.06] shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-cyan-100">
                    <FileText className="h-4 w-4 text-cyan-400" />
                    Quotes to collect
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quoteTasks.length > 0 ? quoteTasks.slice(0, 8).map((task) => {
                    const room = rooms.find((r) => r._id === task.roomId);
                    return (
                      <div key={task._id} className="rounded-lg border border-cyan-500/15 bg-black/20 p-3 text-sm text-zinc-100">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-white/10 bg-black/20 text-zinc-200">{room?.name || "General"}</Badge>
                          <Badge className={TASK_STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                        </div>
                        <div className="mt-2">{task.title}</div>
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-zinc-300">Add quote tasks for windows, roof, bathrooms, and kitchen materials.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-fuchsia-500/25 bg-fuchsia-500/[0.06] shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-fuchsia-100">
                    <ShoppingCart className="h-4 w-4 text-fuchsia-400" />
                    Source links and product ideas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quoteIdeas.length > 0 ? quoteIdeas.slice(0, 8).map((idea) => {
                    const room = rooms.find((r) => r._id === idea.roomId);
                    return (
                      <div key={idea._id} className="rounded-lg border border-fuchsia-500/15 bg-black/20 p-3">
                        <div className="flex items-center gap-2">
                          {room ? <Badge variant="outline" className="border-white/10 bg-black/20 text-zinc-200">{room.name}</Badge> : null}
                          <Badge className={PRIORITY_COLORS[idea.priority || "nice-to-have"]}>{idea.priority || "nice-to-have"}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-zinc-100">{idea.content}</div>
                        {idea.sourceUrl ? (
                          <a href={idea.sourceUrl} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs text-fuchsia-300 hover:text-fuchsia-200">
                            <ExternalLink className="h-3 w-3" />
                            Open link
                          </a>
                        ) : null}
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-zinc-300">Add Wayfair, Costco, Marketplace, and contractor links here as ideas.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
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
                        className="flex items-start gap-3 rounded border border-amber-700/30 bg-zinc-950/80 p-2"
                      >
                        <Lightbulb className="mt-0.5 h-4 w-4 text-amber-400" />
                        {room && (
                          <Badge variant="outline" className="border-white/10 bg-black/20 text-zinc-200">
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
