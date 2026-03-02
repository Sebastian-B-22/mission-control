"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

// Placeholder data - will be replaced with Plaid integration
const DEMO_ACCOUNTS = {
  personal: [
    { id: "1", name: "Chase Checking", mask: "4521", balance: 5234.50, type: "checking" },
    { id: "2", name: "Chase Savings", mask: "8892", balance: 12500.00, type: "savings" },
    { id: "3", name: "Visa Signature", mask: "7788", balance: -1245.30, type: "credit", limit: 10000 },
  ],
  business: [
    { id: "4", name: "Aspire Business Checking", mask: "3344", balance: 15890.75, type: "checking" },
    { id: "5", name: "Business CC", mask: "9901", balance: -2100.00, type: "credit", limit: 25000 },
  ]
};

const DEMO_TRANSACTIONS = [
  { id: "t1", date: "2026-03-01", name: "Stripe Deposit", amount: 399.00, account: "Aspire Business", category: "Income" },
  { id: "t2", date: "2026-03-01", name: "Amazon", amount: -45.99, account: "Chase Checking", category: "Shopping" },
  { id: "t3", date: "2026-02-28", name: "Jotform Registration", amount: 299.00, account: "Aspire Business", category: "Income" },
  { id: "t4", date: "2026-02-28", name: "Whole Foods", amount: -89.50, account: "Visa Signature", category: "Groceries" },
  { id: "t5", date: "2026-02-27", name: "Stripe Deposit", amount: 598.00, account: "Aspire Business", category: "Income" },
  { id: "t6", date: "2026-02-27", name: "Shell Gas", amount: -52.30, account: "Chase Checking", category: "Auto" },
  { id: "t7", date: "2026-02-26", name: "Target", amount: -124.55, account: "Visa Signature", category: "Shopping" },
  { id: "t8", date: "2026-02-26", name: "Stripe Deposit", amount: 199.00, account: "Aspire Business", category: "Income" },
];

export function FinanceView() {
  const [isPlaidConnected, setIsPlaidConnected] = useState(false);

  // Calculate totals
  const personalTotal = DEMO_ACCOUNTS.personal.reduce((sum, a) => sum + a.balance, 0);
  const businessTotal = DEMO_ACCOUNTS.business.reduce((sum, a) => sum + a.balance, 0);
  const netWorth = personalTotal + businessTotal;

  // Calculate cash flow (last 30 days from demo data)
  const income = DEMO_TRANSACTIONS.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = DEMO_TRANSACTIONS.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netCashFlow = income - expenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-400" />
            Finance
          </h1>
          <p className="text-zinc-400 mt-1">Your unified financial dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
          <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />
            Connect Bank
          </Button>
        </div>
      </div>

      {/* Setup Banner - show if Plaid not connected */}
      {!isPlaidConnected && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <div>
                <p className="font-medium text-amber-400">Demo Mode</p>
                <p className="text-sm text-zinc-400">Connect your banks via Plaid to see real data</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-amber-500 text-amber-400 hover:bg-amber-500/20">
              Set Up Plaid
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Net Worth & Cash Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Net Worth</p>
              <Wallet className="h-4 w-4 text-zinc-500" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{formatCurrency(netWorth)}</p>
            <p className="text-sm text-green-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              +$2,100 this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Income (30d)</p>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400 mt-2">{formatCurrency(income)}</p>
            <p className="text-sm text-zinc-500 mt-1">From Stripe + registrations</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Expenses (30d)</p>
              <TrendingDown className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400 mt-2">{formatCurrency(expenses)}</p>
            <p className="text-sm text-zinc-500 mt-1">
              Net: <span className={netCashFlow >= 0 ? "text-green-400" : "text-red-400"}>
                {formatCurrency(netCashFlow)}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Accounts */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-blue-400" />
              Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DEMO_ACCOUNTS.personal.map((account) => (
              <div key={account.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-3">
                  {account.type === "credit" ? (
                    <CreditCard className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <Wallet className="h-4 w-4 text-zinc-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    <p className="text-xs text-zinc-500">••••{account.mask}</p>
                  </div>
                </div>
                <p className={`font-mono font-medium ${account.balance < 0 ? "text-red-400" : "text-white"}`}>
                  {formatCurrency(account.balance)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
              <p className="text-sm text-zinc-400">Total</p>
              <p className="font-mono font-bold text-white">{formatCurrency(personalTotal)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Business Accounts */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-amber-400" />
              Aspire Business
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DEMO_ACCOUNTS.business.map((account) => (
              <div key={account.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-3">
                  {account.type === "credit" ? (
                    <CreditCard className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <Wallet className="h-4 w-4 text-zinc-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    <p className="text-xs text-zinc-500">••••{account.mask}</p>
                  </div>
                </div>
                <p className={`font-mono font-medium ${account.balance < 0 ? "text-red-400" : "text-white"}`}>
                  {formatCurrency(account.balance)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
              <p className="text-sm text-zinc-400">Total</p>
              <p className="font-mono font-bold text-white">{formatCurrency(businessTotal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              View All
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DEMO_TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${tx.amount > 0 ? "bg-green-500/10" : "bg-zinc-800"}`}>
                    {tx.amount > 0 ? (
                      <ArrowDownRight className="h-4 w-4 text-green-400" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{tx.name}</p>
                    <p className="text-xs text-zinc-500">{tx.account} • {tx.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-medium ${tx.amount > 0 ? "text-green-400" : "text-white"}`}>
                    {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-zinc-500">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <ExternalLink className="h-5 w-5" />
          <span className="text-sm">Stripe Dashboard</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <ExternalLink className="h-5 w-5" />
          <span className="text-sm">Chase Login</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <ExternalLink className="h-5 w-5" />
          <span className="text-sm">Jotform Payments</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <ExternalLink className="h-5 w-5" />
          <span className="text-sm">LA Business Tax</span>
        </Button>
      </div>
    </div>
  );
}
