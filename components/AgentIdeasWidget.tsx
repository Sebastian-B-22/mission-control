"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ThumbsUp,
  MessageSquare,
  ThumbsDown,
  Moon,
  Lightbulb,
  X,
  Send,
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
  corinne:   { emoji: "👑", label: "Corinne",   color: "text-purple-400" },
};

const TYPE_LABELS: Record<string, string> = {
  "x-post": "𝕏",
  "email": "📧",
  "blog": "📝",
  "landing-page": "🖥️",
  "other": "📋",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function isOvernightIdea(createdAt: number): boolean {
  // Check if created between 10pm and 8am PST
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

// ─── Creator Badge ────────────────────────────────────────────────────────

function CreatorBadge({ createdBy }: { createdBy: string }) {
  const cfg = CREATOR_CONFIG[createdBy] ?? { emoji: "🤖", label: createdBy, color: "text-gray-400" };
  return (
    <span className={`text-xs font-medium ${cfg.color}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ─── Idea Card ────────────────────────────────────────────────────────────

function IdeaCard({
  item,
  onMoveToReview,
  onAddFeedback,
  onDismiss,
}: {
  item: ContentItem;
  onMoveToReview: () => void;
  onAddFeedback: (feedback: string) => void;
  onDismiss: () => void;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  const isOvernight = isOvernightIdea(item.createdAt);
  const preview = item.content.length > 100 ? item.content.slice(0, 100) + "…" : item.content;
  const typeLabel = TYPE_LABELS[item.type] || "📋";

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      onAddFeedback(feedback.trim());
      setFeedback("");
      setShowFeedback(false);
    }
  };

  return (
    <div className="bg-gray-800/60 rounded-lg p-3 space-y-2 border border-gray-700/50 hover:border-gray-600 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm">{typeLabel}</span>
            <h4 className="font-medium text-sm text-gray-100 truncate">{item.title}</h4>
            {isOvernight && (
              <Badge 
                variant="outline" 
                className="bg-indigo-900/40 border-indigo-500/50 text-indigo-300 text-[10px] px-1.5 py-0 h-5"
              >
                <Moon className="h-3 w-3 mr-1" />
                Overnight
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <CreatorBadge createdBy={item.createdBy} />
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{formatRelativeTime(item.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{preview}</p>

      {/* Notes if present */}
      {item.notes && (
        <div className="bg-gray-700/30 rounded px-2 py-1.5">
          <p className="text-xs text-gray-300 line-clamp-1 italic">📎 {item.notes}</p>
        </div>
      )}

      {/* Feedback input */}
      {showFeedback ? (
        <div className="space-y-2 pt-1">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Add your feedback..."
            rows={2}
            className="bg-gray-900 border-gray-600 text-gray-100 text-xs resize-none"
            autoFocus
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-1"
              onClick={handleSubmitFeedback}
              disabled={!feedback.trim()}
            >
              <Send className="h-3 w-3 mr-1" />
              Send
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-gray-400 hover:text-gray-300"
              onClick={() => {
                setShowFeedback(false);
                setFeedback("");
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        /* Action buttons */
        <div className="flex items-center gap-1.5 pt-1">
          <Button
            size="sm"
            className="h-7 text-xs bg-green-600/80 hover:bg-green-600 text-white flex-1"
            onClick={onMoveToReview}
          >
            <ThumbsUp className="h-3 w-3 mr-1" />
            Review
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-blue-600/50 text-blue-400 hover:bg-blue-600/10 flex-1"
            onClick={() => setShowFeedback(true)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Feedback
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-gray-500 hover:text-red-400 hover:bg-red-900/20"
            onClick={onDismiss}
            title="Dismiss"
          >
            <ThumbsDown className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────

export function AgentIdeasWidget() {
  // Query ideas (stage="idea"), limited to recent ones
  const ideas = useQuery(api.contentPipeline.listByStage, { stage: "idea" }) as ContentItem[] | undefined;

  const updateStage = useMutation(api.contentPipeline.updateStage);
  const updateContent = useMutation(api.contentPipeline.updateContent);
  const deleteContent = useMutation(api.contentPipeline.deleteContent);

  // Take only the first 6 ideas, sorted by createdAt (most recent first)
  const displayIdeas = ideas
    ?.sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6) || [];

  // Count overnight ideas
  const overnightCount = displayIdeas.filter(i => isOvernightIdea(i.createdAt)).length;

  const handleMoveToReview = async (id: Id<"contentPipeline">) => {
    await updateStage({ id, stage: "review", notes: "Moved to review from Ideas widget" });
  };

  const handleAddFeedback = async (id: Id<"contentPipeline">, currentNotes: string | undefined, feedback: string) => {
    const newNotes = currentNotes 
      ? `${currentNotes}\n\n📝 Feedback: ${feedback}`
      : `📝 Feedback: ${feedback}`;
    await updateContent({ id, notes: newNotes });
  };

  const handleDismiss = async (id: Id<"contentPipeline">) => {
    // Delete the idea (or could move to a "dismissed" stage if preferred)
    if (confirm("Dismiss this idea? It will be deleted.")) {
      await deleteContent({ id });
    }
  };

  if (!ideas) {
    return (
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-100">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            Agent Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/60 border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-100">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            Agent Ideas
            {displayIdeas.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                {displayIdeas.length}
              </Badge>
            )}
          </CardTitle>
          {overnightCount > 0 && (
            <Badge 
              variant="outline" 
              className="bg-indigo-900/40 border-indigo-500/50 text-indigo-300 text-xs"
            >
              <Moon className="h-3 w-3 mr-1" />
              {overnightCount} overnight
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Ideas from your agents waiting for review
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayIdeas.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">No ideas yet</p>
            <p className="text-xs text-gray-600 mt-1">Agents will drop ideas here overnight</p>
          </div>
        ) : (
          displayIdeas.map((idea) => (
            <IdeaCard
              key={idea._id}
              item={idea}
              onMoveToReview={() => handleMoveToReview(idea._id)}
              onAddFeedback={(feedback) => handleAddFeedback(idea._id, idea.notes, feedback)}
              onDismiss={() => handleDismiss(idea._id)}
            />
          ))
        )}
        
        {ideas.length > 6 && (
          <p className="text-xs text-center text-gray-500 pt-2">
            +{ideas.length - 6} more in Content Pipeline
          </p>
        )}
      </CardContent>
    </Card>
  );
}
