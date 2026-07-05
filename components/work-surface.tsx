import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function WorkSurfaceStatCard({
  label,
  value,
  description,
  icon,
  className,
}: {
  label: string;
  value: number | string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-zinc-800 bg-zinc-950/80 shadow-none", className)}>
      <CardContent className="flex items-center justify-between gap-3 p-2.5">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
          <div className="mt-0.5 text-lg font-semibold text-white">{value}</div>
        </div>
        {icon ? <div className="shrink-0">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}

export function WorkSurfaceEmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[132px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-8 text-center",
        className
      )}
    >
      <div className="mb-3 text-zinc-500">{icon}</div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">{description}</p> : null}
    </div>
  );
}
