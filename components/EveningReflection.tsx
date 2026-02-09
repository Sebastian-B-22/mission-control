"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface EveningReflectionProps {
  userId: Id<"users">;
  date: string;
}

export function EveningReflection({ userId, date }: EveningReflectionProps) {
  const reflection = useQuery(api.daily.getDailyReflection, { userId, date });
  const saveReflection = useMutation(api.daily.saveDailyReflection);

  const [eveningAppreciated, setEveningAppreciated] = useState("");
  const [eveningLearned, setEveningLearned] = useState("");

  useEffect(() => {
    if (reflection) {
      setEveningAppreciated(reflection.eveningAppreciated || "");
      setEveningLearned(reflection.eveningLearned || "");
    }
  }, [reflection]);

  const handleSave = (field: string, value: string) => {
    const updates: any = { userId, date };
    
    if (field === "eveningAppreciated") {
      updates.morningExcited = reflection?.morningExcited;
      updates.morningSurprise = reflection?.morningSurprise;
      updates.eveningAppreciated = value;
      updates.eveningLearned = eveningLearned;
    } else if (field === "eveningLearned") {
      updates.morningExcited = reflection?.morningExcited;
      updates.morningSurprise = reflection?.morningSurprise;
      updates.eveningAppreciated = eveningAppreciated;
      updates.eveningLearned = value;
    }

    saveReflection(updates);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌙</span>
          <CardTitle>Evening Reflection</CardTitle>
        </div>
        <CardDescription>Close your day with gratitude</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            A moment that I really appreciated today was...
          </label>
          <Textarea
            value={eveningAppreciated}
            onChange={(e) => setEveningAppreciated(e.target.value)}
            onBlur={() => handleSave("eveningAppreciated", eveningAppreciated)}
            placeholder="What moment stood out?"
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Something I learned or realized today was...
          </label>
          <Textarea
            value={eveningLearned}
            onChange={(e) => setEveningLearned(e.target.value)}
            onBlur={() => handleSave("eveningLearned", eveningLearned)}
            placeholder="What insight did you gain?"
            rows={2}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
