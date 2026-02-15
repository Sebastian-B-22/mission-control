"use client";

import { WeeklySchedule } from "@/components/WeeklySchedule";
import { MonthlyFocus } from "@/components/MonthlyFocus";
import { ProjectsThisMonth } from "@/components/ProjectsThisMonth";
import { ReadAloudList } from "@/components/ReadAloudListDB";
import { TripsOnHorizon } from "@/components/TripsOnHorizon";
import { FieldTripList } from "@/components/FieldTripList";
import { BookLibrary } from "@/components/BookLibraryDB";
import { Id } from "@/convex/_generated/dataModel";

interface HomeschoolSubViewProps {
  userId: Id<"users">;
}

export function HomeschoolScheduleView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Weekly Schedule</h1>
        <p className="text-muted-foreground mt-1">A & R Academy routine</p>
      </div>
      <WeeklySchedule userId={userId} />
    </div>
  );
}

export function HomeschoolFocusView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monthly Focus</h1>
        <p className="text-muted-foreground mt-1">This month's priorities</p>
      </div>
      <MonthlyFocus />
    </div>
  );
}

export function HomeschoolProjectsView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects This Month</h1>
        <p className="text-muted-foreground mt-1">Current project-based learning</p>
      </div>
      <ProjectsThisMonth />
    </div>
  );
}

export function HomeschoolReadAloudView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Read Aloud List</h1>
        <p className="text-muted-foreground mt-1">Current family reading</p>
      </div>
      <ReadAloudList userId={userId} />
    </div>
  );
}

export function HomeschoolLibraryView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Book Library</h1>
        <p className="text-muted-foreground mt-1">Full collection</p>
      </div>
      <BookLibrary userId={userId} />
    </div>
  );
}

export function HomeschoolFieldTripsView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Field Trips</h1>
        <p className="text-muted-foreground mt-1">Educational adventures</p>
      </div>
      <FieldTripList userId={userId} />
    </div>
  );
}

export function HomeschoolTripsView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trips on Horizon</h1>
        <p className="text-muted-foreground mt-1">Upcoming travel</p>
      </div>
      <TripsOnHorizon />
    </div>
  );
}
