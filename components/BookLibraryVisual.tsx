"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Search, 
  Loader2,
  BookMarked,
  BookCheck,
  Library,
  Filter,
  X
} from "lucide-react";

interface BookLibraryVisualProps {
  userId: Id<"users">;
}

// Fetch book cover from Open Library API
async function fetchBookCover(title: string, author?: string): Promise<string | null> {
  try {
    // Search Open Library for the book
    const query = encodeURIComponent(`${title} ${author || ""}`);
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=1`
    );
    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
      const book = data.docs[0];
      // Get cover from cover_i (cover ID) or isbn
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
function BookCover({ 
  coverUrl, 
  title, 
  size = "medium" 
}: { 
  coverUrl?: string; 
  title: string;
  size?: "small" | "medium" | "large";
}) {
  const [error, setError] = useState(false);
  
  const sizeClasses = {
    small: "w-16 h-24",
    medium: "w-24 h-36",
    large: "w-32 h-48"
  };
  
  if (!coverUrl || error) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900 dark:to-orange-800 rounded-md flex items-center justify-center shadow-md`}>
        <BookOpen className="w-8 h-8 text-amber-600 dark:text-amber-300 opacity-50" />
      </div>
    );
  }
  
  return (
    <img
      src={coverUrl}
      alt={title}
      className={`${sizeClasses[size]} object-cover rounded-md shadow-md hover:shadow-lg transition-shadow`}
      onError={() => setError(true)}
    />
  );
}

export function BookLibraryVisual({ userId }: BookLibraryVisualProps) {
  const books = useQuery(api.books.getBookLibrary, { userId });
  const readAloudBooks = useQuery(api.books.getReadAloudBooks, { userId }); // Currently reading from read alouds
  const addBook = useMutation(api.books.addBookToLibrary);
  const updateStatus = useMutation(api.books.updateBookStatus);
  const updateCover = useMutation(api.books.updateBookCover);
  const deleteBook = useMutation(api.books.deleteBookFromLibrary);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newReader, setNewReader] = useState<string>("both");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"reading" | "finished" | "want-to-read">("want-to-read");
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  
  // Get unique categories and authors for filters
  const categories = books ? [...new Set(books.map(b => b.category).filter(Boolean))] : [];
  const authors = books ? [...new Set(books.map(b => b.author).filter(Boolean))] : [];

  // Filter books by search and filters
  const filteredBooks = books?.filter(book => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = book.title.toLowerCase().includes(query);
      const matchesAuthor = book.author?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesAuthor) return false;
    }
    
    // Category filter
    if (selectedCategory !== "all" && book.category !== selectedCategory) {
      return false;
    }
    
    // Author filter
    if (selectedAuthor !== "all" && book.author !== selectedAuthor) {
      return false;
    }
    
    return true;
  }) || [];
  
  // Group filtered books by status
  // "Currently Reading" now pulls from readAloudBooks (the Read Aloud tab)
  const currentlyReading = readAloudBooks?.map(b => ({
    ...b,
    _id: b._id as unknown as Id<"bookLibrary">, // Type cast for compatibility
    status: "reading" as const,
    read: false,
    category: undefined,
    isbn: undefined,
    reader: "family",
  })) || [];
  
  const booksByStatus = {
    "reading": currentlyReading,
    "finished": filteredBooks.filter(b => b.status === "finished" || b.read),
    "want-to-read": filteredBooks.filter(b => b.status === "want-to-read" || (!b.status && !b.read)),
  };
  
  const hasActiveFilters = searchQuery || selectedCategory !== "all" || selectedAuthor !== "all";
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedAuthor("all");
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    
    setIsSearching(true);
    
    // Fetch cover from Open Library
    const coverUrl = await fetchBookCover(newTitle, newAuthor);
    
    await addBook({
      userId,
      title: newTitle.trim(),
      author: newAuthor.trim() || undefined,
      coverUrl: coverUrl || undefined,
      reader: newReader,
      status: "want-to-read",
    });
    
    setNewTitle("");
    setNewAuthor("");
    setNewReader("both");
    setShowAddForm(false);
    setIsSearching(false);
  };

  const handleStatusChange = async (id: Id<"bookLibrary">, status: "want-to-read" | "reading" | "finished") => {
    await updateStatus({ id, status });
  };

  const handleDelete = async (id: Id<"bookLibrary">) => {
    if (confirm("Remove this book from the library?")) {
      await deleteBook({ id });
    }
  };

  // Try to fetch missing covers for existing books
  const handleFetchMissingCover = async (book: { _id: Id<"bookLibrary">; title: string; author?: string }) => {
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
            <Library className="h-5 w-5 text-amber-500" />
            <CardTitle>Book Library</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading books...
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: "reading" as const, label: "Currently Reading", icon: BookMarked, count: booksByStatus.reading.length },
    { id: "want-to-read" as const, label: "Want to Read", icon: BookOpen, count: booksByStatus["want-to-read"].length },
    { id: "finished" as const, label: "Finished", icon: BookCheck, count: booksByStatus.finished.length },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5 text-amber-500" />
            <CardTitle>Book Library</CardTitle>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Book
          </Button>
        </div>
        <CardDescription>
          {books.length} books • Track what you're reading
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Book Form */}
        {showAddForm && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Add a book (cover fetched automatically)</span>
            </div>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Book title..."
              className="bg-background"
            />
            <Input
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Author (helps find the right cover)..."
              className="bg-background"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Reader:</span>
              <select
                value={newReader}
                onChange={(e) => setNewReader(e.target.value)}
                className="text-sm border rounded px-2 py-1 bg-background"
              >
                <option value="both">Both Kids</option>
                <option value="anthony">Anthony</option>
                <option value="roma">Roma</option>
                <option value="family">Family Read-Aloud</option>
              </select>
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

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or author..."
              className="pl-9 bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          
          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="all">All Categories</option>
              {categories.sort().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="text-sm border rounded px-2 py-1 bg-background max-w-[200px]"
            >
              <option value="all">All Authors</option>
              {authors.sort().map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear filters
              </Button>
            )}
            
            {hasActiveFilters && (
              <span className="text-sm text-muted-foreground ml-auto">
                {filteredBooks.length} of {books?.length} books
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {booksByStatus[activeTab].map((book) => (
            <div
              key={book._id}
              className="group relative flex flex-col items-center"
            >
              {/* Cover */}
              <div 
                className="relative cursor-pointer"
                onClick={() => activeTab !== "reading" && !book.coverUrl && handleFetchMissingCover(book)}
              >
                <BookCover 
                  coverUrl={book.coverUrl} 
                  title={book.title}
                  size="medium"
                />
                {/* Hover overlay with actions - different for Currently Reading (read alouds) */}
                {activeTab === "reading" ? (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex flex-col items-center justify-center gap-1 p-2">
                    <Badge className="bg-amber-500 text-white text-xs">
                      📚 Read Aloud
                    </Badge>
                    <p className="text-white text-xs text-center mt-1">
                      Manage in Read Alouds tab
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex flex-col items-center justify-center gap-1 p-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 text-xs w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(book._id, "reading");
                      }}
                    >
                      Start Reading
                    </Button>
                    {activeTab !== "finished" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 text-xs w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(book._id, "finished");
                        }}
                      >
                        Mark Finished
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 text-xs w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(book._id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Title & Author */}
              <div className="mt-2 text-center w-full px-1">
                <p className="text-xs font-medium line-clamp-2 leading-tight">
                  {book.title}
                </p>
                {book.author && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {book.author}
                  </p>
                )}
                {activeTab === "finished" && (
                  <Badge 
                    variant="outline" 
                    className={`mt-1 text-xs h-5 px-1.5 ${
                      book.reader === "roma" ? "border-pink-500 text-pink-400" :
                      book.reader === "anthony" ? "border-blue-500 text-blue-400" :
                      "border-green-500 text-green-400"
                    }`}
                  >
                    {book.reader === "roma" ? "Roma" : 
                     book.reader === "anthony" ? "Anthony" : 
                     "Both"}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          
          {booksByStatus[activeTab].length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No books in this category yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
