"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, BookOpen } from "lucide-react";

interface BookLibraryProps {
  userId: Id<"users">;
}

export function BookLibrary({ userId }: BookLibraryProps) {
  const books = useQuery(api.books.getBookLibrary, { userId });
  const addBook = useMutation(api.books.addBookToLibrary);
  const toggleRead = useMutation(api.books.toggleBookRead);
  const deleteBook = useMutation(api.books.deleteBookFromLibrary);

  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggle = async (id: Id<"bookLibrary">, currentRead: boolean) => {
    await toggleRead({ id, read: !currentRead });
  };

  const handleAdd = async () => {
    if (newTitle.trim()) {
      await addBook({
        userId,
        title: newTitle,
        author: newAuthor || undefined,
        category: newCategory || undefined,
      });
      setNewTitle("");
      setNewAuthor("");
      setNewCategory("");
      setShowAddForm(false);
    }
  };

  const handleDelete = async (id: Id<"bookLibrary">) => {
    await deleteBook({ id });
  };

  if (!books) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-500" />
            <CardTitle>Book Library</CardTitle>
          </div>
          <CardDescription>Books available to read & explore</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-500" />
          <CardTitle>Book Library</CardTitle>
        </div>
        <CardDescription>Books available to read & explore</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {books.map((book) => (
            <div
              key={book._id}
              className="flex items-start gap-2 group hover:bg-accent/50 p-2 rounded transition-colors"
            >
              <Checkbox
                checked={book.read}
                onCheckedChange={() => handleToggle(book._id, book.read)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div
                  className={`text-sm font-medium ${
                    book.read ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {book.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {book.author && <span>{book.author}</span>}
                  {book.author && book.category && <span>•</span>}
                  {book.category && (
                    <span className="px-2 py-0.5 bg-accent rounded-full font-medium">
                      {book.category}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(book._id)}
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
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Author (optional)..."
              />
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category (optional)..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm" className="flex-1">
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTitle("");
                  setNewAuthor("");
                  setNewCategory("");
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
