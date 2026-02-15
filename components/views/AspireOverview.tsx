"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { AspireMonthSwimlanes } from "@/components/AspireMonthSwimlanes";
import { Calendar, List } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface AspireOverviewProps {
  userId: Id<"users">;
}

export function AspireOverview({ userId }: AspireOverviewProps) {
  const [viewMode, setViewMode] = useState<"timeline" | "sections">("timeline");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aspire Project Management</h1>
          <p className="text-muted-foreground mt-1">Soccer coaching operations & programs</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "timeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("timeline")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Timeline View
          </Button>
          <Button
            variant={viewMode === "sections" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("sections")}
          >
            <List className="h-4 w-4 mr-2" />
            By Section
          </Button>
        </div>
      </div>

      {/* Timeline View (Month Swimlanes) */}
      {viewMode === "timeline" && <AspireMonthSwimlanes userId={userId} />}

      {/* Sections View (Original Tabs) */}
      {viewMode === "sections" && (
        <Tabs defaultValue="spring" className="w-full">
        <TabsList>
          <TabsTrigger value="spring">Spring League</TabsTrigger>
          <TabsTrigger value="camps">Camps</TabsTrigger>
          <TabsTrigger value="pdp">PDP</TabsTrigger>
          <TabsTrigger value="7v7">7v7</TabsTrigger>
          <TabsTrigger value="pali">Pali</TabsTrigger>
          <TabsTrigger value="agoura">Agoura</TabsTrigger>
        </TabsList>

        <TabsContent value="pali" className="space-y-4">
          <ProjectTaskList
            userId={userId}
            project="aspire"
            subProject="pali"
            title="Pali (Region 69)"
            description="Pacific Palisades programs & coordination"
          />
        </TabsContent>

        <TabsContent value="agoura" className="space-y-4">
          <ProjectTaskList
            userId={userId}
            project="aspire"
            subProject="agoura"
            title="Agoura (Region 4)"
            description="Agoura programs & coordination"
          />
        </TabsContent>

        <TabsContent value="spring" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <ProjectTaskList
              userId={userId}
              project="aspire"
              subProject="spring-agoura"
              title="Agoura Spring League"
              description="Region 4 season planning & registration"
            />
            <ProjectTaskList
              userId={userId}
              project="aspire"
              subProject="spring-pali"
              title="Pali Spring League"
              description="Region 69 season planning & registration"
            />
          </div>
        </TabsContent>

        <TabsContent value="camps" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <ProjectTaskList
              userId={userId}
              project="aspire"
              subProject="camps-agoura"
              title="Agoura Camps"
              description="Region 4 camp planning & execution"
            />
            <ProjectTaskList
              userId={userId}
              project="aspire"
              subProject="camps-pali"
              title="Pali Camps"
              description="Region 69 camp planning & execution"
            />
          </div>
        </TabsContent>

        <TabsContent value="pdp" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <ProjectTaskList
              userId={userId}
              project="aspire"
              subProject="pdp-agoura"
              title="Agoura PDP"
              description="Region 4 winter training program"
            />
            <ProjectTaskList
              userId={userId}
              project="aspire"
              subProject="pdp-pali"
              title="Pali PDP"
              description="Region 69 winter training program"
            />
          </div>
        </TabsContent>

        <TabsContent value="7v7" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <ProjectTaskList
              userId={userId}
              project="aspire"
              subProject="7v7-agoura"
              title="Agoura 7v7 Tournaments"
              description="Region 4 tournament organization"
            />
            <ProjectTaskList
              userId={userId}
              project="aspire"
              subProject="7v7-pali"
              title="Pali 7v7 Tournaments"
              description="Region 69 tournament organization"
            />
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
