"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Archive, CheckCircle2, FileText, History, Link2, Search, Tags } from "lucide-react";

type Area = "all" | "aspire" | "hta" | "homeschool" | "family" | "health" | "operations" | "personal" | "other";
type Status = "all" | "draft" | "current" | "final" | "archived";

const AREAS: Array<{ value: Area; label: string }> = [
  { value: "all", label: "All areas" },
  { value: "aspire", label: "Aspire" },
  { value: "hta", label: "HTA" },
  { value: "homeschool", label: "Homeschool" },
  { value: "family", label: "Family" },
  { value: "health", label: "Health" },
  { value: "operations", label: "Operations" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

const STATUSES: Array<{ value: Status; label: string }> = [
  { value: "all", label: "All status" },
  { value: "final", label: "Final" },
  { value: "current", label: "Current" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

function formatDate(ms?: number) {
  if (!ms) return "Unknown";
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fileViewerUrl(fileUrl: string, title: string) {
  const params = new URLSearchParams({
    file: fileUrl,
    title,
    back: "/dashboard?view=knowledge-files",
  });

  return `/knowledge-viewer?${params.toString()}`;
}

function statusTone(status?: string) {
  switch (status) {
    case "final":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "current":
      return "border-cyan-500/40 bg-cyan-500/10 text-cyan-200";
    case "draft":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    case "archived":
    case "superseded":
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

function areaTone(area?: string) {
  switch (area) {
    case "aspire":
      return "bg-red-500/12 text-red-100";
    case "hta":
      return "bg-cyan-500/12 text-cyan-100";
    case "homeschool":
      return "bg-emerald-500/12 text-emerald-100";
    case "health":
      return "bg-rose-500/12 text-rose-100";
    case "family":
      return "bg-violet-500/12 text-violet-100";
    default:
      return "bg-zinc-800 text-zinc-200";
  }
}

export function KnowledgeFilesView({ userId }: { userId: Id<"users"> }) {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState<Area>("all");
  const [status, setStatus] = useState<Status>("all");
  const [selectedId, setSelectedId] = useState<Id<"knowledgeDocuments"> | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const seedEvaluationDay = useMutation(api.knowledgeFiles.seedEvaluationDayExample);

  const documents = useQuery(api.knowledgeFiles.list, {
    userId,
    search: search.trim() || undefined,
    area: area === "all" ? undefined : area,
    status: status === "all" ? undefined : status,
    limit: 200,
  });

  const selected = useQuery(
    api.knowledgeFiles.get,
    selectedId ? { documentId: selectedId } : "skip"
  );

  useEffect(() => {
    if (documents && documents.length > 0 && !selectedId) {
      setSelectedId(documents[0]._id);
    }
  }, [documents, selectedId]);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of documents ?? []) {
      for (const tag of doc.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12);
  }, [documents]);

  async function seedExample() {
    setSeeded(true);
    const id = await seedEvaluationDay({ userId });
    setSelectedId(id);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-bold">Docs</h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            Final files stay clean on top. Drafts, Telegram attachments, and generated versions are preserved in history without cluttering search.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={seedExample}
          disabled={seeded}
          className="border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Add Evaluation Day Example
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search files, tags, decisions..."
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={area}
                onChange={(event) => setArea(event.target.value as Area)}
                className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-200"
              >
                {AREAS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as Status)}
                className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-200"
              >
                {STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(([tag, count]) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:border-amber-500/50 hover:text-amber-200"
                    onClick={() => setSearch(tag)}
                  >
                    {tag} <span className="text-zinc-500">{count}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="max-h-[66vh] space-y-2 overflow-auto pr-1">
              {documents === undefined ? (
                <p className="text-sm text-zinc-500">Loading files...</p>
              ) : documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-800 p-4 text-sm text-zinc-400">
                  No documents yet. Add the Evaluation Day example or ingest files through the Docs API.
                </div>
              ) : (
                documents.map((doc) => (
                  <button
                    key={doc._id}
                    type="button"
                    onClick={() => {
                      setSelectedId(doc._id);
                      setShowHistory(false);
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedId === doc._id
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">{doc.title}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {doc.project || doc.collection || doc.docType} · {doc.currentVersion?.fileName || "No current file"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] capitalize ${statusTone(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{doc.versionCount} version{doc.versionCount === 1 ? "" : "s"}</span>
                      <span>{formatDate(doc.updatedAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedId && selected === undefined ? (
            <Card className="border-zinc-800 bg-zinc-950">
              <CardContent className="p-6 text-sm text-zinc-500">Loading document...</CardContent>
            </Card>
          ) : !selectedId || selected == null ? (
            <Card className="border-zinc-800 bg-zinc-950">
              <CardContent className="p-6 text-sm text-zinc-500">Select a document to see the current file and version history.</CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-zinc-800 bg-zinc-950">
                <CardHeader className="space-y-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={areaTone(selected.area)}>{selected.area}</Badge>
                        <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${statusTone(selected.status)}`}>
                          {selected.status}
                        </span>
                        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs capitalize text-zinc-300">
                          {selected.docType}
                        </span>
                      </div>
                      <CardTitle className="mt-3 text-xl">{selected.title}</CardTitle>
                      <p className="mt-1 text-sm text-zinc-400">
                        {[selected.project, selected.collection].filter(Boolean).join(" / ") || selected.artifactKey}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowHistory((value) => !value)}
                      className="border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900"
                    >
                      <History className="mr-2 h-4 w-4" />
                      {selected.versions.length - 1 > 0 ? `${selected.versions.length - 1} previous` : "History"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {selected.decisionSummary && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">Decision Summary</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-200">{selected.decisionSummary}</p>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-zinc-800 bg-black/25 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Current File</p>
                      {selected.currentVersion ? (
                        <div className="mt-3 space-y-2">
                          <p className="text-base font-medium text-zinc-100">{selected.currentVersion.fileName}</p>
                          <p className="text-sm text-zinc-400">{selected.currentVersion.summary || selected.currentVersion.sourceNote}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                            <span>v{selected.currentVersion.versionNumber}</span>
                            <span>{selected.currentVersion.fileKind}</span>
                            <span>{formatDate(selected.currentVersion.createdAt)}</span>
                          </div>
                          {selected.currentVersion.fileUrl && (
                            <a
                              href={fileViewerUrl(selected.currentVersion.fileUrl, selected.currentVersion.fileName)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              Open file
                            </a>
                          )}
                          {selected.currentVersion.localPath && (
                            <p className="break-all rounded bg-zinc-900 p-2 text-xs text-zinc-400">{selected.currentVersion.localPath}</p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-zinc-500">No current version promoted yet.</p>
                      )}
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-black/25 p-4">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        <Tags className="h-3.5 w-3.5" />
                        Tags & Source
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {selected.tags.map((tag: string) => (
                          <span key={tag} className="rounded-full bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 space-y-1 text-xs text-zinc-500">
                        <p>Artifact: {selected.artifactKey}</p>
                        {selected.sourceThreadId && <p>Source thread: {selected.sourceThreadId}</p>}
                        {selected.sourceMessageIds?.length ? <p>Messages: {selected.sourceMessageIds.join(", ")}</p> : null}
                        <p>Updated: {formatDate(selected.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {showHistory && (
                <Card className="border-zinc-800 bg-zinc-950">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Archive className="h-4 w-4 text-zinc-400" />
                      Version History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selected.versions.map((version: any) => (
                      <div key={version._id} className="rounded-lg border border-zinc-800 bg-black/20 p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-zinc-100">
                              v{version.versionNumber} · {version.fileName}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">{version.summary || version.sourceNote || version.localPath}</p>
                          </div>
                          <span className={`w-fit rounded-full border px-2 py-0.5 text-[10px] capitalize ${statusTone(version.versionStatus)}`}>
                            {version.versionStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
