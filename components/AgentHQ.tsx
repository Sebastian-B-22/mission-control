"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useGatewayStatus } from "@/hooks/useGatewayStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type TopicKey = "operations" | "marketing" | "family" | "ideas" | "general";

type ChannelKey = "main" | "aspire-ops" | "hta-launch" | "family" | "ideas";

const TOPICS: Array<{ key: TopicKey; label: string }> = [
  { key: "operations", label: "Operations" },
  { key: "marketing", label: "Marketing" },
  { key: "family", label: "Family" },
  { key: "ideas", label: "Ideas" },
  { key: "general", label: "General" },
];

const CHANNELS: Array<{ key: ChannelKey; label: string }> = [
  { key: "main", label: "General" },
  { key: "aspire-ops", label: "Operations" },
  { key: "hta-launch", label: "Marketing" },
  { key: "family", label: "Family" },
  { key: "ideas", label: "Ideas" },
];

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Severity = "critical" | "warn" | "info" | "other";

function classifyLine(line: string): Severity {
  const s = line.toLowerCase();
  if (/(^|\b)(critical|sev0|sev1|high)\b/.test(s)) return "critical";
  if (/(^|\b)(warn|warning|medium)\b/.test(s)) return "warn";
  if (/(^|\b)(info|ok|pass|passed|low)\b/.test(s)) return "info";
  return "other";
}

function groupBySeverity(output: string) {
  const lines = output.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const grouped: Record<Severity, string[]> = {
    critical: [],
    warn: [],
    info: [],
    other: [],
  };
  for (const line of lines) grouped[classifyLine(line)].push(line);
  return grouped;
}

type HuddleMsg = Doc<"agentHuddle"> & {
  channel?: string;
  mentions?: string[];
  deliveredToTopic?: string;
  deliveredAt?: number;
};

export function AgentHQ({ userId }: { userId: Id<"users"> }) {
  const [topic, setTopic] = useState<TopicKey>("general");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendOk, setSendOk] = useState<string | null>(null);

  // Gateway-dependent ops
  const gw = useGatewayStatus({ pollMs: 10_000 });
  const [doctorRunning, setDoctorRunning] = useState(false);
  const [securityRunning, setSecurityRunning] = useState(false);
  const [doctorOut, setDoctorOut] = useState<string | null>(null);
  const [securityOut, setSecurityOut] = useState<string | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);

  // Pending / Next Up
  const createPendingItem = useMutation(api.pendingItems.create);
  const setPendingItemStatus = useMutation(api.pendingItems.setStatus);

  const [pendingOwnerFilter, setPendingOwnerFilter] = useState<string>("all");
  const [pendingTagFilter, setPendingTagFilter] = useState<string>("");
  const [pendingIncludeDone, setPendingIncludeDone] = useState(false);

  const [piTitle, setPiTitle] = useState("");
  const [piDetails, setPiDetails] = useState("");
  const [piOwner, setPiOwner] = useState("corinne");
  const [piTags, setPiTags] = useState("");
  const [piSaving, setPiSaving] = useState(false);
  const [piError, setPiError] = useState<string | null>(null);

  const pendingItems = useQuery(api.pendingItems.list, {
    owner: pendingOwnerFilter === "all" ? undefined : pendingOwnerFilter,
    tag: pendingTagFilter.trim() ? pendingTagFilter.trim() : undefined,
    includeDone: pendingIncludeDone,
    limit: 80,
  });

  // Overnight Inbox (since 9pm)
  function since9pmMs() {
    const now = new Date();
    const ninePm = new Date(now);
    ninePm.setHours(21, 0, 0, 0);
    if (now.getTime() < ninePm.getTime()) {
      ninePm.setDate(ninePm.getDate() - 1);
    }
    return ninePm.getTime();
  }

  const overnightSince = since9pmMs();

  const overnightItems = useQuery(api.overnightInbox.listNewSince, {
    sinceMs: overnightSince,
    limit: 60,
  });

  const overnightArchive = useMutation(api.overnightInbox.archive);
  const overnightPromoteToPending = useMutation(api.overnightInbox.promoteToPending);
  const overnightPromoteToProjects = useMutation(api.overnightInbox.promoteToProjects);

  async function addPendingItem() {
    const title = piTitle.trim();
    if (!title) return;
    setPiSaving(true);
    setPiError(null);

    try {
      const tags = piTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await createPendingItem({
        title,
        details: piDetails.trim() ? piDetails.trim() : undefined,
        owner: piOwner.trim() ? piOwner.trim() : "unassigned",
        status: "open",
        source: "manual",
        tags,
      });

      setPiTitle("");
      setPiDetails("");
      setPiTags("");
    } catch (e) {
      setPiError(e instanceof Error ? e.message : String(e));
    } finally {
      setPiSaving(false);
    }
  }

  // One query for feed - filter client-side.
  const recent = useQuery(api.agentHuddle.getRecent, { limit: 80 }) as HuddleMsg[] | undefined;
  const recentSafe = recent ?? [];

  const [feedChannel, setFeedChannel] = useState<ChannelKey>("main");

  const feedItems = useMemo(() => {
    return recentSafe
      .filter((m) => (m.channel || "main") === feedChannel)
      .slice(-20)
      .reverse();
  }, [recentSafe, feedChannel]);

  const pings = useMemo(() => {
    return recentSafe
      .filter((m) => {
        const msg = String(m.message || "");
        const mentions = (m.mentions || []) as string[];
        return /@corinne\b/i.test(msg) || mentions.map((x) => x.toLowerCase()).includes("corinne");
      })
      .slice(-20)
      .reverse();
  }, [recentSafe]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    setSendError(null);
    setSendOk(null);

    try {
      const res = await fetch("/api/agent-hq/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          topic,
          requestedBy: "mission-control-ui",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send");
      }

      setText("");
      setSendOk("Queued to Telegram outbox");
      setTimeout(() => setSendOk(null), 2500);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  async function runDoctor() {
    setHealthErr(null);
    setDoctorOut(null);
    setDoctorRunning(true);
    try {
      const res = await fetch("/api/gateway/doctor", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Doctor failed");
      setDoctorOut(String(data?.output || ""));
    } catch (e) {
      setHealthErr(e instanceof Error ? e.message : String(e));
    } finally {
      setDoctorRunning(false);
    }
  }

  async function runSecurityAudit() {
    setHealthErr(null);
    setSecurityOut(null);
    setSecurityRunning(true);
    try {
      const res = await fetch("/api/gateway/security-audit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Security audit failed");
      setSecurityOut(String(data?.output || ""));
    } catch (e) {
      setHealthErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSecurityRunning(false);
    }
  }

  const doctorGrouped = doctorOut ? groupBySeverity(doctorOut) : null;
  const securityGrouped = securityOut ? groupBySeverity(securityOut) : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent HQ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quick broadcast + huddle pulse + pings for Corinne
          </p>
        </div>
        <a
          href="/api/paperclip/agents"
          className="text-xs text-blue-400 hover:text-blue-300"
          target="_blank"
          rel="noreferrer"
        >
          Paperclip ↗
        </a>
      </div>

      {/* Health (Gateway) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Health</CardTitle>
          <p className="text-xs text-muted-foreground">
            Run host checks via the OpenClaw gateway. (No autofix yet.)
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!gw.connected ? (
            <div className="border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300">
              <div className="font-medium text-zinc-200">Gateway disconnected</div>
              <div className="mt-1 text-muted-foreground">
                Panels that require the operator host are disabled. Set <code className="text-zinc-200">OPENCLAW_GATEWAY_URL</code> and ensure the gateway is reachable.
              </div>
              {gw.error ? <div className="mt-2 text-[11px] text-red-400">{gw.error}</div> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={runDoctor} disabled={!gw.connected || doctorRunning}>
              {doctorRunning ? "Running Doctor…" : "Run OpenClaw Doctor"}
            </Button>
            <Button size="sm" variant="secondary" onClick={runSecurityAudit} disabled={!gw.connected || securityRunning}>
              {securityRunning ? "Running Security Audit…" : "Run Security Audit (deep)"}
            </Button>
          </div>

          {healthErr ? <p className="text-xs text-red-400">{healthErr}</p> : null}

          {/* Results */}
          {doctorGrouped ? (
            <div className="space-y-2">
              <div className="text-xs font-medium">Doctor results</div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <Badge variant="destructive">Critical {doctorGrouped.critical.length}</Badge>
                <Badge variant="secondary">Warn {doctorGrouped.warn.length}</Badge>
                <Badge variant="outline">Info {doctorGrouped.info.length}</Badge>
              </div>
              <details className="border border-zinc-800 rounded-lg p-3">
                <summary className="cursor-pointer text-xs text-zinc-300">Raw output</summary>
                <pre className="mt-2 text-[11px] whitespace-pre-wrap text-zinc-200">{doctorOut}</pre>
              </details>
            </div>
          ) : null}

          {securityGrouped ? (
            <div className="space-y-2">
              <div className="text-xs font-medium">Security audit results</div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <Badge variant="destructive">Critical {securityGrouped.critical.length}</Badge>
                <Badge variant="secondary">Warn {securityGrouped.warn.length}</Badge>
                <Badge variant="outline">Info {securityGrouped.info.length}</Badge>
              </div>
              <details className="border border-zinc-800 rounded-lg p-3">
                <summary className="cursor-pointer text-xs text-zinc-300">Raw output</summary>
                <pre className="mt-2 text-[11px] whitespace-pre-wrap text-zinc-200">{securityOut}</pre>
              </details>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overnight Inbox */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Overnight Inbox (since 9pm)</CardTitle>
            <p className="text-xs text-muted-foreground">
              New items pushed in by the Mac mini poller for quick morning triage.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {!overnightItems ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : overnightItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">No new items since 9pm.</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-auto pr-2">
                {overnightItems.map((it) => (
                  <div key={it._id} className="border border-zinc-800 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{it.source}</Badge>
                          {it.channel ? (
                            <Badge variant="outline" className="text-[10px]">ch: {it.channel}</Badge>
                          ) : null}
                          {it.topic ? (
                            <Badge variant="outline" className="text-[10px]">topic: {it.topic}</Badge>
                          ) : null}
                          {it.author ? (
                            <Badge variant="outline" className="text-[10px]">by {it.author}</Badge>
                          ) : null}
                          <Badge variant="outline" className="text-[10px]">{formatTime(it.createdAt)}</Badge>
                        </div>
                        <div className="mt-2 text-sm whitespace-pre-wrap text-zinc-200">{it.text}</div>
                        {it.tags?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {it.tags.map((t: string) => (
                              <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={async () => {
                            await overnightPromoteToProjects({
                              id: it._id,
                              userId,
                              status: "backlog",
                            });
                          }}
                        >
                          Promote to Projects
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            await overnightPromoteToPending({
                              id: it._id,
                              owner: "corinne",
                            });
                          }}
                        >
                          Promote to Pending
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await overnightArchive({ id: it._id });
                          }}
                        >
                          Archive
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending / Next Up */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Pending / Next Up</CardTitle>
            <p className="text-xs text-muted-foreground">
              A lightweight list of open items to track what needs doing next.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick add */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
              <div className="md:col-span-5 space-y-2">
                <Label htmlFor="pi-title">Title</Label>
                <Input
                  id="pi-title"
                  value={piTitle}
                  onChange={(e) => setPiTitle(e.target.value)}
                  placeholder="e.g. Follow up with Agoura roster"
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="pi-owner">Owner</Label>
                <Input
                  id="pi-owner"
                  value={piOwner}
                  onChange={(e) => setPiOwner(e.target.value)}
                  placeholder="corinne / sebastian / scout"
                />
              </div>
              <div className="md:col-span-4 space-y-2">
                <Label htmlFor="pi-tags">Tags (comma-separated)</Label>
                <Input
                  id="pi-tags"
                  value={piTags}
                  onChange={(e) => setPiTags(e.target.value)}
                  placeholder="aspire, registration"
                />
              </div>
              <div className="md:col-span-12 space-y-2">
                <Label htmlFor="pi-details">Details (optional)</Label>
                <Textarea
                  id="pi-details"
                  value={piDetails}
                  onChange={(e) => setPiDetails(e.target.value)}
                  placeholder="Context, links, what ‘done’ means…"
                  className="min-h-[70px]"
                />
              </div>
              <div className="md:col-span-12 flex items-center gap-3">
                <Button onClick={addPendingItem} disabled={piSaving || !piTitle.trim()}>
                  {piSaving ? "Adding..." : "Add"}
                </Button>
                {piError && <p className="text-xs text-red-400">{piError}</p>}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="w-full md:w-[220px] space-y-2">
                <Label htmlFor="pi-filter-owner">Filter owner</Label>
                <Input
                  id="pi-filter-owner"
                  value={pendingOwnerFilter === "all" ? "" : pendingOwnerFilter}
                  onChange={(e) => setPendingOwnerFilter(e.target.value.trim() ? e.target.value.trim() : "all")}
                  placeholder="(blank = all)"
                />
              </div>
              <div className="w-full md:w-[220px] space-y-2">
                <Label htmlFor="pi-filter-tag">Filter tag</Label>
                <Input
                  id="pi-filter-tag"
                  value={pendingTagFilter}
                  onChange={(e) => setPendingTagFilter(e.target.value)}
                  placeholder="e.g. aspire"
                />
              </div>
              <div className="flex items-center gap-2 md:pb-2">
                <Checkbox
                  id="pi-include-done"
                  checked={pendingIncludeDone}
                  onCheckedChange={(v) => setPendingIncludeDone(Boolean(v))}
                />
                <Label htmlFor="pi-include-done" className="text-sm">
                  Include done
                </Label>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[360px] overflow-auto pr-2">
              {!pendingItems ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : pendingItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">No pending items.</p>
              ) : (
                pendingItems.map((item) => (
                  <div key={item._id} className="border border-zinc-800 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm truncate">{item.title}</span>
                          <Badge variant={item.status === "blocked" ? "destructive" : item.status === "done" ? "secondary" : "outline"} className="text-[10px]">
                            {item.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            owner: {item.owner}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {item.source}
                          </Badge>
                        </div>
                        {item.details && (
                          <div className="mt-2 text-sm whitespace-pre-wrap text-zinc-200">{item.details}</div>
                        )}
                        {item.tags?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.tags.map((t: string) => (
                              <Badge key={t} variant="secondary" className="text-[10px]">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        {item.status !== "done" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setPendingItemStatus({ id: item._id, status: "done" })}
                          >
                            Mark done
                          </Button>
                        )}
                        {item.status !== "blocked" && item.status !== "done" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPendingItemStatus({ id: item._id, status: "blocked" })}
                          >
                            Block
                          </Button>
                        )}
                        {item.status === "blocked" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPendingItemStatus({ id: item._id, status: "open" })}
                          >
                            Unblock
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Send */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quick Send</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {TOPICS.map((t) => (
                <Button
                  key={t.key}
                  variant={topic === t.key ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setTopic(t.key)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message to send into the Agent HQ Telegram topics..."
              className="min-h-[140px]"
            />
            <div className="flex items-center gap-3">
              <Button onClick={send} disabled={sending || !text.trim()}>
                {sending ? "Sending..." : "Send"}
              </Button>
              <Badge variant="outline">Topic: {topic}</Badge>
            </div>
            {sendError && <p className="text-xs text-red-400">{sendError}</p>}
            {sendOk && <p className="text-xs text-green-500">{sendOk}</p>}
            <p className="text-xs text-muted-foreground">
              This queues a Telegram send. The Mac mini poller delivers it via OpenClaw.
            </p>
          </CardContent>
        </Card>

        {/* What's happening */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Whats happening</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Tabs value={feedChannel} onValueChange={(v) => setFeedChannel(v as ChannelKey)}>
              <TabsList className="flex flex-wrap h-auto">
                {CHANNELS.map((c) => (
                  <TabsTrigger key={c.key} value={c.key} className="text-xs">
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {CHANNELS.map((c) => (
                <TabsContent key={c.key} value={c.key}>
                  <div className="space-y-3 max-h-[460px] overflow-auto pr-2">
                    {feedItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No recent messages.</p>
                    ) : (
                      feedItems.map((m) => (
                        <div key={m._id} className="border border-zinc-800 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-zinc-300">
                              <span className="font-medium">{m.agent}</span>
                              <span className="text-zinc-500">  </span>
                              <span className="text-zinc-500">{formatTime(m.createdAt)}</span>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">
                              {m.channel || "main"}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm whitespace-pre-wrap">{m.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Pings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Pings for you</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[560px] overflow-auto pr-2">
              {pings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No @corinne mentions in recent huddle.</p>
              ) : (
                pings.map((m) => (
                  <div key={m._id} className="border border-zinc-800 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-zinc-300">
                        <span className="font-medium">{m.agent}</span>
                        <span className="text-zinc-500">  </span>
                        <span className="text-zinc-500">{formatTime(m.createdAt)}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {m.channel || "main"}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm whitespace-pre-wrap">{m.message}</div>
                    {(m.deliveredToTopic || m.deliveredAt) && (
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        Delivered{m.deliveredToTopic ? ` to ${m.deliveredToTopic}` : ""}
                        {m.deliveredAt ? ` at ${formatTime(m.deliveredAt)}` : ""}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
