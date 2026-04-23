"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Brain, CheckCircle2, ChevronDown, ChevronUp, Clock, Lightbulb, TrendingUp, User, Zap } from "lucide-react";
import { SelfImprovementFeedback } from "./SelfImprovementFeedback";

interface SebastianDailyViewProps {
  userId: Id<"users">;
}

type QueueItem = {
  id: string;
  title: string;
  details?: string;
  badges?: string[];
};

type SecondaryQueueSectionId =
  | "waiting-on-corinne"
  | "agent-handoffs"
  | "done-today"
  | "daily-rhythm"
  | "idea-pressure";

const QUEUE_SECTION_STORAGE_KEY = "mission-control:queue-secondary-sections:v1";

const DEFAULT_SECONDARY_SECTION_STATE: Record<SecondaryQueueSectionId, boolean> = {
  "waiting-on-corinne": false,
  "agent-handoffs": false,
  "done-today": false,
  "daily-rhythm": false,
  "idea-pressure": false,
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

function getCollapsedPreview(items: QueueItem[], emptyMessage: string) {
  if (items.length === 0) return emptyMessage;
  const firstItem = items[0];
  if (items.length === 1) {
    return firstItem.details ? `${firstItem.title} - ${firstItem.details}` : firstItem.title;
  }
  return firstItem.details
    ? `${firstItem.title} - ${firstItem.details} (+${items.length - 1} more)`
    : `${firstItem.title} (+${items.length - 1} more)`;
}

function QueueListCard({
  title,
  subtitle,
  icon,
  items,
  emptyMessage,
  accentClass,
  itemClass = "",
  collapsible = false,
  isOpen = true,
  onToggle,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  items: QueueItem[];
  emptyMessage: string;
  accentClass: string;
  itemClass?: string;
  collapsible?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const preview = getCollapsedPreview(items, emptyMessage);

  return (
    <Card className={accentClass}>
      <CardHeader className={collapsible ? "pb-4" : undefined}>
        {collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-start justify-between gap-3 text-left"
          >
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                {icon}
                {title}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{isOpen ? subtitle : preview}</p>
            </div>
            <div className="mt-1 shrink-0 rounded-full border border-zinc-800 bg-zinc-950/70 p-1.5 text-zinc-400">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>
        ) : (
          <>
            <CardTitle className="flex items-center gap-2 text-lg">
              {icon}
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </>
        )}
      </CardHeader>
      {(!collapsible || isOpen) && (
        <CardContent className="space-y-3 md:max-h-[420px] md:overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className={`rounded-lg border border-zinc-800 p-2.5 ${itemClass || "bg-zinc-950/60"}`}>
                <p className="text-sm font-medium text-white">{item.title}</p>
                {item.details ? (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.details}</p>
                ) : null}
                {item.badges && item.badges.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.badges.map((badge) => (
                      <Badge key={badge} variant="outline" className="text-[10px]">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function SebastianDailyView({ userId }: SebastianDailyViewProps) {
  const [secondarySectionOpen, setSecondarySectionOpen] = useState<Record<SecondaryQueueSectionId, boolean>>(
    DEFAULT_SECONDARY_SECTION_STATE
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(QUEUE_SECTION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<SecondaryQueueSectionId, boolean>>;
      setSecondarySectionOpen((current) => ({ ...current, ...parsed }));
    } catch {
      // ignore localStorage issues
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(QUEUE_SECTION_STORAGE_KEY, JSON.stringify(secondarySectionOpen));
    } catch {
      // ignore localStorage issues
    }
  }, [secondarySectionOpen]);

  const setSectionOpen = (section: SecondaryQueueSectionId, isOpen: boolean) => {
    setSecondarySectionOpen((current) => ({ ...current, [section]: isOpen }));
  };

  const setAllSecondarySections = (isOpen: boolean) => {
    setSecondarySectionOpen({
      "waiting-on-corinne": isOpen,
      "agent-handoffs": isOpen,
      "done-today": isOpen,
      "daily-rhythm": isOpen,
      "idea-pressure": isOpen,
    });
  };

  const tasks = useQuery(api.sebastianTasks.getSebastianTasks, { userId }) || [];
  const cronJobs = useQuery(api.cronJobs.getCronJobs) || [];
  const overnightItems = useQuery(api.overnightInbox.listNewSince, {
    sinceMs: getQueueDayStartMs(),
    limit: 12,
  }) || [];
  const corinnePending = useQuery(api.pendingItems.list, { owner: "corinne", includeDone: false, limit: 20 }) || [];
  const sebastianPending = useQuery(api.pendingItems.list, { owner: "sebastian", includeDone: false, limit: 20 }) || [];
  const mavenPending = useQuery(api.pendingItems.list, { owner: "maven", includeDone: false, limit: 20 }) || [];
  const scoutPending = useQuery(api.pendingItems.list, { owner: "scout", includeDone: false, limit: 20 }) || [];
  const proposedLearnings = useQuery(api.agentLearnings.list, { status: "proposed", limit: 10 }) || [];
  const priorityIdeas = useQuery(api.agentIdeas.list, { status: "priority", limit: 10 }) || [];
  const newIdeas = useQuery(api.agentIdeas.list, { status: "new", limit: 10 }) || [];

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
  ].slice(0, 6);

  const needsAgentWork = [
    ...tasks.filter((task: any) => (task.status === "todo" || task.status === "in-progress") && ["sebastian", "maven", "scout", "compass", "james"].includes(task.assignedTo || "")),
    ...sebastianPending,
    ...mavenPending,
    ...scoutPending,
  ].slice(0, 6);

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
      details: summarizeText([item.author ? `From ${item.author}` : undefined, item.channel ? `Channel ${item.channel}` : undefined, item.topic ? `Topic ${item.topic}` : undefined].filter(Boolean).join(" • ")) || "New item waiting for triage",
      badges: ["overnight inbox", item.source, ...(item.tags || []).slice(0, 2)],
    })),
    ...corinnePending.map((item: any) => ({
      id: `corinne-${item._id}`,
      title: item.title,
      details: summarizeText(item.details),
      badges: ["pending", `owner: ${item.owner}`, item.source],
    })),
  ].slice(0, 8);

  const reviewQueue: QueueItem[] = [
    ...proposedLearnings.map((item: any) => ({
      id: `learning-${item._id}`,
      title: item.title,
      details: summarizeText(item.learning),
      badges: ["learning review", item.scopeType],
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

  const doneTodayItems: QueueItem[] = completedToday.slice(0, 6).map((task: any) => ({
    id: `done-${task._id}`,
    title: `${getCategoryEmoji(task.category)} ${task.title}`,
    badges: [task.category, "done today"],
  }));

  const dailyTasks = cronJobs
    .filter((job: any) => job.status === "active")
    .map((job: any) => {
      const cronMatch = job.schedule.match(/cron (\d+) (\d+) .*/);
      let timeStr = "";
      let sortTime = 0;

      if (cronMatch) {
        const min = parseInt(cronMatch[1]);
        const hour = parseInt(cronMatch[2]);
        const date = new Date();
        date.setHours(hour, min, 0, 0);
        timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        sortTime = hour * 60 + min;
      } else if (job.schedule.startsWith("every")) {
        timeStr = "Recurring";
        sortTime = 9999;
      } else {
        return null;
      }

      return {
        id: job.jobId,
        title: job.name,
        details: timeStr,
        sortTime,
      };
    })
    .filter((task: any): task is NonNullable<typeof task> => task !== null)
    .sort((a: any, b: any) => a.sortTime - b.sortTime)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="h-6 w-6 text-amber-500" />
            Queue focus
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {today}. Work the list from left to right: act now, triage inbox, then clear review items.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{actionNow.length} action now</Badge>
          <Badge variant="outline">{inboxAndPending.length} inbox + pending</Badge>
          <Badge variant="outline">{reviewQueue.length} to review</Badge>
          <Badge variant="outline">{completedToday.length} done today</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <QueueListCard
          title={`Action now (${actionNow.length})`}
          subtitle="Active tasks, urgent project work, and Sebastian-owned pending items."
          icon={<TrendingUp className="h-5 w-5 text-amber-400" />}
          items={actionNow}
          emptyMessage="Nothing urgent is queued right now."
          accentClass="border-l-4 border-l-amber-500 bg-amber-500/[0.05]"
          itemClass="bg-amber-500/[0.06]"
        />

        <QueueListCard
          title={`Inbox + pending (${inboxAndPending.length})`}
          subtitle="Fresh overnight messages and follow-ups that still need triage or reply."
          icon={<Clock className="h-5 w-5 text-blue-400" />}
          items={inboxAndPending}
          emptyMessage="Inbox is clear for now."
          accentClass="border-l-4 border-l-blue-500 bg-blue-500/[0.05]"
          itemClass="bg-blue-500/[0.06]"
        />

        <QueueListCard
          title={`Needs review (${reviewQueue.length})`}
          subtitle="Learnings, draft outputs, and idea backlog that needs a decision."
          icon={<Brain className="h-5 w-5 text-violet-400" />}
          items={reviewQueue}
          emptyMessage="No review pile at the moment."
          accentClass="border-l-4 border-l-violet-500 bg-violet-500/[0.05]"
          itemClass="bg-violet-500/[0.06]"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <QueueListCard
          title={`Waiting on Corinne (${corinneQueue.length})`}
          subtitle="Tasks and pending items that need Corinne input or follow-through."
          icon={<User className="h-5 w-5 text-pink-400" />}
          items={corinneQueue}
          emptyMessage="Nothing is waiting on Corinne right now."
          accentClass="border-l-4 border-l-pink-500 bg-pink-500/[0.05]"
          itemClass="bg-pink-500/[0.06]"
        />

        <QueueListCard
          title={`Agent handoffs (${agentQueue.length})`}
          subtitle="Work assigned to Sebastian or the agent squad that is still open."
          icon={<Bot className="h-5 w-5 text-cyan-400" />}
          items={agentQueue}
          emptyMessage="No agent follow-up is queued."
          accentClass="border-l-4 border-l-cyan-500 bg-cyan-500/[0.05]"
          itemClass="bg-cyan-500/[0.06]"
        />

        <QueueListCard
          title={`Done today (${doneTodayItems.length})`}
          subtitle="Quick proof the queue is moving."
          icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
          items={doneTodayItems}
          emptyMessage="Nothing completed yet today."
          accentClass="border-l-4 border-l-green-500 bg-green-500/[0.05]"
          itemClass="bg-green-500/[0.06]"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <QueueListCard
          title={`Daily rhythm (${dailyTasks.length})`}
          subtitle="Live recurring jobs from Cron that shape the day."
          icon={<Clock className="h-5 w-5 text-zinc-300" />}
          items={dailyTasks.map((task) => ({
            id: task.id,
            title: task.title,
            details: task.details,
            badges: ["scheduled"],
          }))}
          emptyMessage="No active recurring jobs found."
          accentClass="border-l-4 border-l-zinc-600 bg-zinc-800/40"
          itemClass="bg-zinc-900/80"
        />

        <QueueListCard
          title={`Idea pressure (${priorityIdeas.length + newIdeas.length})`}
          subtitle="Ideas are useful only if they get triaged before they rot."
          icon={<Lightbulb className="h-5 w-5 text-yellow-400" />}
          items={[...priorityIdeas, ...newIdeas].slice(0, 6).map((item: any) => ({
            id: `idea-pressure-${item._id}`,
            title: item.title,
            details: summarizeText(item.summary),
            badges: [item.status, item.sourceAgent],
          }))}
          emptyMessage="No fresh ideas waiting."
          accentClass="border-l-4 border-l-yellow-500 bg-yellow-500/[0.05]"
          itemClass="bg-yellow-500/[0.06]"
        />
      </div>

      <SelfImprovementFeedback />
    </div>
  );
}
