"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ApprovalsInboxDialog() {
  const pendingCount = useQuery(api.approvalsQueue.getPendingCount) ?? 0;
  const items = useQuery(api.approvalsQueue.list, { status: "pending", limit: 50 });
  const enqueueMock = useMutation(api.approvalsQueue.enqueueMock);
  const setStatus = useMutation(api.approvalsQueue.setStatus);

  const [open, setOpen] = useState(false);
  const [mockTitle, setMockTitle] = useState("");
  const [mockDetails, setMockDetails] = useState("");
  const [adding, setAdding] = useState(false);

  const headerLabel = useMemo(() => {
    if (pendingCount <= 0) return "Approvals";
    return `Approvals (${pendingCount})`;
  }, [pendingCount]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="relative">
          {headerLabel}
          {pendingCount > 0 ? (
            <span className="ml-2 inline-flex items-center justify-center text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle>Approvals Inbox</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Pending</h3>
              <Badge variant={pendingCount > 0 ? "secondary" : "outline"} className="text-[10px]">
                {pendingCount} waiting
              </Badge>
            </div>

            {!items ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing pending.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
                {items.map((it) => (
                  <div key={it._id} className="border border-zinc-800 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-zinc-100 truncate">{it.title}</div>
                        {it.details ? (
                          <div className="mt-1 text-xs text-zinc-300 whitespace-pre-wrap">{it.details}</div>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[10px]">pending</Badge>
                          {it.requestedBy ? (
                            <Badge variant="outline" className="text-[10px]">by {it.requestedBy}</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm" onClick={() => setStatus({ id: it._id, status: "approved" })}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setStatus({ id: it._id, status: "rejected" })}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mock / Add */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Add mock approval (MVP)</h3>
            <div className="space-y-2">
              <Input
                value={mockTitle}
                onChange={(e) => setMockTitle(e.target.value)}
                placeholder="Title"
              />
              <Textarea
                value={mockDetails}
                onChange={(e) => setMockDetails(e.target.value)}
                placeholder="Details (optional)"
                className="min-h-[120px]"
              />
              <Button
                disabled={adding || !mockTitle.trim()}
                onClick={async () => {
                  setAdding(true);
                  try {
                    await enqueueMock({
                      title: mockTitle.trim(),
                      details: mockDetails.trim() ? mockDetails.trim() : undefined,
                      requestedBy: "mission-control-ui",
                    });
                    setMockTitle("");
                    setMockDetails("");
                  } finally {
                    setAdding(false);
                  }
                }}
              >
                {adding ? "Adding…" : "Add to approvals"}
              </Button>

              <p className="text-xs text-muted-foreground">
                This is a placeholder inbox until we wire real approval events (content pipeline, outbound messages, etc.).
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
