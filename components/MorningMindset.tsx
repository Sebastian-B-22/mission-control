"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface MorningMindsetProps {
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

export function MorningMindset({ userId, date }: MorningMindsetProps) {
  const reflection = useQuery(api.daily.getDailyReflection, { userId, date });
  const saveReflection = useMutation(api.daily.saveDailyReflection);

  const [morningExcited, setMorningExcited] = useState("");
  const [morningSurprise, setMorningSurprise] = useState("");

  const displayedMorningExcited = morningExcited || reflection?.morningExcited || "";
  const displayedMorningSurprise = morningSurprise || reflection?.morningSurprise || "";

  const handleSave = (field: "morningExcited" | "morningSurprise", value: string) => {
    const updates: ReflectionUpdates = {
      userId,
      date,
      morningExcited: field === "morningExcited" ? value : displayedMorningExcited,
      morningSurprise: field === "morningSurprise" ? value : displayedMorningSurprise,
      eveningAppreciated: reflection?.eveningAppreciated,
      eveningLearned: reflection?.eveningLearned,
    };

    saveReflection(updates);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">☀️</span>
          <CardTitle>Morning Mindset</CardTitle>
        </div>
        <CardDescription>Start your day with intention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">One thing I can get excited about today is...</label>
          <Textarea
            value={displayedMorningExcited}
            onChange={(e) => setMorningExcited(e.target.value)}
            onBlur={() => handleSave("morningExcited", displayedMorningExcited)}
            placeholder="What lights you up today?"
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Someone I could surprise with a note, gift, or sign of appreciation is...</label>
          <Textarea
            value={displayedMorningSurprise}
            onChange={(e) => setMorningSurprise(e.target.value)}
            onBlur={() => handleSave("morningSurprise", displayedMorningSurprise)}
            placeholder="Who could you brighten today?"
            rows={2}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
