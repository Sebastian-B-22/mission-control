"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Agent {
  id: string;
  name: string;
  role: string;
  title: string | null;
  status: "idle" | "working" | "error" | "offline";
  lastHeartbeatAt: string | null;
}

const roleColors: Record<string, string> = {
  ceo: "text-amber-400",
  pm: "text-blue-400",
  cmo: "text-purple-400",
  researcher: "text-green-400",
  general: "text-pink-400",
};

const roleEmoji: Record<string, string> = {
  ceo: "⚡",
  pm: "🔍",
  cmo: "📣",
  researcher: "🧭",
  general: "🎮",
};

const statusIndicator: Record<string, { color: string; label: string }> = {
  idle: { color: "bg-green-500", label: "Idle" },
  working: { color: "bg-yellow-500", label: "Working" },
  error: { color: "bg-red-500", label: "Error" },
  offline: { color: "bg-gray-500", label: "Offline" },
};

export function AgentSquad() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/paperclip/agents");
        const data = await res.json();
        
        if (data.offline) {
          setOffline(true);
          setAgents([]);
        } else if (Array.isArray(data)) {
          setOffline(false);
          setAgents(data);
        }
      } catch (err) {
        setOffline(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🤖 Agent Squad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-24 bg-gray-800 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (offline) {
    return null;
  }


  // Sort: CEO first, then by name
  const sortedAgents = [...agents].sort((a, b) => {
    if (a.role === "ceo") return -1;
    if (b.role === "ceo") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🤖 Agent Squad
          <span className="text-xs font-normal text-gray-500 ml-auto">
            {agents.length} agents
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {sortedAgents.map((agent) => {
            const status = statusIndicator[agent.status] || statusIndicator.offline;
            const emoji = roleEmoji[agent.role] || "🤖";
            const color = roleColors[agent.role] || "text-gray-400";
            
            return (
              <div
                key={agent.id}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{emoji}</span>
                  <span className={`font-semibold ${color}`}>{agent.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${status.color}`} />
                  <span>{status.label}</span>
                </div>
                {agent.title && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {agent.title}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
