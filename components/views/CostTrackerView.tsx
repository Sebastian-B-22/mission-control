"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(n);
}

export function CostTrackerView(props: { userId: Id<"users"> }) {
  const summary = useQuery(api.costTracker.getSummary, { userId: props.userId });
  const recent = useQuery(api.costTracker.listRecent, { userId: props.userId, days: 7, limit: 200 });
  const ingest = useMutation(api.costTracker.ingest);

  // Manual entry (MVP)
  const [agent, setAgent] = useState("sebastian");
  const [model, setModel] = useState("gpt-4.1");
  const [inputTokens, setInputTokens] = useState<string>("");
  const [outputTokens, setOutputTokens] = useState<string>("");
  const [costUsd, setCostUsd] = useState<string>("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Cost Tracker</h1>
        <p className="text-sm text-zinc-400">
          MVP: manual or agent-ingested cost events.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm">Totals</CardTitle>
          </CardHeader>
          <CardContent>
            {!summary ? (
              <p className="text-xs text-zinc-400">Loading…</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Today</span>
                  <span className="text-sm font-medium text-zinc-100">{fmtUsd(summary.todayTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Last 7d</span>
                  <span className="text-sm font-medium text-zinc-100">{fmtUsd(summary.last7dTotal)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm">Manual event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-zinc-400">Agent</Label>
                <Input value={agent} onChange={(e) => setAgent(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Model</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-zinc-400">In tokens</Label>
                <Input value={inputTokens} onChange={(e) => setInputTokens(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Out tokens</Label>
                <Input value={outputTokens} onChange={(e) => setOutputTokens(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Cost (USD)</Label>
                <Input value={costUsd} onChange={(e) => setCostUsd(e.target.value)} className="mt-1" />
              </div>
            </div>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black"
              onClick={async () => {
                await ingest({
                  userId: props.userId,
                  agent: agent.trim() || "unknown",
                  model: model.trim() || "unknown",
                  inputTokens: inputTokens.trim() ? Number(inputTokens) : undefined,
                  outputTokens: outputTokens.trim() ? Number(outputTokens) : undefined,
                  costUsd: Number(costUsd || 0),
                });
                setCostUsd("");
              }}
            >
              Add cost event
            </Button>
            <p className="text-[11px] text-zinc-500">
              Tip: agents can POST to <code className="px-1 rounded bg-zinc-900">/cost-events/ingest</code>.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm">Last 7 days (recent)</CardTitle>
        </CardHeader>
        <CardContent>
          {!recent ? (
            <p className="text-xs text-zinc-400">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-xs text-zinc-400">No events yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((e: any) => (
                <div key={e._id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="text-zinc-200 truncate">
                      <span className="font-medium">{e.agent}</span> - {e.model}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {new Date(e.createdAt).toLocaleString()}
                      {e.inputTokens !== undefined || e.outputTokens !== undefined ? (
                        <>
                          {" · "}
                          {e.inputTokens ?? "?"} in / {e.outputTokens ?? "?"} out
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-zinc-100 font-medium">{fmtUsd(e.costUsd)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
