"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bot, Calendar, Clock, FolderKanban, Users, Zap } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { SebastianDailyView } from "@/components/SebastianDailyView";
import { SebastianCalendarView } from "@/components/SebastianCalendarView";
import { SebastianKanban } from "@/components/SebastianKanban";
import { SebastianAgentView } from "@/components/SebastianAgentView";

interface SebastianWorkspaceProps {
  userId: Id<"users">;
}

function getQueueDayStartMs() {
  const now = new Date();
  const sevenAm = new Date(now);
  sevenAm.setHours(7, 0, 0, 0);

  if (now.getTime() < sevenAm.getTime()) {
    sevenAm.setDate(sevenAm.getDate() - 1);
  }

  return sevenAm.getTime();
}

export function SebastianWorkspace({ userId }: SebastianWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("queue");

  const tasks = useQuery(api.sebastianTasks.getSebastianTasks, { userId }) || [];
  const corinnePending = useQuery(api.pendingItems.list, { owner: "corinne", includeDone: false, limit: 20 }) || [];
  const sebastianPending = useQuery(api.pendingItems.list, { owner: "sebastian", includeDone: false, limit: 20 }) || [];
  const newIdeas = useQuery(api.agentIdeas.list, { status: "new", limit: 10 }) || [];
  const priorityIdeas = useQuery(api.agentIdeas.list, { status: "priority", limit: 10 }) || [];
  const reviewDrafts = useQuery(api.contentPipeline.listByStage, { stage: "review" }) || [];
  const overnightItems =
    useQuery(api.overnightInbox.listNewSince, {
      sinceMs: getQueueDayStartMs(),
      limit: 20,
    }) || [];

  const inProgressCount = tasks.filter((task: any) => task.status === "in-progress").length;
  const highPriorityCount = tasks.filter((task: any) => task.status === "todo" && task.priority === "high").length;
  const actionNowCount = inProgressCount + highPriorityCount + sebastianPending.length;
  const inboxCount = overnightItems.length + corinnePending.length;
  const reviewCount = reviewDrafts.length + priorityIdeas.length + newIdeas.length;
  const backlogCount = tasks.filter((task: any) => task.status === "backlog" || task.status === "todo").length;

  const summaryCards = [
    {
      label: "Action now",
      value: actionNowCount,
      icon: Zap,
      iconClass: "text-amber-400",
      cardClass: "border-amber-500/25 bg-amber-500/[0.06]",
    },
    {
      label: "Inbox + pending",
      value: inboxCount,
      icon: Clock,
      iconClass: "text-blue-400",
      cardClass: "border-blue-500/25 bg-blue-500/[0.06]",
    },
    {
      label: "Needs review",
      value: reviewCount,
      icon: Bot,
      iconClass: "text-violet-400",
      cardClass: "border-violet-500/25 bg-violet-500/[0.06]",
    },
    {
      label: "Project queue",
      value: backlogCount,
      icon: FolderKanban,
      iconClass: "text-emerald-400",
      cardClass: "border-emerald-500/25 bg-emerald-500/[0.06]",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
            <Bot className="h-5 w-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Queue</h1>
              <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-400">Agent Ops</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Start with immediate actions, then triage inbox, pending follow-ups, and review work.
            </p>
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`rounded-xl border px-3 py-2 ${card.cardClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500">{card.label}</div>
                    <div className="mt-0.5 text-xl font-semibold text-white">{card.value}</div>
                  </div>
                  <Icon className={`h-4 w-4 shrink-0 ${card.iconClass}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-grid min-w-[560px] grid-cols-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1">
            <TabsTrigger value="queue" className="flex min-w-[136px] items-center justify-center gap-2 rounded-xl text-zinc-300 data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Queue</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex min-w-[136px] items-center justify-center gap-2 rounded-xl text-zinc-300 data-[state=active]:bg-sky-500/15 data-[state=active]:text-sky-300">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex min-w-[136px] items-center justify-center gap-2 rounded-xl text-zinc-300 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300">
              <FolderKanban className="h-4 w-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex min-w-[136px] items-center justify-center gap-2 rounded-xl text-zinc-300 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="queue" className="mt-4">
          <SebastianDailyView userId={userId} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <SebastianCalendarView userId={userId} />
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <SebastianKanban userId={userId} />
        </TabsContent>

        <TabsContent value="agents" className="mt-4">
          <SebastianAgentView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
