export type AgentId = "sebastian" | "scout" | "maven" | "hermes" | "compass" | "james" | "joy";

export type AgentProfile = {
  id: AgentId;
  name: string;
  title: string;
  role: string;
  lane: string;
  cadence: string;
  channel: string;
  view?: string;
  accent: string;
  badge: string;
  chatUrl?: string;
};

export type AgentActivity = {
  agent?: string;
  channel?: string;
  message?: string;
  createdAt?: number;
};

export const AGENT_PROFILES: AgentProfile[] = [
  {
    id: "sebastian",
    name: "Sebastian",
    title: "Chief of Staff",
    role: "Coordinates decisions, follow-through, and the handoff back to Corinne.",
    lane: "Main huddle, approvals, daily operating rhythm",
    cadence: "Always routed through Telegram + Mission Control",
    channel: "main",
    accent: "text-amber-300",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  {
    id: "scout",
    name: "Scout",
    title: "Operations",
    role: "Handles Aspire operations, registrations, rosters, coach coverage, and parent-service risk.",
    lane: "Aspire ops",
    cadence: "Heartbeat checks plus ops huddles when there is a real blocker",
    channel: "aspire-ops",
    view: "agent-scout",
    accent: "text-sky-300",
    badge: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  },
  {
    id: "maven",
    name: "Maven",
    title: "Marketing",
    role: "Shapes positioning, campaigns, content drafts, and launch strategy.",
    lane: "HTA launch + content pipeline",
    cadence: "Content and research runs, then review-ready drafts",
    channel: "hta-launch",
    view: "agent-maven",
    accent: "text-emerald-300",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  {
    id: "hermes",
    name: "Hermes",
    title: "Audit / R&D",
    role: "Pressure-tests systems, audits implementation details, and spots technical or strategic gaps.",
    lane: "Main huddle + audit reviews",
    cadence: "Standalone agent; surfaced here when Hermes contributes to the operating loop",
    channel: "main",
    view: "agent-hermes",
    accent: "text-violet-300",
    badge: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  },
  {
    id: "compass",
    name: "Compass",
    title: "Anthony's Companion",
    role: "Supports Anthony's projects, learning momentum, and habit check-ins.",
    lane: "Family huddle",
    cadence: "Family check-ins and project support",
    channel: "family",
    view: "agent-compass",
    accent: "text-cyan-300",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    chatUrl: "https://t.me/CompassAspireBot",
  },
  {
    id: "james",
    name: "James",
    title: "Roma's Companion",
    role: "Supports Roma's creative projects, learning, and daily follow-through.",
    lane: "Family huddle",
    cadence: "Family check-ins and project support",
    channel: "family",
    view: "agent-james",
    accent: "text-fuchsia-300",
    badge: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20",
    chatUrl: "https://t.me/JamesAspireBot",
  },
  {
    id: "joy",
    name: "Joy",
    title: "Carolyn Support",
    role: "A narrow support lane for Carolyn's assistant flow.",
    lane: "Joy support",
    cadence: "Only active when support is requested",
    channel: "joy-support",
    accent: "text-rose-300",
    badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  },
];

export const AGENT_PROFILE_BY_ID = AGENT_PROFILES.reduce<Record<AgentId, AgentProfile>>((acc, profile) => {
  acc[profile.id] = profile;
  return acc;
}, {} as Record<AgentId, AgentProfile>);

export function normalizeAgentName(agent?: string) {
  return (agent || "").trim().toLowerCase();
}

export function findLastAgentActivity(messages: AgentActivity[] | undefined, agentId: AgentId) {
  if (!messages) return undefined;

  return [...messages]
    .reverse()
    .find((message) => normalizeAgentName(message.agent) === agentId);
}

export function findLastChannelActivity(messages: AgentActivity[] | undefined, channel: string) {
  if (!messages) return undefined;

  return [...messages]
    .reverse()
    .find((message) => message.channel === channel);
}

export function formatRelativeActivity(timestamp?: number) {
  if (!timestamp) return "No huddle activity";

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

export function getActivityTone(timestamp?: number) {
  if (!timestamp) {
    return {
      label: "Ready",
      className: "border-zinc-700 bg-zinc-800/60 text-zinc-300",
      dotClassName: "bg-zinc-500",
    };
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 3 * 60 * 60 * 1000) {
    return {
      label: "Recent",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      dotClassName: "bg-emerald-400",
    };
  }

  if (diffMs < 24 * 60 * 60 * 1000) {
    return {
      label: "Today",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
      dotClassName: "bg-amber-400",
    };
  }

  return {
    label: "Quiet",
    className: "border-zinc-700 bg-zinc-800/60 text-zinc-300",
    dotClassName: "bg-zinc-500",
  };
}
