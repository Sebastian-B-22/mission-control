"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, BookOpen } from "lucide-react";

const defaultBooks = [
  // A
  { title: "Abraham Lincoln (DK Biography)", author: "DK", category: "Biography", read: false },
  { title: "Albert Einstein (DK Biography)", author: "DK", category: "Biography", read: false },
  { title: "Alexander Hamilton: The Outsider", author: "", category: "Biography", read: false },
  { title: "All Creatures Great and Small", author: "James Herriot", category: "Health/Science", read: false },
  { title: "Amelia Earhart (DK Biography)", author: "DK", category: "Biography", read: false },
  { title: "Ancient Art of Origami", author: "", category: "Other", read: false },
  { title: "Anne Frank's Diary", author: "Anne Frank", category: "Classic Lit", read: false },
  
  // B-C
  { title: "Blood and Guts", author: "Linda Allison", category: "Health/Science", read: false },
  { title: "Carry On, Mr. Bowditch", author: "Jean Lee Latham", category: "Adventure", read: false },
  
  // D-E
  { title: "Ender's Game", author: "Orson Scott Card", category: "Adventure", read: false },
  
  // G
  { title: "George Washington's Secret Six", author: "", category: "Biography", read: true },
  { title: "Great Battles for Boys - American Revolution", author: "", category: "History", read: false },
  
  // H
  { title: "Hana's Suitcase", author: "", category: "History", read: true },
  { title: "Heidi", author: "Johanna Spyri", category: "Classic Lit", read: false },
  { title: "How to Teach Children Shakespeare", author: "", category: "Other", read: false },
  
  // K-L
  { title: "King Arthur (Classic Starts)", author: "", category: "Classic Lit", read: false },
  { title: "Leon Garfield's Shakespeare Stories", author: "Leon Garfield", category: "Classic Lit", read: false },
  { title: "Little Britches: Father and I Were Ranchers", author: "Ralph Moody", category: "Adventure", read: false },
  { title: "Little Women", author: "Louisa May Alcott", category: "Classic Lit", read: false },
  { title: "Lord of the Flies", author: "William Golding", category: "Classic Lit", read: false },
  { title: "Lord of the Rings trilogy", author: "J.R.R. Tolkien", category: "Adventure", read: false },
  
  // M-O
  { title: "Marie Antoinette (Who/What Was)", author: "", category: "Biography", read: false },
  { title: "Miller Moguls series", author: "", category: "Other", read: false },
  { title: "Nelson Mandela (Who/What Was)", author: "", category: "Biography", read: false },
  { title: "Once and Future King", author: "T.H. White", category: "Classic Lit", read: false },
  
  // P-Q
  { title: "Pearl Harbor (Who/What Was)", author: "", category: "History", read: false },
  { title: "Queen Elizabeth 2 (Who/What Was)", author: "", category: "Biography", read: false },
  
  // R-S
  { title: "Robinson Crusoe", author: "Daniel Defoe", category: "Classic Lit", read: false },
  { title: "See Inside Your Body (Usborne)", author: "Usborne", category: "Health/Science", read: false },
  { title: "Shane", author: "Jack Schaefer", category: "Classic Lit", read: false },
  { title: "Story of Doctor Doolittle", author: "Hugh Lofting", category: "Adventure", read: false },
  { title: "Story of the World Book 1 (Ancient times)", author: "", category: "History", read: false },
  
  // T
  { title: "The Bronze Bow", author: "Elizabeth George Speare", category: "Classic Lit", read: false },
  { title: "The Disappearing Spoon", author: "Sam Kean", category: "Health/Science", read: false },
  { title: "The Door in the Wall", author: "Marguerite de Angeli", category: "Classic Lit", read: false },
  { title: "The Way We Work", author: "David Macaulay", category: "Health/Science", read: false },
  { title: "Treasure Island (Classic Starts)", author: "", category: "Adventure", read: false },
  { title: "Treasury of Egyptian Mythology", author: "", category: "Mythology", read: false },
  { title: "Treasury of Norse Mythology", author: "", category: "Mythology", read: false },
  { title: "Tuttle Twins Free Market Rules", author: "", category: "History", read: false },
  { title: "Tuttle Twins Guide to series", author: "", category: "History", read: false },
  { title: "Tuttle Twins History Volume 2 (American Revolution)", author: "", category: "History", read: false },
  { title: "Tuttle Twins History Volume 3 (War of 1812, Civil War)", author: "", category: "History", read: false },
  { title: "Tuttle Twins Teen Series (Choose Your Consequence)", author: "", category: "History", read: false },
  
  // U-W
  { title: "Understood Betsy", author: "Dorothy Canfield Fisher", category: "Classic Lit", read: false },
  { title: "Who Was Benjamin Franklin?", author: "", category: "Biography", read: false },
  { title: "Will You Sign Here, John Hancock?", author: "", category: "Biography", read: false },
  { title: "A Wind in the Door", author: "Madeleine L'Engle", category: "Adventure", read: false },
  { title: "A Wrinkle in Time", author: "Madeleine L'Engle", category: "Adventure", read: true },
];

export function BookLibrary() {
  const [books, setBooks] = useState(defaultBooks);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggle = (index: number) => {
    const updated = [...books];
    updated[index].read = !updated[index].read;
    setBooks(updated);
  };

  const handleAdd = () => {
    if (newTitle.trim()) {
      setBooks([...books, { title: newTitle, author: newAuthor || "", category: newCategory || "", read: false }]);
      setNewTitle("");
      setNewAuthor("");
      setNewCategory("");
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
          <BookOpen className="h-5 w-5 text-green-500" />
          <CardTitle>Book Library</CardTitle>
        </div>
        <CardDescription>Books available to read & explore</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {books.map((book, i) => (
            <div
              key={i}
              className="flex items-start gap-2 group hover:bg-accent/50 p-2 rounded transition-colors"
            >
              <Checkbox
                checked={book.read}
                onCheckedChange={() => handleToggle(i)}
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
