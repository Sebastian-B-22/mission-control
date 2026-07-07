"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  DollarSign,
  ExternalLink,
  FileText,
  Home,
  TrendingUp,
  Users,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkSurfacePageHeader } from "@/components/work-surface";

type PayrollRow = {
  coach: string;
  hours: number;
  rate?: number;
  method: "Zelle" | "Venmo" | "Zelle/Venmo" | "Internal" | "Needs review";
  notes?: string;
  rateRecordedAt?: string;
  previousRates?: { rate: number; effectiveDate?: string; note?: string }[];
};

type PayrollPaymentStatus = {
  paid: boolean;
  paidAt?: string;
  method?: PayrollRow["method"];
};

type FinanceViewProps = {
  userId: Id<"users">;
};

type ProgramExpense = {
  expenseKey: string;
  label: string;
  category: string;
  amount: number;
  notes?: string;
};

const cashFlowWindows = [
  {
    label: "Next 7 days",
    items: ["Payroll prep", "urgent bills", "incoming registrations"],
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  },
  {
    label: "Next 30 days",
    items: ["coach payouts", "field payments", "camp revenue timing"],
    tone: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
  },
  {
    label: "Next 60 days",
    items: ["tax set-aside", "program launches", "cash runway"],
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  },
];

const springLeagueExpenseRows: ProgramExpense[] = [
  { expenseKey: "spring-2026-shirts", label: "Shirts", category: "Player gear", amount: 0 },
  { expenseKey: "spring-2026-screen-printing", label: "Screen printing", category: "Player gear", amount: 0 },
  { expenseKey: "spring-2026-medals", label: "Medals", category: "Player gear", amount: 0 },
  { expenseKey: "spring-2026-balls", label: "Balls", category: "Player gear", amount: 0 },
  { expenseKey: "spring-2026-flyers", label: "Flyers", category: "Marketing", amount: 0 },
  { expenseKey: "spring-2026-insurance", label: "Insurance", category: "Operations", amount: 0 },
  { expenseKey: "spring-2026-staff-snacks", label: "Staff snacks", category: "Operations", amount: 0 },
  { expenseKey: "spring-2026-staff-clothing", label: "Staff clothing", category: "Operations", amount: 0 },
  { expenseKey: "spring-2026-helpers", label: "Helpers", category: "Labor", amount: 0 },
  { expenseKey: "spring-2026-allie", label: "Allie / personal assistant", category: "Labor", amount: 0 },
  { expenseKey: "spring-2026-owner-time", label: "Corinne owner time", category: "True profit layer", amount: 0 },
];

const springLeaguePrice = 299;

const staffHoursSheet = {
  id: "1f4J2nzAbkEKJSdCy0mdxI5dKXAJag1V5RbUgAOcUrAw",
  title: "Staff Hours (2026)",
  sourceAccount: "corinne@aspiresoccercoaching.com",
  url: "https://docs.google.com/spreadsheets/d/1f4J2nzAbkEKJSdCy0mdxI5dKXAJag1V5RbUgAOcUrAw/edit",
  sourceTab: "May",
  syncedAt: "Jun 8, 2026 12:50 PM",
};

const coachRates: PayrollRow[] = [
  { coach: "Gio", hours: 63.25, rate: 60, method: "Zelle" },
  { coach: "Mphatso", hours: 36.72, rate: 40, method: "Zelle" },
  { coach: "David", hours: 57.75, rate: 40, method: "Zelle" },
  { coach: "Vicky", hours: 5, rate: 30, method: "Zelle/Venmo" },
  { coach: "Pete", hours: 42.5, rate: 75, method: "Zelle" },
  { coach: "Noe", hours: 11.5, rate: 25, method: "Zelle" },
  { coach: "Louis", hours: 0, rate: 65, method: "Zelle" },
  { coach: "Joey", hours: 0, rate: 70, method: "Internal" },
  { coach: "Leodo", hours: 0, rate: 50, method: "Zelle" },
  { coach: "Cindy", hours: 0, rate: 40, method: "Zelle" },
  { coach: "Josh", hours: 0, rate: 50, method: "Zelle" },
  { coach: "Ernesto", hours: 0, rate: 35, method: "Zelle" },
  { coach: "Marco", hours: 0, rate: 40, method: "Zelle" },
  { coach: "Elijah", hours: 0, rate: 30, method: "Zelle" },
  { coach: "Reagan", hours: 0, rate: 30, method: "Zelle" },
];

const payrollRows = coachRates.filter((row) => row.hours > 0);
const mayPayrollTotal = payrollRows.reduce((sum, row) => sum + row.hours * (row.rate ?? 0), 0);
const mayPayrollHours = payrollRows.reduce((sum, row) => sum + row.hours, 0);

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatHours(hours: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(hours);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <Card className={`min-w-0 gap-3 border shadow-none ${tone}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">{label}</p>
            <p className="mt-1.5 break-words text-lg font-semibold text-white">{value}</p>
          </div>
          <Icon className="h-5 w-5 shrink-0 text-zinc-300" />
        </div>
        <p className="mt-2 break-words text-xs leading-5 text-zinc-400">{detail}</p>
      </CardContent>
    </Card>
  );
}

function PersonalTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-violet-300" />
            Personal Command Center
          </CardTitle>
          <p className="text-sm text-zinc-400">
            Keep personal finances visible without mixing them with business operations.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            ["Cash buffer", "Manual starting value needed"],
            ["Upcoming bills", "Add monthly household obligations"],
            ["Cards / debt", "Track balances without burying in transactions"],
            ["Avoidance list", "Small, clear next actions for anything stressful"],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              <p className="text-sm font-medium text-white">{title}</p>
              <p className="mt-2 text-sm leading-5 text-zinc-400">{detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/10">
        <CardHeader>
          <CardTitle className="text-base">Personal v1 Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-300">
          <div className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-violet-200" />
            Separate from business by default.
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-violet-200" />
            Manual inputs first, bank sync later.
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-violet-200" />
            Focused on weekly clarity, not a giant transaction dump.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BusinessTab({ userId }: FinanceViewProps) {
  const registrationCounts = useQuery(api.registrations.getAllCounts) || [];
  const storedExpenses = useQuery(api.finance.getProgramExpenses, {
    userId,
    program: "spring_league",
    season: "spring-2026",
  }) || [];
  const setProgramExpense = useMutation(api.finance.setProgramExpense);

  const expenseByKey = useMemo(
    () => new Map(storedExpenses.map((expense: any) => [expense.expenseKey, expense])),
    [storedExpenses]
  );
  const expenseRows = springLeagueExpenseRows.map((row) => {
    const stored = expenseByKey.get(row.expenseKey) as any;
    return { ...row, amount: stored?.amount ?? row.amount, notes: stored?.notes };
  });
  const ownerTimeCost = expenseRows.find((row) => row.expenseKey === "spring-2026-owner-time")?.amount ?? 0;
  const cashExpenseTotal = expenseRows
    .filter((row) => row.expenseKey !== "spring-2026-owner-time")
    .reduce((sum, row) => sum + row.amount, 0);
  const springPlayers = registrationCounts
    .filter((count: any) => count.program === "spring-pali" || count.program === "spring-agoura")
    .reduce((sum: number, count: any) => sum + (count.count || 0), 0);
  const springRevenue = springPlayers * springLeaguePrice;
  const springCashProfit = springRevenue - mayPayrollTotal - cashExpenseTotal;
  const springTrueProfit = springCashProfit - ownerTimeCost;

  function updateExpense(row: ProgramExpense, rawValue: string) {
    const amount = Number(rawValue || 0);
    void setProgramExpense({
      userId,
      entity: "aspire",
      program: "spring_league",
      season: "spring-2026",
      expenseKey: row.expenseKey,
      label: row.label,
      category: row.category,
      amount: Number.isFinite(amount) ? amount : 0,
      notes: row.notes,
    });
  }

  return (
    <div className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader className="pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-300" />
              Spring League Profit Model
            </CardTitle>
            <p className="mt-1 text-sm text-zinc-400">Revenue, payroll, cash costs, and true profit in one scannable view.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-100/80">Revenue estimate</p>
                  <p className="mt-1.5 font-mono text-lg font-semibold text-white">{formatCurrency(springRevenue)}</p>
                  <p className="mt-1 text-xs text-zinc-400">{springPlayers} players x {formatCurrency(springLeaguePrice)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-emerald-300" />
              </div>
            </div>
            <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-100/80">Coach payroll</p>
                  <p className="mt-1.5 font-mono text-lg font-semibold text-white">{formatCurrency(mayPayrollTotal)}</p>
                  <p className="mt-1 text-xs text-zinc-400">May preview from Staff Hours.</p>
                </div>
                <Users className="h-5 w-5 text-cyan-300" />
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-100/80">Other cash costs</p>
                  <p className="mt-1.5 font-mono text-lg font-semibold text-white">{formatCurrency(cashExpenseTotal)}</p>
                  <p className="mt-1 text-xs text-zinc-400">Editable buckets below.</p>
                </div>
                <FileText className="h-5 w-5 text-amber-300" />
              </div>
            </div>
            <div className="rounded-lg border border-violet-500/25 bg-violet-500/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-violet-100/80">Cash profit</p>
                  <p className="mt-1.5 font-mono text-lg font-semibold text-white">{formatCurrency(springCashProfit)}</p>
                  <p className="mt-1 text-xs text-zinc-400">True profit: {formatCurrency(springTrueProfit)}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-violet-300" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Expense</th>
                  <th className="px-3 py-2 font-medium">Bucket</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Profit treatment</th>
                </tr>
              </thead>
              <tbody>
                {expenseRows.map((row) => (
                  <tr key={row.expenseKey} className="border-b border-zinc-900 last:border-0">
                    <td className="px-3 py-3 font-medium text-white">{row.label}</td>
                    <td className="px-3 py-3 text-zinc-300">{row.category}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">$</span>
                        <Input
                          key={`${row.expenseKey}-${row.amount}`}
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={row.amount || ""}
                          onBlur={(event) => updateExpense(row, event.target.value)}
                          className="h-8 w-32 border-zinc-700 bg-zinc-950 font-mono text-zinc-100"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">
                      {row.expenseKey === "spring-2026-owner-time" ? "True profit only" : "Cash profit"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CashFlowTab() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {cashFlowWindows.map((window) => (
          <Card key={window.label} className={window.tone}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4" />
                {window.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {window.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <ArrowRight className="h-3.5 w-3.5" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-300" />
            Weekly Cash Flow Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            "Do we have enough cash for payroll due between the 1st and 5th?",
            "What registrations or invoices are expected this week?",
            "Which bills, field payments, or tax items are coming due?",
            "Which program is profitable, underpriced, or costing more than expected?",
          ].map((question) => (
            <div key={question} className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-300">
              {question}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StaffPayScale() {
  const [showAll, setShowAll] = useState(false);
  const [expandedCoach, setExpandedCoach] = useState<string | null>(null);
  const sortedRows = useMemo(
    () =>
      [...coachRates].sort((a, b) => {
        const rateDelta = (b.rate ?? 0) - (a.rate ?? 0);
        return rateDelta !== 0 ? rateDelta : a.coach.localeCompare(b.coach);
      }),
    []
  );
  const visibleRows = showAll ? sortedRows : sortedRows.slice(0, 5);

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Staff Pay Scale</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((value) => !value)}
            className="h-8 px-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            {showAll ? "Show less" : "Show all"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleRows.map((row) => {
          const isExpanded = expandedCoach === row.coach;

          return (
            <div key={row.coach} className="rounded-lg border border-zinc-800 bg-zinc-950/70">
              <button
                type="button"
                onClick={() => setExpandedCoach(isExpanded ? null : row.coach)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-none text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-none text-zinc-500" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{row.coach}</p>
                    <p className="text-xs text-zinc-500">{row.hours > 0 ? `${formatHours(row.hours)} May hours` : row.method}</p>
                  </div>
                </div>
                <p className="font-mono text-sm font-semibold text-zinc-200">{formatCurrency(row.rate ?? 0)}/hr</p>
              </button>

              {isExpanded && (
                <div className="space-y-2 border-t border-zinc-800 px-3 py-3 text-xs text-zinc-400">
                  <div className="flex items-center justify-between gap-3">
                    <span>Payment method</span>
                    <span className="text-zinc-200">{row.method}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Current rate recorded</span>
                    <span className="text-zinc-200">{row.rateRecordedAt ?? "Jun 1, 2026"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Prior rate history</span>
                    <span className="text-zinc-200">
                      {row.previousRates?.length ? `${row.previousRates.length} entries` : "Not recorded yet"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Raise review</span>
                    <span className="text-zinc-200">Needs policy/date</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function PayrollTab({ userId }: FinanceViewProps) {
  const payrollPeriod = "2026-05";
  const storedPayments = useQuery(api.finance.getPayrollPayments, { userId, period: payrollPeriod }) || [];
  const setPayrollPayment = useMutation(api.finance.setPayrollPayment);

  const paymentStatus = useMemo<Record<string, PayrollPaymentStatus>>(() => {
    return Object.fromEntries(
      storedPayments.map((payment: any) => [
        payment.coach,
        {
          paid: payment.paid,
          paidAt: payment.paidAt,
          method: payment.method,
        },
      ])
    );
  }, [storedPayments]);

  const paidTotal = useMemo(
    () =>
      payrollRows.reduce((sum, row) => {
        return paymentStatus[row.coach]?.paid ? sum + row.hours * (row.rate ?? 0) : sum;
      }, 0),
    [paymentStatus]
  );

  const unpaidTotal = mayPayrollTotal - paidTotal;
  const paidCount = payrollRows.filter((row) => paymentStatus[row.coach]?.paid).length;

  function togglePaid(row: PayrollRow) {
    const existing = paymentStatus[row.coach];
    const paid = !existing?.paid;

    void setPayrollPayment({
      userId,
      period: payrollPeriod,
      coach: row.coach,
      hours: row.hours,
      rate: row.rate ?? 0,
      amount: row.hours * (row.rate ?? 0),
      method: row.method,
      paid,
      paidAt: paid ? new Date().toISOString().slice(0, 10) : undefined,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="May payroll"
          value={formatCurrency(mayPayrollTotal)}
          detail={`${formatHours(mayPayrollHours)} paid coach hours from ${staffHoursSheet.title}.`}
          tone="border-cyan-500/25 bg-cyan-500/10"
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Pay period"
          value="May 2026"
          detail="Prior-month payroll due around June 1-5."
          tone="border-emerald-500/25 bg-emerald-500/10"
        />
        <MetricCard
          icon={FileText}
          label="Source"
          value={staffHoursSheet.sourceTab}
          detail={`Synced from ${staffHoursSheet.sourceAccount}.`}
          tone="border-violet-500/25 bg-violet-500/10"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Unpaid"
          value={formatCurrency(unpaidTotal)}
          detail={`${paidCount}/${payrollRows.length} payouts marked paid in MC.`}
          tone="border-amber-500/25 bg-amber-500/10"
        />
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-300" />
                May Payroll Preview
              </CardTitle>
              <p className="mt-2 text-sm text-zinc-400">
                Pulled from the May tab in Staff Hours (2026), using the hourly rates Corinne provided.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
            className="w-full shrink-0 border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900 md:w-auto"
            >
              <a href={staffHoursSheet.url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open sheet
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Coach</th>
                  <th className="py-2 pr-4 font-medium">Hours</th>
                  <th className="py-2 pr-4 font-medium">Rate</th>
                  <th className="py-2 pr-4 font-medium">Payout</th>
                  <th className="py-2 font-medium">Method</th>
                  <th className="py-2 pl-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payrollRows.map((row) => {
                  const status = paymentStatus[row.coach];

                  return (
                    <tr key={row.coach} className="border-b border-zinc-900 last:border-0">
                      <td className="py-3 pr-4 font-medium text-white">{row.coach}</td>
                      <td className="py-3 pr-4 font-mono text-zinc-200">{formatHours(row.hours)}</td>
                      <td className="py-3 pr-4 font-mono text-zinc-300">{formatCurrency(row.rate ?? 0)}/hr</td>
                      <td className="py-3 pr-4 font-mono font-semibold text-emerald-200">
                        {formatCurrency(row.hours * (row.rate ?? 0))}
                      </td>
                      <td className="py-3 text-zinc-300">{row.method}</td>
                      <td className="py-3 pl-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => togglePaid(row)}
                          className={
                            status?.paid
                              ? "whitespace-nowrap border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                              : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
                          }
                        >
                          {status?.paid ? `Paid ${status.paidAt ?? ""}` : "Mark paid"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700">
                  <td className="pt-3 pr-4 font-semibold text-white">Total</td>
                  <td className="pt-3 pr-4 font-mono font-semibold text-white">{formatHours(mayPayrollHours)}</td>
                  <td className="pt-3 pr-4 text-zinc-500" />
                  <td className="pt-3 pr-4 font-mono text-lg font-bold text-emerald-200">
                    {formatCurrency(mayPayrollTotal)}
                  </td>
                  <td className="pt-3 text-zinc-500" />
                  <td className="pt-3 pl-4 text-sm text-zinc-400">
                    {formatCurrency(paidTotal)} paid
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-cyan-500/30 bg-cyan-500/10">
        <CardHeader>
          <CardTitle className="text-base">Payroll Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-200">
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-zinc-950/60 px-3 py-2">
            <span className="min-w-0">Hours source</span>
            <span className="break-words text-right font-medium text-white">{staffHoursSheet.sourceTab}</span>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-zinc-950/60 px-3 py-2">
            <span className="min-w-0">Payment tracking</span>
            <span className="break-words text-right font-medium text-emerald-200">Database</span>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-zinc-950/60 px-3 py-2">
            <span className="min-w-0">Unpaid</span>
            <span className="break-words text-right font-mono font-semibold text-amber-100">{formatCurrency(unpaidTotal)}</span>
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-cyan-300" />
            Monthly Payroll Workflow
          </CardTitle>
          <p className="text-sm text-zinc-400">
            Payroll should become a monthly checklist instead of spreadsheet math and memory.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            ["Import hours", "Read monthly totals from the coach-hours Google Sheet."],
            ["Apply rates", "Use coach-specific hourly rates stored in MC."],
            ["Review exceptions", "Flag missing rates, unusually high hours, or blank totals."],
            ["Generate payouts", "Create a Zelle/Venmo checklist for the prior month."],
            ["Mark paid", "Track date, method, amount, and notes for history/bookkeeping."],
          ].map(([title, detail], index) => (
            <div key={title} className="grid grid-cols-[32px_1fr] gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-sm font-semibold text-cyan-100">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-1 text-sm leading-5 text-zinc-400">{detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <StaffPayScale />
      </div>
    </div>
  );
}

function TaxesTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-300" />
            Taxes and Bookkeeping
          </CardTitle>
          <p className="text-sm text-zinc-400">
            MC should be the prep layer for Bench/Kick and the accountant, not a replacement for bookkeeping software.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            ["Monthly close", "Receipts, statements, deposits, refunds, payroll summary."],
            ["Bookkeeper handoff", "What Bench/Kick has, what is missing, what needs review."],
            ["Tax set-aside", "Manual target until bank and revenue data are connected."],
            ["Accountant questions", "Capture open issues before they become tax-season chaos."],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm font-medium text-white">{title}</p>
              <p className="mt-2 text-sm leading-5 text-zinc-400">{detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardHeader>
          <CardTitle className="text-base">Bookkeeping Rule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-zinc-300">
          <p>
            Keep Aspire, 7v7, HTA, and personal finance records distinct. The dashboard can show them together, but the underlying data should not blend.
          </p>
          <p>
            That separation matters for cash flow, taxes, bookkeeping, and knowing which project is actually making money.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function FinanceView({ userId }: FinanceViewProps) {
  return (
    <div className="space-y-4">
      <WorkSurfacePageHeader
        title="Finance"
        description="A calm money dashboard for separating personal, Aspire, payroll, cash flow, and bookkeeping decisions."
      />

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <TabsTrigger value="personal" className="min-w-fit px-3 py-2 data-[state=active]:bg-violet-600">Personal</TabsTrigger>
          <TabsTrigger value="business" className="min-w-fit px-3 py-2 data-[state=active]:bg-emerald-600">Business</TabsTrigger>
          <TabsTrigger value="cash-flow" className="min-w-fit px-3 py-2 data-[state=active]:bg-cyan-600">Cash Flow</TabsTrigger>
          <TabsTrigger value="payroll" className="min-w-fit px-3 py-2 data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950">Payroll</TabsTrigger>
          <TabsTrigger value="taxes" className="min-w-fit px-3 py-2 data-[state=active]:bg-rose-600">Taxes / Bookkeeping</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalTab />
        </TabsContent>

        <TabsContent value="business">
          <BusinessTab userId={userId} />
        </TabsContent>

        <TabsContent value="cash-flow">
          <CashFlowTab />
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollTab userId={userId} />
        </TabsContent>

        <TabsContent value="taxes">
          <TaxesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
