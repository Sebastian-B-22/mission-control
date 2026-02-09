"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, BookOpen } from "lucide-react";

const defaultBooks = [
  { title: "The Disappearing Spoon", author: "Sam Kean", completed: false },
  { title: "Blood and Guts", author: "Linda Allison", completed: false },
  { title: "See Inside Your Body", author: "Usborne", completed: false },
  { title: "The Way We Work", author: "David Macaulay", completed: false },
];

export function ReadAloudList() {
  const [books, setBooks] = useState(defaultBooks);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggle = (index: number) => {
    const updated = [...books];
    updated[index].completed = !updated[index].completed;
    setBooks(updated);
  };

  const handleAdd = () => {
    if (newTitle.trim()) {
      setBooks([
        ...books,
        { title: newTitle, author: newAuthor || "", completed: false },
      ]);
      setNewTitle("");
      setNewAuthor("");
      setShowAddForm(false);
    }
  };

  const handleDelete = (index: number) => {
    setBooks(books.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-500" />
          <CardTitle>Read-Aloud List</CardTitle>
        </div>
        <CardDescription>Books for family reading time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {books.map((book, i) => (
            <div
              key={i}
              className="flex items-start gap-2 group hover:bg-accent/50 p-2 rounded transition-colors"
            >
              <Checkbox
                checked={book.completed}
                onCheckedChange={() => handleToggle(i)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div
                  className={`text-sm font-medium ${
                    book.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {book.title}
                </div>
                {book.author && (
                  <div className="text-xs text-muted-foreground">{book.author}</div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        ) : (
          <div className="space-y-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Book title..."
              onKeyDown={(e) => e.key === "Enter" && newAuthor && handleAdd()}
            />
            <Input
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Author (optional)..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm" className="flex-1">
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTitle("");
                  setNewAuthor("");
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
