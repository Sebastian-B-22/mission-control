"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Save } from "lucide-react";

interface MonthlyItineraryProps {
  userId: Id<"users">;
}

export function MonthlyItinerary({ userId }: MonthlyItineraryProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthDisplay = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const itinerary = useQuery(api.fieldTrips.getMonthlyItinerary, { userId, month: currentMonth });
  const saveItinerary = useMutation(api.fieldTrips.saveMonthlyItinerary);

  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);

  const content = draftContent ?? itinerary?.content ?? "";

  const handleSave = async () => {
    await saveItinerary({ userId, month: currentMonth, content });
    setIsSaved(true);
  };

  const handleChange = (value: string) => {
    setDraftContent(value);
    setIsSaved(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Monthly Itinerary</CardTitle>
              <CardDescription>{currentMonthDisplay}</CardDescription>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaved} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isSaved ? "Saved" : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Plan your homeschool month...\n\nWeek 1:\n- \n\nWeek 2:\n- \n\nWeek 3:\n- \n\nWeek 4:\n- `}
          rows={20}
          className="font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}
