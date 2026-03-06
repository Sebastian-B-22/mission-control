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
  Search, 
  Loader2,
  Gamepad2,
  Star,
  Heart,
  Package,
  Filter,
  X,
  Users,
  Clock
} from "lucide-react";

interface GameLibraryVisualProps {
  userId: Id<"users">;
}

// Game cover component with fallback
function GameCover({ 
  imageUrl, 
  title, 
  size = "medium" 
}: { 
  imageUrl?: string; 
  title: string;
  size?: "small" | "medium" | "large";
}) {
  const [error, setError] = useState(false);
  
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32"
  };
  
  if (!imageUrl || error) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-900 dark:to-purple-800 rounded-lg flex items-center justify-center shadow-md`}>
        <Gamepad2 className="w-8 h-8 text-indigo-600 dark:text-indigo-300 opacity-50" />
      </div>
    );
  }
  
  return (
    <img
      src={imageUrl}
      alt={title}
      className={`${sizeClasses[size]} object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow`}
      onError={() => setError(true)}
    />
  );
}

export function GameLibraryVisual({ userId }: GameLibraryVisualProps) {
  const games = useQuery(api.games.getGameLibrary, { userId });
  const addGame = useMutation(api.games.addGameToLibrary);
  const updateStatus = useMutation(api.games.updateGameStatus);
  const toggleFavorite = useMutation(api.games.toggleGameFavorite);
  const deleteGame = useMutation(api.games.deleteGameFromLibrary);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPublisher, setNewPublisher] = useState("");
  const [newCategory, setNewCategory] = useState<string>("board-game");
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<"own" | "want" | "favorites">("own");
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Get unique categories for filters
  const categories = (games ? [...new Set(games.map((g: any) => g.category).filter(Boolean))] : []) as string[];

  // Filter games by search and filters
  const filteredGames = games?.filter((game: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = game.title.toLowerCase().includes(query);
      const matchesPublisher = game.publisher?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesPublisher) return false;
    }
    
    // Category filter
    if (selectedCategory !== "all" && game.category !== selectedCategory) {
      return false;
    }
    
    return true;
  }) || [];
  
  // Group filtered games by status
  const gamesByStatus = {
    "own": filteredGames.filter((g: any) => g.status === "own" || !g.status),
    "want": filteredGames.filter((g: any) => g.status === "want"),
    "favorites": filteredGames.filter((g: any) => g.favorite),
  };
  
  const hasActiveFilters = searchQuery || selectedCategory !== "all";
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    
    setIsAdding(true);
    
    await addGame({
      userId,
      title: newTitle.trim(),
      publisher: newPublisher.trim() || undefined,
      category: newCategory,
      status: "own",
    });
    
    setNewTitle("");
    setNewPublisher("");
    setNewCategory("board-game");
    setShowAddForm(false);
    setIsAdding(false);
  };

  const handleStatusChange = async (id: Id<"gameLibrary">, status: "own" | "want" | "borrowed") => {
    await updateStatus({ id, status });
  };

  const handleToggleFavorite = async (id: Id<"gameLibrary">, currentFavorite: boolean) => {
    await toggleFavorite({ id, favorite: !currentFavorite });
  };

  const handleDelete = async (id: Id<"gameLibrary">) => {
    if (confirm("Remove this game from the library?")) {
      await deleteGame({ id });
    }
  };

  if (!games) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-indigo-500" />
            <CardTitle>Game Library</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading games...
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: "own" as const, label: "Our Games", icon: Package, count: gamesByStatus.own.length },
    { id: "want" as const, label: "Wish List", icon: Star, count: gamesByStatus.want.length },
    { id: "favorites" as const, label: "Favorites", icon: Heart, count: gamesByStatus.favorites.length },
  ];

  const categoryOptions = [
    { value: "board-game", label: "Board Game" },
    { value: "card-game", label: "Card Game" },
    { value: "video-game", label: "Video Game" },
    { value: "outdoor", label: "Outdoor Game" },
    { value: "puzzle", label: "Puzzle" },
    { value: "educational", label: "Educational" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-indigo-500" />
            <CardTitle>Game Library</CardTitle>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Game
          </Button>
        </div>
        <CardDescription>
          {games.length} games • Family game night collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Game Form */}
        {showAddForm && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Add a game</span>
            </div>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Game title..."
              className="bg-background"
            />
            <Input
              value={newPublisher}
              onChange={(e) => setNewPublisher(e.target.value)}
              placeholder="Publisher (optional)..."
              className="bg-background"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Type:</span>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="text-sm border rounded px-2 py-1 bg-background"
              >
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAdd} 
                size="sm" 
                className="flex-1"
                disabled={isAdding || !newTitle.trim()}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Game"
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTitle("");
                  setNewPublisher("");
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
              placeholder="Search by title or publisher..."
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
              <option value="all">All Types</option>
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                {filteredGames.length} of {games?.length} games
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
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
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

        {/* Game Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {gamesByStatus[activeTab].map((game: any) => (
            <div
              key={game._id}
              className="group relative flex flex-col items-center"
            >
              {/* Cover */}
              <div className="relative">
                <GameCover 
                  imageUrl={game.imageUrl} 
                  title={game.title}
                  size="medium"
                />
                {/* Favorite badge */}
                {game.favorite && (
                  <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
                    <Heart className="h-3 w-3 text-white fill-white" />
                  </div>
                )}
                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1 p-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 text-xs w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(game._id, game.favorite || false);
                    }}
                  >
                    <Heart className={`h-3 w-3 mr-1 ${game.favorite ? "fill-red-500 text-red-500" : ""}`} />
                    {game.favorite ? "Unfavorite" : "Favorite"}
                  </Button>
                  {activeTab !== "want" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 text-xs w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(game._id, "want");
                      }}
                    >
                      Move to Wishlist
                    </Button>
                  )}
                  {activeTab === "want" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 text-xs w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(game._id, "own");
                      }}
                    >
                      Mark as Owned
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 text-xs w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(game._id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
              
              {/* Title & Info */}
              <div className="mt-2 text-center w-full px-1">
                <p className="text-xs font-medium line-clamp-2 leading-tight">
                  {game.title}
                </p>
                {game.publisher && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {game.publisher}
                  </p>
                )}
                {game.category && (
                  <Badge variant="outline" className="mt-1 text-xs h-4 px-1">
                    {game.category.replace("-", " ")}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          
          {gamesByStatus[activeTab].length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              <Gamepad2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No games in this category yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
