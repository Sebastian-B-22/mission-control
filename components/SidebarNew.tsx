"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AGENT_PROFILES,
  AgentActivity,
  findLastAgentActivity,
  formatRelativeActivity,
  getActivityTone,
} from "@/lib/agentOps";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  Calendar,
  Clock3,
  Target,
  Home,
  Briefcase,
  BookOpen,
  Heart,
  ChevronRight,
  ChevronDown,
  Handshake,
  Users,
  DollarSign,
  Hammer,
  Ticket,
} from "lucide-react";
import { SoccerBall } from "@/components/icons/SoccerBall";

interface SidebarProps {
  userId: Id<"users">;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function SidebarNew({ userId, currentView, onViewChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedChildGroups, setExpandedChildGroups] = useState<string[]>([]);

  useEffect(() => {
    const activeSection = ["health", "homeschool", "family", "personal", "professional", "aspire", "hta", "agents"].find((section) =>
      currentView === section || currentView.startsWith(`${section}-`)
    );

    if (activeSection) {
      setExpandedSections((prev) => (prev.includes(activeSection) ? prev : [...prev, activeSection]));
    }
  }, [currentView]);

  // Get Sebastian&apos;s tasks for quick status
  const sebastianTasks = useQuery(api.sebastianTasks.getSebastianTasks, { userId }) || [];
  const inProgressCount = sebastianTasks.filter((t: any) => t.status === "in-progress").length;
  const todoCount = sebastianTasks.filter((t: any) => t.status === "todo").length;

  // Get content pipeline review count for badge
  const pipelineReview = useQuery(api.contentPipeline.listByStage, { stage: "review" }) || [];
  const reviewCount = pipelineReview.length;
  const recentAgentMessages = useQuery(api.agentHuddle.getRecent, { limit: 80 }) as AgentActivity[] | undefined;

  // Registration counts now shown on pages, not sidebar

  // Get RPM categories
  const categories = useQuery(api.rpm.getCategoriesByUser, { userId }) || [];
  const personalCategories = categories.filter((c: any) => c.type === "personal");
  const professionalCategories = categories.filter((c: any) => c.type === "professional");

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  const toggleChildGroup = (group: string) => {
    setExpandedChildGroups(prev =>
      prev.includes(group)
        ? prev.filter(item => item !== group)
        : [...prev, group]
    );
  };

  const isChildGroupExpanded = (group: string) => expandedChildGroups.includes(group);

  const htaChildTones: Record<string, { active: string; idle: string; badge: string }> = {
    "hta-gtm": {
      active: "border-l-2 border-cyan-400 bg-cyan-500/12 text-cyan-100",
      idle: "border-l-2 border-transparent text-zinc-400 hover:border-cyan-500/40 hover:bg-cyan-500/6 hover:text-cyan-100",
      badge: "bg-cyan-500/12 text-cyan-100",
    },
    "hta-product": {
      active: "border-l-2 border-violet-400 bg-violet-500/12 text-violet-100",
      idle: "border-l-2 border-transparent text-zinc-400 hover:border-violet-500/40 hover:bg-violet-500/6 hover:text-violet-100",
      badge: "bg-violet-500/12 text-violet-100",
    },
    "hta-curriculum": {
      active: "border-l-2 border-emerald-400 bg-emerald-500/12 text-emerald-100",
      idle: "border-l-2 border-transparent text-zinc-400 hover:border-emerald-500/40 hover:bg-emerald-500/6 hover:text-emerald-100",
      badge: "bg-emerald-500/12 text-emerald-100",
    },
    "hta-marketing": {
      active: "border-l-2 border-amber-400 bg-amber-500/12 text-amber-100",
      idle: "border-l-2 border-transparent text-zinc-400 hover:border-amber-500/40 hover:bg-amber-500/6 hover:text-amber-100",
      badge: "bg-amber-500/12 text-amber-100",
    },
    "hta-operations": {
      active: "border-l-2 border-rose-400 bg-rose-500/12 text-rose-100",
      idle: "border-l-2 border-transparent text-zinc-400 hover:border-rose-500/40 hover:bg-rose-500/6 hover:text-rose-100",
      badge: "bg-rose-500/12 text-rose-100",
    },
  };

  const getChildTone = (section: string | undefined, childView: string, active: boolean) => {
    if (section === "hta") {
      const tone = htaChildTones[childView];
      if (tone) return active ? tone.active : tone.idle;
    }

    return active
      ? "text-brand bg-surface-2 font-medium"
      : "text-ink-soft hover:bg-surface-2";
  };

  const agentOpsViews = new Set([
    "sebastian",
    "agent-ideas",
    "content-pipeline",
    "email-drafts",
    "agent-learnings",
    "engagement-habits",
    "agent-huddle-main",
    "agent-huddle-aspire-ops",
    "agent-huddle-hta-launch",
    "agent-huddle-family",
    "agent-huddle-ideas",
    "agent-huddle-overnight",
    "agent-huddle-joy-support",
    "knowledge-files",
    "memory",
  ]);

  const isItemActive = (item: any) => {
    if (item.activeViews) {
      return item.activeViews.includes(currentView);
    }

    return currentView === item.view || (item.section && currentView.startsWith(item.section));
  };

  const isChildActive = (child: any) => {
    if (child.activeViews) {
      return child.activeViews.includes(currentView);
    }

    return currentView === child.view;
  };

  const getChildKey = (child: any) => child.view || child.href || child.name;

  const navigation = [
    {
      name: "Daily",
      icon: Calendar,
      view: "daily",
    },
    {
      name: "Weekly",
      icon: Calendar,
      view: "weekly",
    },
    {
      name: "Monthly",
      icon: Calendar,
      view: "monthly",
    },
    {
      name: "Time",
      icon: Clock3,
      view: "time",
    },
    {
      name: "Health",
      icon: Heart,
      view: "health",
      expandable: true,
      section: "health",
      activeViews: ["health", "health-daily", "health-strength", "health-biomap"],
      children: [
        { name: "Daily Health", view: "health-daily" },
        { name: "Strength", view: "health-strength" },
        { name: "BioMap", view: "health-biomap" },
      ],
    },
    {
      name: "Homeschool",
      icon: BookOpen,
      view: "homeschool-overview",
      expandable: true,
      section: "homeschool",
      children: [
        { name: "Progress", view: "homeschool-progress" },
        {
          name: "Schedule",
          view: "homeschool-daily",
          activeViews: ["homeschool-daily", "homeschool-schedule", "homeschool-focus"],
          children: [
            { name: "Daily", view: "homeschool-daily" },
            { name: "Weekly", view: "homeschool-schedule" },
            { name: "Monthly", view: "homeschool-focus" },
          ],
        },
        {
          name: "Resource Library",
          view: "homeschool-resources",
          activeViews: ["homeschool-resources", "homeschool-library", "homeschool-games"],
          children: [
            { name: "Book Library", view: "homeschool-library" },
            { name: "Game Library", view: "homeschool-games" },
            { name: "Typing Game", href: "/kids/typing" },
          ],
        },
        {
          name: "Life Skills",
          view: "homeschool-life-skills",
          activeViews: ["homeschool-life-skills", "homeschool-summer", "homeschool-health"],
          children: [
            { name: "Checklist", view: "homeschool-life-skills" },
            { name: "Summer Goals", view: "homeschool-summer" },
            { name: "Health Habits", view: "homeschool-health" },
          ],
        },
        { name: "Projects", view: "homeschool-projects" },
        { name: "Read Aloud List", view: "homeschool-readaloud" },
        { name: "Field Trips", view: "homeschool-fieldtrips" },
        { name: "Travel", view: "homeschool-trips" },
      ]
    },
    {
      name: "Family Meeting",
      icon: Handshake,
      view: "family-meeting",
      expandable: true,
      section: "family",
      children: [
        { name: "Acknowledgements", view: "family-acknowledgements" },
        { name: "Discussion Queue", view: "family-discussion" },
        { name: "Goals", view: "family-goals" },
        { name: "Support Requests", view: "family-support" },
        { name: "Meal Planning", view: "family-meals" },
        { name: "Movie Night", view: "family-movies" },
        { name: "Game Nights", view: "family-games" },
      ]
    },
    {
      name: "Finance",
      icon: DollarSign,
      view: "finance",
    },
    {
      name: "Tickets",
      icon: Ticket,
      view: "tickets",
    },
    {
      name: "Home Remodel",
      icon: Hammer,
      view: "home-remodel",
    },
    {
      name: "Personal RPM",
      icon: Home,
      view: "personal-overview",
      expandable: true,
      section: "personal",
      children: [
        ...personalCategories.map((cat: any) => ({
          name: cat.name,
          view: `personal-category-${cat._id}`,
          categoryId: cat._id,
        })),
        { name: "Personal CRM", view: "personal-crm" },
      ]
    },
    {
      name: "Professional RPM",
      icon: Briefcase,
      view: "professional-overview",
      expandable: true,
      section: "professional",
      children: professionalCategories.map((cat: any) => ({
        name: cat.name,
        view: `professional-category-${cat._id}`,
        categoryId: cat._id,
      }))
    },
    {
      name: "Aspire",
      icon: SoccerBall,
      view: "aspire-overview",
      expandable: true,
      section: "aspire",
      children: [
        { name: "Family CRM", view: "aspire-families" },
        { name: "Spring Ops", view: "aspire-spring" },
        { name: "Coach Staffing", view: "aspire-coach-hub" },
        { name: "Camps", view: "aspire-camps" },
        { name: "PDP", view: "aspire-pdp" },
        { name: "7v7", view: "aspire-7v7" },
        { name: "Pali Tasks", view: "aspire-pali" },
        { name: "Agoura Tasks", view: "aspire-agoura" },
      ]
    },
    {
      name: "HTA",
      icon: Target,
      view: "hta-overview",
      expandable: true,
      section: "hta",
      children: [
        { name: "World Cup", view: "hta-worldcup" },
        { name: "GTM Timeline", view: "hta-gtm" },
        { name: "Product Dev", view: "hta-product" },
        { name: "Curriculum Dev", view: "hta-curriculum" },
        { name: "Marketing", view: "hta-marketing" },
        { name: "Operations", view: "hta-operations" },
      ]
    },
    {
      name: "Agent Ops",
      icon: Users,
      view: "agent-huddle-main",
      expandable: true,
      section: "agents",
      activeViews: Array.from(agentOpsViews),
      children: [
        { type: "label", name: "Work" },
        { name: "Queue", view: "sebastian" },
        { name: "Ideas", view: "agent-ideas" },
        { name: "Content", view: "content-pipeline", badge: reviewCount > 0 ? `${reviewCount} to review` : null },
        { name: "Emails & Texts", view: "email-drafts" },
        { name: "Training", view: "agent-learnings" },
        { name: "Engagement", view: "engagement-habits" },
        { type: "label", name: "Admin" },
        { name: "Huddle", view: "agent-huddle-main", activeViews: ["agent-huddle-main", "agent-huddle-aspire-ops", "agent-huddle-hta-launch", "agent-huddle-family", "agent-huddle-ideas", "agent-huddle-overnight", "agent-huddle-joy-support"] },
        { name: "Docs", view: "knowledge-files" },
        { name: "Memory Search", view: "memory" },
      ]
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button (only show on small screens) */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar - always visible on desktop, collapsible on mobile */}
      <div
        className={`fixed top-0 left-0 h-full bg-surface-0 border-r border-line shadow-lg z-40 transition-transform duration-300 w-64 overflow-y-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-6 pt-16 lg:pt-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              Mission Control
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Quick Navigation</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => (
              <div key={item.view}>
                {/* Main Item */}
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      if (item.expandable && item.section) {
                        toggleSection(item.section);
                      }
                      onViewChange(item.view);
                      if (!item.expandable) {
                        setIsOpen(false);
                      }
                    }}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isItemActive(item)
                        ? "bg-surface-2 text-brand font-medium"
                        : "text-zinc-300 hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                    {(item as any).badge && (
                      <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded-full">
                        {(item as any).badge}
                      </span>
                    )}
                  </button>
                  
                  {/* Expand/Collapse Icon */}
                  {item.expandable && item.section && (
                    <button
                      onClick={() => toggleSection(item.section!)}
                      className="p-2 hover:bg-surface-2 rounded"
                    >
                      {isExpanded(item.section) ? (
                        <ChevronDown className="h-3 w-3 text-zinc-500" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-zinc-500" />
                      )}
                    </button>
                  )}
                </div>

                {/* Sub-navigation */}
                {item.expandable && item.section && isExpanded(item.section) && item.children && item.children.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-line pl-2">
                    {item.children.map((child: any) => (
                      child.type === "label" ? (
                        <div
                          key={`label-${child.name}`}
                          className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500"
                        >
                          {child.name}
                        </div>
                      ) : (
                        <div key={getChildKey(child)} className="space-y-1">
                          <button
                            onClick={() => {
                              const childKey = getChildKey(child);
                              if (child.href) {
                                window.location.href = child.href;
                              } else {
                                onViewChange(child.view);
                              }
                              if (child.children?.length) {
                                toggleChildGroup(childKey);
                              } else {
                                setIsOpen(false);
                              }
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded text-xs transition-colors ${getChildTone(item.section, child.view, isChildActive(child))}`}
                          >
                            <div className="flex items-center gap-2">
                              {child.children?.length && isChildGroupExpanded(getChildKey(child)) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              <span>{child.name}</span>
                            </div>
                            {(child as any).badge ? (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${item.section === "hta" ? (htaChildTones[child.view]?.badge || "bg-zinc-800 text-zinc-300") : "bg-zinc-800 text-zinc-300"}`}>
                                {(child as any).badge}
                              </span>
                            ) : null}
                          </button>
                          {child.children?.length && isChildGroupExpanded(getChildKey(child)) ? (
                            <div className="ml-5 space-y-1 border-l border-zinc-800 pl-2">
                              {child.children.map((grandchild: any) => (
                                <button
                                  key={getChildKey(grandchild)}
                                  onClick={() => {
                                    if (grandchild.href) {
                                      window.location.href = grandchild.href;
                                    } else {
                                      onViewChange(grandchild.view);
                                    }
                                    setIsOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-[11px] transition-colors ${getChildTone(item.section, grandchild.view || grandchild.href, isChildActive(grandchild))}`}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                  <span>{grandchild.name}</span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Agent Status Card */}
          <Card className="mt-6 gap-3 bg-surface-1 p-4 border-line">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-200">Agent Squad</h3>
              <button
                type="button"
                onClick={() => onViewChange("agent-huddle-main")}
                className="rounded border border-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:border-amber-500/30 hover:text-amber-300"
              >
                Huddle
              </button>
            </div>
            <div className="space-y-1.5">
              {AGENT_PROFILES.map((agent) => {
                const lastActivity = findLastAgentActivity(recentAgentMessages, agent.id);
                const status = getActivityTone(lastActivity?.createdAt);
                const content = (
                  <>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-medium text-zinc-300">{agent.name}</span>
                        <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClassName)} />
                      </div>
                      <span className="block truncate text-[10px] text-zinc-500">{agent.title}</span>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-zinc-500">
                      {formatRelativeActivity(lastActivity?.createdAt)}
                    </span>
                  </>
                );

                return agent.view ? (
                  <button
                    key={agent.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded px-1 py-1 text-left transition-colors hover:bg-surface-2"
                    onClick={() => onViewChange(agent.view!)}
                  >
                    {content}
                  </button>
                ) : (
                  <div key={agent.id} className="flex items-center justify-between gap-2 rounded px-1 py-1">
                    {content}
                  </div>
                );
              })}
            </div>
            {(todoCount > 0 || inProgressCount > 0) && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-zinc-500">Sebastian&apos;s Work:</p>
                <div className="mt-1 space-y-1">
                  {inProgressCount > 0 && (
                    <p className="text-xs">
                      <span className="text-amber-500 font-medium">{inProgressCount}</span> in progress
                    </p>
                  )}
                  {todoCount > 0 && (
                    <p className="text-xs">
                      <span className="text-zinc-400 font-medium">{todoCount}</span> to do
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Today's Date */}
          <div className="mt-6 text-xs text-center text-zinc-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Overlay when sidebar is open (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
