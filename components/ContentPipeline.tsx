"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  Layers3,
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
import { WorkSurfaceEmptyState } from "@/components/work-surface";
import { cn } from "@/lib/utils";

// Helper to make URLs in notes clickable
function Linkify({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────

type ContentType = "x-post" | "email" | "blog" | "landing-page" | "other";
type DisplayContentType = ContentType | "x-reply";
type ContentStage = "idea" | "review" | "approved" | "published";
type RejectReason = "too-salesy" | "off-brand" | "wrong-tone" | "factually-wrong" | "custom";

const REJECT_REASONS: { value: RejectReason; label: string; emoji: string }[] = [
  { value: "too-salesy", label: "Too Salesy", emoji: "💰" },
  { value: "off-brand", label: "Off-Brand", emoji: "🎨" },
  { value: "wrong-tone", label: "Wrong Tone", emoji: "🗣️" },
  { value: "factually-wrong", label: "Factually Wrong", emoji: "❌" },
  { value: "custom", label: "Other...", emoji: "✏️" },
];

type ContentItem = {
  _id: Id<"contentPipeline">;
  title: string;
  content: string;
  type: DisplayContentType;
  stage: ContentStage;
  createdBy: string;
  assignedTo: string;
  notes?: string;
  parentContentId?: Id<"contentPipeline">;
  rootContentId?: Id<"contentPipeline">;
  outputGroupId?: Id<"contentOutputGroups">;
  outputRole?: string;
  createdAt: number;
  updatedAt: number;
  publishedUrl?: string;
  verificationStatus?: "pending" | "passed" | "failed" | "overridden";
  verificationScore?: number;
};

// ─── Constants ────────────────────────────────────────────────────────────

const STAGES: { value: ContentStage; label: string; sublabel?: string; emoji: string; color: string; headerColor: string }[] = [
  { value: "idea",      label: "Idea",      emoji: "💡", color: "border-gray-600",   headerColor: "text-gray-400" },
  { value: "review",    label: "Review",    emoji: "👀", color: "border-amber-600",  headerColor: "text-amber-400" },
  { value: "approved",  label: "Approved",  sublabel: "auto-posts to X ≤15min", emoji: "✅", color: "border-green-700",  headerColor: "text-green-400" },
  { value: "published", label: "Published", emoji: "🚀", color: "border-purple-700", headerColor: "text-purple-400" },
];

const TYPE_CONFIG: Record<DisplayContentType, { label: string; emoji: string; badgeClass: string }> = {
  "x-post":       { label: "X Post",       emoji: "𝕏",  badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  "x-reply":      { label: "X Reply",      emoji: "💬", badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" },
  "email":        { label: "Email",        emoji: "📧", badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  "blog":         { label: "Blog",         emoji: "📝", badgeClass: "border-green-500/30 bg-green-500/10 text-green-300" },
  "landing-page": { label: "Landing Page", emoji: "🖥️", badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-300" },
  "other":        { label: "Other",        emoji: "📋", badgeClass: "border-zinc-700 bg-zinc-900/80 text-zinc-300" },
};

const CREATOR_CONFIG: Record<string, { emoji: string; badgeClass: string }> = {
  sebastian: { emoji: "⚡", badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  maven:     { emoji: "✍️", badgeClass: "border-green-500/30 bg-green-500/10 text-green-300" },
  scout:     { emoji: "🔍", badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  corinne:   { emoji: "👑", badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-300" },
};

const STAGE_ORDER: ContentStage[] = ["idea", "review", "approved", "published"];

function getNextStage(current: ContentStage): ContentStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

const DIALOG_SHELL_CLASS = "max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl sm:max-w-3xl sm:rounded-2xl";
const DIALOG_FIELD_CLASS = "border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-500/40";
const META_BADGE_CLASS = "border text-[11px] font-medium";
const INLINE_SUBPANEL_CLASS = "space-y-3 rounded-xl border border-zinc-800/80 bg-black/20 p-3";
const INLINE_ACTION_ROW_CLASS = "flex flex-wrap justify-end gap-2 border-t border-zinc-800/80 pt-3";

function formatContentDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPreviewLabel(type: DisplayContentType) {
  switch (type) {
    case "x-post":
    case "x-reply":
      return "X preview";
    case "email":
      return "Email preview";
    case "blog":
      return "Blog preview";
    case "landing-page":
      return "Landing page preview";
    default:
      return "Content preview";
  }
}

function getStageBadgeClasses(stage?: string) {
  switch ((stage || "").toLowerCase()) {
    case "review":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "approved":
      return "border-green-500/30 bg-green-500/10 text-green-300";
    case "published":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    default:
      return "border-zinc-700 bg-zinc-900/80 text-zinc-300";
  }
}

function getVerificationBadgeConfig(status?: ContentItem["verificationStatus"], score?: number) {
  switch (status) {
    case "passed":
      return {
        label: `✅ Verified${score != null ? ` ${score}` : ""}`,
        className: "border-green-500/30 bg-green-500/10 text-green-300",
      };
    case "failed":
      return {
        label: `⚠️ Needs Review${score != null ? ` ${score}` : ""}`,
        className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      };
    case "pending":
      return {
        label: "⏳ Verifying...",
        className: "border-blue-500/30 bg-blue-500/10 text-blue-300",
      };
    case "overridden":
      return {
        label: "🛡️ Override",
        className: "border-purple-500/30 bg-purple-500/10 text-purple-300",
      };
    default:
      return null;
  }
}

function formatOutputLabel(value?: string) {
  if (!value) return "Output";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function DetailSection({
  label,
  title,
  description,
  actions,
  tone = "default",
  children,
}: {
  label: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  tone?: "default" | "amber" | "violet" | "purple" | "red";
  children: ReactNode;
}) {
  const toneClass = {
    default: "border-zinc-800 bg-zinc-900/70",
    amber: "border-amber-500/20 bg-amber-500/5",
    violet: "border-violet-500/20 bg-violet-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
    red: "border-red-500/20 bg-red-500/5",
  }[tone];

  return (
    <section className={cn("space-y-3 rounded-2xl border p-4", toneClass)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</p>
          {title ? <p className="text-sm font-semibold text-zinc-100">{title}</p> : null}
          {description ? <p className="text-xs leading-relaxed text-zinc-400">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

// ─── Content with Clickable Links ─────────────────────────────────────────

function ContentWithLinks({ text, className = "" }: { text: string; className?: string }) {
  // Split text by URLs and render links as clickable
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
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

function TypeBadge({ type }: { type: DisplayContentType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <Badge variant="outline" className={cn(META_BADGE_CLASS, cfg.badgeClass)}>
      {cfg.emoji} {cfg.label}
    </Badge>
  );
}

// ─── Creator Badge ────────────────────────────────────────────────────────

function CreatorBadge({ createdBy }: { createdBy: string }) {
  const cfg = CREATOR_CONFIG[createdBy] ?? { emoji: "🤖", badgeClass: "border-zinc-700 bg-zinc-900/80 text-zinc-300" };
  return (
    <Badge variant="outline" className={cn(META_BADGE_CLASS, cfg.badgeClass)}>
      {cfg.emoji} {createdBy}
    </Badge>
  );
}

function VerificationBadge({ item }: { item: ContentItem }) {
  const badge = getVerificationBadgeConfig(item.verificationStatus, item.verificationScore);
  return badge ? <Badge variant="outline" className={cn(META_BADGE_CLASS, badge.className)}>{badge.label}</Badge> : null;
}

// ─── Content Card ─────────────────────────────────────────────────────────

function PipelineEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <WorkSurfaceEmptyState
      icon={<Layers3 className="h-8 w-8" />}
      title={title}
      description={description}
      className="min-h-[160px]"
    />
  );
}

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
  const noteUrlMatch = item.notes?.match(/https?:\/\/[^\s,|)]+/);

  return (
    <Card
      className="group cursor-pointer rounded-2xl border-zinc-800 bg-zinc-950/90 shadow-none transition-all hover:border-zinc-700 hover:bg-zinc-950"
      onClick={onClick}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <TypeBadge type={item.type} />
            <CreatorBadge createdBy={item.createdBy} />
            <VerificationBadge item={item} />
          </div>
          <span className="shrink-0 uppercase tracking-wide">{formatContentDate(item.updatedAt || item.createdAt)}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <h4 className="line-clamp-2 text-sm font-semibold leading-tight text-zinc-100">{item.title}</h4>

            <p className="line-clamp-3 text-xs leading-relaxed text-zinc-400">{preview}</p>

            {item.notes && (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/80 px-3 py-2">
                <p className="line-clamp-2 text-xs italic leading-relaxed text-zinc-300">📎 <Linkify text={item.notes} /></p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 shrink-0 rounded-full p-0 text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-3" onClick={(e) => e.stopPropagation()}>
          <CopyButton text={item.content} />

          {noteUrlMatch && (
            <a
              href={noteUrlMatch[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/5 px-2.5 text-xs text-blue-300 transition-colors hover:bg-blue-500/10 hover:text-blue-200"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Open Post
            </a>
          )}

          {item.stage === "review" && onApprove && (
            <Button
              size="sm"
              className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
              onClick={onApprove}
            >
              <Check className="h-3 w-3 mr-1" />
              {item.title?.startsWith("Reply:") ? "Approve (manual)" : "Approve → Post"}
            </Button>
          )}

          {item.stage === "review" && onRequestChanges && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-amber-500/30 text-xs text-amber-300 hover:bg-amber-500/10"
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
              className="h-7 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
              onClick={onAdvance}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              {STAGES.find(s => s.value === nextStage)?.label}
            </Button>
          )}
        </div>

        {/* Published URL */}
        {item.publishedUrl && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2">
            <a
              href={item.publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-purple-300 hover:text-purple-200"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              View Published
            </a>
          </div>
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
  onRecordEdit,
  onRecordReject,
}: {
  item: ContentItem | null;
  open: boolean;
  onClose: () => void;
  onUpdateStage: (id: Id<"contentPipeline">, stage: ContentStage, notes?: string, publishedUrl?: string) => void;
  onUpdateContent: (id: Id<"contentPipeline">, title?: string, content?: string, notes?: string) => void;
  onRecordEdit: (item: ContentItem, originalContent: string, finalContent: string) => void;
  onRecordReject: (item: ContentItem, reason: RejectReason, customReason?: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [requestChangesNote, setRequestChangesNote] = useState("");
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [showPublishUrl, setShowPublishUrl] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState<RejectReason | null>(null);
  const [customRejectReason, setCustomRejectReason] = useState("");
  
  // Track original content for edit comparison
  const originalContentRef = useRef<string>("");
  const verification = useQuery(
    api.contentVerification.getVerificationForContent,
    item ? { contentId: item._id } : "skip"
  );
  const overrideVerification = useMutation(api.contentVerification.overrideVerification);

  useEffect(() => {
    if (!item) return;
    setIsEditing(false);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditNotes(item.notes ?? "");
    setRequestChangesNote("");
    setShowRequestChanges(false);
    setPublishedUrl(item.publishedUrl ?? "");
    setShowPublishUrl(false);
    setShowRejectDialog(false);
    setRejectReason(null);
    setCustomRejectReason("");
    originalContentRef.current = item.content;
  }, [item?._id]);

  if (!item) return null;

  const startEdit = () => {
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditNotes(item.notes ?? "");
    originalContentRef.current = item.content; // Capture original for comparison
    setIsEditing(true);
  };

  const saveEdit = () => {
    // Record edit if content changed
    if (originalContentRef.current && originalContentRef.current !== editContent) {
      onRecordEdit(item, originalContentRef.current, editContent);
    }
    onUpdateContent(item._id, editTitle, editContent, editNotes || undefined);
    setIsEditing(false);
  };

  const handleApprove = () => {
    // Preserve existing notes - append approval stamp
    const existingNotes = item.notes ?? "";
    const approvalStamp = "✅ Approved by Corinne";
    const newNotes = existingNotes
      ? `${existingNotes}\n\n${approvalStamp}`
      : approvalStamp;
    onUpdateStage(item._id, "approved", newNotes);
    onClose();
  };

  const handleRequestChanges = () => {
    onUpdateStage(item._id, "idea", requestChangesNote || "Needs revision - moved to Ideas");
    setShowRequestChanges(false);
    setRequestChangesNote("");
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason) return;
    onRecordReject(item, rejectReason, rejectReason === "custom" ? customRejectReason : undefined);
    onUpdateStage(item._id, "idea", `Rejected: ${REJECT_REASONS.find(r => r.value === rejectReason)?.label}${rejectReason === "custom" && customRejectReason ? ` - ${customRejectReason}` : ""}`);
    setShowRejectDialog(false);
    setRejectReason(null);
    setCustomRejectReason("");
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
  const currentStageIndex = STAGE_ORDER.indexOf(item.stage);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className={DIALOG_SHELL_CLASS}>
        <DialogHeader className="space-y-4 border-b border-zinc-800 pb-4 text-left">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-zinc-700 bg-zinc-900/80 text-zinc-200">
                  {stageInfo?.emoji} {stageInfo?.label}
                </Badge>
                <TypeBadge type={item.type} />
                <CreatorBadge createdBy={item.createdBy} />
                <VerificationBadge item={item} />
              </div>

              <DialogTitle className="pr-2 text-left text-xl leading-tight text-zinc-50">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={cn(DIALOG_FIELD_CLASS, "h-11 text-base font-semibold")}
                  />
                ) : (
                  item.title
                )}
              </DialogTitle>

              <DialogDescription className="text-left text-sm text-zinc-400">
                Updated {formatContentDate(item.updatedAt)}
                {item.assignedTo ? ` • Assigned to ${item.assignedTo}` : ""}
                {item.outputRole ? ` • Role: ${item.outputRole}` : ""}
              </DialogDescription>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Next step</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {nextStage ? STAGES.find((stage) => stage.value === nextStage)?.label : "Done"}
              </p>
              <p className="text-xs text-zinc-500">
                {nextStage ? "Ready when you are" : "Already published"}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            {STAGES.map((stage) => {
              const stageIndex = STAGE_ORDER.indexOf(stage.value);
              const isActive = stage.value === item.stage;
              const isComplete = stageIndex < currentStageIndex;

              return (
                <div
                  key={stage.value}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left transition-colors",
                    isActive && "border-amber-500/40 bg-amber-500/10 text-amber-200",
                    !isActive && isComplete && "border-green-500/20 bg-green-500/5 text-zinc-200",
                    !isActive && !isComplete && "border-zinc-800 bg-zinc-900/60 text-zinc-500"
                  )}
                >
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span>{stage.emoji}</span>
                    <span>{stage.label}</span>
                  </div>
                  {stage.sublabel ? <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{stage.sublabel}</p> : null}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <DetailSection
            label="Content"
            title={isEditing ? "Refine the final copy before approving or publishing." : "Review the exact draft that will be copied or posted."}
            description={isEditing ? "Edits stay local until you save." : "Use edit mode for quick wording changes without leaving the workflow."}
            actions={!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                onClick={startEdit}
              >
                <Pencil className="mr-1 h-3 w-3" />
                Edit draft
              </Button>
            ) : undefined}
          >
            {isEditing ? (
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                className={cn(DIALOG_FIELD_CLASS, "min-h-[240px] font-mono text-sm leading-relaxed")}
              />
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-black/20 p-4 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
                <ContentWithLinks text={item.content} />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
              <span>{getPreviewLabel(item.type)}</span>
              <span>{(isEditing ? editContent : item.content).length} chars</span>
            </div>
          </DetailSection>

          {!isEditing && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <DetailSection
                label="Preview"
                title={getPreviewLabel(item.type)}
                description="Quick read of the final presentation and length before you approve."
                actions={<Badge variant="outline" className={cn(META_BADGE_CLASS, "border-zinc-700 bg-zinc-900/80 text-zinc-200")}>{item.content.length} chars</Badge>}
              >
                <div className="rounded-xl border border-zinc-800 bg-black/30 p-4 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
                  <ContentWithLinks text={item.content} />
                </div>
              </DetailSection>

              <DetailSection
                label="Verification"
                title={verification ? "Automated checks" : "Checks pending"}
                description={verification ? "A quick confidence read before the final decision." : "Verification results will appear here once the draft has been checked."}
                tone={verification && !verification.overallPassed ? "amber" : "default"}
                actions={verification ? (
                  <Badge variant="outline" className={cn(META_BADGE_CLASS, verification.overallPassed ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300")}>
                    Tone {verification.checks.tone.score}
                  </Badge>
                ) : undefined}
              >
                {verification ? (
                  <div className="space-y-2">
                    {[
                      {
                        passed: verification.checks.characterCount.passed,
                        label: `Character count (${verification.checks.characterCount.count}/${verification.checks.characterCount.limit})`,
                      },
                      {
                        passed: verification.checks.links.passed,
                        label: `Links (${verification.checks.links.broken.length} broken)`,
                      },
                      {
                        passed: verification.checks.tone.passed,
                        label: `Tone similarity (${verification.checks.tone.score}/100)`,
                      },
                      {
                        passed: verification.checks.formatting.passed,
                        label: `Formatting (${verification.checks.formatting.issues.length} issues)`,
                      },
                    ].map((check) => (
                      <div key={check.label} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-black/20 px-3 py-2 text-xs">
                        <span className="text-zinc-300">{check.label}</span>
                        <span className={check.passed ? "text-green-300" : "text-amber-300"}>{check.passed ? "Pass" : "Needs review"}</span>
                      </div>
                    ))}

                    {!verification.overallPassed && (
                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                          onClick={async () => {
                            await overrideVerification({ contentId: item._id, overriddenBy: "corinne" });
                            onUpdateStage(item._id, "approved", "Override approved by Corinne");
                            onClose();
                          }}
                        >
                          Override and approve anyway
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-800 bg-black/20 px-4 py-6 text-sm text-zinc-500">
                    No verification results for this draft yet.
                  </div>
                )}
              </DetailSection>
            </div>
          )}

          {isEditing ? (
            <DetailSection
              label="Notes"
              title="Reviewer context"
              description="Keep links, instructions, or rationale attached to the draft."
            >
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                placeholder="Agent notes or feedback..."
                className={cn(DIALOG_FIELD_CLASS, "min-h-[110px] text-sm")}
              />
            </DetailSection>
          ) : item.notes ? (
            <DetailSection
              label="Notes"
              title="Attached context"
              description="Supporting detail, links, or reviewer notes."
            >
              <div className="rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm italic leading-relaxed text-zinc-300">
                <Linkify text={item.notes} />
              </div>
            </DetailSection>
          ) : null}

          {item.publishedUrl && (
            <DetailSection
              label="Published link"
              title="Live destination"
              description="Jump straight to the published version."
              tone="purple"
            >
              <a
                href={item.publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-black/20 px-3 py-2 text-sm text-purple-300 transition-colors hover:border-purple-400/50 hover:text-purple-200"
              >
                <ExternalLink className="h-4 w-4" />
                {item.publishedUrl}
              </a>
            </DetailSection>
          )}

          {showRequestChanges && (
            <DetailSection
              label="Request changes"
              title="Tell Maven exactly what to revise"
              description="This moves the piece back to Ideas with your notes attached."
              tone="amber"
            >
              <div className={INLINE_SUBPANEL_CLASS}>
                <Textarea
                  value={requestChangesNote}
                  onChange={(e) => setRequestChangesNote(e.target.value)}
                  placeholder="Describe what needs to be revised..."
                  rows={4}
                  className={cn(DIALOG_FIELD_CLASS, "text-sm")}
                  autoFocus
                />
                <div className={INLINE_ACTION_ROW_CLASS}>
                  <Button size="sm" variant="ghost" className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" onClick={() => setShowRequestChanges(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="bg-amber-500 text-black hover:bg-amber-600" onClick={handleRequestChanges}>
                    Send feedback
                  </Button>
                </div>
              </div>
            </DetailSection>
          )}

          {showPublishUrl && (
            <DetailSection
              label="Mark published"
              title="Add the live URL if you have it"
              description="Optional, but useful for quick access after publishing."
              tone="purple"
            >
              <div className={INLINE_SUBPANEL_CLASS}>
                <Input
                  value={publishedUrl}
                  onChange={(e) => setPublishedUrl(e.target.value)}
                  placeholder="https://..."
                  className={cn(DIALOG_FIELD_CLASS, "text-sm")}
                />
                <div className={INLINE_ACTION_ROW_CLASS}>
                  <Button size="sm" variant="ghost" className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" onClick={() => setShowPublishUrl(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700" onClick={handlePublish}>
                    Mark published
                  </Button>
                </div>
              </div>
            </DetailSection>
          )}

          {showRejectDialog && (
            <DetailSection
              label="Reject"
              title="Why are you rejecting this?"
              description="This feedback is stored so Maven can learn your voice better over time."
              tone="red"
            >
              <div className={INLINE_SUBPANEL_CLASS}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {REJECT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setRejectReason(reason.value)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition-colors",
                        rejectReason === reason.value
                          ? "border-red-500/50 bg-red-500/10 text-red-100"
                          : "border-zinc-800 bg-black/20 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-lg">{reason.emoji}</span>
                        <span>{reason.label}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {rejectReason === "custom" && (
                  <Textarea
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    placeholder="Describe what's wrong with this content..."
                    rows={3}
                    className={cn(DIALOG_FIELD_CLASS, "text-sm")}
                    autoFocus
                  />
                )}

                <div className={INLINE_ACTION_ROW_CLASS}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    onClick={() => {
                      setShowRejectDialog(false);
                      setRejectReason(null);
                      setCustomRejectReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 text-white hover:bg-red-700"
                    onClick={handleReject}
                    disabled={!rejectReason || (rejectReason === "custom" && !customRejectReason.trim())}
                  >
                    Reject content
                  </Button>
                </div>
              </div>
            </DetailSection>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <CopyButton text={isEditing ? editContent : item.content} size="large" />
          </div>

          {isEditing ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button size="sm" className="bg-amber-500 text-black hover:bg-amber-600" onClick={saveEdit}>
                Save changes
              </Button>
            </div>
          ) : (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {item.stage === "review" && (
                <>
                  <Button size="sm" className="gap-1 bg-green-600 text-white hover:bg-green-700" onClick={handleApprove}>
                    <Check className="h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                    onClick={() => {
                      setShowRejectDialog(false);
                      setShowRequestChanges((prev) => !prev);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                    Request changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-red-500/40 text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      setShowRequestChanges(false);
                      setShowRejectDialog((prev) => !prev);
                    }}
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </Button>
                </>
              )}

              {item.stage === "approved" && (
                <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700" onClick={() => setShowPublishUrl((prev) => !prev)}>
                  🚀 Mark published
                </Button>
              )}

              {item.stage !== "review" && item.stage !== "approved" && nextStage && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                  onClick={() => {
                    onUpdateStage(item._id, nextStage);
                    onClose();
                  }}
                >
                  <ArrowRight className="h-3 w-3" />
                  Move to {STAGES.find((stage) => stage.value === nextStage)?.label}
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
      <Card className={cn("h-full rounded-2xl border-zinc-800 bg-zinc-900/70 shadow-none", isReviewCol && "ring-1 ring-amber-500/30")}>
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Pipeline stage</p>
              <CardTitle className={`flex items-center gap-2 text-base font-semibold ${stage.headerColor}`}>
                <span>{stage.emoji}</span>
                <span>{stage.label}</span>
              </CardTitle>
              {"sublabel" in stage && stage.sublabel && (
                <p className="text-xs text-green-400">{stage.sublabel}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-300">
                {items.length} items
              </Badge>
              {isReviewCol && items.length > 0 && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300 animate-pulse">
                  Needs review
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {items.length === 0 ? (
            <PipelineEmptyState title={`No ${stage.label.toLowerCase()} items`} description={isReviewCol ? "Anything waiting for approval will show up here first." : "Move content through the pipeline to keep this stage active."} />
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
  const [stage, setStage] = useState<ContentStage>("review");
  const [createdBy, setCreatedBy] = useState("sebastian");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setTitle(""); setContent(""); setType("x-post");
    setStage("review"); setCreatedBy("sebastian"); setNotes("");
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({ title: title.trim(), content: content.trim(), type, stage, createdBy, notes: notes.trim() || undefined });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className={DIALOG_SHELL_CLASS}>
        <DialogHeader className="space-y-2 border-b border-zinc-800 pb-4 text-left">
          <DialogTitle className="text-zinc-50">Add Content</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Drop a new piece of content into the pipeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <DetailSection
            label="Basics"
            title="Set up the draft"
            description="Start with the title, content type, and who created it."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Title *</Label>
                <Input
                  placeholder="e.g., HTA Launch Tweet #1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={DIALOG_FIELD_CLASS}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Type *</Label>
                  <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
                    <SelectTrigger className={cn(DIALOG_FIELD_CLASS, "text-zinc-200")}>
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
                  <Label className="text-zinc-300">Stage</Label>
                  <Select value={stage} onValueChange={(v) => setStage(v as ContentStage)}>
                    <SelectTrigger className={cn(DIALOG_FIELD_CLASS, "text-zinc-200")}>
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
                <Label className="text-zinc-300">Created By</Label>
                <Select value={createdBy} onValueChange={setCreatedBy}>
                  <SelectTrigger className={cn(DIALOG_FIELD_CLASS, "text-zinc-200")}>
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
            </div>
          </DetailSection>

          <DetailSection
            label="Draft"
            title="Paste or write the content"
            description="The character count updates live so it is easy to sanity check length."
            actions={<Badge variant="outline" className={cn(META_BADGE_CLASS, "border-zinc-700 bg-zinc-900/80 text-zinc-200")}>{content.length} chars</Badge>}
          >
            <div className="space-y-2">
              <Label className="text-zinc-300">Content *</Label>
              <Textarea
                placeholder="Paste or type the content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className={cn(DIALOG_FIELD_CLASS, "font-mono text-sm leading-relaxed")}
              />
            </div>
          </DetailSection>

          <DetailSection
            label="Notes"
            title="Optional context"
            description="Use this for links, reviewer context, or agent instructions."
          >
            <div className="space-y-2">
              <Label className="text-zinc-300">Notes</Label>
              <Textarea
                placeholder="Agent notes, context, or instructions for reviewer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={cn(DIALOG_FIELD_CLASS, "text-sm")}
              />
            </div>
          </DetailSection>
        </div>

        <DialogFooter className="border-t border-zinc-800 pt-4">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-900">
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

  useEffect(() => {
    if (!open) {
      setNote("");
    }
  }, [open, item?._id]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className={cn(DIALOG_SHELL_CLASS, "sm:max-w-xl")}>
        <DialogHeader className="space-y-2 border-b border-zinc-800 pb-4 text-left">
          <DialogTitle className="text-zinc-50">Request Changes</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Describe what needs to be revised for &quot;{item.title}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <DetailSection
            label="Feedback"
            title="Give the next pass a clear target"
            description="Specific notes make revisions faster and usually better."
            tone="amber"
          >
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What needs to change? Be specific..."
              rows={5}
              className={cn(DIALOG_FIELD_CLASS, "text-sm")}
              autoFocus
            />
          </DetailSection>
        </div>

        <DialogFooter className="border-t border-zinc-800 pt-4">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-900">
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

  const [isClearing, setIsClearing] = useState(false);

  // Queries & mutations
  const allItems = (useQuery(api.contentPipeline.listAll, {
    type: typeFilter !== "all" ? typeFilter : undefined,
  }) ?? []) as ContentItem[];

  const createContent = useMutation(api.contentPipeline.createContent);
  const updateStage   = useMutation(api.contentPipeline.updateStage);
  const updateContent = useMutation(api.contentPipeline.updateContent);
  const deleteContent = useMutation(api.contentPipeline.deleteContent);
  const markGroupCompleteIfReady = useMutation(api.contentOutputGroups.markCompleteIfReady);

  // Maven feedback mutations
  const recordReject = useMutation(api.mavenFeedback.recordReject);
  const recordEdit = useMutation(api.mavenFeedback.recordEdit);
  const feedbackStats = useQuery(api.mavenFeedback.getFeedbackStats);

  // Group by stage
  const byStage = (stage: ContentStage) => allItems.filter((i) => i.stage === stage);

  // Stats
  const reviewCount = byStage("review").length;
  const approvedCount = byStage("approved").length;
  const publishedCount = byStage("published").length;
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
    const item = allItems.find((entry) => entry._id === id);
    await updateStage({ id, stage, notes, publishedUrl });
    if (item?.outputGroupId) {
      await markGroupCompleteIfReady({ groupId: item.outputGroupId });
    }
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
    // Preserve existing notes - append approval stamp rather than replacing
    const item = allItems.find(i => i._id === id);
    const existingNotes = item?.notes ?? "";
    const approvalStamp = "✅ Approved by Corinne";
    const newNotes = existingNotes
      ? `${existingNotes}\n\n${approvalStamp}`
      : approvalStamp;
    await updateStage({ id, stage: "approved", notes: newNotes });
    if (item?.outputGroupId) {
      await markGroupCompleteIfReady({ groupId: item.outputGroupId });
    }
  };

  const handleRequestChanges = (item: ContentItem) => {
    setRequestChangesItem(item);
  };

  const handleSubmitChanges = async (note: string) => {
    if (!requestChangesItem) return;
    await updateStage({
      id: requestChangesItem._id,
      stage: "idea",
      notes: note || "Needs revision - moved to Ideas",
    });
    if (requestChangesItem.outputGroupId) {
      await markGroupCompleteIfReady({ groupId: requestChangesItem.outputGroupId });
    }
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

  const handleClearAll = async () => {
    const count = allItems.length;
    if (!confirm(`Delete all ${count} items from the pipeline? This cannot be undone.`)) return;
    setIsClearing(true);
    try {
      for (const item of allItems) {
        await deleteContent({ id: item._id });
      }
    } finally {
      setIsClearing(false);
      setSelectedItem(null);
    }
  };

  const handleClearReview = async () => {
    const reviewItems = byStage("review");
    if (!confirm(`Delete all ${reviewItems.length} items in Review? This cannot be undone.`)) return;
    setIsClearing(true);
    try {
      for (const item of reviewItems) {
        await deleteContent({ id: item._id });
      }
    } finally {
      setIsClearing(false);
    }
  };

  // Maven feedback handlers
  const handleRecordEdit = async (item: ContentItem, originalContent: string, finalContent: string) => {
    await recordEdit({
      contentId: item._id,
      contentTitle: item.title,
      contentType: item.type,
      createdBy: item.createdBy,
      originalContent,
      finalContent,
    });
  };

  const handleRecordReject = async (item: ContentItem, reason: RejectReason, customReason?: string) => {
    await recordReject({
      contentId: item._id,
      contentTitle: item.title,
      contentType: item.type,
      createdBy: item.createdBy,
      reason,
      customReason,
      originalContent: item.content,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-sm text-muted-foreground">
            Maven drops drafts here daily. <strong className="text-green-400">Approve</strong> auto-posts to @corinnebriers within 15 min. Reply targets still need manual posting, and failed posts stay visible until you handle them.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-500">{totalCount} total</span>
            {reviewCount > 0 && (
              <span className="animate-pulse text-xs font-medium text-amber-400">
                👀 {reviewCount} waiting for review
              </span>
            )}
            {feedbackStats && feedbackStats.total > 0 && (
              <span className="text-xs text-purple-400" title="Voice feedback collected for Maven">
                🎯 {feedbackStats.total} voice feedback items
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {totalCount > 0 && (
            <Button
              onClick={handleClearReview}
              size="sm"
              variant="outline"
              disabled={isClearing || byStage("review").length === 0}
              className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Review ({byStage("review").length})
            </Button>
          )}
          {totalCount > 0 && (
            <Button
              onClick={handleClearAll}
              size="sm"
              variant="outline"
              disabled={isClearing}
              className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {isClearing ? "Clearing..." : "Clear All"}
            </Button>
          )}
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Content
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { label: "In review", value: reviewCount, icon: <Check className="h-3.5 w-3.5 text-amber-400" />, tone: "border-amber-500/20 bg-amber-500/5" },
          { label: "Approved", value: approvedCount, icon: <Check className="h-3.5 w-3.5 text-green-400" />, tone: "border-green-500/20 bg-green-500/5" },
          { label: "Published", value: publishedCount, icon: <ExternalLink className="h-3.5 w-3.5 text-purple-400" />, tone: "border-violet-500/20 bg-violet-500/5" },
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

      <div className="space-y-4">
        <div className="space-y-4">
          {/* Type filter */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Filter content type</p>
              <span className="text-[11px] text-zinc-500">{totalCount} visible</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
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
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    typeFilter === opt.value
                      ? "border-amber-400 bg-amber-500 font-semibold text-black"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
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
        </div>
      </div>

      {/* Expanded content modal */}
      <ContentModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateStage={handleUpdateStage}
        onUpdateContent={handleUpdateContent}
        onRecordEdit={handleRecordEdit}
        onRecordReject={handleRecordReject}
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
