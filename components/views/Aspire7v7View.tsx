"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { WorkSurfacePageHeader } from "@/components/work-surface";
import { CalendarDays, ClipboardList, ExternalLink, MapPin, TrendingUp, Users } from "lucide-react";

interface Aspire7v7ViewProps {
  userId: Id<"users">;
}

const sevenVSevenFinanceRows = [
  { suffix: "revenue", label: "Paid registration revenue", category: "Revenue" },
  { suffix: "refunds", label: "Refunds and credits", category: "Adjustments" },
  { suffix: "processing", label: "Stripe / processing fees", category: "Fees" },
  { suffix: "field", label: "Field / facility", category: "Operations" },
  { suffix: "staff", label: "Staff / contractor pay", category: "Labor" },
  { suffix: "equipment", label: "Equipment and supplies", category: "Operations" },
  { suffix: "marketing", label: "Marketing / flyers", category: "Marketing" },
  { suffix: "other", label: "Other direct costs", category: "Other" },
] as const;

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function LocationFinanceCard({
  userId,
  location,
  label,
}: {
  userId: Id<"users">;
  location: "pali" | "culver";
  label: string;
}) {
  const storedRows = useQuery(api.finance.getProgramExpenses, {
    userId,
    program: "7v7",
    season: `2026-${location}`,
  }) || [];
  const setProgramExpense = useMutation(api.finance.setProgramExpense);
  const byKey = useMemo(
    () => new Map(storedRows.map((row: any) => [row.expenseKey, row])),
    [storedRows]
  );
  const rows = sevenVSevenFinanceRows.map((row) => {
    const expenseKey = `7v7-2026-${location}-${row.suffix}`;
    const stored = byKey.get(expenseKey) as any;
    return { ...row, expenseKey, amount: stored?.amount ?? 0 };
  });
  const revenue = rows.find((row) => row.suffix === "revenue")?.amount ?? 0;
  const costs = rows
    .filter((row) => row.suffix !== "revenue")
    .reduce((sum, row) => sum + row.amount, 0);
  const profit = revenue - costs;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  function saveRow(row: (typeof rows)[number], rawValue: string) {
    const amount = Number(rawValue || 0);
    void setProgramExpense({
      userId,
      entity: "7v7",
      program: "7v7",
      season: `2026-${location}`,
      expenseKey: row.expenseKey,
      label: row.label,
      category: row.category,
      amount: Number.isFinite(amount) ? amount : 0,
      notes: `${label} 2026`,
    });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-white">
          <span>{label}</span>
          <Badge variant="outline" className="border-teal-400/30 bg-teal-500/10 text-teal-100">Private</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-100/75">Revenue</p>
            <p className="mt-1 font-mono font-semibold text-white">{formatMoney(revenue)}</p>
          </div>
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-amber-100/75">Costs</p>
            <p className="mt-1 font-mono font-semibold text-white">{formatMoney(costs)}</p>
          </div>
          <div className={`rounded-lg border p-3 ${profit >= 0 ? "border-violet-500/25 bg-violet-500/10" : "border-rose-500/25 bg-rose-500/10"}`}>
            <p className="text-[10px] uppercase tracking-[0.14em] text-violet-100/75">Profit</p>
            <p className="mt-1 font-mono font-semibold text-white">{formatMoney(profit)}</p>
            <p className="text-[10px] text-zinc-400">{margin.toFixed(1)}%</p>
          </div>
        </div>

        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.expenseKey} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 rounded-lg border border-zinc-800 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-200">{row.label}</p>
                <p className="text-xs text-zinc-500">{row.category}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">$</span>
                <Input
                  key={`${row.expenseKey}-${row.amount}`}
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={row.amount || ""}
                  onBlur={(event) => saveRow(row, event.target.value)}
                  className="h-8 border-zinc-700 bg-black font-mono text-zinc-100"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SevenVSevenFinanceTracker({ userId }: Aspire7v7ViewProps) {
  return (
    <Card className="border-teal-400/20 bg-gradient-to-br from-teal-500/10 via-zinc-950 to-violet-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5 text-teal-300" />
          7v7 Finance by Location
        </CardTitle>
        <p className="text-sm text-zinc-400">Keep Pali and Culver separate so combined revenue never hides which location is actually profitable.</p>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-2">
        <LocationFinanceCard userId={userId} location="pali" label="Pali" />
        <LocationFinanceCard userId={userId} location="culver" label="Culver" />
      </CardContent>
    </Card>
  );
}

export function Aspire7v7View({ userId }: Aspire7v7ViewProps) {
  const soccer7v7BaseUrl = "https://book.soccer7v7.com";
  const quickLinks = [
    {
      label: "Player registration",
      href: `${soccer7v7BaseUrl}/play?location=pali`,
      icon: CalendarDays,
      tone: "border-teal-400/30 bg-teal-500/10 text-teal-100",
    },
    {
      label: "Host dashboard",
      href: `${soccer7v7BaseUrl}/admin`,
      icon: ClipboardList,
      tone: "border-orange-400/30 bg-orange-500/10 text-orange-100",
    },
    {
      label: "Pali embed",
      href: `${soccer7v7BaseUrl}/embed/pali`,
      icon: MapPin,
      tone: "border-sky-400/30 bg-sky-500/10 text-sky-100",
    },
    {
      label: "Culver embed",
      href: `${soccer7v7BaseUrl}/embed/culver`,
      icon: Users,
      tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
    },
  ];

  return (
    <div className="space-y-6">
      <WorkSurfacePageHeader
        title="Soccer7v7 Operations"
        description="Links and embedded views for the standalone 7v7 booking and host dashboard."
        action={(
          <div className="flex flex-wrap gap-2">
            <Badge variant="info" className="border-teal-400/30 bg-teal-500/12 text-teal-100">
              Live
            </Badge>
            <Button asChild>
              <a href={`${soccer7v7BaseUrl}/admin`} target="_blank" rel="noopener noreferrer">
                Open 7v7 OS
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        )}
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-xl border p-3 transition hover:-translate-y-0.5 hover:bg-white/[0.03] ${link.tone}`}
            >
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-5 w-5 mt-0.5" />
                <ExternalLink className="h-4 w-4 opacity-70" />
              </div>
              <div className="mt-3 text-sm font-semibold text-white">{link.label}</div>
            </a>
          );
        })}
      </div>

      <SevenVSevenFinanceTracker userId={userId} />

      <Card className="overflow-hidden border-teal-400/25 bg-gradient-to-br from-teal-500/12 via-slate-950 to-orange-500/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-white">Live host dashboard</CardTitle>
            </div>
            <Badge variant="outline" className="w-fit border-orange-400/30 bg-orange-500/12 text-orange-100">
              soccer7v7-os.vercel.app
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
            <iframe
              title="Soccer7v7 host dashboard"
              src={`${soccer7v7BaseUrl}/admin`}
              className="h-[640px] w-full bg-white"
              loading="lazy"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-sky-400/20 bg-slate-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Player-facing Pali registration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
            <iframe
              title="Pali Soccer7v7 registration"
              src={`${soccer7v7BaseUrl}/embed/pali`}
              className="h-[560px] w-full bg-white"
              loading="lazy"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ProjectTaskList userId={userId} project="aspire" subProject="7v7-pali" title="Pali 7v7 follow-up" />
        <ProjectTaskList userId={userId} project="aspire" subProject="7v7-agoura" title="Agoura 7v7 follow-up" />
      </div>
    </div>
  );
}
