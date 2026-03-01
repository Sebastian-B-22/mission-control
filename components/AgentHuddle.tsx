"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Users, RefreshCw, Hash, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type HuddleMessage = {
  _id: string;
  agent: string;
  message: string;
  channel: string;
  mentions?: string[];
  createdAt: number;
};

// ─── Constants ────────────────────────────────────────────────────────────

const CHANNELS = {
  main: { name: "Main Huddle", icon: "📢", description: "Daily standups, announcements" },
  "aspire-ops": { name: "Aspire Ops", icon: "⚽", description: "Registrations, scheduling, coaches" },
  "hta-launch": { name: "HTA Launch", icon: "🚀", description: "Marketing, product, launch" },
  family: { name: "Family", icon: "👨‍👩‍👧‍👦", description: "Kids' learning, projects" },
  ideas: { name: "Ideas", icon: "💡", description: "Brainstorming, discussions" },
};

const AGENT_CONFIG: Record<string, { emoji: string; label: string; color: string; bgColor: string }> = {
  sebastian: { emoji: "⚡", label: "Sebastian", color: "text-amber-400", bgColor: "bg-amber-950/50" },
  scout:     { emoji: "🔍", label: "Scout",     color: "text-blue-400",  bgColor: "bg-blue-950/50" },
  maven:     { emoji: "📣", label: "Maven",     color: "text-green-400", bgColor: "bg-green-950/50" },
  compass:   { emoji: "🧭", label: "Compass",   color: "text-cyan-400",  bgColor: "bg-cyan-950/50" },
  james:     { emoji: "🎮", label: "James",     color: "text-purple-400", bgColor: "bg-purple-950/50" },
  corinne:   { emoji: "👑", label: "Corinne",   color: "text-pink-400",  bgColor: "bg-pink-950/50" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

// Simple markdown parser for messages
function parseMarkdown(text: string): React.ReactNode {
  // Split by markdown patterns and preserve them
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  
  return parts.map((part, i) => {
    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    // Code: `text`
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-gray-700 px-1 rounded text-sm">{part.slice(1, -1)}</code>;
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
    hour12: true 
  });
  
  if (isToday) {
    return time;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${time}`;
  }
  
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric" 
  }) + ` ${time}`;
}

// ─── Message Component ────────────────────────────────────────────────────

function MessageBubble({ message }: { message: HuddleMessage }) {
  const config = AGENT_CONFIG[message.agent] ?? { 
    emoji: "🤖", 
    label: message.agent, 
    color: "text-gray-400",
    bgColor: "bg-gray-800/50"
  };
  
  const isCorinne = message.agent === "corinne";
  
  return (
    <div className={`flex gap-3 ${isCorinne ? "flex-row-reverse" : ""}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${config.bgColor}`}>
        {config.emoji}
      </div>
      <div className={`flex-1 max-w-[85%] ${isCorinne ? "text-right" : ""}`}>
        <div className={`flex items-center gap-2 mb-1 ${isCorinne ? "justify-end" : ""}`}>
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
        </div>
        <div className={`inline-block px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
          isCorinne 
            ? "bg-pink-900/30 text-pink-100" 
            : "bg-gray-800 text-gray-100"
        }`}>
          {parseMarkdown(message.message)}
        </div>
        {message.mentions && message.mentions.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {message.mentions.map((m) => (
              <span key={m} className="text-xs text-blue-400">@{m}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Channel Selector ─────────────────────────────────────────────────────

function ChannelSelector({ 
  currentChannel, 
  onChange,
  channelStats 
}: { 
  currentChannel: string;
  onChange: (channel: string) => void;
  channelStats?: Record<string, { count: number }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const current = CHANNELS[currentChannel as keyof typeof CHANNELS];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <span>{current?.icon}</span>
        <span className="font-medium">{current?.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-20 overflow-hidden">
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
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 transition-colors ${
                    isActive ? "bg-gray-700" : ""
                  }`}
                >
                  <span className="text-lg">{channel.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{channel.name}</div>
                    <div className="text-xs text-gray-400">{channel.description}</div>
                  </div>
                  {stats && stats.count > 0 && (
                    <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                      {stats.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

interface AgentHuddleProps {
  initialChannel?: string;
}

export default function AgentHuddle({ initialChannel = "main" }: AgentHuddleProps) {
  const [currentChannel, setCurrentChannel] = useState(initialChannel);
  const [newMessage, setNewMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Sync channel when initialChannel prop changes (sidebar navigation)
  useEffect(() => {
    setCurrentChannel(initialChannel);
  }, [initialChannel]);
  
  const messages = useQuery(api.agentHuddle.getByChannel, { 
    channel: currentChannel, 
    limit: 100 
  });
  const channelStats = useQuery(api.agentHuddle.getChannelStats, {});
  const postMessage = useMutation(api.agentHuddle.post);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handlePost = async () => {
    if (!newMessage.trim() || isPosting) return;
    
    // Parse @mentions from message
    const mentionRegex = /@(sebastian|scout|maven|compass|james)/gi;
    const mentions = [...newMessage.matchAll(mentionRegex)].map(m => m[1].toLowerCase());
    
    setIsPosting(true);
    try {
      await postMessage({
        agent: "corinne",
        message: newMessage.trim(),
        channel: currentChannel,
        mentions: mentions.length > 0 ? mentions : undefined,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to post:", error);
    } finally {
      setIsPosting(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };
  
  const channelInfo = CHANNELS[currentChannel as keyof typeof CHANNELS];
  
  return (
    <Card className="bg-gray-900 border-gray-800 h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-purple-400" />
            Agent Huddle
          </CardTitle>
          <ChannelSelector
            currentChannel={currentChannel}
            onChange={setCurrentChannel}
            channelStats={channelStats as Record<string, { count: number }> | undefined}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{channelInfo?.description}</p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
          {messages === undefined ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
              <span className="text-4xl mb-2">{channelInfo?.icon}</span>
              <p className="font-medium">{channelInfo?.name}</p>
              <p className="text-xs">No messages yet - start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg._id} message={msg as HuddleMessage} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input area */}
        <div className="flex gap-2 flex-shrink-0">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelInfo?.name}... (Enter to send)`}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-gray-800 border-gray-700"
            rows={1}
          />
          <Button
            onClick={handlePost}
            disabled={!newMessage.trim() || isPosting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
