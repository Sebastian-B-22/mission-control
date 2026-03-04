"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, MapPin, Image, Loader2, Calendar, ExternalLink } from "lucide-react";

interface FieldTripListProps {
  userId: Id<"users">;
}

// Fetch place image from Unsplash
async function fetchPlaceImage(query: string): Promise<string | null> {
  // Use Unsplash source for a random image related to the location
  // This doesn't require an API key for simple usage
  return `https://source.unsplash.com/400x200/?${encodeURIComponent(query + " landmark attraction")}`;
}

// Place card component
function FieldTripCard({ 
  trip, 
  onDelete 
}: { 
  trip: {
    _id: Id<"fieldTrips">;
    name: string;
    location: string;
    imageUrl?: string;
    date?: string;
    notes?: string;
  };
  onDelete: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Use Picsum for reliable placeholder images with location-based seed
  const seed = trip.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 1000;
  const imageUrl = trip.imageUrl || `https://picsum.photos/seed/${seed}/400/200`;
  
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={trip.name}
            className={`w-full h-full object-cover transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-12 w-12 text-zinc-400" />
          </div>
        )}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        )}
        
        {/* Delete button */}
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm">{trip.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="h-3 w-3" />
          {trip.location}
        </div>
        {trip.date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3" />
            {new Date(trip.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        )}
        {trip.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{trip.notes}</p>
        )}
        
        {/* Quick actions */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.location)}`, "_blank")}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Maps
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FieldTripList({ userId }: FieldTripListProps) {
  const trips = useQuery(api.fieldTrips.getFieldTrips, { userId });
  const createTrip = useMutation(api.fieldTrips.createFieldTrip);
  const deleteTrip = useMutation(api.fieldTrips.deleteFieldTrip);
  const [newTrip, setNewTrip] = useState({
    name: "",
    location: "",
    date: "",
    notes: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddTrip = async () => {
    if (newTrip.name.trim() && newTrip.location.trim()) {
      const order = trips ? trips.length : 0;
      await createTrip({
        userId,
        name: newTrip.name,
        location: newTrip.location,
        date: newTrip.date || undefined,
        notes: newTrip.notes || undefined,
        order,
      });
      setNewTrip({ name: "", location: "", date: "", notes: "" });
      setShowAddForm(false);
    }
  };

  const handleDeleteTrip = async (id: Id<"fieldTrips">) => {
    if (confirm("Remove this field trip?")) {
      await deleteTrip({ id });
    }
  };

  if (!trips) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-500" />
            <CardTitle>Field Trip Ideas</CardTitle>
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
            <MapPin className="h-5 w-5 text-emerald-500" />
            <div>
              <CardTitle>Field Trip Ideas</CardTitle>
              <CardDescription>{trips.length} destinations to explore</CardDescription>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)} 
            variant="outline" 
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Trip
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Trip Form */}
        {showAddForm && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <Input
              value={newTrip.name}
              onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
              placeholder="Field trip name (e.g., Getty Museum)"
              className="bg-background"
            />
            <Input
              value={newTrip.location}
              onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
              placeholder="Location (e.g., Los Angeles, CA)"
              className="bg-background"
            />
            <Input
              type="date"
              value={newTrip.date}
              onChange={(e) => setNewTrip({ ...newTrip, date: e.target.value })}
              placeholder="Planned date (optional)"
              className="bg-background"
            />
            <Textarea
              value={newTrip.notes}
              onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
              placeholder="Notes (optional)..."
              className="bg-background min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleAddTrip} 
                size="sm" 
                className="flex-1"
                disabled={!newTrip.name.trim() || !newTrip.location.trim()}
              >
                Add Field Trip
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTrip({ name: "", location: "", date: "", notes: "" });
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Trip Grid */}
        {trips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No field trips added yet</p>
            <p className="text-sm">Add destinations you want to explore!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => (
              <FieldTripCard
                key={trip._id}
                trip={trip}
                onDelete={() => handleDeleteTrip(trip._id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
