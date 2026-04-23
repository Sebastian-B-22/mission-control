"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkSurfaceEmptyState } from "@/components/work-surface";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  Clock,
  Wrench,
  Trash2,
  Moon,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

type AgentIdea = {
  _id: Id<"agentIdeas">;
  title: string;
  summary: string;
  sourceAgent: string;
  businessArea?: string;
  ideaType?: string;
  confidence?: "low" | "medium" | "high";
  effort?: "low" | "medium" | "high";
  recommendedAction?: string;
  status: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

const CREATOR_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  sebastian: { emoji: "⚡", label: "Sebastian", color: "text-amber-400" },
  maven: { emoji: "📣", label: "Maven", color: "text-green-400" },
  scout: { emoji: "🔍", label: "Scout", color: "text-blue-400" },
  compass: { emoji: "🧭", label: "Compass", color: "text-cyan-400" },
  james: { emoji: "🎮", label: "James", color: "text-purple-400" },
  corinne: { emoji: "👑", label: "Corinne", color: "text-pink-400" },
};

function isOvernightIdea(createdAt: number): boolean {
  const date = new Date(createdAt);
  const pstDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const hour = pstDate.getHours();
  return hour >= 22 || hour < 8;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "just now";
}

function LevelBadge({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Badge variant="outline" className="border-zinc-700 bg-zinc-900/70 text-[10px] text-zinc-300">
      {label}: {value}
    </Badge>
  );
}

function IdeaCard({
  item,
  onMove,
  onDelete,
  onConvert,
}: {
  item: AgentIdea;
  onMove: (stage: string) => void;
  onDelete: () => void;
  onConvert: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isOvernight = isOvernightIdea(item.createdAt);
  const creator = CREATOR_CONFIG[item.sourceAgent] ?? { emoji: "🤖", label: item.sourceAgent, color: "text-gray-400" };

  return (
    <Card className="border-zinc-800 bg-zinc-950/80 shadow-none transition-colors hover:border-zinc-700">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-medium text-zinc-100">{item.title}</h4>
              {isOvernight && (
                <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 px-1.5 text-[10px] text-indigo-300">
                  <Moon className="mr-1 h-3 w-3" />
                  Overnight
                </Badge>
              )}
              {item.businessArea && (
                <Badge variant="outline" className="border-zinc-700 bg-zinc-900/70 text-[10px] text-zinc-300">
                  {item.businessArea}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className={creator.color}>{creator.emoji} {creator.label}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500">{formatRelativeTime(item.createdAt)}</span>
              {item.ideaType && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400">{item.ideaType}</span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <p className={`text-xs leading-relaxed text-zinc-400 ${expanded ? "" : "line-clamp-3"}`}>
          {item.summary}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <LevelBadge label="Confidence" value={item.confidence} />
          <LevelBadge label="Effort" value={item.effort} />
          {item.recommendedAction && (
            <Badge variant="outline" className="border-cyan-700/60 bg-cyan-500/10 text-[10px] text-cyan-300">
              Next: {item.recommendedAction}
            </Badge>
          )}
        </div>

        {item.notes && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
            <p className="text-xs italic text-zinc-300">📎 {item.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800 pt-2">
          <Button size="sm" className="h-7 bg-red-600/80 text-xs text-white hover:bg-red-600" onClick={() => onMove("priority")}>
            <Star className="mr-1 h-3 w-3" />
            Priority
          </Button>
          <Button size="sm" variant="outline" className="h-7 border-blue-600/40 text-xs text-blue-400 hover:bg-blue-600/10" onClick={() => onMove("later")}>
            <Clock className="mr-1 h-3 w-3" />
            Later
          </Button>
          <Button size="sm" variant="outline" className="h-7 border-orange-600/40 text-xs text-orange-400 hover:bg-orange-600/10" onClick={() => onMove("needs-work")}>
            <Wrench className="mr-1 h-3 w-3" />
            Tweak
          </Button>
          <Button size="sm" variant="outline" className="h-7 border-green-600/40 text-xs text-green-400 hover:bg-green-600/10" onClick={onConvert}>
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Convert
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto h-7 w-7 p-0 text-zinc-500 hover:bg-red-900/20 hover:text-red-400" onClick={onDelete} title="Delete">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentIdeasWidget({ userId }: { userId: Id<"users"> }) {
  const [activeTab, setActiveTab] = useState("new");
  const [selectedIdea, setSelectedIdea] = useState<AgentIdea | null>(null);
  const [convertForm, setConvertForm] = useState({
    title: "",
    description: "",
    category: "agent-squad",
    priority: "medium",
    assignedTo: "sebastian",
    status: "todo",
    agentNotes: "",
  });

  const newIdeas = useQuery(api.agentIdeas.list, { status: "new", limit: 100 }) as AgentIdea[] | undefined;
  const priorityIdeas = useQuery(api.agentIdeas.list, { status: "priority", limit: 100 }) as AgentIdea[] | undefined;
  const laterIdeas = useQuery(api.agentIdeas.list, { status: "later", limit: 100 }) as AgentIdea[] | undefined;
  const needsWorkIdeas = useQuery(api.agentIdeas.list, { status: "needs-work", limit: 100 }) as AgentIdea[] | undefined;
  const convertedIdeas = useQuery(api.agentIdeas.list, { status: "converted", limit: 100 }) as AgentIdea[] | undefined;

  const updateStatus = useMutation(api.agentIdeas.updateStatus);
  const deleteIdea = useMutation(api.agentIdeas.deleteIdea);
  const convertToTask = useMutation(api.agentIdeas.convertToTask);

  const handleMove = async (id: Id<"agentIdeas">, status: string) => {
    await updateStatus({ id, status: status as any });
  };

  const handleDelete = async (id: Id<"agentIdeas">) => {
    if (confirm("Delete this idea?")) {
      await deleteIdea({ id });
    }
  };

  const sortByDate = (items: AgentIdea[] | undefined) =>
    items?.slice().sort((a, b) => b.createdAt - a.createdAt) || [];

  const newCount = newIdeas?.length || 0;
  const priorityCount = priorityIdeas?.length || 0;
  const laterCount = laterIdeas?.length || 0;
  const needsWorkCount = needsWorkIdeas?.length || 0;
  const convertedCount = convertedIdeas?.length || 0;
  const overnightCount = newIdeas?.filter((i) => isOvernightIdea(i.createdAt)).length || 0;

  const openConvertDialog = (idea: AgentIdea) => {
    setSelectedIdea(idea);
    setConvertForm({
      title: idea.title,
      description: idea.summary,
      category: idea.businessArea || "agent-squad",
      priority: idea.effort || "medium",
      assignedTo: "sebastian",
      status: "todo",
      agentNotes: idea.recommendedAction || idea.notes || "",
    });
  };

  const handleConvert = async () => {
    if (!selectedIdea) return;
    await convertToTask({
      ideaId: selectedIdea._id,
      userId,
      title: convertForm.title,
      description: convertForm.description,
      category: convertForm.category,
      priority: convertForm.priority as any,
      assignedTo: convertForm.assignedTo,
      status: convertForm.status as any,
      agentNotes: convertForm.agentNotes || undefined,
      lastUpdatedBy: "sebastian",
    });
    setSelectedIdea(null);
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 shadow-none">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              Agent Ideas
              {newCount > 0 && (
                <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
                  {newCount} new
                </Badge>
              )}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Structured idea inbox from your agents, separate from the content review queue.
            </p>
          </div>
          {overnightCount > 0 && (
            <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300">
              <Moon className="mr-1 h-3 w-3" />
              {overnightCount} overnight
            </Badge>
          )}
        </div>

        <div className="grid gap-2 lg:grid-cols-4">
          {[
            { label: "New", value: newCount, icon: <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />, tone: "border-yellow-500/20 bg-yellow-500/5" },
            { label: "Priority", value: priorityCount, icon: <Star className="h-3.5 w-3.5 text-red-400" />, tone: "border-red-500/20 bg-red-500/5" },
            { label: "Needs work", value: needsWorkCount, icon: <Wrench className="h-3.5 w-3.5 text-orange-400" />, tone: "border-orange-500/20 bg-orange-500/5" },
            { label: "Converted", value: convertedCount, icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />, tone: "border-green-500/20 bg-green-500/5" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border px-3 py-2 ${stat.tone}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">{stat.label}</div>
                {stat.icon}
              </div>
              <div className="mt-1 text-lg font-semibold text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid w-full grid-cols-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1">
            <TabsTrigger value="new" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">New {newCount > 0 && `(${newCount})`}</TabsTrigger>
            <TabsTrigger value="priority" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Priority {priorityCount > 0 && `(${priorityCount})`}</TabsTrigger>
            <TabsTrigger value="later" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Later {laterCount > 0 && `(${laterCount})`}</TabsTrigger>
            <TabsTrigger value="needs-work" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Tweak {needsWorkCount > 0 && `(${needsWorkCount})`}</TabsTrigger>
            <TabsTrigger value="converted" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Converted {convertedCount > 0 && `(${convertedCount})`}</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-3 mt-0">
            {sortByDate(newIdeas).length === 0 ? <EmptyState icon="idea" label="No new ideas" sublabel="Agents will drop structured ideas here" /> : sortByDate(newIdeas).map((idea) => <IdeaCard key={idea._id} item={idea} onMove={(status) => handleMove(idea._id, status)} onDelete={() => handleDelete(idea._id)} onConvert={() => openConvertDialog(idea)} />)}
          </TabsContent>

          <TabsContent value="priority" className="space-y-3 mt-0">
            {sortByDate(priorityIdeas).length === 0 ? <EmptyState icon="priority" label="No priority ideas" /> : sortByDate(priorityIdeas).map((idea) => <IdeaCard key={idea._id} item={idea} onMove={(status) => handleMove(idea._id, status)} onDelete={() => handleDelete(idea._id)} onConvert={() => openConvertDialog(idea)} />)}
          </TabsContent>

          <TabsContent value="later" className="space-y-3 mt-0">
            {sortByDate(laterIdeas).length === 0 ? <EmptyState icon="later" label="No ideas saved for later" /> : sortByDate(laterIdeas).map((idea) => <IdeaCard key={idea._id} item={idea} onMove={(status) => handleMove(idea._id, status)} onDelete={() => handleDelete(idea._id)} onConvert={() => openConvertDialog(idea)} />)}
          </TabsContent>

          <TabsContent value="needs-work" className="space-y-3 mt-0">
            {sortByDate(needsWorkIdeas).length === 0 ? <EmptyState icon="tweak" label="No ideas need tweaking" /> : sortByDate(needsWorkIdeas).map((idea) => <IdeaCard key={idea._id} item={idea} onMove={(status) => handleMove(idea._id, status)} onDelete={() => handleDelete(idea._id)} onConvert={() => openConvertDialog(idea)} />)}
          </TabsContent>

          <TabsContent value="converted" className="space-y-3 mt-0">
            {sortByDate(convertedIdeas).length === 0 ? <EmptyState icon="priority" label="No converted ideas yet" sublabel="Turn ideas into real tasks from any queue" /> : sortByDate(convertedIdeas).map((idea) => <IdeaCard key={idea._id} item={idea} onMove={(status) => handleMove(idea._id, status)} onDelete={() => handleDelete(idea._id)} onConvert={() => openConvertDialog(idea)} />)}
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedIdea} onOpenChange={(open) => !open && setSelectedIdea(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert idea into task</DialogTitle>
              <DialogDescription>
                Turn this idea into a real Sebastian workspace task with the right owner and next action.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Task title</Label>
                <Input value={convertForm.title} onChange={(e) => setConvertForm((prev) => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={4} value={convertForm.description} onChange={(e) => setConvertForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Assign to</Label>
                  <Select value={convertForm.assignedTo} onValueChange={(value) => setConvertForm((prev) => ({ ...prev, assignedTo: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corinne">👑 Corinne</SelectItem>
                      <SelectItem value="sebastian">⚡ Sebastian</SelectItem>
                      <SelectItem value="scout">🔍 Scout</SelectItem>
                      <SelectItem value="maven">📣 Maven</SelectItem>
                      <SelectItem value="compass">🧭 Compass</SelectItem>
                      <SelectItem value="james">🎮 James</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={convertForm.status} onValueChange={(value) => setConvertForm((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={convertForm.priority} onValueChange={(value) => setConvertForm((prev) => ({ ...prev, priority: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={convertForm.category} onValueChange={(value) => setConvertForm((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
              <div className="space-y-2">
                <Label>Agent notes / next action</Label>
                <Textarea rows={3} value={convertForm.agentNotes} onChange={(e) => setConvertForm((prev) => ({ ...prev, agentNotes: e.target.value }))} placeholder="What should happen next?" />
              </div>
              {selectedIdea && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Original idea</p>
                    <p>{selectedIdea.summary}</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedIdea(null)}>Cancel</Button>
              <Button onClick={handleConvert} disabled={!selectedIdea || !convertForm.title.trim()}>
                Convert to task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, label, sublabel }: { icon: "idea" | "priority" | "later" | "tweak"; label: string; sublabel?: string }) {
  const Icon = icon === "priority" ? Star : icon === "later" ? Clock : icon === "tweak" ? Wrench : Lightbulb;

  return (
    <WorkSurfaceEmptyState
      icon={<Icon className="h-8 w-8" />}
      title={label}
      description={sublabel}
    />
  );
}
