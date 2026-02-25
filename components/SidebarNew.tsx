"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Menu,
  X,
  Calendar,
  Target,
  Users,
  Home,
  Briefcase,
  BookOpen,
  Bot,
  Brain,
  Layers,
  Heart,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Handshake,
} from "lucide-react";

interface SidebarProps {
  userId: Id<"users">;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function SidebarNew({ userId, currentView, onViewChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Get Sebastian&apos;s tasks for quick status
  const sebastianTasks = useQuery(api.sebastianTasks.getSebastianTasks, { userId }) || [];
  const inProgressCount = sebastianTasks.filter(t => t.status === "in-progress").length;
  const todoCount = sebastianTasks.filter(t => t.status === "todo").length;

  // Get content pipeline review count for badge
  const pipelineReview = useQuery(api.contentPipeline.listByStage, { stage: "review" }) || [];
  const reviewCount = pipelineReview.length;

  // Get RPM categories
  const categories = useQuery(api.rpm.getCategoriesByUser, { userId }) || [];
  const personalCategories = categories.filter(c => c.type === "personal");
  const professionalCategories = categories.filter(c => c.type === "professional");

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  const navigation = [
    {
      name: "Daily",
      icon: Calendar,
      view: "daily",
    },
    {
      name: "Personal CRM",
      icon: Heart,
      view: "personal-crm",
    },
    {
      name: "Family Meeting",
      icon: Handshake,
      view: "family-meeting",
    },
    {
      name: "Health",
      icon: Heart,
      view: "health",
    },
    {
      name: "Personal RPM",
      icon: Home,
      view: "personal-overview",
      expandable: true,
      section: "personal",
      children: personalCategories.map(cat => ({
        name: cat.name,
        view: `personal-category-${cat._id}`,
        categoryId: cat._id,
      }))
    },
    {
      name: "Professional RPM",
      icon: Briefcase,
      view: "professional-overview",
      expandable: true,
      section: "professional",
      children: professionalCategories.map(cat => ({
        name: cat.name,
        view: `professional-category-${cat._id}`,
        categoryId: cat._id,
      }))
    },
    {
      name: "HTA",
      icon: Target,
      view: "hta-overview",
      expandable: true,
      section: "hta",
      children: [
        { name: "GTM Timeline", view: "hta-gtm" },
        { name: "Product Dev", view: "hta-product" },
        { name: "Curriculum Dev", view: "hta-curriculum" },
        { name: "Marketing", view: "hta-marketing" },
        { name: "Operations", view: "hta-operations" },
      ]
    },
    {
      name: "Aspire",
      icon: Users,
      view: "aspire-overview",
      expandable: true,
      section: "aspire",
      children: [
        { name: "👨‍👩‍👧‍👦 Family CRM", view: "aspire-families" },
        { name: "Spring League", view: "aspire-spring" },
        { name: "Camps", view: "aspire-camps" },
        { name: "PDP", view: "aspire-pdp" },
        { name: "7v7", view: "aspire-7v7" },
        { name: "Pali", view: "aspire-pali" },
        { name: "Agoura", view: "aspire-agoura" },
      ]
    },
    {
      name: "Homeschool",
      icon: BookOpen,
      view: "homeschool-overview",
      expandable: true,
      section: "homeschool",
      children: [
        { name: "Weekly Schedule", view: "homeschool-schedule" },
        { name: "Monthly Focus", view: "homeschool-focus" },
        { name: "Projects This Month", view: "homeschool-projects" },
        { name: "Read Aloud List", view: "homeschool-readaloud" },
        { name: "Book Library", view: "homeschool-library" },
        { name: "Field Trips", view: "homeschool-fieldtrips" },
        { name: "Trips on Horizon", view: "homeschool-trips" },
      ]
    },
    {
      name: "Sebastian",
      icon: Bot,
      view: "sebastian",
      badge: inProgressCount > 0 ? `${inProgressCount} in progress` : null,
      expandable: true,
      section: "sebastian",
      children: [
        { name: "Content Pipeline", view: "content-pipeline", badge: reviewCount > 0 ? `${reviewCount} to review` : null },
        { name: "Engagement", view: "engagement-habits" },
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
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-transform duration-300 w-64 overflow-y-auto
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
                      currentView === item.view || currentView.startsWith(item.view.split('-')[0])
                        ? "bg-amber-50 text-amber-900 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                  
                  {/* Expand/Collapse Icon */}
                  {item.expandable && item.section && (
                    <button
                      onClick={() => toggleSection(item.section!)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      {isExpanded(item.section) ? (
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>

                {/* Sub-navigation */}
                {item.expandable && item.section && isExpanded(item.section) && item.children && item.children.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                    {item.children.map((child) => (
                      <button
                        key={child.view}
                        onClick={() => {
                          onViewChange(child.view);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                          currentView === child.view
                            ? "bg-amber-50 text-amber-900 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <ChevronRight className="h-3 w-3" />
                        <span>{child.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Agent Status Card */}
          <Card className="mt-6 p-4">
            <h3 className="text-sm font-semibold mb-3">Agent Squad</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="text-gray-700 font-medium">Sebastian</span>
                  <span className="text-gray-500 text-[10px]">Chief of Staff</span>
                </div>
                <span className="text-green-600 font-medium">● Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="text-gray-700 font-medium">Scout</span>
                  <span className="text-gray-500 text-[10px]">Operations</span>
                </div>
                <span className="text-green-600 font-medium">● Live</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="text-gray-700 font-medium">Maven</span>
                  <span className="text-gray-500 text-[10px]">Marketing</span>
                </div>
                <span className="text-green-600 font-medium">● Live</span>
              </div>
            </div>
            {(todoCount > 0 || inProgressCount > 0) && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-500">Sebastian&apos;s Work:</p>
                <div className="mt-1 space-y-1">
                  {inProgressCount > 0 && (
                    <p className="text-xs">
                      <span className="text-amber-600 font-medium">{inProgressCount}</span> in progress
                    </p>
                  )}
                  {todoCount > 0 && (
                    <p className="text-xs">
                      <span className="text-gray-600 font-medium">{todoCount}</span> to do
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Today's Date */}
          <div className="mt-6 text-xs text-center text-gray-400">
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
