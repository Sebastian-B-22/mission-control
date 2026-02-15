"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Id } from "@/convex/_generated/dataModel";

interface HTAOverviewProps {
  userId: Id<"users">;
}

export function HTAOverview({ userId }: HTAOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">HTA Project Management</h1>
        <p className="text-muted-foreground mt-1">Home Team Academy launch preparation</p>
      </div>

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
    </div>
  );
}
