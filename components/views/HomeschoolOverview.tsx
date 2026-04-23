"use client";

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

      <HomeschoolObjectives />

      <MonthlyFocus mode="overview" />

      <div className="grid gap-6 md:grid-cols-3">
        <ProjectsThisMonth />
        <ReadAloudList userId={userId} />
        <TripsOnHorizon />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FieldTripList userId={userId} />
        <BookLibrary userId={userId} />
      </div>
    </div>
  );
}
