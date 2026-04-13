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

type StarterTask = {
  title: string;
  roomHint?: string;
};

const BLANK_CANVAS_STARTERS: StarterTask[] = [
  { title: "Set deadline for relatives to pick up claimed furniture" },
  { title: "Plan dumpster day for inherited junk and overgrowth" },
  { title: "Schedule family demo day to save on labor" },
  { title: "Donate unwanted books to the library drop box" },
];

const PRIORITY_PROJECT_STARTERS: StarterTask[] = [
  { title: "Measure bathroom vanity spaces", roomHint: "Bathroom" },
  { title: "Get 3 quotes for window replacement" },
  { title: "Get 3 quotes for roof replacement" },
  { title: "Choose kitchen refresh plan: paint cabinets vs replace", roomHint: "Kitchen" },
  { title: "Clear shed for future home gym" },
];

const DECISION_STARTERS: StarterTask[] = [
  { title: "Decide which bathroom gets renovated first", roomHint: "Bathroom" },
  { title: "Decide whether to sell a car to fund the bathroom remodel" },
  { title: "Set ship-or-donate fallback for unclaimed furniture" },
  { title: "Decide paint-vs-replace plan for kitchen cabinets", roomHint: "Kitchen" },
];

const SOURCING_STARTERS: StarterTask[] = [
  { title: "Price bathroom vanities from Wayfair and Costco", roomHint: "Bathroom" },
  { title: "Create quote tracker for windows and roof" },
  { title: "Check Marketplace for furniture and hutches" },
  { title: "Save kitchen inspiration links and paint options", roomHint: "Kitchen" },
];

const MOVE_IN_OBJECTIVE_BLUEPRINT = [
  {
    title: "Clear inherited stuff",
    description: "Confirm the blank-canvas plan, then set pickup, donate, and junk deadlines.",
    milestoneStart: 0,
    milestoneEnd: 2,
    cardClass: "border-sky-500/25 bg-sky-500/[0.05]",
    titleClass: "text-sky-100",
    textClass: "text-sky-200/80",
    buttonClass: "border-sky-500/15 hover:bg-sky-500/10",
  },
  {
    title: "Lock renovation priorities",
    description: "Decide bathroom order, room priorities, and the kitchen refresh approach.",
    milestoneStart: 2,
    milestoneEnd: 4,
    cardClass: "border-amber-500/25 bg-amber-500/[0.05]",
    titleClass: "text-amber-100",
    textClass: "text-amber-200/80",
    buttonClass: "border-amber-500/15 hover:bg-amber-500/10",
  },
  {
    title: "Source, quote, fund",
    description: "Measure, compare options, get quotes, and make the funding calls for must-do work.",
    milestoneStart: 4,
    milestoneEnd: 6,
    cardClass: "border-emerald-500/25 bg-emerald-500/[0.05]",
    titleClass: "text-emerald-100",
    textClass: "text-emerald-200/80",
    buttonClass: "border-emerald-500/15 hover:bg-emerald-500/10",
  },
  {
    title: "Final prep + move",
    description: "Land the house in a move-ready state and make the January move cleanly.",
    milestoneStart: 6,
    milestoneEnd: 7,
    cardClass: "border-violet-500/25 bg-violet-500/[0.05]",
    titleClass: "text-violet-100",
    textClass: "text-violet-200/80",
    buttonClass: "border-violet-500/15 hover:bg-violet-500/10",
  },
] as const;

function includesAnyKeyword(value: string | undefined, keywords: string[]) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

function StarterTaskList({
  items,
  accentClass,
  onPick,
}: {
  items: StarterTask[];
  accentClass: string;
  onPick: (title: string, roomHint?: string) => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-3">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Suggested starters</div>
      <div className="grid gap-2">
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onPick(item.title, item.roomHint)}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-sm text-zinc-100 transition-colors hover:bg-white/5 ${accentClass}`}
          >
            <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </div>
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

  const moveInObjectives = MOVE_IN_OBJECTIVE_BLUEPRINT.map((stage) => {
    const objectiveMilestones = milestones.slice(stage.milestoneStart, stage.milestoneEnd);
    const completedCount = objectiveMilestones.filter((milestone) => milestone.completed).length;
    const targetDate = objectiveMilestones[objectiveMilestones.length - 1]?.targetDate;
    return {
      ...stage,
      milestones: objectiveMilestones,
      completedCount,
      totalCount: objectiveMilestones.length,
      targetDate,
      isComplete: objectiveMilestones.length > 0 && completedCount === objectiveMilestones.length,
    };
  }).filter((stage) => stage.milestones.length > 0);

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

  const isGettingStarted = allTasks.length === 0 && openIdeas.length === 0 && totalEstimated === 0 && totalSpent === 0;

  const openQuickAddFor = (title: string, roomHint?: string) => {
    setNewTaskTitle(title);
    if (roomHint) {
      const matchedRoom = rooms.find((room) => room.name.toLowerCase().includes(roomHint.toLowerCase()));
      setNewTaskRoom(matchedRoom?._id || "");
    } else {
      setNewTaskRoom("");
    }
    setShowQuickAdd(true);
  };

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Hammer className="h-6 w-6 text-orange-500" />
          <div>
            <h1 className="text-xl font-bold">Home Remodel</h1>
            <p className="text-xs text-muted-foreground">
              Joey's childhood home - January 2027 move
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Quick Add Button */}
          <Button variant="outline" size="sm" onClick={() => setShowQuickAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add Task
          </Button>
          {/* Countdown */}
          <Badge className="px-3 py-1.5 bg-red-500 text-sm text-white border-red-600">
            <Calendar className="h-3.5 w-3.5 mr-2" />
            {daysUntilMove} days until move
          </Badge>
        </div>
      </div>

      {/* Compact Overview */}
      <Card className="border-zinc-800 bg-zinc-950/90 shadow-none">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">Rooms</div>
            <div className="mt-0.5 text-base font-semibold text-white">{stats?.roomsComplete || 0}/{stats?.roomsTotal || 0}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">Tasks</div>
            <div className="mt-0.5 text-base font-semibold text-white">{stats?.tasksByStatus.done || 0}/{stats?.tasksTotal || 0}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">Active</div>
            <div className="mt-0.5 text-base font-semibold text-white">{stats?.tasksByStatus.inProgress || 0}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">Ideas</div>
            <div className="mt-0.5 text-base font-semibold text-white">{stats?.ideasTotal || 0}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">Budget</div>
            <div className="mt-0.5 text-base font-semibold text-emerald-200">${totalEstimated.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">Spent</div>
            <div className="mt-0.5 text-base font-semibold text-rose-200">${totalSpent.toLocaleString()}</div>
          </div>
          <div className="h-8 w-px bg-zinc-800 hidden md:block" />
          <div className="min-w-[200px] flex-1">
            <div className="text-[11px] uppercase tracking-wide text-orange-300/80">Next objective</div>
            <div className="mt-0.5 text-sm font-semibold text-orange-100">
              {nextMilestone ? nextMilestone.title : "Move-in day"}
            </div>
            <div className="text-xs text-zinc-400">
              {nextMilestone ? `${formatShortDate(nextMilestone.targetDate)}${daysToNextMilestone !== null ? ` • ${daysToNextMilestone} days` : ""}` : `Target ${formatShortDate("2027-01-15")}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Move-In Objectives */}
      <Card className="border-zinc-800 bg-zinc-950/90 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-zinc-100">
            <Target className="h-4 w-4 text-orange-400" />
            Move-In Objectives
          </CardTitle>
          <p className="text-xs text-zinc-400">
            Four phases to move from clean-out to move-in.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {moveInObjectives.map((objective) => (
            <div key={objective.title} className={`rounded-xl border p-3 ${objective.cardClass}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-sm font-semibold ${objective.titleClass}`}>{objective.title}</div>
                  {objective.targetDate ? (
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
                      Target by {formatShortDate(objective.targetDate)}
                    </div>
                  ) : null}
                </div>
                <Badge className={objective.isComplete ? "bg-green-600 text-white" : "bg-black/30 text-zinc-200 border border-white/10"}>
                  {objective.completedCount}/{objective.totalCount}
                </Badge>
              </div>
              <div className="mt-2 space-y-1.5">
                {objective.milestones.map((milestone) => {
                  const isPast = new Date(milestone.targetDate) < today && !milestone.completed;
                  return (
                    <button
                      key={milestone._id}
                      onClick={() => toggleMilestone({ milestoneId: milestone._id, completed: !milestone.completed })}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-all ${
                        milestone.completed
                          ? "border-green-700/40 bg-green-950/40 text-green-100"
                          : isPast
                          ? "border-red-700/40 bg-red-950/40 text-red-100"
                          : `bg-black/20 text-zinc-200 ${objective.buttonClass}`
                      }`}
                    >
                      {milestone.completed ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />}
                      <span className="flex-1 truncate">{milestone.title}</span>
                      <span className="text-xs opacity-70">{formatShortDate(milestone.targetDate)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
        <TabsContent value="plan" className="mt-4 space-y-4">
          <div className={`grid gap-4 ${isGettingStarted ? "md:grid-cols-2" : ""}`}>
            {isGettingStarted ? (
              <Card className="border-amber-500/25 bg-amber-500/[0.08] shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-amber-100">Start here this week</CardTitle>
                  <p className="text-sm text-amber-200/80">
                    You&apos;ve got the structure. Now let&apos;s turn it into a working remodel plan with the first real moves.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => openQuickAddFor("Set deadline for relatives to pick up claimed furniture")} className="rounded-xl border border-orange-500/20 bg-black/20 p-3 text-left transition hover:bg-white/5">
                    <div className="text-sm font-semibold text-orange-100">Furniture deadlines</div>
                    <p className="mt-1.5 text-sm text-zinc-300">Start with inherited-item decisions so the house can become a blank canvas.</p>
                  </button>
                  <button type="button" onClick={() => openQuickAddFor("Plan dumpster day for inherited junk and overgrowth")} className="rounded-xl border border-sky-500/20 bg-black/20 p-3 text-left transition hover:bg-white/5">
                    <div className="text-sm font-semibold text-sky-100">Dumpster + demo day</div>
                    <p className="mt-1.5 text-sm text-zinc-300">Create the first cleanup push before spending energy on finish details.</p>
                  </button>
                  <button type="button" onClick={() => openQuickAddFor("Measure bathroom vanity spaces", "Bathroom")} className="rounded-xl border border-emerald-500/20 bg-black/20 p-3 text-left transition hover:bg-white/5">
                    <div className="text-sm font-semibold text-emerald-100">Grab measurements</div>
                    <p className="mt-1.5 text-sm text-zinc-300">Measure bathrooms first so sourcing vanities gets concrete fast.</p>
                  </button>
                  <button type="button" onClick={() => setActiveTab("rooms")} className="rounded-xl border border-fuchsia-500/20 bg-black/20 p-3 text-left transition hover:bg-white/5">
                    <div className="text-sm font-semibold text-fuchsia-100">Review rooms</div>
                    <p className="mt-1.5 text-sm text-zinc-300">Open Rooms and fill in vision and current state room by room.</p>
                  </button>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-sky-500/25 bg-sky-500/[0.05] shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-sky-100">
                  <Home className="h-4 w-4 text-sky-400" />
                  Remodel game plan
                </CardTitle>
                <p className="text-sm text-sky-200/80">
                  Blank canvas first, then priority renovations, then sourcing and polish.
                </p>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-orange-500/20 bg-black/20 p-3">
                  <div className="text-sm font-semibold text-orange-100">1. Blank canvas first</div>
                  <p className="mt-1.5 text-sm text-zinc-300">Clear inherited items, junk, books, and blockers.</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-black/20 p-3">
                  <div className="text-sm font-semibold text-amber-100">2. Priority projects</div>
                  <p className="mt-1.5 text-sm text-zinc-300">Bathrooms, kitchen, windows, roof, yard, shed-to-gym.</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-black/20 p-3">
                  <div className="text-sm font-semibold text-emerald-100">3. Source smart</div>
                  <p className="mt-1.5 text-sm text-zinc-300">Measure first, then compare vendors and quotes.</p>
                </div>
                <div className="rounded-xl border border-fuchsia-500/20 bg-black/20 p-3">
                  <div className="text-sm font-semibold text-fuchsia-100">4. Family logistics</div>
                  <p className="mt-1.5 text-sm text-zinc-300">Use deadlines to force pickup, ship, sell, or donate decisions.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                  <StarterTaskList
                    items={BLANK_CANVAS_STARTERS}
                    accentClass="border-sky-500/15"
                    onPick={openQuickAddFor}
                  />
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
                  <StarterTaskList
                    items={PRIORITY_PROJECT_STARTERS}
                    accentClass="border-amber-500/15"
                    onPick={openQuickAddFor}
                  />
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
                  <StarterTaskList
                    items={DECISION_STARTERS}
                    accentClass="border-violet-500/15"
                    onPick={openQuickAddFor}
                  />
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
                    }) : (
                      <StarterTaskList
                        items={SOURCING_STARTERS}
                        accentClass="border-emerald-500/15"
                        onPick={openQuickAddFor}
                      />
                    )}
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
                    }) : <p className="text-sm text-zinc-300">Capture links from Wayfair, Costco, Marketplace, and contractor quotes here as you go.</p>}
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
