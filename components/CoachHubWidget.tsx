"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Eye,
  ExternalLink,
  RefreshCw
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface CoachHubSummary {
  coaches: {
    total: number;
    withIssues: number;
  };
  certifications: {
    expired: number;
    expiringSoon: number;
    missing: number;
    coachesNeedingAction: number;
  };
  latestPost: {
    id: string;
    title: string;
    viewCount: number;
    totalCoaches: number;
    shoutCount: number;
    createdAt: number;
    authorName: string;
  } | null;
  activity: {
    recentComments: number;
    recentMessages: number;
  };
  generatedAt: number;
}

// ─── Constants ────────────────────────────────────────────────────────────

const COACH_HUB_API = "https://ideal-hummingbird-117.convex.site/summary";
const COACH_HUB_URL = "https://coach-hub-three.vercel.app";
const API_KEY = "sk-sebastian-coach-hub-2026";

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "just now";
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function CoachHubWidget() {
  const [summary, setSummary] = useState<CoachHubSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(COACH_HUB_API, {
        headers: { "X-Agent-Key": API_KEY }
      });
      
      if (!response.ok) throw new Error("Failed to fetch");
      
      const data = await response.json();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError("Unable to load Coach Hub data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSummary, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const certStatus = summary?.certifications;
  const hasCertIssues = certStatus && (certStatus.expired > 0 || certStatus.expiringSoon > 0 || certStatus.missing > 0);
  const postViewPercent = summary?.latestPost 
    ? Math.round((summary.latestPost.viewCount / summary.latestPost.totalCoaches) * 100)
    : 0;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            Coach Hub
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />}
            <a 
              href={COACH_HUB_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : !summary ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : (
          <>
            {/* Certification Status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
              <div className="flex items-center gap-3">
                {hasCertIssues ? (
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                )}
                <div>
                  <div className="text-sm font-medium">Certifications</div>
                  <div className="text-xs text-gray-400">
                    {summary.coaches.total} coaches
                  </div>
                </div>
              </div>
              {hasCertIssues ? (
                <Badge variant="outline" className="border-amber-500 text-amber-400">
                  {certStatus.expired > 0 && `${certStatus.expired} expired`}
                  {certStatus.expired > 0 && certStatus.expiringSoon > 0 && " · "}
                  {certStatus.expiringSoon > 0 && `${certStatus.expiringSoon} expiring`}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-green-500 text-green-400">
                  All current
                </Badge>
              )}
            </div>

            {/* Latest Post */}
            {summary.latestPost && (
              <div className="p-3 rounded-lg bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium truncate flex-1">
                    📋 {summary.latestPost.title}...
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatRelativeTime(summary.latestPost.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span className={postViewPercent < 50 ? "text-amber-400" : "text-green-400"}>
                      {summary.latestPost.viewCount}/{summary.latestPost.totalCoaches} viewed ({postViewPercent}%)
                    </span>
                  </div>
                  {summary.latestPost.shoutCount > 0 && (
                    <div>📣 {summary.latestPost.shoutCount}</div>
                  )}
                </div>
              </div>
            )}

            {/* Activity */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <MessageSquare className="h-4 w-4" />
                <span>24h Activity</span>
              </div>
              <div className="text-gray-300">
                {summary.activity.recentComments} comments · {summary.activity.recentMessages} messages
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
