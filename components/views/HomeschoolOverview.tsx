"use client";

import { WeeklySchedule } from "@/components/WeeklySchedule";
import { HomeschoolObjectives } from "@/components/HomeschoolObjectives";
import { MonthlyFocus } from "@/components/MonthlyFocus";
import { ProjectsThisMonth } from "@/components/ProjectsThisMonth";
import { ReadAloudList } from "@/components/ReadAloudListDB";
import { TripsOnHorizon } from "@/components/TripsOnHorizon";
import { FieldTripList } from "@/components/FieldTripList";
import { BookLibrary } from "@/components/BookLibraryDB";
import { Id } from "@/convex/_generated/dataModel";

interface HomeschoolOverviewProps {
  userId: Id<"users">;
}

export function HomeschoolOverview({ userId }: HomeschoolOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">A & R Academy</h1>
        <p className="text-muted-foreground mt-1">Homeschool management & planning</p>
      </div>

      {/* Homeschool Objectives - Slim Banner */}
      <HomeschoolObjectives />

      {/* Weekly Schedule - Full Width */}
      <WeeklySchedule userId={userId} />

      {/* Two Column Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <MonthlyFocus />
          <ProjectsThisMonth />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ReadAloudList userId={userId} />
          <TripsOnHorizon />
        </div>
      </div>

      {/* Long Lists - Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <FieldTripList userId={userId} />
        <BookLibrary userId={userId} />
      </div>
    </div>
  );
}
