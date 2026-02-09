"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar, MapPin } from "lucide-react";

const defaultTrips = [
  { name: "California Science Center", date: "2026-02-17", location: "Los Angeles", notes: "Body exhibit" },
  { name: "iFLY + Nixon Museum", date: "2026-01-31", location: "Yorba Linda", notes: "Combo trip" },
];

export function TripsOnHorizon() {
  const [trips, setTrips] = useState(defaultTrips);
  const [newTrip, setNewTrip] = useState({ name: "", date: "", location: "", notes: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = () => {
    if (newTrip.name.trim() && newTrip.date) {
      setTrips([...trips, { ...newTrip }]);
      setNewTrip({ name: "", date: "", location: "", notes: "" });
      setShowAddForm(false);
    }
  };

  const handleDelete = (index: number) => {
    setTrips(trips.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <CardTitle>Trips on the Horizon</CardTitle>
        </div>
        <CardDescription>Upcoming adventures & scheduled trips</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {trips.map((trip, i) => (
            <div
              key={i}
              className="border rounded-lg p-3 hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium">{trip.name}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(trip.date).toLocaleDateString()}</span>
                    </div>
                    {trip.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{trip.location}</span>
                      </div>
                    )}
                  </div>
                  {trip.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{trip.notes}</p>
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
            Add Trip
          </Button>
        ) : (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Input
              value={newTrip.name}
              onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
              placeholder="Trip name..."
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={newTrip.date}
                onChange={(e) => setNewTrip({ ...newTrip, date: e.target.value })}
              />
              <Input
                value={newTrip.location}
                onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
                placeholder="Location..."
              />
            </div>
            <Textarea
              value={newTrip.notes}
              onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
              placeholder="Notes (optional)..."
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm" className="flex-1">
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTrip({ name: "", date: "", location: "", notes: "" });
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
