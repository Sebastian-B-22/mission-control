"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface EveningReflectionProps {
  userId: Id<"users">;
  date: string;
}

interface ReflectionUpdates {
  userId: Id<"users">;
  date: string;
  morningExcited?: string;
  morningSurprise?: string;
  eveningAppreciated?: string;
  eveningLearned?: string;
}

export function EveningReflection({ userId, date }: EveningReflectionProps) {
  const reflection = useQuery(api.daily.getDailyReflection, { userId, date });
  const saveReflection = useMutation(api.daily.saveDailyReflection);
  const [eveningAppreciated, setEveningAppreciated] = useState("");
  const [eveningLearned, setEveningLearned] = useState("");

  const displayedEveningAppreciated = eveningAppreciated || reflection?.eveningAppreciated || "";
  const displayedEveningLearned = eveningLearned || reflection?.eveningLearned || "";

  const handleSave = (field: "eveningAppreciated" | "eveningLearned", value: string) => {
    const updates: ReflectionUpdates = {
      userId,
      date,
      morningExcited: reflection?.morningExcited,
      morningSurprise: reflection?.morningSurprise,
      eveningAppreciated: field === "eveningAppreciated" ? value : displayedEveningAppreciated,
      eveningLearned: field === "eveningLearned" ? value : displayedEveningLearned,
    };

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
          <label className="text-sm font-medium text-muted-foreground">A moment that I really appreciated today was...</label>
          <Textarea
            value={displayedEveningAppreciated}
            onChange={(e) => setEveningAppreciated(e.target.value)}
            onBlur={() => handleSave("eveningAppreciated", displayedEveningAppreciated)}
            placeholder="What moment stood out?"
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Something I learned or realized today was...</label>
          <Textarea
            value={displayedEveningLearned}
            onChange={(e) => setEveningLearned(e.target.value)}
            onBlur={() => handleSave("eveningLearned", displayedEveningLearned)}
            placeholder="What insight did you gain?"
            rows={2}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
