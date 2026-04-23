import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WorkflowStepId = "ideas" | "content" | "messages" | "training" | "engagement";

interface AgentWorkflowShellProps {
  title: string;
  description: string;
  icon: ReactNode;
  stageLabel: string;
  activeStep: WorkflowStepId;
  children: ReactNode;
}

const WORKFLOW_STEPS: Array<{
  id: WorkflowStepId;
  label: string;
  caption: string;
}> = [
  {
    id: "ideas",
    label: "Ideas",
    caption: "Capture and sort agent suggestions before they become work.",
  },
  {
    id: "content",
    label: "Content",
    caption: "Review drafts and move the strongest pieces toward publishing.",
  },
  {
    id: "messages",
    label: "Emails & Texts",
    caption: "Turn draft email and text copy into send-ready communication.",
  },
  {
    id: "training",
    label: "Training",
    caption: "Keep accepted learnings and discard noisy ones.",
  },
  {
    id: "engagement",
    label: "Engagement",
    caption: "Support the loop with consistent audience touchpoints.",
  },
];

export function AgentWorkflowShell({
  title,
  description,
  icon,
  stageLabel,
  activeStep,
  children,
}: AgentWorkflowShellProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-400">Agent Ops</Badge>
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                Work
              </Badge>
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                {stageLabel}
              </Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[780px] items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            {WORKFLOW_STEPS.map((step, index) => {
              const isActive = step.id === activeStep;

              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex min-w-[132px] items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "border-amber-500/30 bg-amber-500/10 text-white"
                        : "border-zinc-800 bg-zinc-950/80 text-zinc-400"
                    )}
                  >
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{index + 1}</div>
                      <div className={cn("font-medium", isActive ? "text-white" : "text-zinc-300")}>{step.label}</div>
                    </div>
                    {isActive ? (
                      <Badge className="ml-2 border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-300">
                        Current
                      </Badge>
                    ) : null}
                  </div>
                  {index < WORKFLOW_STEPS.length - 1 ? <ArrowRight className="h-4 w-4 text-zinc-600" /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
