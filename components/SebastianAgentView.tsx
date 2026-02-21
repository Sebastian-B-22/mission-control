"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Activity, MessageSquare, CheckCircle } from "lucide-react";

export function SebastianAgentView() {
  const agents = [
    {
      name: "Sebastian",
      emoji: "⚡",
      role: "Chief of Staff",
      status: "active",
      model: "claude-sonnet-4-5",
      color: "amber",
      responsibilities: [
        "Strategy & coordination",
        "Daily briefs & check-ins",
        "Task board management",
        "Cross-agent coordination",
      ],
      lastActivity: "Just now",
    },
    {
      name: "Scout",
      emoji: "🔍",
      role: "Operations Commander",
      status: "live",
      model: "claude-sonnet-4-5",
      color: "blue",
      responsibilities: [
        "Quo message monitoring (9:30 PM daily)",
        "Registration data analysis",
        "Parent action item detection",
        "Early warning system",
      ],
      lastActivity: "Today 5:15 PM",
    },
    {
      name: "Maven",
      emoji: "📣",
      role: "Marketing Brain",
      status: "live",
      model: "claude-sonnet-4-5",
      color: "purple",
      responsibilities: [
        "HTA content creation",
        "X posts & email sequences",
        "Landing page copy",
        "Corinne's voice & tone",
      ],
      lastActivity: "Today 7:30 AM",
    },
  ];

  const recentHandoffs = [
    {
      from: "Sebastian",
      to: "Scout",
      task: "Daily Quo monitoring",
      status: "automated",
      time: "Daily 9:30 PM",
    },
    {
      from: "Sebastian",
      to: "Maven",
      task: 'HTA "Why Now" content',
      status: "pending",
      time: "Queued",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "live":
        return "bg-blue-500";
      case "idle":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Agent Squad Coordination</h2>
      </div>

      {/* Agent Status Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.name} className={`border-l-4 border-l-${agent.color}-500`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{agent.emoji}</span>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{agent.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                  <Badge variant="outline" className="text-xs">
                    {agent.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">RESPONSIBILITIES</p>
                <ul className="space-y-1">
                  {agent.responsibilities.map((resp, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">MODEL</p>
                <p className="text-sm">{agent.model}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">LAST ACTIVITY</p>
                <p className="text-sm">{agent.lastActivity}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Handoffs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle className="text-lg">Recent Handoffs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentHandoffs.map((handoff, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{handoff.from}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium text-sm">{handoff.to}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{handoff.task}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {handoff.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{handoff.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Future Agents */}
      <Card className="bg-gray-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg text-muted-foreground">Future Squad Members</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { name: "Closer", emoji: "💰", role: "Sales Optimizer", eta: "April-May 2026" },
              { name: "Compass", emoji: "📊", role: "Finance Director", eta: "Summer 2026" },
              { name: "Builder", emoji: "🏗️", role: "HTA Product Manager", eta: "Summer-Fall 2026" },
              { name: "Champion", emoji: "🏆", role: "Raving Fans Builder", eta: "Winter 2026-27" },
            ].map((agent) => (
              <div key={agent.name} className="p-3 rounded-lg border bg-white opacity-60">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{agent.emoji}</span>
                  <p className="font-medium text-sm">{agent.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{agent.role}</p>
                <p className="text-xs text-muted-foreground mt-1">ETA: {agent.eta}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Agent Squad Economics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">CURRENT MONTHLY COST</p>
              <p className="text-2xl font-bold">$200</p>
              <p className="text-xs text-muted-foreground">Claude Max subscription</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">AGENTS DEPLOYED</p>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Sebastian + Scout + Maven</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">FULL SQUAD TARGET</p>
              <p className="text-2xl font-bold">7</p>
              <p className="text-xs text-muted-foreground">By Winter 2026-27</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
