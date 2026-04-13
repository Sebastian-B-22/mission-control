"use client";

import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Brain, CheckCircle2, Clock, TrendingUp, User, Zap } from "lucide-react";

interface SebastianDailyViewProps {
  userId: Id<"users">;
}

type QueueItem = {
  id: string;
  title: string;
  details?: string;
  badges?: string[];
};

function getQueueDayStartMs() {
  const now = new Date();
  const sevenAm = new Date(now);
  sevenAm.setHours(7, 0, 0, 0);

  if (now.getTime() < sevenAm.getTime()) {
    sevenAm.setDate(sevenAm.getDate() - 1);
  }

  return sevenAm.getTime();
}

function summarizeText(value?: string, maxLength = 140) {
  if (!value) return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function getCategoryEmoji(category?: string) {
  const emojis: Record<string, string> = {
    infrastructure: "🔧",
    hta: "🏠",
    aspire: "⚽",
    "agent-squad": "🤖",
    skills: "🎯",
    other: "📋",
  };

  return emojis[category || "other"] || "📋";
}

function QueueLane({
  title,
  subtitle,
  icon,
  items,
  emptyMessage,
  cardClass,
  itemClass,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  items: QueueItem[];
  emptyMessage: string;
  cardClass: string;
  itemClass: string;
}) {
  return (
    <Card className={`w-[320px] shrink-0 border shadow-none ${cardClass}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          {icon}
          {title}
        </CardTitle>
        <p className="text-sm text-zinc-400">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[620px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`rounded-xl border p-3 ${itemClass}`}>
              <p className="text-sm font-medium text-white">{item.title}</p>
              {item.details ? <p className="mt-1 text-xs leading-relaxed text-zinc-400">{item.details}</p> : null}
              {item.badges && item.badges.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.badges.map((badge) => (
                    <Badge key={badge} variant="outline" className="border-white/10 bg-black/20 text-[10px] text-zinc-200">
                      {badge}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function SebastianDailyView({ userId }: SebastianDailyViewProps) {
  const tasks = useQuery(api.sebastianTasks.getSebastianTasks, { userId }) || [];
  const overnightItems =
    useQuery(api.overnightInbox.listNewSince, {
      sinceMs: getQueueDayStartMs(),
      limit: 12,
    }) || [];
  const corinnePending = useQuery(api.pendingItems.list, { owner: "corinne", includeDone: false, limit: 20 }) || [];
  const sebastianPending = useQuery(api.pendingItems.list, { owner: "sebastian", includeDone: false, limit: 20 }) || [];
  const mavenPending = useQuery(api.pendingItems.list, { owner: "maven", includeDone: false, limit: 20 }) || [];
  const scoutPending = useQuery(api.pendingItems.list, { owner: "scout", includeDone: false, limit: 20 }) || [];
  const newIdeas = useQuery(api.agentIdeas.list, { status: "new", limit: 10 }) || [];
  const priorityIdeas = useQuery(api.agentIdeas.list, { status: "priority", limit: 10 }) || [];
  const reviewDrafts = useQuery(api.contentPipeline.listByStage, { stage: "review" }) || [];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const inProgress = tasks.filter((task: any) => task.status === "in-progress");
  const highPriorityTodo = tasks.filter((task: any) => task.status === "todo" && task.priority === "high");
  const completedToday = tasks.filter((task: any) => {
    if (task.status !== "done" || !task.completedAt) return false;
    return new Date(task.completedAt).toDateString() === new Date().toDateString();
  });

  const needsCorinne = [
    ...tasks.filter((task: any) => (task.status === "todo" || task.status === "in-progress") && task.assignedTo === "corinne"),
    ...corinnePending,
  ].slice(0, 8);

  const needsAgentWork = [
    ...tasks.filter(
      (task: any) =>
        (task.status === "todo" || task.status === "in-progress") &&
        ["sebastian", "maven", "scout", "compass", "james"].includes(task.assignedTo || "")
    ),
    ...sebastianPending,
    ...mavenPending,
    ...scoutPending,
  ].slice(0, 8);

  const actionNow: QueueItem[] = [
    ...inProgress.map((task: any) => ({
      id: `in-progress-${task._id}`,
      title: `${getCategoryEmoji(task.category)} ${task.title}`,
      details: summarizeText(task.description),
      badges: ["in progress", task.priority, task.category, task.assignedTo ? `owner: ${task.assignedTo}` : "unassigned"],
    })),
    ...highPriorityTodo.map((task: any) => ({
      id: `todo-${task._id}`,
      title: `${getCategoryEmoji(task.category)} ${task.title}`,
      details: summarizeText(task.description),
      badges: ["high priority", task.category, task.assignedTo ? `owner: ${task.assignedTo}` : "unassigned"],
    })),
    ...sebastianPending.map((item: any) => ({
      id: `pending-${item._id}`,
      title: item.title,
      details: summarizeText(item.details),
      badges: ["pending", `owner: ${item.owner}`, item.source],
    })),
  ].slice(0, 8);

  const inboxAndPending: QueueItem[] = [
    ...overnightItems.map((item: any) => ({
      id: `overnight-${item._id}`,
      title: summarizeText(item.text, 90) || "New overnight item",
      details:
        summarizeText(
          [
            item.author ? `From ${item.author}` : undefined,
            item.channel ? `Channel ${item.channel}` : undefined,
            item.topic ? `Topic ${item.topic}` : undefined,
          ]
            .filter(Boolean)
            .join(" • ")
        ) || "New item waiting for triage",
      badges: ["overnight", item.source, ...(item.tags || []).slice(0, 2)],
    })),
    ...corinnePending.map((item: any) => ({
      id: `corinne-pending-${item._id}`,
      title: item.title,
      details: summarizeText(item.details),
      badges: ["pending", `owner: ${item.owner}`, item.source],
    })),
  ].slice(0, 8);

  const reviewQueue: QueueItem[] = [
    ...reviewDrafts.map((item: any) => ({
      id: `review-draft-${item._id}`,
      title: item.title,
      details: summarizeText(item.content),
      badges: ["content review", item.type, item.createdBy],
    })),
    ...priorityIdeas.map((item: any) => ({
      id: `priority-idea-${item._id}`,
      title: item.title,
      details: summarizeText(item.summary),
      badges: ["priority idea", item.sourceAgent],
    })),
    ...newIdeas.map((item: any) => ({
      id: `new-idea-${item._id}`,
      title: item.title,
      details: summarizeText(item.summary),
      badges: ["new idea", item.sourceAgent],
    })),
  ].slice(0, 8);

  const corinneQueue: QueueItem[] = needsCorinne.map((item: any, index: number) => ({
    id: `corinne-queue-${item._id ?? index}`,
    title: item.title || item.task,
    details: summarizeText(item.description || item.details),
    badges: [item.assignedTo ? `owner: ${item.assignedTo}` : `owner: ${item.owner || "corinne"}`, item.status || "open"],
  }));

  const agentQueue: QueueItem[] = needsAgentWork.map((item: any, index: number) => ({
    id: `agent-queue-${item._id ?? index}`,
    title: item.title || item.task,
    details: summarizeText(item.description || item.details),
    badges: [item.assignedTo ? `owner: ${item.assignedTo}` : `owner: ${item.owner || "agent"}`, item.status || "open"],
  }));

  const doneTodayItems: QueueItem[] = completedToday.slice(0, 8).map((task: any) => ({
    id: `done-${task._id}`,
    title: `${getCategoryEmoji(task.category)} ${task.title}`,
    badges: [task.category, "done today"],
  }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Zap className="h-6 w-6 text-amber-500" />
          Queue focus
        </h2>
        <p className="mt-1 text-sm text-zinc-400">{today}. Work left to right: act now, triage inbox, clear review, then close loops.</p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4 pr-4">
          <QueueLane
            title={`Action now (${actionNow.length})`}
            subtitle="Active tasks, urgent project work, and Sebastian-owned pending items."
            icon={<TrendingUp className="h-5 w-5 text-amber-400" />}
            items={actionNow}
            emptyMessage="Nothing urgent is queued right now."
            cardClass="border-amber-500/30 bg-amber-500/[0.06]"
            itemClass="border-amber-500/15 bg-black/20"
          />

          <QueueLane
            title={`Inbox + pending (${inboxAndPending.length})`}
            subtitle="Fresh overnight messages and follow-ups that still need triage or reply."
            icon={<Clock className="h-5 w-5 text-blue-400" />}
            items={inboxAndPending}
            emptyMessage="Inbox is clear for now."
            cardClass="border-blue-500/30 bg-blue-500/[0.06]"
            itemClass="border-blue-500/15 bg-black/20"
          />

          <QueueLane
            title={`Needs review (${reviewQueue.length})`}
            subtitle="Draft outputs and ideas that need a decision before they rot."
            icon={<Brain className="h-5 w-5 text-violet-400" />}
            items={reviewQueue}
            emptyMessage="No review pile at the moment."
            cardClass="border-violet-500/30 bg-violet-500/[0.06]"
            itemClass="border-violet-500/15 bg-black/20"
          />

          <QueueLane
            title={`Waiting on Corinne (${corinneQueue.length})`}
            subtitle="Tasks and follow-ups that need Corinne input or a decision."
            icon={<User className="h-5 w-5 text-pink-400" />}
            items={corinneQueue}
            emptyMessage="Nothing is waiting on Corinne right now."
            cardClass="border-pink-500/30 bg-pink-500/[0.06]"
            itemClass="border-pink-500/15 bg-black/20"
          />

          <QueueLane
            title={`Agent handoffs (${agentQueue.length})`}
            subtitle="Work assigned to Sebastian or the agent squad that is still open."
            icon={<Bot className="h-5 w-5 text-cyan-400" />}
            items={agentQueue}
            emptyMessage="No agent follow-up is queued."
            cardClass="border-cyan-500/30 bg-cyan-500/[0.06]"
            itemClass="border-cyan-500/15 bg-black/20"
          />

          <QueueLane
            title={`Done today (${doneTodayItems.length})`}
            subtitle="Quick proof the queue is actually moving."
            icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
            items={doneTodayItems}
            emptyMessage="Nothing completed yet today."
            cardClass="border-green-500/30 bg-green-500/[0.06]"
            itemClass="border-green-500/15 bg-black/20"
          />
        </div>
      </div>
    </div>
  );
}
