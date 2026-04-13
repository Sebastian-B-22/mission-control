"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { WorkSurfaceEmptyState } from "@/components/work-surface";

type DraftId = Id<"emailDrafts">;

type EmailDraftDoc = Doc<"emailDrafts">;
type EmailDraftSuggestion = EmailDraftDoc["suggestions"][number];

type DraftStatus = "draft" | "review" | "approved" | "sent";

const statusColor: Record<DraftStatus, string> = {
  draft: "bg-zinc-800 text-zinc-200",
  review: "bg-amber-900/40 text-amber-300",
  approved: "bg-green-900/40 text-green-300",
  sent: "bg-blue-900/40 text-blue-300",
};

function formatDateTime(ms?: number) {
  if (!ms) return "";
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "";
  }
}

export function EmailDraftsView({ showHeader = true }: { showHeader?: boolean }) {
  const drafts = useQuery(api.emailDrafts.list, {}) ?? [];

  const createDraft = useMutation(api.emailDrafts.create);
  const updateDraft = useMutation(api.emailDrafts.update);
  const markApproved = useMutation(api.emailDrafts.markApproved);
  const softDelete = useMutation(api.emailDrafts.softDelete);
  const addSuggestion = useMutation(api.emailDrafts.addSuggestion);
  const setSuggestionStatus = useMutation(api.emailDrafts.setSuggestionStatus);

  const [selectedId, setSelectedId] = useState<DraftId | null>(null);
  const selected = useMemo<EmailDraftDoc | null>(
    () => drafts.find((d) => d._id === selectedId) ?? null,
    [drafts, selectedId]
  );
  // Editor local state (keeps typing snappy)
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [suggestionText, setSuggestionText] = useState("");

  const loadDraftIntoEditor = (draft: EmailDraftDoc) => {
    setSelectedId(draft._id);
    setTitle(draft.title ?? "");
    setTags((draft.tags ?? []).join(", "));
    setBodyMarkdown(draft.bodyMarkdown ?? "");
    setSuggestionText("");
    setShowPreview(false);
  };

  const handleCreate = async () => {
    const newId = await createDraft({
      title: "New Email Draft",
      bodyMarkdown: "",
      tags: [],
      lastEditedBy: "corinne",
    });

    // Optimistically select after list refresh
    setSelectedId(newId as DraftId);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    await updateDraft({
      id: selectedId,
      title: title.trim() || "Untitled",
      bodyMarkdown,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      lastEditedBy: "corinne",
    });
  };

  const handleCopy = async () => {
    if (!selected) return;
    const text = `Subject: ${selected.title}\n\n${bodyMarkdown}`;
    await navigator.clipboard.writeText(text);
  };

  const handleApprove = async () => {
    if (!selectedId) return;
    await markApproved({ id: selectedId, lastEditedBy: "corinne" });
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const ok = window.confirm("Delete this draft? You can restore it later (soft delete).");
    if (!ok) return;
    await softDelete({ id: selectedId, deletedBy: "corinne" });
    setSelectedId(null);
  };

  const handleAddSuggestion = async () => {
    if (!selectedId) return;
    if (!suggestionText.trim()) return;
    await addSuggestion({
      draftId: selectedId,
      proposedBodyMarkdown: suggestionText,
      author: "agent",
    });
    setSuggestionText("");
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    if (!selectedId) return;
    await setSuggestionStatus({
      draftId: selectedId,
      suggestionId,
      status: "accepted",
      applyToBody: true,
      lastEditedBy: "corinne",
    });
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    if (!selectedId) return;
    await setSuggestionStatus({
      draftId: selectedId,
      suggestionId,
      status: "rejected",
      lastEditedBy: "corinne",
    });
  };

  // When selection changes because list refreshed (create), load it.
  if (selectedId && !selected) {
    const fresh = drafts.find((d) => d._id === selectedId);
    if (fresh) loadDraftIntoEditor(fresh);
  }

  return (
    <div className="space-y-5">
      {showHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <span>✉️</span> Email Drafts
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Draft, review, approve, and copy emails without losing the thread.
            </p>
          </div>
          <Button onClick={handleCreate}>+ New Draft</Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* List */}
        <Card className="lg:col-span-1 border-zinc-800 bg-zinc-950/90 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-sm">Drafts</CardTitle>
            {!showHeader && <Button onClick={handleCreate}>+ New Draft</Button>}
          </CardHeader>
          <CardContent className="space-y-2">
            {drafts.length === 0 ? (
              <WorkSurfaceEmptyState icon={<span className="text-2xl">✉️</span>} title="No drafts yet" description="Create a draft to start the review loop." />
            ) : (
              drafts.map((d) => (
                <button
                  key={d._id}
                  onClick={() => loadDraftIntoEditor(d)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedId === d._id
                      ? "border-amber-500/30 bg-zinc-900"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm">{d.title}</div>
                      <div className="text-[11px] text-zinc-500 mt-1">
                        Updated {formatDateTime(d.updatedAt)}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor[d.status as DraftStatus]}`}>
                      {d.status}
                    </span>
                  </div>
                  {(d.tags ?? []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(d.tags ?? []).slice(0, 3).map((t: string) => (
                        <Badge key={t} variant="secondary" className="bg-zinc-800 text-zinc-200 text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-2 border-zinc-800 bg-zinc-950/90 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <WorkSurfaceEmptyState icon={<span className="text-2xl">📝</span>} title="Select a draft to edit" description="The editor, preview, and suggestions will stay aligned once you pick a draft." className="min-h-[320px]" />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma separated)</Label>
                    <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="spring-league, pali" />
                  </div>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor[selected.status as DraftStatus]}`}>
                        {selected.status}
                      </span>
                      <span className="text-xs text-zinc-500">Last edited by {selected.lastEditedBy}</span>
                    </div>
                    <p className="text-xs text-zinc-500">Use preview, copy, and approval actions from one place so this feels like a real review surface, not a loose editor.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => setShowPreview((s) => !s)}>
                      {showPreview ? "Hide Preview" : "Preview"}
                    </Button>
                    <Button variant="outline" onClick={handleCopy}>Copy</Button>
                    <Button variant="outline" onClick={handleSave}>Save</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    <Button onClick={handleApprove} disabled={selected.status === "approved" || selected.status === "sent"}>
                      Mark Approved
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Body (Markdown)</Label>
                  <Textarea
                    value={bodyMarkdown}
                    onChange={(e) => setBodyMarkdown(e.target.value)}
                    rows={14}
                    className="font-mono"
                  />
                </div>

                {showPreview && (
                  <div className="space-y-2">
                    <Label>Preview (raw markdown)</Label>
                    <pre className="whitespace-pre-wrap text-sm bg-zinc-900 border border-zinc-800 rounded p-3">
                      {bodyMarkdown || "(empty)"}
                    </pre>
                  </div>
                )}

                {/* Suggestions */}
                <div className="pt-2 border-t border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Suggestions</h3>
                    <span className="text-xs text-zinc-500">(Creation is minimal/stubbed)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="md:col-span-4">
                      <Textarea
                        value={suggestionText}
                        onChange={(e) => setSuggestionText(e.target.value)}
                        placeholder="Paste a proposed replacement body here (agent suggestion)..."
                        rows={3}
                        className="font-mono"
                      />
                    </div>
                    <div className="md:col-span-1 flex md:items-start">
                      <Button onClick={handleAddSuggestion} className="w-full">Add</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(selected.suggestions ?? []).length === 0 ? (
                      <WorkSurfaceEmptyState icon={<span className="text-2xl">💡</span>} title="No suggestions yet" description="Agent-proposed rewrites will show up here for accept or reject decisions." />
                    ) : (
                      (selected.suggestions ?? [])
                        .slice()
                        .reverse()
                        .map((s: EmailDraftSuggestion) => (
                          <div key={s.id} className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs text-zinc-400">
                                {s.author} - {formatDateTime(s.createdAt)}
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200">
                                {s.status}
                              </span>
                            </div>
                            <pre className="whitespace-pre-wrap text-xs bg-zinc-950 border border-zinc-800 rounded p-2">
                              {s.proposedBodyMarkdown}
                            </pre>
                            {s.status === "pending" && (
                              <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => handleAcceptSuggestion(s.id)}>
                                  Accept & Apply
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRejectSuggestion(s.id)}>
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
