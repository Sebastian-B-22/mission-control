"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HTAMonthSwimlanes } from "@/components/HTAMonthSwimlanes";
import { Calendar, List } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface HTAOverviewProps {
  userId: Id<"users">;
}

export function HTAOverview({ userId }: HTAOverviewProps) {
  const [viewMode, setViewMode] = useState<"timeline" | "sections">("timeline");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HTA Project Management</h1>
          <p className="text-muted-foreground mt-1">Home Team Academy launch preparation</p>
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
      {viewMode === "timeline" && <HTAMonthSwimlanes userId={userId} />}

      {/* Sections View (Original Tabs) */}
      {viewMode === "sections" && (
        <Tabs defaultValue="gtm" className="w-full">
        <TabsList>
          <TabsTrigger value="gtm">GTM Timeline</TabsTrigger>
          <TabsTrigger value="product">Product Dev</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum Dev</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="gtm" className="space-y-4">
          <ProjectTaskList
            userId={userId}
            project="hta"
            subProject="gtm"
            title="Go-To-Market Timeline"
            description="Launch milestones, key dates & GTM strategy"
          />
        </TabsContent>

        <TabsContent value="product" className="space-y-4">
          <ErrorBoundary>
            <ProjectTaskList
              userId={userId}
              project="hta"
              subProject="product"
              title="Product Development"
              description="Subscription box development & testing"
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-4">
          <ProjectTaskList
            userId={userId}
            project="hta"
            subProject="curriculum"
            title="Curriculum Development"
            description="Activity creation & content"
          />
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <ProjectTaskList
            userId={userId}
            project="hta"
            subProject="marketing"
            title="Marketing"
            description="Brand, content & customer acquisition"
          />
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <ProjectTaskList
            userId={userId}
            project="hta"
            subProject="operations"
            title="Operations"
            description="Fulfillment, shipping & systems"
          />
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
