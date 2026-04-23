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

type ChannelKey = "main" | "aspire-ops" | "hta-launch" | "family" | "ideas" | "overnight-strategy";

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
  { key: "overnight-strategy", label: "Overnight" },
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
  source?: "mission-control" | "telegram" | "huddle" | "agent-trigger" | "manual" | "system";
  sourceAuthor?: string;
};

type TelegramOutboxMsg = Doc<"telegramOutbox">;

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

  // Pushed health runs (works even without gateway)
  const recentHealthRuns = useQuery(api.healthRuns.listRecentHealthRuns, {
    userId,
    limit: 20,
  });
  const recentOutbox = useQuery(api.telegramOutbox.getRecent, { limit: 12 }) as TelegramOutboxMsg[] | undefined;

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

  // Overnight Inbox (since 7am)
  // Rationale: overnight agent jobs tend to run early morning; Corinne should wake up and see them.
  function since7amMs() {
    const now = new Date();
    const sevenAm = new Date(now);
    sevenAm.setHours(7, 0, 0, 0);
    // If it's before 7am, show items since yesterday 7am.
    if (now.getTime() < sevenAm.getTime()) {
      sevenAm.setDate(sevenAm.getDate() - 1);
    }
    return sevenAm.getTime();
  }

  const overnightSince = since7amMs();

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
      setSendOk("Posted to Huddle and queued to Telegram");
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

  const latestDoctorRun = useMemo(() => {
    const runs = recentHealthRuns ?? [];
    return runs.find((r) => r.kind === "doctor") ?? null;
  }, [recentHealthRuns]);

  const latestSecurityRun = useMemo(() => {
    const runs = recentHealthRuns ?? [];
    return runs.find((r) => r.kind === "security_audit") ?? null;
  }, [recentHealthRuns]);

  function statusBadgeVariant(status: string): "destructive" | "secondary" | "outline" {
    if (status === "critical") return "destructive";
    if (status === "warn") return "secondary";
    return "outline";
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Telegram Bridge</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mission Control is the hub. Telegram is the fast edge. Sebastian routes the work.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-100">
        <span className="font-medium text-white">Default model:</span> Telegram with Sebastian for fast operating conversation, Mission Control for tracking, backlog, drafts, and internal agent collaboration.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-sky-500/20 bg-sky-500/5">
          <CardHeader>
            <CardTitle className="text-base">Telegram Bridge</CardTitle>
            <p className="text-xs text-sky-100/70">
              Send from Mission Control into Telegram topics. Human replies in Telegram are meant to flow back here.
            </p>
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
              placeholder="Send from Mission Control to a Telegram topic. Example: TEST bridge please reply 'got it'"
              className="min-h-[180px] border-sky-500/20 bg-zinc-950/80"
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
              This is the only Mission Control composer that sends to Telegram.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-base">Recent bridge activity</CardTitle>
            <p className="text-xs text-emerald-100/70">
              Outbound messages queued for Telegram and their delivery status.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
              {!recentOutbox ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : recentOutbox.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent bridge messages.</p>
              ) : (
                recentOutbox.map((m) => (
                  <div key={m._id} className="border border-zinc-800 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                        <Badge variant="outline" className="text-[10px]">topic: {m.topic}</Badge>
                        {m.deliveredThreadId ? <Badge variant="outline" className="text-[10px]">thread: {m.deliveredThreadId}</Badge> : null}
                        <span>{formatTime(m.createdAt)}</span>
                      </div>
                      <Badge
                        variant={m.status === "failed" ? "destructive" : m.status === "sent" ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {m.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm whitespace-pre-wrap">{m.text}</div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {m.status === "sent"
                        ? `Delivered${m.sentAt ? ` at ${formatTime(m.sentAt)}` : ""}${m.deliveredAccountId ? ` via ${m.deliveredAccountId}` : ""}`
                        : m.status === "failed"
                          ? m.error || "Send failed"
                          : "Queued for Mac mini poller"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-violet-500/20 bg-violet-500/5">
          <CardHeader>
            <CardTitle className="text-base">Recent internal huddle</CardTitle>
            <p className="text-xs text-violet-100/70">
              Actual agent conversation inside Mission Control.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Tabs value={feedChannel} onValueChange={(v) => setFeedChannel(v as ChannelKey)}>
              <TabsList className="flex flex-wrap h-auto border border-violet-500/10 bg-violet-950/30">
                {CHANNELS.map((c) => (
                  <TabsTrigger key={c.key} value={c.key} className="text-xs">
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {CHANNELS.map((c) => (
                <TabsContent key={c.key} value={c.key}>
                  <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
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
                          {m.source === "telegram" ? (
                            <div className="mt-2 text-[11px] text-blue-300">
                              From Telegram{m.sourceAuthor ? ` by ${m.sourceAuthor}` : ""}
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
