import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function WorkSurfaceStatCard({
  label,
  value,
  description,
  icon,
  tone = "default",
  size = "default",
  className,
}: {
  label: string;
  value: number | string;
  description?: string;
  icon?: ReactNode;
  tone?: "default" | "brand" | "success" | "warning" | "danger" | "info" | "accent";
  size?: "default" | "compact";
  className?: string;
}) {
  const toneClasses = {
    default: "border-line bg-card",
    brand: "border-brand/35 bg-brand/10",
    success: "border-success/35 bg-success/10",
    warning: "border-warning/35 bg-warning/10",
    danger: "border-danger/35 bg-danger/10",
    info: "border-info/35 bg-info/10",
    accent: "border-violet-400/35 bg-violet-500/10",
  };

  return (
    <Card className={cn("shadow-none", toneClasses[tone], className)}>
      <CardContent className={cn(
        "flex items-center justify-between gap-4",
        size === "compact" ? "p-3" : "p-4"
      )}>
        <div className="min-w-0">
          <div className={cn(
            "font-medium uppercase text-ink-faint",
            size === "compact" ? "text-[11px] tracking-[0.16em]" : "text-xs tracking-wide"
          )}>{label}</div>
          <div className={cn(
            "font-semibold tabular-nums text-ink",
            size === "compact" ? "mt-1.5 text-2xl" : "mt-2 text-3xl"
          )}>{value}</div>
          {description ? (
            <div className={cn(
              "mt-1 text-ink-soft",
              size === "compact" ? "text-xs" : "text-sm"
            )}>{description}</div>
          ) : null}
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
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[132px] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-1/70 px-4 py-8 text-center",
        className
      )}
    >
      <div className="mb-3 text-ink-faint">{icon}</div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function WorkSurfacePageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-ink-soft">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
