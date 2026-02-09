"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface MorningMindsetProps {
  userId: Id<"users">;
  date: string;
}

export function MorningMindset({ userId, date }: MorningMindsetProps) {
  const reflection = useQuery(api.daily.getDailyReflection, { userId, date });
  const saveReflection = useMutation(api.daily.saveDailyReflection);

  const [morningExcited, setMorningExcited] = useState("");
  const [morningSurprise, setMorningSurprise] = useState("");

  useEffect(() => {
    if (reflection) {
      setMorningExcited(reflection.morningExcited || "");
      setMorningSurprise(reflection.morningSurprise || "");
    }
  }, [reflection]);

  const handleSave = (field: string, value: string) => {
    const updates: any = { userId, date };
    
    if (field === "morningExcited") {
      updates.morningExcited = value;
      updates.morningSurprise = morningSurprise;
      updates.eveningAppreciated = reflection?.eveningAppreciated;
      updates.eveningLearned = reflection?.eveningLearned;
    } else if (field === "morningSurprise") {
      updates.morningExcited = morningExcited;
      updates.morningSurprise = value;
      updates.eveningAppreciated = reflection?.eveningAppreciated;
      updates.eveningLearned = reflection?.eveningLearned;
    }

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
          <label className="text-sm font-medium text-muted-foreground">
            One thing I can get excited about today is...
          </label>
          <Textarea
            value={morningExcited}
            onChange={(e) => setMorningExcited(e.target.value)}
            onBlur={() => handleSave("morningExcited", morningExcited)}
            placeholder="What lights you up today?"
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Someone I could surprise with a note, gift, or sign of appreciation is...
          </label>
          <Textarea
            value={morningSurprise}
            onChange={(e) => setMorningSurprise(e.target.value)}
            onBlur={() => handleSave("morningSurprise", morningSurprise)}
            placeholder="Who could you brighten today?"
            rows={2}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
