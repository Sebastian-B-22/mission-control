"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  MessageSquareMore,
  MoonStar,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

type HuddleMessage = {
  _id: string;
  agent: string;
  message: string;
  channel?: string;
  missionId?: string;
  round?: "brief" | "round1" | "round2" | "synthesis" | "note";
  kind?: "brief" | "response" | "synthesis" | "note";
  mentions?: string[];
  source?: "mission-control" | "telegram" | "huddle" | "agent-trigger" | "manual" | "system";
  sourceAuthor?: string;
  createdAt: number;
};

type HuddleMode = "live" | "overnight";

type MissionStatus = "round1" | "round2" | "synthesis" | "completed" | "cancelled";

type ChannelConfig = {
  name: string;
  icon: string;
  description: string;
  mode: HuddleMode;
  participants: string[];
  desiredOutcome: string;
  briefTitle: string;
  briefDescription: string;
  prompts: string[];
};

type ActiveMission = {
  _id: string;
  channel: string;
  mode: HuddleMode;
  title: string;
  brief: string;
  createdBy: string;
  participants: string[];
  status: MissionStatus;
  createdAt: number;
  updatedAt: number;
  lastMessageAt?: number;
  completedAt?: number;
  finalMessageId?: string;
};

type MissionProgress = {
  phase: MissionStatus;
  discussionParticipants: string[];
  round1Responded: string[];
  round2Responded: string[];
  synthesisPosted: boolean;
  waitingOn: string[];
  totalDiscussionParticipants: number;
};

type ChannelView = {
  activeMission: ActiveMission | null;
  progress: MissionProgress | null;
  messages: HuddleMessage[];
};

const CHANNELS: Record<string, ChannelConfig> = {
  main: {
    name: "General",
    icon: "📢",
    description: "Cross-agent discussion for active decisions, blockers, and alignment.",
    mode: "live",
    participants: ["Sebastian", "Scout", "Maven", "Compass", "James"],
    desiredOutcome: "Get the right people on one question, pressure-test options, and leave with a clear next move.",
    briefTitle: "Live brief",
    briefDescription: "Give the agents one focused question, who should weigh in, and what a useful answer looks like.",
    prompts: [
      "@sebastian @scout @maven Live huddle: We need a recommendation on [topic]. Each of you give your take, react to each other, and end with one recommended next step.",
      "@sebastian @scout Live huddle: What is the operational risk here, what is the fastest fix, and what should Corinne decide today?",
      "@sebastian @maven Live huddle: Pressure-test this message or campaign angle, then tell me the strongest version to move forward with.",
    ],
  },
  "aspire-ops": {
    name: "Operations",
    icon: "⚽",
    description: "Operations huddle for registrations, scheduling, parents, coaches, and delivery.",
    mode: "live",
    participants: ["Sebastian", "Scout"],
    desiredOutcome: "Surface the bottleneck, choose the fix, and clarify ownership.",
    briefTitle: "Operations brief",
    briefDescription: "Use this when the question is operational and you want a fast answer instead of scattered updates.",
    prompts: [
      "@sebastian @scout Live ops huddle: What is the biggest bottleneck in Aspire ops right now, and what is the fastest path to clean it up?",
      "@sebastian @scout Live ops huddle: Here is the situation: [details]. Give me the best next step, risk to watch, and who should own it.",
    ],
  },
  "hta-launch": {
    name: "Marketing",
    icon: "🚀",
    description: "Launch huddle for product, positioning, offers, growth, and go-to-market.",
    mode: "live",
    participants: ["Sebastian", "Maven"],
    desiredOutcome: "Turn a fuzzy launch question into a sharper plan and next experiment.",
    briefTitle: "Launch brief",
    briefDescription: "Best for campaign ideas, launch sequencing, copy direction, and launch tradeoffs.",
    prompts: [
      "@sebastian @maven Live launch huddle: What should we do next to move HTA closer to launch with the most leverage?",
      "@sebastian @maven Live launch huddle: Pressure-test this positioning angle, tell me what is weak, and give me the strongest revision.",
    ],
  },
  family: {
    name: "Family",
    icon: "👨‍👩‍👧‍👦",
    description: "Family huddle for kid projects, routines, learning, and home coordination.",
    mode: "live",
    participants: ["Sebastian", "Compass", "James"],
    desiredOutcome: "Make the family move clearer, calmer, and easier to act on.",
    briefTitle: "Family brief",
    briefDescription: "Use when you want the family-side perspective, not just work logic.",
    prompts: [
      "@sebastian @compass @james Live family huddle: What is the best next move here for the kids and for family flow this week?",
      "@sebastian @compass @james Live family huddle: Help me simplify this so it is easier to follow through on as a family.",
    ],
  },
  ideas: {
    name: "Ideas",
    icon: "💡",
    description: "Idea huddle for rough concepts, experiments, and pressure-testing possibilities.",
    mode: "live",
    participants: ["Sebastian", "Scout", "Maven"],
    desiredOutcome: "Separate the promising idea from the distracting one and identify the best first move.",
    briefTitle: "Idea brief",
    briefDescription: "Great for brainstorming, but still anchored to an outcome, not random chatter.",
    prompts: [
      "@sebastian @scout @maven Live idea huddle: Is this worth pursuing right now? Tell me what makes it strong, weak, and what the first proof point should be.",
      "@sebastian @maven Live idea huddle: Turn this rough idea into a tighter offer, angle, or test.",
    ],
  },
  "overnight-strategy": {
    name: "Overnight",
    icon: "🌙",
    description: "Overnight strategic pass on goals, workflow, revenue, retention, and tomorrow's priorities.",
    mode: "overnight",
    participants: ["Sebastian", "Scout", "Maven"],
    desiredOutcome: "Wake up to the highest-leverage opportunities, workflow improvements, and the clearest next priorities.",
    briefTitle: "Overnight brief",
    briefDescription: "Point the overnight team at the goal, the pressure point, and what kind of leverage you want uncovered by morning.",
    prompts: [
      "@sebastian @scout @maven Overnight huddle: Look across Aspire + HTA and bring me 1 workflow improvement, 1 revenue opportunity, 1 retention move, and the most important priority for tomorrow.",
      "@sebastian @scout @maven Overnight huddle: Based on our current goals, what is the highest-leverage change we could make this week to improve workflow or revenue?",
      "@sebastian @scout @maven Overnight huddle: Find what is slowing us down, what is leaking value, and what one move would create the biggest win by tomorrow night.",
    ],
  },
  "joy-support": {
    name: "Joy Support",
    icon: "🌸",
    description: "Support lane for Joy to ask Sebastian for help.",
    mode: "live",
    participants: ["Sebastian"],
    desiredOutcome: "Help Joy get unstuck quickly.",
    briefTitle: "Support brief",
    briefDescription: "A narrow support lane, not a broad huddle.",
    prompts: ["@sebastian Help me think through this clearly and give me the best next step."],
  },
};

const AGENT_CONFIG: Record<string, { emoji: string; label: string; color: string; bgColor: string }> = {
  sebastian: { emoji: "⚡", label: "Sebastian", color: "text-amber-400", bgColor: "bg-amber-950/50" },
  scout: { emoji: "🔍", label: "Scout", color: "text-blue-400", bgColor: "bg-blue-950/50" },
  maven: { emoji: "📣", label: "Maven", color: "text-green-400", bgColor: "bg-green-950/50" },
  compass: { emoji: "🧭", label: "Compass", color: "text-cyan-400", bgColor: "bg-cyan-950/50" },
  james: { emoji: "🎮", label: "James", color: "text-purple-400", bgColor: "bg-purple-950/50" },
  corinne: { emoji: "👑", label: "Corinne", color: "text-pink-400", bgColor: "bg-pink-950/50" },
  joy: { emoji: "🌸", label: "Joy", color: "text-rose-300", bgColor: "bg-rose-950/40" },
};

function parseMarkdown(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-zinc-700 px-1 text-sm">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return time;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${time}`;
  }

  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

function prettyRound(round?: HuddleMessage["round"]) {
  switch (round) {
    case "brief":
      return "Brief";
    case "round1":
      return "Round 1";
    case "round2":
      return "Round 2";
    case "synthesis":
      return "Sebastian synthesis";
    default:
      return "Notes";
  }
}

function prettyPhase(phase?: MissionStatus | null) {
  switch (phase) {
    case "round1":
      return "Round 1";
    case "round2":
      return "Round 2";
    case "synthesis":
      return "Synthesis";
    case "completed":
      return "Completed";
    default:
      return "No active mission";
  }
}

function missionTitle(title: string) {
  return title.length > 120 ? `${title.slice(0, 117)}...` : title;
}

function MessageBubble({ message }: { message: HuddleMessage }) {
  const config = AGENT_CONFIG[message.agent] ?? {
    emoji: "🤖",
    label: message.agent,
    color: "text-gray-400",
    bgColor: "bg-gray-800/50",
  };

  const isCorinne = message.agent === "corinne";
  const isSynthesis = message.kind === "synthesis";
  const sourceLabel = message.source === "telegram"
    ? `via Telegram${message.sourceAuthor ? ` · ${message.sourceAuthor}` : ""}`
    : message.source === "mission-control"
      ? "via Mission Control"
      : null;

  return (
    <div className={`flex gap-3 ${isCorinne ? "flex-row-reverse" : ""}`}>
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-lg ${config.bgColor}`}>
        {config.emoji}
      </div>
      <div className={`flex-1 ${isCorinne ? "text-right" : ""}`}>
        <div className={`mb-1 flex items-center gap-2 ${isCorinne ? "justify-end" : ""}`}>
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          <span className="text-xs text-zinc-500">{formatTime(message.createdAt)}</span>
        </div>
        <div
          className={`inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
            isSynthesis
              ? "border border-amber-500/30 bg-amber-500/10 text-amber-50"
              : isCorinne
                ? "bg-pink-900/30 text-pink-100"
                : "bg-zinc-800 text-zinc-100"
          }`}
        >
          {parseMarkdown(message.message)}
        </div>
        {sourceLabel ? (
          <div className={`mt-1 text-[11px] ${isCorinne ? "text-right text-blue-300" : "text-blue-300"}`}>
            {sourceLabel}
          </div>
        ) : null}
        {message.mentions && message.mentions.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.mentions.map((mention) => (
              <span key={mention} className="text-xs text-blue-400">@{mention}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChannelSelector({
  currentChannel,
  onChange,
  channelStats,
}: {
  currentChannel: string;
  onChange: (channel: string) => void;
  channelStats?: Record<string, { count: number; hasActiveMission?: boolean }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const current = CHANNELS[currentChannel];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800"
      >
        <span>{current?.icon}</span>
        <span className="font-medium text-zinc-100">{current?.name}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
            {Object.entries(CHANNELS).map(([id, channel]) => {
              const stats = channelStats?.[id];
              const isActive = id === currentChannel;

              return (
                <button
                  key={id}
                  onClick={() => {
                    onChange(id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-zinc-800 ${
                    isActive ? "bg-zinc-800" : ""
                  }`}
                >
                  <span className="text-lg">{channel.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-100">{channel.name}</div>
                    <div className="text-xs text-zinc-400">{channel.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats?.hasActiveMission ? (
                      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
                        live
                      </Badge>
                    ) : null}
                    {stats && stats.count > 0 ? (
                      <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                        {stats.count}
                      </Badge>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

function MissionCard({ channel, onUsePrompt }: { channel: ChannelConfig; onUsePrompt: (prompt: string) => void }) {
  const isOvernight = channel.mode === "overnight";

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
              {isOvernight ? (
                <><MoonStar className="mr-1 h-3 w-3" />Overnight Huddle</>
              ) : (
                <><MessageSquareMore className="mr-1 h-3 w-3" />Live Huddle</>
              )}
            </Badge>
            <Badge variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300">
              {channel.name}
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-zinc-100">{channel.briefTitle}</h3>
          <p className="max-w-3xl text-sm text-zinc-400">{channel.briefDescription}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/30 px-3 py-2 text-right">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Desired outcome</div>
          <div className="mt-1 max-w-sm text-sm text-zinc-200">{channel.desiredOutcome}</div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-100">
            <Sparkles className="h-4 w-4 text-amber-400" /> Suggested kickoff prompts
          </div>
          <div className="space-y-2">
            {channel.prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onUsePrompt(prompt)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-zinc-100"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-100">
              <Users className="h-4 w-4 text-amber-400" /> Participants
            </div>
            <div className="flex flex-wrap gap-2">
              {channel.participants.map((participant) => (
                <Badge key={participant} variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300">
                  {participant}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-100">
              <Target className="h-4 w-4 text-amber-400" /> What good looks like
            </div>
            <ul className="space-y-2 text-sm text-zinc-400">
              {isOvernight ? (
                <>
                  <li>• one workflow improvement</li>
                  <li>• one revenue opportunity</li>
                  <li>• one retention or relationship move</li>
                  <li>• the clearest priority for tomorrow</li>
                </>
              ) : (
                <>
                  <li>• one focused question</li>
                  <li>• the right people weigh in</li>
                  <li>• a recommendation, not a pile of updates</li>
                  <li>• a clear owner and next action</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionStatusCard({ mission, progress }: { mission: ActiveMission; progress: MissionProgress }) {
  const phaseIndex = ["round1", "round2", "synthesis"].indexOf(progress.phase);
  const steps = [
    { key: "round1", label: "Round 1", detail: "Initial takes" },
    { key: "round2", label: "Round 2", detail: "Agents respond to each other" },
    { key: "synthesis", label: "Synthesis", detail: "Sebastian recommendation + owner + next step" },
  ] as const;

  const waitingLabels = progress.waitingOn.map((agent) => AGENT_CONFIG[agent]?.label ?? agent);
  const round1Done = progress.round1Responded.map((agent) => AGENT_CONFIG[agent]?.label ?? agent);
  const round2Done = progress.round2Responded.map((agent) => AGENT_CONFIG[agent]?.label ?? agent);

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
              Active mission
            </Badge>
            <Badge variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-300">
              {prettyPhase(progress.phase)}
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-zinc-100">{mission.title}</h3>
          <p className="max-w-3xl text-sm text-zinc-300">{mission.brief}</p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          <div>Started {formatTime(mission.createdAt)}</div>
          <div>Updated {formatTime(mission.updatedAt)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
          <div className="mb-3 text-sm font-medium text-zinc-100">Mission progress</div>
          <div className="grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => {
              const isComplete = phaseIndex > index || (step.key === "synthesis" && progress.synthesisPosted);
              const isCurrent = progress.phase === step.key && !(step.key === "synthesis" && progress.synthesisPosted);

              return (
                <div
                  key={step.key}
                  className={`rounded-xl border px-3 py-3 ${
                    isComplete
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : isCurrent
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-zinc-800 bg-zinc-950/70"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-100">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <CircleDashed className={`h-4 w-4 ${isCurrent ? "text-amber-300" : "text-zinc-500"}`} />
                    )}
                    {step.label}
                  </div>
                  <div className="text-xs text-zinc-400">{step.detail}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-800 bg-black/20 p-4">
          <div>
            <div className="mb-2 text-sm font-medium text-zinc-100">Waiting on</div>
            {waitingLabels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {waitingLabels.map((label) => (
                  <Badge key={label} variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-300">
                    {label}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-emerald-300">Current phase complete</div>
            )}
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-zinc-100">Round 1 done</div>
            <div className="flex flex-wrap gap-2">
              {round1Done.length > 0 ? round1Done.map((label) => (
                <Badge key={label} variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-300">
                  {label}
                </Badge>
              )) : <span className="text-sm text-zinc-500">None yet</span>}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-zinc-100">Round 2 done</div>
            <div className="flex flex-wrap gap-2">
              {round2Done.length > 0 ? round2Done.map((label) => (
                <Badge key={label} variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-300">
                  {label}
                </Badge>
              )) : <span className="text-sm text-zinc-500">None yet</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AgentHuddleProps {
  initialChannel?: string;
}

export default function AgentHuddle({ initialChannel = "main" }: AgentHuddleProps) {
  const [currentChannel, setCurrentChannel] = useState(initialChannel);
  const [newMessage, setNewMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentChannel(initialChannel);
  }, [initialChannel]);

  const channelView = useQuery(api.agentHuddle.getChannelView, {
    channel: currentChannel,
    limit: 120,
  }) as ChannelView | undefined;
  const channelStats = useQuery(api.agentHuddle.getChannelStats, {});
  const startMission = useMutation(api.agentHuddle.startMission);
  const postMessage = useMutation(api.agentHuddle.post);

  const messages = channelView?.messages ?? [];
  const activeMission = channelView?.activeMission ?? null;
  const progress = channelView?.progress ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, currentChannel]);

  const channelInfo = CHANNELS[currentChannel] || CHANNELS.main;
  const messagePlaceholder = activeMission
    ? progress?.phase === "round2"
      ? "Reply to the active mission. React to the other takes, sharpen the recommendation, and keep it bounded..."
      : progress?.phase === "synthesis"
        ? "Add a note to the mission or help refine the final synthesis..."
        : "Reply to the active mission. Give your take clearly and keep it practical..."
    : channelInfo.mode === "overnight"
      ? "Start an overnight mission. Tell the team what to push on, where value is leaking, and what kind of wins to find by morning..."
      : "Start a focused mission. Ask one question, tag the right people, and say what kind of answer you want...";

  const groupedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const previousRound = index > 0 ? messages[index - 1]?.round : undefined;
      const showRoundHeader = message.round !== previousRound;
      return { message, showRoundHeader };
    });
  }, [messages]);

  const handlePost = async () => {
    if (!newMessage.trim() || isPosting) return;

    const mentionRegex = /@(sebastian|scout|maven|compass|james|joy)/gi;
    const mentions = [...newMessage.matchAll(mentionRegex)].map((match) => match[1].toLowerCase());

    setIsPosting(true);
    try {
      if (!activeMission) {
        await startMission({
          agent: "corinne",
          channel: currentChannel,
          message: newMessage.trim(),
          mentions: mentions.length > 0 ? mentions : undefined,
          participants: mentions.length > 0 ? mentions : undefined,
        });
      } else {
        await postMessage({
          agent: "corinne",
          message: newMessage.trim(),
          channel: currentChannel,
          missionId: activeMission._id as never,
          mentions: mentions.length > 0 ? mentions : undefined,
        });
      }
      setNewMessage("");
    } catch (error) {
      console.error("Failed to post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <Card className="flex h-full flex-col border-zinc-800 bg-zinc-900 text-zinc-100">
      <CardHeader className="space-y-3 border-b border-zinc-800 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-zinc-100">
              <Users className="h-5 w-5 text-amber-400" />
              Agent Huddle
            </CardTitle>
            <p className="mt-1 text-sm text-zinc-400">Internal agent conversation inside Mission Control.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(CHANNELS).map(([channelId, channel]) => (
            <Button
              key={channelId}
              size="sm"
              variant={channelId === currentChannel ? "default" : "outline"}
              className={channelId === currentChannel ? "bg-amber-500 text-black hover:bg-amber-400" : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}
              onClick={() => setCurrentChannel(channelId)}
            >
              <span className="mr-1.5">{channel.icon}</span>
              {channel.name}
            </Button>
          ))}
        </div>

        {activeMission && progress ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
            <div className="font-medium">Active mission: {missionTitle(activeMission.title)}</div>
            <div className="mt-1 text-xs text-amber-200/80">
              {prettyPhase(progress.phase)}{progress.waitingOn.length > 0 ? ` · waiting on ${progress.waitingOn.map((agent) => AGENT_CONFIG[agent]?.label ?? agent).join(", ")}` : ""}
            </div>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-3">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {channelView === undefined ? (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Loading huddle...
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-black/20 px-6 py-12 text-center text-zinc-500">
                <span className="mb-3 text-4xl">{channelInfo.icon}</span>
                <p className="text-base font-medium text-zinc-200">{channelInfo.name}</p>
                <p className="mt-2 max-w-md text-sm">
                  {channelInfo.mode === "overnight"
                    ? "No overnight mission yet. Start with one focused strategic brief so the team knows what to push on while you sleep."
                    : "No messages yet. Start with one focused question and the agents will respond here like a conversation."}
                </p>
              </div>
              <MissionCard channel={channelInfo} onUsePrompt={setNewMessage} />
            </div>
          ) : (
            <>
              {groupedMessages.map(({ message, showRoundHeader }) => (
                <div key={message._id} className="space-y-3">
                  {showRoundHeader ? (
                    <div className="sticky top-0 z-10 -mx-1 rounded-full bg-zinc-900/90 px-1 py-1 backdrop-blur">
                      <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">
                        {prettyRound(message.round)}
                      </div>
                    </div>
                  ) : null}
                  <MessageBubble message={message} />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="space-y-2 border-t border-zinc-800 pt-3">
          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {channelInfo.prompts.slice(0, 2).map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setNewMessage(prompt)}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-zinc-100"
                >
                  {index === 0 ? "Starter 1" : "Starter 2"}
                </button>
              ))}
            </div>
          ) : null}

          {activeMission ? (
            <p className="text-xs text-zinc-500">
              Current phase: {prettyPhase(progress?.phase)}. Keep replying here and Sebastian will close the loop with a final recommendation.
            </p>
          ) : null}

          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={messagePlaceholder}
              className="min-h-[72px] resize-none border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
              rows={2}
            />
            <Button
              onClick={handlePost}
              disabled={!newMessage.trim() || isPosting}
              className="self-end bg-amber-500 text-black hover:bg-amber-400"
            >
              {isPosting ? <RefreshCw className="h-4 w-4 animate-spin" /> : activeMission ? <Send className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
