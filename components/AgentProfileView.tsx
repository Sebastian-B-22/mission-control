"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import AgentHuddle from "@/components/AgentHuddle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AGENT_PROFILE_BY_ID,
  AgentActivity,
  AgentId,
  findLastAgentActivity,
  findLastChannelActivity,
  formatRelativeActivity,
  getActivityTone,
} from "@/lib/agentOps";
import { cn } from "@/lib/utils";
import { ExternalLink, MessageSquareText, Radio, Route, Timer, UserRoundCog } from "lucide-react";

export function AgentProfileView({ agentId }: { agentId: AgentId }) {
  const profile = AGENT_PROFILE_BY_ID[agentId];
  const recentMessages = useQuery(api.agentHuddle.getRecent, { limit: 120 }) as AgentActivity[] | undefined;

  const lastAgentActivity = useMemo(
    () => findLastAgentActivity(recentMessages, agentId),
    [agentId, recentMessages]
  );
  const lastChannelActivity = useMemo(
    () => findLastChannelActivity(recentMessages, profile.channel),
    [profile.channel, recentMessages]
  );
  const status = getActivityTone(lastAgentActivity?.createdAt || lastChannelActivity?.createdAt);
  const lastActivityLabel = formatRelativeActivity(lastAgentActivity?.createdAt);
  const lastChannelLabel = formatRelativeActivity(lastChannelActivity?.createdAt);
  const lastSnippet = lastAgentActivity?.message?.replace(/\s+/g, " ").trim();

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
            <Badge variant="outline" className={cn("border", profile.badge)}>
              {profile.title}
            </Badge>
            <Badge variant="outline" className={cn("gap-1.5", status.className)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClassName)} />
              {status.label}
            </Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">{profile.role}</p>
        </div>

        {profile.chatUrl ? (
          <a
            href={profile.chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            Open bot
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="gap-3 border-zinc-800 bg-zinc-900/80 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-200">
              <UserRoundCog className={cn("h-4 w-4", profile.accent)} />
              Role
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm text-zinc-400">{profile.lane}</CardContent>
        </Card>

        <Card className="gap-3 border-zinc-800 bg-zinc-900/80 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-200">
              <Timer className={cn("h-4 w-4", profile.accent)} />
              Rhythm
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm text-zinc-400">{profile.cadence}</CardContent>
        </Card>

        <Card className="gap-3 border-zinc-800 bg-zinc-900/80 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-200">
              <Radio className={cn("h-4 w-4", profile.accent)} />
              Last Reply
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm text-zinc-400">{lastActivityLabel}</CardContent>
        </Card>

        <Card className="gap-3 border-zinc-800 bg-zinc-900/80 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-200">
              <Route className={cn("h-4 w-4", profile.accent)} />
              Huddle Lane
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm text-zinc-400">{lastChannelLabel}</CardContent>
        </Card>
      </div>

      {lastSnippet ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-zinc-500">
            <MessageSquareText className="h-3.5 w-3.5" />
            Latest huddle reply
          </div>
          <p className="line-clamp-2 text-sm text-zinc-300">{lastSnippet}</p>
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        <AgentHuddle initialChannel={profile.channel} />
      </div>
    </div>
  );
}
