"use client";

import { useState } from "use";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export default function MorningCheckInPage() {
  const router = useRouter();
  const [oneThing, setOneThing] = useState("");
  const [excitement, setExcitement] = useState("");
  const [surprise, setSurprise] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Save to Convex
    // const today = new Date().toISOString().split('T')[0];
    // await createCheckIn({
    //   userId,
    //   date: today,
    //   type: "morning",
    //   responses: { oneThing, excitement, surprise }
    // });

    router.push("/dashboard");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Good Morning! ☀️
          </CardTitle>
          <CardDescription>
            Let's set your intention for today. Complete before 9am for best results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="oneThing" className="text-lg font-semibold">
                What's your ONE THING today? *
              </Label>
              <p className="text-sm text-muted-foreground">
                The one thing that, if completed, will make today a success.
              </p>
              <Input
                id="oneThing"
                value={oneThing}
                onChange={(e) => setOneThing(e.target.value)}
                placeholder="My ONE THING today is..."
                required
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excitement" className="text-base font-medium">
                One thing I can get excited about today is...
              </Label>
              <Textarea
                id="excitement"
                value={excitement}
                onChange={(e) => setExcitement(e.target.value)}
                placeholder="Something to look forward to..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surprise" className="text-base font-medium">
                Someone I could surprise with a note, gift, or sign of appreciation is...
              </Label>
              <Textarea
                id="surprise"
                value={surprise}
                onChange={(e) => setSurprise(e.target.value)}
                placeholder="Who can you make smile today?"
                rows={3}
              />
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h3 className="font-semibold mb-2">Today's Top 3 Priorities</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Priority 1 from your RPM categories</li>
                <li>Priority 2 from your RPM categories</li>
                <li>Priority 3 from your RPM categories</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2 italic">
                These will be pulled from your RPM planning
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" size="lg" className="flex-1">
                Complete Morning Check-In
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
