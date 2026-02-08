"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Save } from "lucide-react";

export function MonthlyItinerary() {
  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(true);

  const handleSave = () => {
    // TODO: Save to Convex
    setIsSaved(true);
  };

  const handleChange = (value: string) => {
    setContent(value);
    setIsSaved(false);
  };

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Monthly Itinerary</CardTitle>
              <CardDescription>{currentMonth}</CardDescription>
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
