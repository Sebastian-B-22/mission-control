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
  CheckSquare,
  Target,
  Users,
  Home,
  Briefcase,
  BookOpen,
  Bot,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  userId: Id<"users">;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ userId, currentTab, onTabChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get today's date for quick stats
  const today = new Date().toISOString().split("T")[0];
  
  // Get Sebastian's tasks for quick status
  const sebastianTasks = useQuery(api.sebastianTasks.getSebastianTasks, { userId }) || [];
  const inProgressCount = sebastianTasks.filter(t => t.status === "in-progress").length;
  const todoCount = sebastianTasks.filter(t => t.status === "todo").length;

  // Get RPM categories for quick links
  const categories = useQuery(api.rpm.getCategoriesByUser, { userId }) || [];
  const personalCategories = categories.filter(c => c.type === "personal");
  const professionalCategories = categories.filter(c => c.type === "professional");

  const navigation = [
    {
      name: "Daily",
      icon: Calendar,
      tab: "daily",
      badge: null,
    },
    {
      name: "Personal RPM",
      icon: Home,
      tab: "personal",
      badge: null,
      children: personalCategories.slice(0, 3).map(cat => ({
        name: cat.name,
        onClick: () => {
          onTabChange("personal");
          setIsOpen(false);
        }
      }))
    },
    {
      name: "Professional RPM",
      icon: Briefcase,
      tab: "professional",
      badge: null,
      children: professionalCategories.slice(0, 3).map(cat => ({
        name: cat.name,
        onClick: () => {
          onTabChange("professional");
          setIsOpen(false);
        }
      }))
    },
    {
      name: "HTA",
      icon: Target,
      tab: "hta",
      badge: null,
    },
    {
      name: "Aspire",
      icon: Users,
      tab: "aspire",
      badge: null,
    },
    {
      name: "Homeschool",
      icon: BookOpen,
      tab: "homeschool",
      badge: null,
    },
    {
      name: "Sebastian",
      icon: Bot,
      tab: "sebastian",
      badge: inProgressCount > 0 ? `${inProgressCount} in progress` : null,
    },
  ];

  return (
    <>
      {/* Mobile/Desktop Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 overflow-y-auto`}
      >
        <div className="p-6 pt-16">
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
              <div key={item.tab}>
                <button
                  onClick={() => {
                    onTabChange(item.tab);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentTab === item.tab
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

                {/* Sub-navigation for categories */}
                {item.children && item.children.length > 0 && currentTab === item.tab && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child, idx) => (
                      <button
                        key={idx}
                        onClick={child.onClick}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors"
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
                <span className="text-gray-600">Sebastian</span>
                <span className="text-green-600 font-medium">● Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Scout</span>
                <span className="text-green-600 font-medium">● Live</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Maven</span>
                <span className="text-green-600 font-medium">● Live</span>
              </div>
            </div>
            {(todoCount > 0 || inProgressCount > 0) && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-500">Sebastian's Work:</p>
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
