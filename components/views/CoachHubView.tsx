"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Eye,
  ExternalLink,
  RefreshCw,
  Shield,
  FileCheck,
  Clock,
  Bell,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  Folder,
  File
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface Coach {
  id: string;
  name: string;
  phone?: string;
  role?: string;
  region?: string;
  ageGroup?: string;
  certs: {
    backgroundCheck?: { status: string; expiresAt?: number };
    safeSport?: { status: string; expiresAt?: number };
  };
}

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: number;
}

interface Post {
  id: string;
  content: string;
  authorName: string;
  createdAt: number;
  viewCount: number;
  totalCoaches: number;
  viewers: string[];
  nonViewers: string[];
  shoutCount: number;
  comments: Comment[];
  isPinned: boolean;
}

interface Shift {
  id: string;
  dayOfWeek: number;
  region: string;
  coachName: string;
  startTime: string;
  endTime: string;
  field: string;
  subField?: string;
  group?: string;
  birthYears?: string;
  participants?: number;
  notes?: string;
  isHighlighted?: boolean;
}

interface Resource {
  id: string;
  title: string;
  type: string;
  url?: string;
  description?: string;
  ageGroup?: string;
  region?: string;
}

interface CoachHubData {
  coaches: Coach[];
  posts: Post[];
  schedule: {
    weekStartDate: number;
    isPublished: boolean;
    shifts: Shift[];
  } | null;
  resources: {
    byAgeGroup: Record<string, Record<string, Resource[]>>;
    other: Resource[];
  };
  events: any[];
  summary: {
    totalCoaches: number;
    certsExpired: number;
    certsExpiring: number;
    recentComments: number;
    upcomingEvents: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────

const COACH_HUB_API = "https://ideal-hummingbird-117.convex.site";
const COACH_HUB_URL = "https://coach-hub-three.vercel.app";
const API_KEY = "sk-sebastian-coach-hub-2026";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function getCertStatus(cert?: { status: string; expiresAt?: number }): "valid" | "expiring" | "expired" | "missing" {
  if (!cert) return "missing";
  if (cert.status === "expired") return "expired";
  if (cert.status === "expiring") return "expiring";
  return "valid";
}

function formatWeekDate(timestamp: number): string {
  const date = new Date(timestamp);
  const endDate = new Date(timestamp + 6 * 24 * 60 * 60 * 1000);
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function isCurrentWeek(timestamp: number): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return timestamp === monday.getTime();
}

const AGE_GROUP_ORDER = ["5U", "6U", "7U", "8U", "9U", "10U", "11U", "12U", "14U"];

// ─── Post Detail Modal ────────────────────────────────────────────────────

function PostDetail({ post, onClose }: { post: Post; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm text-gray-400">{post.authorName} · {formatRelativeTime(post.createdAt)}</div>
              {post.isPinned && <Badge className="mt-1 bg-amber-600">📌 Pinned</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
          
          <div className="prose prose-invert max-w-none mb-6 whitespace-pre-wrap">
            {post.content}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 pb-4 border-b border-gray-700">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.viewCount}/{post.totalCoaches} viewed
            </span>
            {post.shoutCount > 0 && <span>📣 {post.shoutCount} shouts</span>}
            <span>💬 {post.comments.length} comments</span>
          </div>

          {post.nonViewers.length > 0 && (
            <div className="mb-4 p-3 bg-amber-950/30 rounded-lg">
              <div className="text-sm font-medium text-amber-400 mb-1">Haven't viewed:</div>
              <div className="text-sm text-gray-300">{post.nonViewers.join(", ")}</div>
            </div>
          )}

          <div className="space-y-4">
            <div className="font-medium">Comments ({post.comments.length})</div>
            {post.comments.length === 0 ? (
              <div className="text-gray-500 text-sm">No comments yet</div>
            ) : (
              post.comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{comment.authorName}</span>
                    <span className="text-gray-500">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <div className="text-gray-300">{comment.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function CoachHubView() {
  const [data, setData] = useState<CoachHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["curriculum"]));

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${COACH_HUB_API}/mirror`, {
        headers: { "X-Agent-Key": API_KEY }
      });
      
      if (!response.ok) throw new Error("Failed to fetch");
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError("Unable to load Coach Hub data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error || "No data available"}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>⚽</span> Coach Hub
          </h1>
          <p className="text-muted-foreground mt-1">Staff management, schedule & curriculum</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={COACH_HUB_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open App
            </a>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{data.summary.totalCoaches}</p>
                <p className="text-xs text-gray-400">Coaches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-gray-800 ${data.summary.certsExpired > 0 ? 'bg-red-950/30' : 'bg-gray-900'}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-400">{data.summary.certsExpired}</p>
                <p className="text-xs text-gray-400">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-gray-800 ${data.summary.certsExpiring > 0 ? 'bg-amber-950/30' : 'bg-gray-900'}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-amber-400">{data.summary.certsExpiring}</p>
                <p className="text-xs text-gray-400">Expiring</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{data.summary.recentComments}</p>
                <p className="text-xs text-gray-400">Comments (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-2xl font-bold">{data.summary.upcomingEvents}</p>
                <p className="text-xs text-gray-400">Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="posts">
            <Bell className="h-4 w-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 mr-2" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="curriculum">
            <BookOpen className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4 space-y-4">
          {data.posts.map((post) => {
            const viewPercent = Math.round((post.viewCount / post.totalCoaches) * 100);
            const title = post.content.split('\n')[0].replace(/[#*📋🚨⚠️🔔]/g, '').trim().slice(0, 60);
            
            return (
              <Card 
                key={post.id} 
                className="bg-gray-900 border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => setSelectedPost(post)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {post.isPinned && <span className="text-amber-400">📌</span>}
                        <span className="font-medium">{title}...</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {post.authorName} · {formatRelativeTime(post.createdAt)}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm mt-3">
                    <span className={`flex items-center gap-1 ${viewPercent < 50 ? 'text-amber-400' : 'text-green-400'}`}>
                      <Eye className="h-4 w-4" />
                      {post.viewCount}/{post.totalCoaches} ({viewPercent}%)
                    </span>
                    {post.nonViewers.length > 0 && post.nonViewers.length <= 3 && (
                      <span className="text-xs text-gray-500">
                        Missing: {post.nonViewers.slice(0, 3).join(", ")}
                      </span>
                    )}
                    {post.comments.length > 0 && (
                      <span className="text-gray-400">💬 {post.comments.length}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="mt-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-4">
              <div className="space-y-2">
                {data.coaches.map((coach) => {
                  const bgStatus = getCertStatus(coach.certs.backgroundCheck);
                  const ssStatus = getCertStatus(coach.certs.safeSport);
                  const hasIssue = bgStatus !== "valid" || ssStatus !== "valid";
                  
                  return (
                    <div 
                      key={coach.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        hasIssue ? 'bg-red-950/20' : 'bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">
                          {coach.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{coach.name}</div>
                          <div className="text-xs text-gray-400">
                            {coach.region && `${coach.region} · `}{coach.ageGroup || coach.role || 'Coach'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant="outline" 
                          className={
                            bgStatus === "valid" ? "border-green-500 text-green-400" :
                            bgStatus === "expiring" ? "border-amber-500 text-amber-400" :
                            bgStatus === "expired" ? "border-red-500 text-red-400" :
                            "border-gray-500 text-gray-400"
                          }
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          BG
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            ssStatus === "valid" ? "border-green-500 text-green-400" :
                            ssStatus === "expiring" ? "border-amber-500 text-amber-400" :
                            ssStatus === "expired" ? "border-red-500 text-red-400" :
                            "border-gray-500 text-gray-400"
                          }
                        >
                          <FileCheck className="h-3 w-3 mr-1" />
                          SS
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>
                  {data.schedule && !isCurrentWeek(data.schedule.weekStartDate) 
                    ? "📅 Upcoming Schedule" 
                    : "Weekly Schedule"}
                </span>
                {data.schedule && (
                  <div className="flex gap-2">
                    {!isCurrentWeek(data.schedule.weekStartDate) && (
                      <Badge variant="outline" className="border-blue-500 text-blue-400">
                        Upcoming
                      </Badge>
                    )}
                    <Badge variant="outline" className={data.schedule.isPublished ? "border-green-500 text-green-400" : "border-amber-500 text-amber-400"}>
                      {data.schedule.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                )}
              </CardTitle>
              {data.schedule && (
                <p className="text-sm text-gray-400">{formatWeekDate(data.schedule.weekStartDate)}</p>
              )}
            </CardHeader>
            <CardContent>
              {!data.schedule || data.schedule.shifts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No schedule published yet. Spring League starts March 9.
                </div>
              ) : (
                <div className="space-y-4">
                  {DAYS.map((day, dayIndex) => {
                    const dayShifts = data.schedule!.shifts.filter(s => s.dayOfWeek === dayIndex);
                    if (dayShifts.length === 0) return null;
                    
                    return (
                      <div key={day}>
                        <div className="font-medium text-sm text-gray-400 mb-2">{day}</div>
                        <div className="space-y-2">
                          {dayShifts.map((shift) => (
                            <div 
                              key={shift.id}
                              className={`p-3 rounded-lg ${shift.isHighlighted ? 'bg-red-950/30 border border-red-800' : 'bg-gray-800/50'}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{shift.coachName}</div>
                                  <div className="text-sm text-gray-400">
                                    {shift.startTime} - {shift.endTime} · {shift.field}{shift.subField ? ` (${shift.subField})` : ''}
                                  </div>
                                  {shift.group && (
                                    <div className="text-sm text-gray-300 mt-1">
                                      {shift.group} {shift.birthYears} {shift.participants && `· ${shift.participants} kids`}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {shift.region}
                                </Badge>
                              </div>
                              {shift.notes && (
                                <div className={`text-sm mt-2 ${shift.isHighlighted ? 'text-red-400' : 'text-gray-400'}`}>
                                  📝 {shift.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Curriculum/Resources Tab */}
        <TabsContent value="curriculum" className="mt-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-4">
              {Object.keys(data.resources.byAgeGroup).length === 0 && data.resources.other.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No resources available
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Age Group Resources */}
                  {AGE_GROUP_ORDER
                    .filter(age => data.resources.byAgeGroup[age])
                    .map((ageGroup) => {
                      const regions = data.resources.byAgeGroup[ageGroup];
                      const totalItems = Object.values(regions).flat().length;
                      
                      return (
                        <div key={ageGroup} className="border border-gray-800 rounded-lg overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-800/50"
                            onClick={() => toggleCategory(ageGroup)}
                          >
                            <span className="font-medium flex items-center gap-2">
                              <Folder className="h-4 w-4 text-amber-400" />
                              {ageGroup} Curriculum
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">{totalItems} items</span>
                              {expandedCategories.has(ageGroup) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </button>
                          {expandedCategories.has(ageGroup) && (
                            <div className="border-t border-gray-800">
                              {Object.entries(regions).map(([region, items]) => (
                                <div key={region} className="border-b border-gray-800 last:border-b-0">
                                  <div className="px-3 py-2 bg-gray-800/30 text-xs font-medium text-gray-400 uppercase">
                                    {region === "all" ? "All Regions" : region}
                                  </div>
                                  <div className="p-2 space-y-1">
                                    {items.map((item) => (
                                      <a
                                        key={item.id}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-800/50 group"
                                      >
                                        {item.type === "folder" ? (
                                          <Folder className="h-4 w-4 text-amber-400" />
                                        ) : item.type === "link" ? (
                                          <LinkIcon className="h-4 w-4 text-blue-400" />
                                        ) : (
                                          <File className="h-4 w-4 text-gray-400" />
                                        )}
                                        <div className="flex-1">
                                          <div className="text-sm group-hover:text-blue-400">{item.title}</div>
                                          {item.description && (
                                            <div className="text-xs text-gray-500">{item.description}</div>
                                          )}
                                        </div>
                                        <ExternalLink className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  
                  {/* Other Resources */}
                  {data.resources.other.length > 0 && (
                    <div className="border border-gray-800 rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-800/50"
                        onClick={() => toggleCategory("other")}
                      >
                        <span className="font-medium flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-400" />
                          Other Resources
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{data.resources.other.length} items</span>
                          {expandedCategories.has("other") ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                      {expandedCategories.has("other") && (
                        <div className="border-t border-gray-800 p-2 space-y-1">
                          {data.resources.other.map((item) => (
                            <a
                              key={item.id}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2 rounded hover:bg-gray-800/50 group"
                            >
                              {item.type === "folder" ? (
                                <Folder className="h-4 w-4 text-amber-400" />
                              ) : item.type === "link" ? (
                                <LinkIcon className="h-4 w-4 text-blue-400" />
                              ) : (
                                <File className="h-4 w-4 text-gray-400" />
                              )}
                              <div className="flex-1">
                                <div className="text-sm group-hover:text-blue-400">{item.title}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500">{item.description}</div>
                                )}
                              </div>
                              <ExternalLink className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetail post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
