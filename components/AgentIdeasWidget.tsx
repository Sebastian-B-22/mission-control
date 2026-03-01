"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Clock,
  Wrench,
  Trash2,
  Moon,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type ContentItem = {
  _id: Id<"contentPipeline">;
  title: string;
  content: string;
  type: string;
  stage: string;
  createdBy: string;
  assignedTo: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

// ─── Constants ────────────────────────────────────────────────────────────

const CREATOR_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  sebastian: { emoji: "⚡", label: "Sebastian", color: "text-amber-400" },
  maven:     { emoji: "📣", label: "Maven",     color: "text-green-400" },
  scout:     { emoji: "🔍", label: "Scout",     color: "text-blue-400" },
  compass:   { emoji: "🧭", label: "Compass",   color: "text-cyan-400" },
  james:     { emoji: "🎮", label: "James",     color: "text-purple-400" },
  corinne:   { emoji: "👑", label: "Corinne",   color: "text-pink-400" },
};

const TYPE_LABELS: Record<string, string> = {
  "x-post": "𝕏",
  "x-reply": "↩️",
  "email": "📧",
  "blog": "📝",
  "landing-page": "🖥️",
  "other": "📋",
};

const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  idea: { label: "New", color: "text-yellow-400", bgColor: "bg-yellow-900/30" },
  priority: { label: "Priority", color: "text-red-400", bgColor: "bg-red-900/30" },
  later: { label: "Later", color: "text-blue-400", bgColor: "bg-blue-900/30" },
  "needs-work": { label: "Needs Work", color: "text-orange-400", bgColor: "bg-orange-900/30" },
  review: { label: "In Review", color: "text-purple-400", bgColor: "bg-purple-900/30" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

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

// ─── Idea Card ────────────────────────────────────────────────────────────

function IdeaCard({
  item,
  onMove,
  onDelete,
  showMoveOptions = true,
}: {
  item: ContentItem;
  onMove: (stage: string) => void;
  onDelete: () => void;
  showMoveOptions?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const isOvernight = isOvernightIdea(item.createdAt);
  const creator = CREATOR_CONFIG[item.createdBy] ?? { emoji: "🤖", label: item.createdBy, color: "text-gray-400" };
  const typeLabel = TYPE_LABELS[item.type] || "📋";
  const stageConfig = STAGE_CONFIG[item.stage] || STAGE_CONFIG.idea;

  return (
    <div className="bg-gray-800/60 rounded-lg p-3 space-y-2 border border-gray-700/50 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span>{typeLabel}</span>
            <h4 className="font-medium text-sm text-gray-100">{item.title}</h4>
            {isOvernight && (
              <Badge variant="outline" className="bg-indigo-900/40 border-indigo-500/50 text-indigo-300 text-[10px] px-1.5">
                <Moon className="h-3 w-3 mr-1" />
                Overnight
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className={creator.color}>{creator.emoji} {creator.label}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500">{formatRelativeTime(item.createdAt)}</span>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-200">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Content preview or full */}
      <p className={`text-xs text-gray-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
        {item.content}
      </p>

      {/* Notes */}
      {item.notes && (
        <div className="bg-gray-700/30 rounded px-2 py-1.5">
          <p className="text-xs text-gray-300 italic">📎 {item.notes}</p>
        </div>
      )}

      {/* Action buttons */}
      {showMoveOptions && (
        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
          <Button
            size="sm"
            className="h-7 text-xs bg-red-600/80 hover:bg-red-600 text-white"
            onClick={() => onMove("priority")}
          >
            <Star className="h-3 w-3 mr-1" />
            Priority
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-blue-600/50 text-blue-400 hover:bg-blue-600/10"
            onClick={() => onMove("later")}
          >
            <Clock className="h-3 w-3 mr-1" />
            Later
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-orange-600/50 text-orange-400 hover:bg-orange-600/10"
            onClick={() => onMove("needs-work")}
          >
            <Wrench className="h-3 w-3 mr-1" />
            Tweak
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-purple-600/50 text-purple-400 hover:bg-purple-600/10"
            onClick={() => onMove("review")}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Review
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-gray-500 hover:text-red-400 hover:bg-red-900/20 ml-auto"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────

export function AgentIdeasWidget() {
  const [activeTab, setActiveTab] = useState("new");
  
  // Query all relevant stages
  const newIdeas = useQuery(api.contentPipeline.listByStage, { stage: "idea" }) as ContentItem[] | undefined;
  const priorityIdeas = useQuery(api.contentPipeline.listByStage, { stage: "priority" }) as ContentItem[] | undefined;
  const laterIdeas = useQuery(api.contentPipeline.listByStage, { stage: "later" }) as ContentItem[] | undefined;
  const needsWorkIdeas = useQuery(api.contentPipeline.listByStage, { stage: "needs-work" }) as ContentItem[] | undefined;

  const updateStage = useMutation(api.contentPipeline.updateStage);
  const deleteContent = useMutation(api.contentPipeline.deleteContent);

  const handleMove = async (id: Id<"contentPipeline">, stage: string) => {
    await updateStage({ id, stage: stage as any });
  };

  const handleDelete = async (id: Id<"contentPipeline">) => {
    if (confirm("Delete this idea?")) {
      await deleteContent({ id });
    }
  };

  const sortByDate = (items: ContentItem[] | undefined) => 
    items?.sort((a, b) => b.createdAt - a.createdAt) || [];

  const newCount = newIdeas?.length || 0;
  const priorityCount = priorityIdeas?.length || 0;
  const laterCount = laterIdeas?.length || 0;
  const needsWorkCount = needsWorkIdeas?.length || 0;
  const overnightCount = newIdeas?.filter(i => isOvernightIdea(i.createdAt)).length || 0;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Agent Ideas
            {newCount > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                {newCount} new
              </Badge>
            )}
          </CardTitle>
          {overnightCount > 0 && (
            <Badge variant="outline" className="bg-indigo-900/40 border-indigo-500/50 text-indigo-300">
              <Moon className="h-3 w-3 mr-1" />
              {overnightCount} overnight
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Ideas from your agents - triage and prioritize
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full mb-4">
            <TabsTrigger value="new" className="text-xs">
              New {newCount > 0 && `(${newCount})`}
            </TabsTrigger>
            <TabsTrigger value="priority" className="text-xs">
              Priority {priorityCount > 0 && `(${priorityCount})`}
            </TabsTrigger>
            <TabsTrigger value="later" className="text-xs">
              Later {laterCount > 0 && `(${laterCount})`}
            </TabsTrigger>
            <TabsTrigger value="needs-work" className="text-xs">
              Tweak {needsWorkCount > 0 && `(${needsWorkCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-3 mt-0">
            {sortByDate(newIdeas).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No new ideas</p>
                <p className="text-xs mt-1">Agents will drop ideas here</p>
              </div>
            ) : (
              sortByDate(newIdeas).map((idea) => (
                <IdeaCard
                  key={idea._id}
                  item={idea}
                  onMove={(stage) => handleMove(idea._id, stage)}
                  onDelete={() => handleDelete(idea._id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="priority" className="space-y-3 mt-0">
            {sortByDate(priorityIdeas).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No priority ideas</p>
              </div>
            ) : (
              sortByDate(priorityIdeas).map((idea) => (
                <IdeaCard
                  key={idea._id}
                  item={idea}
                  onMove={(stage) => handleMove(idea._id, stage)}
                  onDelete={() => handleDelete(idea._id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="later" className="space-y-3 mt-0">
            {sortByDate(laterIdeas).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No ideas saved for later</p>
              </div>
            ) : (
              sortByDate(laterIdeas).map((idea) => (
                <IdeaCard
                  key={idea._id}
                  item={idea}
                  onMove={(stage) => handleMove(idea._id, stage)}
                  onDelete={() => handleDelete(idea._id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="needs-work" className="space-y-3 mt-0">
            {sortByDate(needsWorkIdeas).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No ideas need tweaking</p>
              </div>
            ) : (
              sortByDate(needsWorkIdeas).map((idea) => (
                <IdeaCard
                  key={idea._id}
                  item={idea}
                  onMove={(stage) => handleMove(idea._id, stage)}
                  onDelete={() => handleDelete(idea._id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
