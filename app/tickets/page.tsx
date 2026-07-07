"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const TEAMS = [
  { id: "acfc", label: "Angel City FC" },
  { id: "lafc", label: "LAFC" },
  { id: "galaxy", label: "LA Galaxy" },
] as const;

type Team = (typeof TEAMS)[number]["id"];

export default function TicketsInterestPage() {
  const joinInterestList = useMutation(api.tickets.joinInterestList);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => name.trim() && phone.trim() && teams.length > 0, [name, phone, teams]);

  const toggleTeam = (team: Team) => {
    setTeams((current) => current.includes(team) ? current.filter((t) => t !== team) : [...current, team]);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus("saving");
    setMessage("");

    try {
      await joinInterestList({
        name,
        phone,
        email: email.trim() || undefined,
        teams,
        source: "tickets-public-page",
      });
      setStatus("success");
      setMessage("You’re on the list. I’ll only text you when tickets for your selected teams are available.");
      setName("");
      setPhone("");
      setEmail("");
      setTeams([]);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-950 to-black px-4 py-10 text-zinc-50">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center space-y-3">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-300/80">Soccer tickets</p>
          <h1 className="text-4xl font-black tracking-tight">Want first dibs?</h1>
          <p className="text-zinc-300">
            Join Corinne’s simple ticket text list for ACFC, LAFC, and Galaxy games. No spam - just a quick text when seats are available.
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-50 shadow-2xl">
          <CardHeader>
            <CardTitle>Join the interest list</CardTitle>
            <CardDescription className="text-zinc-400">
              Pick the teams you care about. You can ignore or opt out anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="bg-zinc-900 border-zinc-700" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Mobile number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(310) 555-1234" className="bg-zinc-900 border-zinc-700" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-zinc-500">optional</span></Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-zinc-900 border-zinc-700" />
              </div>

              <div className="space-y-3">
                <Label>Teams</Label>
                <div className="grid gap-3">
                  {TEAMS.map((team) => (
                    <label key={team.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <Checkbox checked={teams.includes(team.id)} onCheckedChange={() => toggleTeam(team.id)} />
                      <span>{team.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {message ? (
                <div className={`rounded-xl border p-3 text-sm ${status === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-red-500/30 bg-red-500/10 text-red-100"}`}>
                  {message}
                </div>
              ) : null}

              <Button type="submit" disabled={!canSubmit || status === "saving"} className="w-full bg-amber-500 font-bold text-black hover:bg-amber-400">
                {status === "saving" ? "Saving..." : "Join the list"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-500">
          This is a private interest list, not a Ticketmaster listing or public marketplace.
        </p>
      </div>
    </main>
  );
}
