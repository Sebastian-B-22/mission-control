"use client";

import { WeeklySchedule } from "@/components/WeeklySchedule";
import { MonthlyFocus } from "@/components/MonthlyFocus";
import { ProjectsThisMonth } from "@/components/ProjectsThisMonth";
import { ReadAloudList } from "@/components/ReadAloudListDB";
import { TripsOnHorizon } from "@/components/TripsOnHorizon";
import { FieldTripList } from "@/components/FieldTripList";
import { BookLibrary } from "@/components/BookLibraryDB";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <p className="text-muted-foreground mt-1">Current & upcoming learning themes</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* This Month */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-600">This Month</h2>
          <MonthlyFocus />
        </div>

        {/* Up Next */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-600">Up Next</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Month's Focus</CardTitle>
              <CardDescription>Planning ahead</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-lg text-sm"
                placeholder="Add next month's focus areas here..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function HomeschoolProjectsView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects This Month</h1>
        <p className="text-muted-foreground mt-1">Current & upcoming project-based learning</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* This Month */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-600">This Month</h2>
          <ProjectsThisMonth />
        </div>

        {/* Up Next */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-600">Up Next</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Month's Projects</CardTitle>
              <CardDescription>Projects in the pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-lg text-sm"
                placeholder="Add upcoming projects here..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function HomeschoolReadAloudView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Read Aloud List</h1>
        <p className="text-muted-foreground mt-1">Current & upcoming family reading</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Currently Reading */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-600">Currently Reading</h2>
          <ReadAloudList userId={userId} />
        </div>

        {/* Up Next */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-600">Up Next</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Books on Deck</CardTitle>
              <CardDescription>What we'll read next</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-lg text-sm"
                placeholder="Add upcoming read-aloud books here..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
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
