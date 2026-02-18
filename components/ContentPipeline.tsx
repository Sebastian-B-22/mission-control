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
  Copy,
  Check,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ExternalLink,
  X,
  ArrowRight,
} from "lucide-react";
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

type ContentType = "x-post" | "email" | "blog" | "landing-page" | "other";
type ContentStage = "idea" | "draft" | "review" | "approved" | "published";

type ContentItem = {
  _id: Id<"contentPipeline">;
  title: string;
  content: string;
  type: ContentType;
  stage: ContentStage;
  createdBy: string;
  assignedTo: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  publishedUrl?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────

const STAGES: { value: ContentStage; label: string; emoji: string; color: string; headerColor: string }[] = [
  { value: "idea",      label: "Idea",      emoji: "💡", color: "border-gray-600",   headerColor: "text-gray-400" },
  { value: "draft",     label: "Draft",     emoji: "✏️", color: "border-blue-700",   headerColor: "text-blue-400" },
  { value: "review",    label: "Review",    emoji: "👀", color: "border-amber-600",  headerColor: "text-amber-400" },
  { value: "approved",  label: "Approved",  emoji: "✅", color: "border-green-700",  headerColor: "text-green-400" },
  { value: "published", label: "Published", emoji: "🚀", color: "border-purple-700", headerColor: "text-purple-400" },
];

const TYPE_CONFIG: Record<ContentType, { label: string; emoji: string; color: string }> = {
  "x-post":       { label: "X Post",       emoji: "𝕏",  color: "bg-sky-500/20 text-sky-300" },
  "email":        { label: "Email",         emoji: "📧", color: "bg-amber-500/20 text-amber-300" },
  "blog":         { label: "Blog",          emoji: "📝", color: "bg-green-500/20 text-green-300" },
  "landing-page": { label: "Landing Page",  emoji: "🖥️", color: "bg-purple-500/20 text-purple-300" },
  "other":        { label: "Other",         emoji: "📋", color: "bg-gray-500/20 text-gray-300" },
};

const CREATOR_CONFIG: Record<string, { emoji: string; color: string }> = {
  sebastian: { emoji: "⚡", color: "text-amber-400" },
  maven:     { emoji: "✍️", color: "text-green-400" },
  scout:     { emoji: "🔍", color: "text-blue-400" },
  corinne:   { emoji: "👑", color: "text-purple-400" },
};

const STAGE_ORDER: ContentStage[] = ["idea", "draft", "review", "approved", "published"];

function getNextStage(current: ContentStage): ContentStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

// ─── Copy Button ──────────────────────────────────────────────────────────

function CopyButton({ text, size = "default" }: { text: string; size?: "default" | "large" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / iOS
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (size === "large") {
    return (
      <Button
        onClick={handleCopy}
        className={`w-full gap-2 font-semibold transition-all ${
          copied
            ? "bg-green-600 hover:bg-green-600 text-white"
            : "bg-amber-500 hover:bg-amber-600 text-black"
        }`}
        size="lg"
      >
        {copied ? (
          <>
            <Check className="h-5 w-5" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-5 w-5" />
            Copy to Clipboard
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={`h-7 gap-1.5 text-xs transition-all ${
        copied ? "text-green-400" : "text-gray-400 hover:text-amber-400"
      }`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

// ─── Type Badge ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: ContentType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.color}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ─── Creator Badge ────────────────────────────────────────────────────────

function CreatorBadge({ createdBy }: { createdBy: string }) {
  const cfg = CREATOR_CONFIG[createdBy] ?? { emoji: "🤖", color: "text-gray-400" };
  return (
    <span className={`text-xs ${cfg.color}`}>
      {cfg.emoji} {createdBy}
    </span>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────

function ContentCard({
  item,
  onClick,
  onApprove,
  onRequestChanges,
  onAdvance,
  onDelete,
}: {
  item: ContentItem;
  onClick: () => void;
  onApprove?: () => void;
  onRequestChanges?: () => void;
  onAdvance?: () => void;
  onDelete: () => void;
}) {
  const preview = item.content.length > 120 ? item.content.slice(0, 120) + "…" : item.content;
  const nextStage = getNextStage(item.stage);

  return (
    <Card
      className="group bg-gray-800/80 border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm text-gray-100 leading-tight flex-1">{item.title}</h4>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-500 hover:text-red-400 shrink-0"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Type + creator */}
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={item.type} />
          <CreatorBadge createdBy={item.createdBy} />
        </div>

        {/* Content preview */}
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{preview}</p>

        {/* Notes */}
        {item.notes && (
          <div className="bg-gray-700/50 rounded p-2">
            <p className="text-xs text-gray-300 line-clamp-2 italic">📎 {item.notes}</p>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          <CopyButton text={item.content} />

          {item.stage === "review" && onApprove && (
            <Button
              size="sm"
              className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
              onClick={onApprove}
            >
              <Check className="h-3 w-3 mr-1" />
              Approve
            </Button>
          )}

          {item.stage === "review" && onRequestChanges && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-amber-600 text-amber-400 hover:bg-amber-600/10"
              onClick={onRequestChanges}
            >
              <X className="h-3 w-3 mr-1" />
              Changes
            </Button>
          )}

          {item.stage !== "review" && nextStage && onAdvance && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-gray-500 hover:text-gray-300"
              onClick={onAdvance}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              {STAGES.find(s => s.value === nextStage)?.label}
            </Button>
          )}
        </div>

        {/* Published URL */}
        {item.publishedUrl && (
          <a
            href={item.publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            View Published
          </a>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Expanded Content Modal ───────────────────────────────────────────────

function ContentModal({
  item,
  open,
  onClose,
  onUpdateStage,
  onUpdateContent,
}: {
  item: ContentItem | null;
  open: boolean;
  onClose: () => void;
  onUpdateStage: (id: Id<"contentPipeline">, stage: ContentStage, notes?: string, publishedUrl?: string) => void;
  onUpdateContent: (id: Id<"contentPipeline">, title?: string, content?: string, notes?: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [requestChangesNote, setRequestChangesNote] = useState("");
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [showPublishUrl, setShowPublishUrl] = useState(false);

  if (!item) return null;

  const startEdit = () => {
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditNotes(item.notes ?? "");
    setIsEditing(true);
  };

  const saveEdit = () => {
    onUpdateContent(item._id, editTitle, editContent, editNotes || undefined);
    setIsEditing(false);
  };

  const handleApprove = () => {
    onUpdateStage(item._id, "approved", "Approved by Corinne ✅");
    onClose();
  };

  const handleRequestChanges = () => {
    onUpdateStage(item._id, "draft", requestChangesNote || "Changes requested by Corinne");
    setShowRequestChanges(false);
    setRequestChangesNote("");
    onClose();
  };

  const handlePublish = () => {
    onUpdateStage(item._id, "published", undefined, publishedUrl || undefined);
    setShowPublishUrl(false);
    setPublishedUrl("");
    onClose();
  };

  const stageInfo = STAGES.find(s => s.value === item.stage);
  const nextStage = getNextStage(item.stage);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-100 flex items-center gap-2 pr-8">
            <span>{stageInfo?.emoji}</span>
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-gray-800 border-gray-600 text-gray-100"
              />
            ) : (
              <span>{item.title}</span>
            )}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <TypeBadge type={item.type} />
              <CreatorBadge createdBy={item.createdBy} />
              <span className="text-gray-500 text-xs">
                {new Date(item.updatedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Stage indicator */}
          <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
            {STAGES.map((s, i) => (
              <div key={s.value} className="flex items-center gap-1 shrink-0">
                <span className={s.value === item.stage ? "font-bold text-amber-400" : "text-gray-600"}>
                  {s.emoji} {s.label}
                </span>
                {i < STAGES.length - 1 && <ChevronRight className="h-3 w-3 text-gray-700" />}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-sm">Content</Label>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-gray-500 hover:text-gray-300"
                  onClick={startEdit}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                className="bg-gray-800 border-gray-600 text-gray-100 font-mono text-sm leading-relaxed"
              />
            ) : (
              <div className="bg-gray-800/80 rounded-lg p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-700">
                {item.content}
              </div>
            )}
          </div>

          {/* Notes */}
          {isEditing ? (
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                placeholder="Agent notes or feedback..."
                className="bg-gray-800 border-gray-600 text-gray-100 text-sm"
              />
            </div>
          ) : item.notes ? (
            <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-300 italic">{item.notes}</p>
            </div>
          ) : null}

          {/* Published URL */}
          {item.publishedUrl && (
            <a
              href={item.publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
            >
              <ExternalLink className="h-4 w-4" />
              {item.publishedUrl}
            </a>
          )}

          {/* Request Changes input */}
          {showRequestChanges && (
            <div className="space-y-2 border border-amber-600/30 rounded p-3 bg-amber-900/10">
              <Label className="text-amber-300 text-sm">What needs to change?</Label>
              <Textarea
                value={requestChangesNote}
                onChange={(e) => setRequestChangesNote(e.target.value)}
                placeholder="Describe what needs to be revised..."
                rows={3}
                className="bg-gray-800 border-gray-600 text-gray-100 text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={handleRequestChanges}
                >
                  Send Feedback
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400"
                  onClick={() => setShowRequestChanges(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Publish URL input */}
          {showPublishUrl && (
            <div className="space-y-2 border border-purple-600/30 rounded p-3 bg-purple-900/10">
              <Label className="text-purple-300 text-sm">Published URL (optional)</Label>
              <Input
                value={publishedUrl}
                onChange={(e) => setPublishedUrl(e.target.value)}
                placeholder="https://..."
                className="bg-gray-800 border-gray-600 text-gray-100 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handlePublish}
                >
                  Mark Published
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400"
                  onClick={() => setShowPublishUrl(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* The BIG copy button - always visible */}
          <div className="w-full sm:flex-1">
            <CopyButton text={item.content} size="large" />
          </div>

          {/* Edit actions */}
          {isEditing ? (
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black"
                onClick={saveEdit}
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 shrink-0 flex-wrap justify-end">
              {/* Review-specific actions */}
              {item.stage === "review" && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white gap-1"
                    onClick={handleApprove}
                  >
                    <Check className="h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-600 text-amber-400 hover:bg-amber-600/10 gap-1"
                    onClick={() => setShowRequestChanges(true)}
                  >
                    <X className="h-3 w-3" />
                    Request Changes
                  </Button>
                </>
              )}

              {/* Approved → Published */}
              {item.stage === "approved" && (
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1"
                  onClick={() => setShowPublishUrl(true)}
                >
                  🚀 Mark Published
                </Button>
              )}

              {/* Generic advance for other stages */}
              {item.stage !== "review" && item.stage !== "approved" && nextStage && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 gap-1"
                  onClick={() => {
                    onUpdateStage(item._id, nextStage);
                    onClose();
                  }}
                >
                  <ArrowRight className="h-3 w-3" />
                  Move to {STAGES.find(s => s.value === nextStage)?.label}
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  items,
  onCardClick,
  onApprove,
  onRequestChanges,
  onAdvance,
  onDelete,
}: {
  stage: typeof STAGES[number];
  items: ContentItem[];
  onCardClick: (item: ContentItem) => void;
  onApprove: (id: Id<"contentPipeline">) => void;
  onRequestChanges: (item: ContentItem) => void;
  onAdvance: (id: Id<"contentPipeline">, newStage: ContentStage) => void;
  onDelete: (id: Id<"contentPipeline">) => void;
}) {
  const isReviewCol = stage.value === "review";

  return (
    <div className="flex-1 min-w-[280px]">
      <Card className={`h-full bg-gray-900/60 border-gray-800 ${isReviewCol ? "ring-1 ring-amber-500/40" : ""}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-base font-semibold flex items-center gap-2 ${stage.headerColor}`}>
            <span>{stage.emoji}</span>
            <span>{stage.label}</span>
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              ({items.length})
            </span>
            {isReviewCol && items.length > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full animate-pulse">
                Needs review!
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 opacity-40">Empty</p>
          ) : (
            items.map((item) => {
              const nextStage = getNextStage(item.stage);
              return (
                <ContentCard
                  key={item._id}
                  item={item}
                  onClick={() => onCardClick(item)}
                  onApprove={item.stage === "review" ? () => onApprove(item._id) : undefined}
                  onRequestChanges={item.stage === "review" ? () => onRequestChanges(item) : undefined}
                  onAdvance={nextStage ? () => onAdvance(item._id, nextStage) : undefined}
                  onDelete={() => onDelete(item._id)}
                />
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Add Content Dialog ───────────────────────────────────────────────────

function AddContentDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    type: ContentType;
    stage: ContentStage;
    createdBy: string;
    notes?: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<ContentType>("x-post");
  const [stage, setStage] = useState<ContentStage>("draft");
  const [createdBy, setCreatedBy] = useState("sebastian");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setTitle(""); setContent(""); setType("x-post");
    setStage("draft"); setCreatedBy("sebastian"); setNotes("");
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({ title: title.trim(), content: content.trim(), type, stage, createdBy, notes: notes.trim() || undefined });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Add Content</DialogTitle>
          <DialogDescription className="text-gray-400">
            Drop a new piece of content into the pipeline
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Title *</Label>
            <Input
              placeholder="e.g., HTA Launch Tweet #1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-600 text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="x-post">𝕏 X Post</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="blog">📝 Blog Post</SelectItem>
                  <SelectItem value="landing-page">🖥️ Landing Page</SelectItem>
                  <SelectItem value="other">📋 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as ContentStage)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Created By</Label>
            <Select value={createdBy} onValueChange={setCreatedBy}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sebastian">⚡ Sebastian</SelectItem>
                <SelectItem value="maven">✍️ Maven</SelectItem>
                <SelectItem value="scout">🔍 Scout</SelectItem>
                <SelectItem value="corinne">👑 Corinne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Content *</Label>
            <Textarea
              placeholder="Paste or type the content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="bg-gray-800 border-gray-600 text-gray-100 font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-gray-500">{content.length} chars</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Notes (optional)</Label>
            <Textarea
              placeholder="Agent notes, context, or instructions for reviewer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-gray-800 border-gray-600 text-gray-100 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            Add to Pipeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Request Changes Dialog ────────────────────────────────────────────────

function RequestChangesDialog({
  item,
  open,
  onClose,
  onSubmit,
}: {
  item: ContentItem | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Request Changes</DialogTitle>
          <DialogDescription className="text-gray-400">
            Describe what needs to be revised for &quot;{item.title}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What needs to change? Be specific..."
            rows={4}
            className="bg-gray-800 border-gray-600 text-gray-100"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
            Cancel
          </Button>
          <Button
            onClick={() => { onSubmit(note); setNote(""); onClose(); }}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            Send Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ContentPipeline Component ───────────────────────────────────────

export function ContentPipeline() {
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [requestChangesItem, setRequestChangesItem] = useState<ContentItem | null>(null);

  // Queries & mutations
  const allItems = (useQuery(api.contentPipeline.listAll, {
    type: typeFilter !== "all" ? typeFilter : undefined,
  }) ?? []) as ContentItem[];

  const createContent = useMutation(api.contentPipeline.createContent);
  const updateStage   = useMutation(api.contentPipeline.updateStage);
  const updateContent = useMutation(api.contentPipeline.updateContent);
  const deleteContent = useMutation(api.contentPipeline.deleteContent);

  // Group by stage
  const byStage = (stage: ContentStage) => allItems.filter((i) => i.stage === stage);

  // Stats
  const reviewCount = byStage("review").length;
  const totalCount  = allItems.length;

  // Handlers
  const handleCreate = async (data: {
    title: string; content: string; type: ContentType;
    stage: ContentStage; createdBy: string; notes?: string;
  }) => {
    await createContent({
      title: data.title,
      content: data.content,
      type: data.type,
      stage: data.stage,
      createdBy: data.createdBy,
      assignedTo: "corinne",
      notes: data.notes,
    });
  };

  const handleUpdateStage = async (
    id: Id<"contentPipeline">,
    stage: ContentStage,
    notes?: string,
    publishedUrl?: string
  ) => {
    await updateStage({ id, stage, notes, publishedUrl });
    // Refresh selected item if open
    if (selectedItem?._id === id) setSelectedItem(null);
  };

  const handleUpdateContent = async (
    id: Id<"contentPipeline">,
    title?: string,
    content?: string,
    notes?: string
  ) => {
    await updateContent({ id, title, content, notes });
    if (selectedItem?._id === id) {
      // Optimistically update selected item view
      setSelectedItem(prev => prev ? { ...prev, title: title ?? prev.title, content: content ?? prev.content, notes: notes ?? prev.notes } : null);
    }
  };

  const handleApprove = async (id: Id<"contentPipeline">) => {
    await updateStage({ id, stage: "approved", notes: "Approved by Corinne ✅" });
  };

  const handleRequestChanges = (item: ContentItem) => {
    setRequestChangesItem(item);
  };

  const handleSubmitChanges = async (note: string) => {
    if (!requestChangesItem) return;
    await updateStage({
      id: requestChangesItem._id,
      stage: "draft",
      notes: note || "Changes requested by Corinne",
    });
    setRequestChangesItem(null);
  };

  const handleAdvance = async (id: Id<"contentPipeline">, newStage: ContentStage) => {
    await updateStage({ id, stage: newStage });
  };

  const handleDelete = async (id: Id<"contentPipeline">) => {
    if (!confirm("Delete this content item?")) return;
    await deleteContent({ id });
    if (selectedItem?._id === id) setSelectedItem(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Content drafts from agents - review and approve before publishing
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">{totalCount} total</span>
            {reviewCount > 0 && (
              <span className="text-xs text-amber-400 font-medium animate-pulse">
                👀 {reviewCount} waiting for review
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Content
        </Button>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { value: "all" as const, label: "All", emoji: "🌐" },
          { value: "x-post" as ContentType, label: "X Posts", emoji: "𝕏" },
          { value: "email" as ContentType, label: "Email", emoji: "📧" },
          { value: "blog" as ContentType, label: "Blog", emoji: "📝" },
          { value: "landing-page" as ContentType, label: "Landing Pages", emoji: "🖥️" },
          { value: "other" as ContentType, label: "Other", emoji: "📋" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              typeFilter === opt.value
                ? "bg-amber-500 text-black font-semibold"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            }`}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage.value}
            stage={stage}
            items={byStage(stage.value)}
            onCardClick={setSelectedItem}
            onApprove={handleApprove}
            onRequestChanges={handleRequestChanges}
            onAdvance={handleAdvance}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Expanded content modal */}
      <ContentModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateStage={handleUpdateStage}
        onUpdateContent={handleUpdateContent}
      />

      {/* Add content dialog */}
      <AddContentDialog
        open={isAdding}
        onClose={() => setIsAdding(false)}
        onSave={handleCreate}
      />

      {/* Request changes dialog */}
      <RequestChangesDialog
        item={requestChangesItem}
        open={!!requestChangesItem}
        onClose={() => setRequestChangesItem(null)}
        onSubmit={handleSubmitChanges}
      />
    </div>
  );
}
