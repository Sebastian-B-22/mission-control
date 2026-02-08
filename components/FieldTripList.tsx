"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, MapPin, Calendar } from "lucide-react";

interface FieldTripListProps {
  userId: Id<"users">;
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
  const [expandedId, setExpandedId] = useState<Id<"fieldTrips"> | null>(null);
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
    await deleteTrip({ id });
  };

  if (!trips) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Field Trips</CardTitle>
          <CardDescription>Educational outings & adventures</CardDescription>
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
        <CardTitle>Upcoming Field Trips</CardTitle>
        <CardDescription>Educational outings & adventures</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Trip Form */}
        {!showAddForm ? (
          <Button 
            onClick={() => setShowAddForm(true)} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Field Trip
          </Button>
        ) : (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Input
              placeholder="Field trip name..."
              value={newTrip.name}
              onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Location..."
                value={newTrip.location}
                onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
              />
              <Input
                type="date"
                value={newTrip.date}
                onChange={(e) => setNewTrip({ ...newTrip, date: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Notes (optional)..."
              value={newTrip.notes}
              onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddTrip} size="sm" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
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

        {/* Trip List */}
        <div className="space-y-2">
          {trips.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              No field trips planned yet!
            </p>
          ) : (
            trips.map((trip) => (
              <div
                key={trip._id}
                className="border rounded-lg p-3 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <h4 className="font-medium">{trip.name}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{trip.location}</span>
                      </div>
                      {trip.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(trip.date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {trip.notes && (
                      <div className="mt-2">
                        {expandedId === trip._id ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">{trip.notes}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedId(null)}
                              className="text-xs"
                            >
                              Hide notes
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedId(trip._id)}
                            className="text-xs"
                          >
                            View notes
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTrip(trip._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
