"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { MonthlyFocus } from "@/components/MonthlyFocus";
import { ProjectsThisMonth } from "@/components/ProjectsThisMonth";
import { ReadAloudList } from "@/components/ReadAloudListDB";
import { TripsOnHorizon } from "@/components/TripsOnHorizon";
import { FieldTripList } from "@/components/FieldTripList";
import { BookLibrary } from "@/components/BookLibraryDB";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Trash2, BookMarked, ArrowRight } from "lucide-react";

// Up Next Books Component
function UpNextBooks({ userId }: { userId: Id<"users"> }) {
  const books = useQuery(api.books.getUpNextBooks, { userId });
  const addBook = useMutation(api.books.addReadAloudBook);
  const deleteBook = useMutation(api.books.deleteReadAloudBook);
  const moveToReading = useMutation(api.books.moveToReading);

  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = async () => {
    if (newTitle.trim()) {
      await addBook({
        userId,
        title: newTitle.trim(),
        author: newAuthor.trim() || undefined,
        status: "up-next",
      });
      setNewTitle("");
      setNewAuthor("");
      setShowAddForm(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-lg">Books on Deck</CardTitle>
        </div>
        <CardDescription>What we&apos;ll read next</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {books && books.length > 0 ? (
          <div className="space-y-2">
            {books.map((book) => (
              <div
                key={book._id}
                className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 group"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{book.title}</div>
                  {book.author && (
                    <div className="text-xs text-muted-foreground">{book.author}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveToReading({ id: book._id })}
                  className="opacity-0 group-hover:opacity-100 text-green-600"
                  title="Move to Currently Reading"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteBook({ id: book._id })}
                  className="opacity-0 group-hover:opacity-100 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No books on deck yet</p>
        )}

        {showAddForm ? (
          <div className="space-y-2 pt-2 border-t">
            <Input
              placeholder="Book title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Input
              placeholder="Author (optional)"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

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
  void userId;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monthly Focus</h1>
        <p className="text-muted-foreground mt-1">Current & upcoming learning themes</p>
      </div>
      <MonthlyFocus />
    </div>
  );
}

export function HomeschoolProjectsView({ userId }: HomeschoolSubViewProps) {
  void userId;
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
              <CardTitle className="text-lg">Next Month&apos;s Projects</CardTitle>
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
          <h2 className="text-xl font-semibold text-orange-500">Up Next</h2>
          <UpNextBooks userId={userId} />
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
  void userId;
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
