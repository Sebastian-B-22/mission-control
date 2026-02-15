"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Calendar, KanbanSquare, Users } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { SebastianDailyView } from "@/components/SebastianDailyView";
import { SebastianCalendarView } from "@/components/SebastianCalendarView";
import { SebastianKanban } from "@/components/SebastianKanban";
import { SebastianAgentView } from "@/components/SebastianAgentView";

interface SebastianWorkspaceProps {
  userId: Id<"users">;
}

export function SebastianWorkspace({ userId }: SebastianWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("daily");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span className="text-amber-500">⚡</span>
          Sebastian's Workspace
        </h1>
        <p className="text-muted-foreground mt-1">AI sidekick coordination center</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Daily</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <KanbanSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Agents</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <SebastianDailyView userId={userId} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <SebastianCalendarView userId={userId} />
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <SebastianKanban userId={userId} />
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <SebastianAgentView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
