"use client";

import { useState } from "react";
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

interface ReflectionUpdates {
  userId: Id<"users">;
  date: string;
  morningExcited?: string;
  morningSurprise?: string;
  eveningAppreciated?: string;
  eveningLearned?: string;
}

export function JournalPrompts({ userId, date }: JournalPromptsProps) {
  const reflection = useQuery(api.daily.getDailyReflection, { userId, date });
  const saveReflection = useMutation(api.daily.saveDailyReflection);

  const [morningExcited, setMorningExcited] = useState("");
  const [morningSurprise, setMorningSurprise] = useState("");
  const [eveningAppreciated, setEveningAppreciated] = useState("");
  const [eveningLearned, setEveningLearned] = useState("");

  const displayedMorningExcited = morningExcited || reflection?.morningExcited || "";
  const displayedMorningSurprise = morningSurprise || reflection?.morningSurprise || "";
  const displayedEveningAppreciated = eveningAppreciated || reflection?.eveningAppreciated || "";
  const displayedEveningLearned = eveningLearned || reflection?.eveningLearned || "";

  const handleSave = (
    field: "morningExcited" | "morningSurprise" | "eveningAppreciated" | "eveningLearned",
    value: string
  ) => {
    const updates: ReflectionUpdates = {
      userId,
      date,
      morningExcited: field === "morningExcited" ? value : displayedMorningExcited,
      morningSurprise: field === "morningSurprise" ? value : displayedMorningSurprise,
      eveningAppreciated: field === "eveningAppreciated" ? value : displayedEveningAppreciated,
      eveningLearned: field === "eveningLearned" ? value : displayedEveningLearned,
    };

    saveReflection(updates);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-orange-500" />
            <CardTitle>Morning Mindset</CardTitle>
          </div>
          <CardDescription>Start your day with intention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={displayedMorningExcited} onChange={(e) => setMorningExcited(e.target.value)} onBlur={() => handleSave("morningExcited", displayedMorningExcited)} placeholder="What lights you up today?" rows={3} className="resize-none" />
          <Textarea value={displayedMorningSurprise} onChange={(e) => setMorningSurprise(e.target.value)} onBlur={() => handleSave("morningSurprise", displayedMorningSurprise)} placeholder="Who could you brighten today?" rows={3} className="resize-none" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-blue-500" />
            <CardTitle>Evening Reflection</CardTitle>
          </div>
          <CardDescription>Close your day with gratitude</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={displayedEveningAppreciated} onChange={(e) => setEveningAppreciated(e.target.value)} onBlur={() => handleSave("eveningAppreciated", displayedEveningAppreciated)} placeholder="What moment stood out?" rows={3} className="resize-none" />
          <Textarea value={displayedEveningLearned} onChange={(e) => setEveningLearned(e.target.value)} onBlur={() => handleSave("eveningLearned", displayedEveningLearned)} placeholder="What insight did you gain?" rows={3} className="resize-none" />
        </CardContent>
      </Card>
    </div>
  );
}
