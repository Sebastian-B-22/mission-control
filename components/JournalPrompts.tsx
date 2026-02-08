"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sunrise, Moon } from "lucide-react";

interface JournalPromptsProps {
  userId: Id<"users">;
  date: string;
}

export function JournalPrompts({ userId, date }: JournalPromptsProps) {
  const reflection = useQuery(api.daily.getDailyReflection, { userId, date });
  const saveReflection = useMutation(api.daily.saveDailyReflection);

  const [morningExcited, setMorningExcited] = useState("");
  const [morningSurprise, setMorningSurprise] = useState("");
  const [eveningAppreciated, setEveningAppreciated] = useState("");
  const [eveningLearned, setEveningLearned] = useState("");

  // Load existing reflection when it arrives
  useEffect(() => {
    if (reflection) {
      setMorningExcited(reflection.morningExcited || "");
      setMorningSurprise(reflection.morningSurprise || "");
      setEveningAppreciated(reflection.eveningAppreciated || "");
      setEveningLearned(reflection.eveningLearned || "");
    }
  }, [reflection]);

  // Auto-save on change (debounced)
  const handleSave = (field: string, value: string) => {
    const updates: any = { userId, date };
    
    if (field === "morningExcited") {
      updates.morningExcited = value;
      updates.morningSurprise = morningSurprise;
      updates.eveningAppreciated = eveningAppreciated;
      updates.eveningLearned = eveningLearned;
    } else if (field === "morningSurprise") {
      updates.morningExcited = morningExcited;
      updates.morningSurprise = value;
      updates.eveningAppreciated = eveningAppreciated;
      updates.eveningLearned = eveningLearned;
    } else if (field === "eveningAppreciated") {
      updates.morningExcited = morningExcited;
      updates.morningSurprise = morningSurprise;
      updates.eveningAppreciated = value;
      updates.eveningLearned = eveningLearned;
    } else if (field === "eveningLearned") {
      updates.morningExcited = morningExcited;
      updates.morningSurprise = morningSurprise;
      updates.eveningAppreciated = eveningAppreciated;
      updates.eveningLearned = value;
    }

    saveReflection(updates);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Morning Mindset */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-orange-500" />
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
              rows={3}
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
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Evening Reflection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-blue-500" />
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
              rows={3}
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
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
