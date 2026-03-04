"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, BookOpen, Loader2, ArrowRight } from "lucide-react";

interface ReadAloudListProps {
  userId: Id<"users">;
}

// Fetch book cover from Open Library API
async function fetchBookCover(title: string, author?: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${author || ""}`);
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=1`
    );
    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
      const book = data.docs[0];
      if (book.cover_i) {
        return `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
      }
      if (book.isbn && book.isbn.length > 0) {
        return `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-M.jpg`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching book cover:", error);
    return null;
  }
}

// Book cover component with fallback
function BookCover({ coverUrl, title }: { coverUrl?: string; title: string }) {
  const [error, setError] = useState(false);
  
  if (!coverUrl || error) {
    return (
      <div className="w-12 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-5 h-5 text-purple-500 opacity-50" />
      </div>
    );
  }
  
  return (
    <img
      src={coverUrl}
      alt={title}
      className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0"
      onError={() => setError(true)}
    />
  );
}

export function ReadAloudList({ userId }: ReadAloudListProps) {
  const books = useQuery(api.books.getReadAloudBooks, { userId });
  const upNextBooks = useQuery(api.books.getUpNextBooks, { userId });
  const addBook = useMutation(api.books.addReadAloudBook);
  const toggleCompleted = useMutation(api.books.toggleReadAloudCompleted);
  const moveToReading = useMutation(api.books.moveToReading);
  const deleteBook = useMutation(api.books.deleteReadAloudBook);
  const updateCover = useMutation(api.books.updateReadAloudCover);

  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [addToUpNext, setAddToUpNext] = useState(false);

  const handleToggle = async (id: Id<"readAloudBooks">, currentCompleted: boolean) => {
    await toggleCompleted({ id, completed: !currentCompleted });
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    
    setIsSearching(true);
    const coverUrl = await fetchBookCover(newTitle, newAuthor);
    
    await addBook({
      userId,
      title: newTitle.trim(),
      author: newAuthor.trim() || undefined,
      coverUrl: coverUrl || undefined,
      status: addToUpNext ? "up-next" : "reading",
    });
    
    setNewTitle("");
    setNewAuthor("");
    setShowAddForm(false);
    setIsSearching(false);
  };

  const handleDelete = async (id: Id<"readAloudBooks">) => {
    if (confirm("Remove this book?")) {
      await deleteBook({ id });
    }
  };

  const handleFetchCover = async (book: { _id: Id<"readAloudBooks">; title: string; author?: string }) => {
    const coverUrl = await fetchBookCover(book.title, book.author);
    if (coverUrl) {
      await updateCover({ id: book._id, coverUrl });
    }
  };

  if (!books) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            <CardTitle>Read-Aloud List</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            <CardTitle>Read-Aloud List</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Book
          </Button>
        </div>
        <CardDescription>Books for family reading time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Book Form */}
        {showAddForm && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Book title..."
              className="bg-background"
            />
            <Input
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Author (helps find cover)..."
              className="bg-background"
            />
            <div className="flex items-center gap-2">
              <Checkbox 
                id="upNext" 
                checked={addToUpNext}
                onCheckedChange={(checked) => setAddToUpNext(checked as boolean)}
              />
              <label htmlFor="upNext" className="text-sm">Add to "Up Next" list</label>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAdd} 
                size="sm" 
                className="flex-1"
                disabled={isSearching || !newTitle.trim()}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finding cover...
                  </>
                ) : (
                  "Add Book"
                )}
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

        {/* Currently Reading */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            📖 Currently Reading
            <Badge variant="secondary">{books.length}</Badge>
          </h3>
          <div className="space-y-2">
            {books.length === 0 ? (
              <p className="text-sm text-muted-foreground">No books currently being read</p>
            ) : (
              books.map((book) => (
                <div
                  key={book._id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => !book.coverUrl && handleFetchCover(book)}
                  >
                    <BookCover coverUrl={book.coverUrl} title={book.title} />
                  </div>
                  <Checkbox
                    checked={book.completed}
                    onCheckedChange={() => handleToggle(book._id, book.completed)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${
                      book.completed ? "line-through text-muted-foreground" : ""
                    }`}>
                      {book.title}
                    </p>
                    {book.author && (
                      <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(book._id)}
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Up Next */}
        {upNextBooks && upNextBooks.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              📚 Up Next
              <Badge variant="outline">{upNextBooks.length}</Badge>
            </h3>
            <div className="space-y-2">
              {upNextBooks.map((book) => (
                <div
                  key={book._id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => !book.coverUrl && handleFetchCover(book)}
                  >
                    <BookCover coverUrl={book.coverUrl} title={book.title} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{book.title}</p>
                    {book.author && (
                      <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveToReading({ id: book._id })}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(book._id)}
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
