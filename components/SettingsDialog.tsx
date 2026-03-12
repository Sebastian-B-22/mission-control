"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";

export function SettingsDialog(props: {
  userId: Id<"users">;
  onOpenOnboarding: () => void;
  onResetOnboarding: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-200">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Quick controls for Mission Control (MVP).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-sm font-medium text-zinc-100">Onboarding</p>
            <p className="text-xs text-zinc-400 mt-1">
              Re-open or reset the onboarding checklist.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 text-zinc-200"
                onClick={() => {
                  setOpen(false);
                  props.onOpenOnboarding();
                }}
              >
                Open onboarding
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-zinc-300"
                onClick={() => {
                  props.onResetOnboarding();
                }}
              >
                Reset progress
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="border-zinc-700 text-zinc-200"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
