"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type StepKey =
  | "projectsBasics"
  | "pendingNextUp"
  | "overnightInbox"
  | "gatewayConnectivity"
  | "runHealthChecks";

const STEPS: Array<{
  key: StepKey;
  title: string;
  description: string;
  ctaLabel: string;
  view?: string;
  optional?: boolean;
}> = [
  {
    key: "projectsBasics",
    title: "Projects basics",
    description: "Know where projects + tasks live (Sebastian > Projects & Backlog).",
    ctaLabel: "Open Projects",
    view: "sebastian",
  },
  {
    key: "pendingNextUp",
    title: "Pending / Next Up",
    description: "Triage what’s open, blocked, or next.",
    ctaLabel: "Open Agent HQ",
    view: "agent-hq",
  },
  {
    key: "overnightInbox",
    title: "Overnight Inbox",
    description: "Promote overnight ideas into real tasks.",
    ctaLabel: "Open Agent HQ",
    view: "agent-hq",
  },
  {
    key: "gatewayConnectivity",
    title: "Gateway connectivity",
    description: "Make sure the Gateway badge is green (optional).",
    ctaLabel: "Got it",
    optional: true,
  },
  {
    key: "runHealthChecks",
    title: "Run Health checks",
    description: "Check the Health dashboard and confirm the pipeline is healthy.",
    ctaLabel: "Open Health",
    view: "health",
  },
];

export function OnboardingWizardDialog(props: {
  userId: Id<"users">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (view: string) => void;
}) {
  const state = useQuery(api.onboarding.getOrCreate, { userId: props.userId });
  const ensure = useMutation(api.onboarding.ensure);
  const setStep = useMutation(api.onboarding.setStep);
  const dismiss = useMutation(api.onboarding.dismiss);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!props.open) return;
    // Ensure persistence so toggles don’t get lost.
    ensure({ userId: props.userId }).finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, props.userId]);

  const steps = useMemo(() => {
    const completed = (state as any)?.steps ?? {};
    return STEPS.map((s) => ({ ...s, completed: Boolean(completed[s.key]) }));
  }, [state]);

  const completedCount = steps.filter((s) => s.completed).length;

  const handleDismiss = async () => {
    await dismiss({ userId: props.userId, dismissed: true });
    props.onOpenChange(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Welcome to Mission Control</DialogTitle>
          <DialogDescription>
            Quick setup checklist - {completedCount}/{steps.length} complete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {steps.map((s) => (
            <div
              key={s.key}
              className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
            >
              <Checkbox
                checked={s.completed}
                disabled={!ready}
                onCheckedChange={async (val) => {
                  await setStep({
                    userId: props.userId,
                    step: s.key,
                    completed: Boolean(val),
                  });
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-100">{s.title}</p>
                  {s.optional && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                      optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">{s.description}</p>
              </div>
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-200"
                  onClick={() => {
                    if (s.view && props.onNavigate) props.onNavigate(s.view);
                  }}
                >
                  {s.ctaLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            className="text-zinc-400"
            onClick={handleDismiss}
          >
            Dismiss
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                await dismiss({ userId: props.userId, dismissed: false });
                props.onOpenChange(false);
              }}
              variant="outline"
              className="border-zinc-700 text-zinc-200"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
