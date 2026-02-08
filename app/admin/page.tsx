"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Upload } from "lucide-react";

export default function AdminPage() {
  const { user } = useUser();
  const importSchedule = useMutation(api.admin.importWeeklySchedule);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImportSchedule = async () => {
    if (!user) return;
    
    setLoading(true);
    setStatus(null);

    try {
      const result = await importSchedule({
        clerkId: user.id,
        clearExisting: true, // Clear existing schedule before importing
      });

      setStatus({
        type: "success",
        message: result.message || "Schedule imported successfully!",
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error.message || "Failed to import schedule",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please sign in to access admin tools.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Admin Tools</h1>

      <Card>
        <CardHeader>
          <CardTitle>Import Weekly Homeschool Schedule</CardTitle>
          <CardDescription>
            Load the complete weekly schedule (Monday-Sunday) into your Mission Control dashboard.
            This will replace any existing schedule blocks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
            <p className="font-medium">Schedule includes:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Complete daily schedules (Monday-Sunday)</li>
              <li>Time blocks with activities and notes</li>
              <li>Sprinting, learning blocks, passion projects</li>
              <li>Sports activities (rock climbing, horseback riding, martial arts, soccer)</li>
              <li>Family time (Italian practice, meal prep, game nights)</li>
            </ul>
          </div>

          <Button
            onClick={handleImportSchedule}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            {loading ? "Importing..." : "Import Weekly Schedule"}
          </Button>

          {status && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              {status.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              After importing, you can edit any time block directly from the{" "}
              <strong>Homeschool</strong> tab in your dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
