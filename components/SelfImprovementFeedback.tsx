"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Send, CheckCircle2 } from "lucide-react";

interface FeedbackItem {
  id: string;
  text: string;
  timestamp: number;
  status: "pending" | "reviewed" | "implemented";
}

export function SelfImprovementFeedback() {
  const [feedback, setFeedback] = useState("");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = () => {
    if (!feedback.trim()) return;

    const newItem: FeedbackItem = {
      id: Date.now().toString(),
      text: feedback,
      timestamp: Date.now(),
      status: "pending",
    };

    setItems([newItem, ...items]);
    setFeedback("");
    setShowForm(false);

    // TODO: Save to file or Convex for persistence
    console.log("Feedback submitted:", newItem);
  };

  const updateStatus = (id: string, status: FeedbackItem["status"]) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status } : item
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Self-Improvement Ideas
            </CardTitle>
            <CardDescription className="mt-1">
              Spot something repetitive or tedious? Log it here and I&apos;ll build a skill/tool to automate it.
            </CardDescription>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              + Add Idea
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feedback Form */}
        {showForm && (
          <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <Textarea
              placeholder="Example: 'Checking Quo messages manually every day is tedious - could we automate the daily summary?'"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} size="sm">
                <Send className="h-4 w-4 mr-2" />
                Submit
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Feedback Items */}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No improvement ideas yet. Click &quot;+ Add Idea&quot; to get started!
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border bg-white space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1">{item.text}</p>
                  <Badge
                    variant={
                      item.status === "implemented"
                        ? "default"
                        : item.status === "reviewed"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {item.status === "implemented" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {item.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  {item.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateStatus(item.id, "reviewed")}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Mark Reviewed
                      </Button>
                      <Button
                        onClick={() => updateStatus(item.id, "implemented")}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-green-600"
                      >
                        Mark Implemented
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
