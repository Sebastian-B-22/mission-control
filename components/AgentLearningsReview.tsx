"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle2, Archive, XCircle, Lightbulb } from "lucide-react";
import { WorkSurfaceEmptyState } from "@/components/work-surface";

const STATUSES = ["proposed", "approved", "rejected", "archived"] as const;
const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  proposed: "Proposed",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

const STATUS_STYLES: Record<(typeof STATUSES)[number], string> = {
  proposed: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  approved: "border-green-500/30 bg-green-500/10 text-green-300",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  archived: "border-zinc-700 bg-zinc-900 text-zinc-300",
};

const STATUS_CARD_STYLES: Record<(typeof STATUSES)[number], string> = {
  proposed: "border-amber-500/25 bg-amber-500/[0.06]",
  approved: "border-green-500/25 bg-green-500/[0.06]",
  rejected: "border-rose-500/25 bg-rose-500/[0.06]",
  archived: "border-zinc-800 bg-zinc-950/90",
};

export function AgentLearningsReview() {
  const proposed = useQuery(api.agentLearnings.list, { status: "proposed", limit: 100 }) || [];
  const approved = useQuery(api.agentLearnings.list, { status: "approved", limit: 100 }) || [];
  const rejected = useQuery(api.agentLearnings.list, { status: "rejected", limit: 100 }) || [];
  const archived = useQuery(api.agentLearnings.list, { status: "archived", limit: 100 }) || [];
  const setStatus = useMutation(api.agentLearnings.setStatus);

  const groups = useMemo(
    () => ({ proposed, approved, rejected, archived }),
    [proposed, approved, rejected, archived]
  );

  const total = proposed.length + approved.length + rejected.length + archived.length;

  return (
    <div className="space-y-5">
      <div className="grid gap-2 lg:grid-cols-4">
        {STATUSES.map((status) => (
          <div key={status} className={`rounded-xl border px-3 py-2 ${STATUS_CARD_STYLES[status]}`}>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">{STATUS_LABELS[status]}</div>
            <div className="mt-1 text-lg font-semibold text-white">{groups[status].length}</div>
          </div>
        ))}
      </div>

      <Card className="border-zinc-800 bg-zinc-950/90 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="h-5 w-5 text-violet-500" />
            Learnings Review Queue
            <Badge variant="outline" className="border-zinc-700 text-zinc-300">{total} total</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Keep the training loop tight. Approve durable learnings, reject bad ones, and archive anything that should stay visible but out of the active lane.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {STATUSES.map((status) => (
            <section key={status} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{STATUS_LABELS[status]}</h3>
                <Badge className={STATUS_STYLES[status]} variant="outline">
                  {groups[status].length}
                </Badge>
              </div>

              {groups[status].length === 0 ? (
                <WorkSurfaceEmptyState
                  icon={<Brain className="h-8 w-8" />}
                  title={`No ${STATUS_LABELS[status].toLowerCase()} learnings`}
                  description={status === "proposed" ? "New learning candidates will land here first." : "This lane is clear right now."}
                />
              ) : (
                groups[status].map((item: any) => (
                  <div key={item._id} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-white">{item.title}</h4>
                          <Badge variant="outline">{item.scopeType}</Badge>
                          {item.scopeKey ? <Badge variant="secondary">{item.scopeKey}</Badge> : null}
                          {typeof item.confidence === "number" ? (
                            <Badge variant="outline">Confidence {Math.round(item.confidence * 100)}%</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Proposed by {item.proposedBy} via {item.sourceType} • {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={STATUS_STYLES[status]} variant="outline">{STATUS_LABELS[status]}</Badge>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">{item.learning}</p>

                    {item.notes ? (
                      <div className="rounded-md bg-zinc-900/70 p-3 text-sm text-muted-foreground">
                        {item.notes}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
                      {status !== "approved" ? (
                        <Button size="sm" onClick={() => setStatus({ id: item._id, status: "approved" })}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      ) : null}
                      {status !== "rejected" ? (
                        <Button size="sm" variant="outline" onClick={() => setStatus({ id: item._id, status: "rejected" })}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      ) : null}
                      {status !== "archived" ? (
                        <Button size="sm" variant="secondary" onClick={() => setStatus({ id: item._id, status: "archived" })}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </Button>
                      ) : null}
                      {status !== "proposed" ? (
                        <Button size="sm" variant="ghost" onClick={() => setStatus({ id: item._id, status: "proposed" })}>
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Move back to proposed
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
