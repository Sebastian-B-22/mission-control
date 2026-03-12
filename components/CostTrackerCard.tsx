"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function CostTrackerCard(props: {
  userId: Id<"users">;
  onOpen?: () => void;
}) {
  const summary = useQuery(api.costTracker.getSummary, { userId: props.userId });

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-amber-400" />
          AI Cost Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!summary ? (
          <p className="text-xs text-zinc-400">Loading…</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">Today</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {fmtUsd(summary.todayTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-zinc-500">Last 7d</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {fmtUsd(summary.last7dTotal)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-zinc-500">
                {summary.last7dCount} events tracked
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 text-zinc-200"
                onClick={() => props.onOpen?.()}
              >
                Details
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
