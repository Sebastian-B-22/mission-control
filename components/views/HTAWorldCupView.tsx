"use client";

import { useMemo, useState } from "react";
import type { ElementType } from "react";
import { useMutation, useQuery } from "convex/react";
import { Award, CalendarDays, Download, MessageSquare, Share2, Trophy, Upload, Users } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type WorldCupEntry = Doc<"worldCupEntries">;
type WorldCupAccessToken = Doc<"worldCupAccessTokens">;
type ModeFilter = "all" | "quick-kids" | "full-family" | "fantasy-five" | "second-chance" | "launch-list";

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

function modeLabel(mode: string) {
  if (mode === "quick-kids") return "Quick Kids";
  if (mode === "fantasy-five") return "Fantasy Five";
  if (mode === "second-chance") return "Second Chance";
  if (mode === "full-family") return "Full Bracket";
  return "Launch List";
}

function entryChampion(entry: WorldCupEntry) {
  const data = entry.entryData as any;
  if (entry.mode === "quick-kids") return data?.simplePicks?.champion || "No winner yet";
  if (entry.mode === "fantasy-five") {
    const picks = data?.fantasyFive?.picks || {};
    const captain = data?.fantasyFive?.captain;
    return captain ? `Captain: ${captain}` : Object.values(picks).filter(Boolean).join(", ") || "No squad yet";
  }
  const finalWinner = data?.winners?.final?.final_0;
  return finalWinner || "No champion yet";
}

function entryTeams(entry: WorldCupEntry) {
  const data = entry.entryData as any;
  if (entry.mode === "quick-kids") {
    const teams = [data?.simplePicks?.champion, ...(data?.simplePicks?.quarterfinalists || [])].filter(Boolean);
    return teams.length ? teams.join(", ") : "No teams yet";
  }

  if (entry.mode === "fantasy-five") {
    const picks = data?.fantasyFive?.picks || {};
    return Object.values(picks).filter(Boolean).join(", ") || "No squad yet";
  }

  if (entry.mode === "launch-list") {
    return Array.isArray(data?.participants) ? data.participants.join(", ") : "Launch interest";
  }

  const wildcards = Array.isArray(data?.wildcards) ? data.wildcards.slice(0, 3).join(", ") : "";
  return wildcards ? `Top wildcards: ${wildcards}` : "Full bracket saved";
}

function familyKey(entry: WorldCupEntry) {
  return (entry.parentEmail || entry.parentPhone || entry.familyName || entry._id).toLowerCase();
}

function latestEntryKey(entry: WorldCupEntry) {
  return `${familyKey(entry)}::${entry.participantName || "family"}::${entry.mode}`;
}

function adminStatus(entry: WorldCupEntry) {
  return (entry as any).adminStatus || "active";
}

function csvEscape(value: unknown) {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function HTAWorldCupView() {
  const [mode, setMode] = useState<ModeFilter>("all");
  const queryArgs = mode === "all" ? { limit: 250 } : { limit: 250, mode };
  const entries = useQuery(api.worldCup.listEntries, queryArgs);
  const leaderboard = useQuery(api.worldCup.listLeaderboard, { limit: 100, publicOnly: false });
  const missionSubmissions = useQuery(api.worldCup.listMissionSubmissions, { limit: 100 });
  const accessTokens = useQuery(api.worldCup.listAccessTokens, { limit: 50 });
  const setEntryStatus = useMutation(api.worldCup.setEntryAdminStatus);

  const rows = useMemo(() => entries || [], [entries]);
  const latestRows = useMemo(() => {
    const latest = new Map<string, WorldCupEntry>();
    rows.forEach((entry) => {
      if (entry.mode === "launch-list" || adminStatus(entry) !== "active") return;
      const key = latestEntryKey(entry);
      const current = latest.get(key);
      if (!current || entry.createdAt > current.createdAt) latest.set(key, entry);
    });
    return Array.from(latest.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [rows]);
  const leaderboardRows = useMemo(() => leaderboard?.rows || [], [leaderboard]);
  const stats = useMemo(() => {
    const allEntries = rows;
    const families = new Set(allEntries.map(familyKey));
    const quickKids = allEntries.filter((entry) => entry.mode === "quick-kids").length;
    const fullBrackets = allEntries.filter((entry) => entry.mode === "full-family").length;
    const fantasyFive = allEntries.filter((entry) => entry.mode === "fantasy-five").length;
    const confirmations = allEntries.filter((entry) => Boolean((entry as any).confirmationTextSentAt)).length;
    const smsOptIns = allEntries.filter((entry) => entry.textOptIn).length;

    return { families: families.size, quickKids, fullBrackets, fantasyFive, confirmations, smsOptIns };
  }, [rows]);

  const exportEntries = () => {
    const fantasyBonusByFamily = new Map<string, number>();
    downloadCsv(
      "hta-world-cup-entries.csv",
      rows.map((entry) => {
        const groupCodes = entry.groupCodes || [];
        const groupParticipationEntries = Math.min(new Set(groupCodes).size, 3);
        const isActivePrizeEntry = entry.mode !== "launch-list" && adminStatus(entry) === "active";
        let fantasyFiveBonusEntry = 0;
        if (isActivePrizeEntry && entry.mode === "fantasy-five") {
          const key = familyKey(entry);
          const used = fantasyBonusByFamily.get(key) || 0;
          if (used < 3) {
            fantasyFiveBonusEntry = 1;
            fantasyBonusByFamily.set(key, used + 1);
          }
        }
        const bracketRaffleEntry = isActivePrizeEntry ? 1 : 0;
        return {
          createdAt: new Date(entry.createdAt).toISOString(),
          familyName: entry.familyName,
          parentName: entry.parentName || "",
          parentEmail: entry.parentEmail || "",
          parentPhone: entry.parentPhone || "",
          mode: entry.mode,
          participantName: entry.participantName || "",
          participantDisplayName: (entry as any).participantDisplayName || "",
          participantType: entry.participantType || "",
          ageRange: entry.ageRange || "",
          champion: entryChampion(entry),
          teams: entryTeams(entry),
          groupCodes: groupCodes.join(" "),
          bracketRaffleEntry,
          fantasyFiveBonusEntry,
          groupParticipationEntries,
          totalRaffleEntries: bracketRaffleEntry + fantasyFiveBonusEntry + groupParticipationEntries,
          textOptIn: entry.textOptIn ? "yes" : "no",
          confirmationTextSentAt: (entry as any).confirmationTextSentAt ? new Date((entry as any).confirmationTextSentAt).toISOString() : "",
          adminStatus: adminStatus(entry),
          source: entry.source,
          submissionId: entry._id,
        };
      })
    );
  };

  const exportMissions = () => {
    downloadCsv(
      "hta-world-cup-missions.csv",
      (missionSubmissions || []).map((submission: Doc<"worldCupMissionSubmissions">) => ({
        createdAt: new Date(submission.createdAt).toISOString(),
        familyName: submission.familyName,
        parentName: submission.parentName || "",
        parentEmail: submission.parentEmail || "",
        parentPhone: submission.parentPhone || "",
        childFirstName: submission.childFirstName || "",
        challengeKey: submission.challengeKey,
        challengeTitle: submission.challengeTitle,
        status: submission.status,
        caption: submission.caption || "",
        socialPostUrl: submission.socialPostUrl || "",
        mediaName: submission.mediaName || "",
        repostPermission: (submission as any).repostPermission ? "yes" : "no",
        source: submission.source,
        submissionId: submission._id,
      }))
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">HTA Campaign</p>
          <h1 className="mt-1 text-3xl font-black text-white">World Cup Challenge</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Captured family entries, SMS opt-ins, access-link requests, and bracket modes from the public World Cup flow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportEntries}
            disabled={!rows.length}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-bold text-zinc-100 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export Entries
          </button>
          <button
            type="button"
            onClick={exportMissions}
            disabled={!missionSubmissions?.length}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-bold text-zinc-100 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export Missions
          </button>
          <a
            href="/worldcup"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-bold text-white hover:bg-emerald-400"
          >
            Open Public Page
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={Users} label="Families" value={stats.families} detail="Unique parent contacts" />
        <Metric icon={Trophy} label="Quick Kids" value={stats.quickKids} detail="Simple kid entries" />
        <Metric icon={CalendarDays} label="Full Brackets" value={stats.fullBrackets} detail="Older kids/adults" />
        <Metric icon={Award} label="Fantasy Five" value={stats.fantasyFive} detail="Advanced squads" />
        <Metric icon={MessageSquare} label="Confirmations" value={stats.confirmations} detail="Texts sent" />
        <Metric icon={MessageSquare} label="SMS Opt-ins" value={stats.smsOptIns} detail="Text reminders" />
      </div>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-white">Entries</CardTitle>
              <p className="mt-1 text-xs text-zinc-500">Latest active entries counted for leaderboard: {latestRows.length}</p>
            </div>
            <Tabs value={mode} onValueChange={(value) => setMode(value as ModeFilter)}>
              <TabsList className="bg-zinc-900">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="quick-kids">Quick</TabsTrigger>
                <TabsTrigger value="full-family">Full</TabsTrigger>
                <TabsTrigger value="fantasy-five">Fantasy</TabsTrigger>
                <TabsTrigger value="second-chance">Second</TabsTrigger>
                <TabsTrigger value="launch-list">Launch</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {!entries ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">Loading entries...</div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">No World Cup entries yet.</div>
          ) : (
            <div className="grid gap-3">
              {rows.map((entry) => (
                <EntryCard
                  key={entry._id}
                  entry={entry}
                  onStatus={(adminStatus) => setEntryStatus({ id: entry._id, adminStatus })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><MessageSquare className="h-5 w-5 text-emerald-300" /> SMS + Access Links</CardTitle>
        </CardHeader>
        <CardContent>
          {!accessTokens ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">Loading access-link requests...</div>
          ) : accessTokens.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">No access-link requests yet.</div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {accessTokens.map((token: WorldCupAccessToken) => (
                <div key={token._id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                  <div className="font-bold text-white">{token.parentPhone}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Requested {formatDate(token.createdAt)} • reusable access link
                  </div>
                  <Badge className="mt-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-100">
                    Active link
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white"><Award className="h-5 w-5 text-emerald-300" /> Internal Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {!leaderboard ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">Loading leaderboard...</div>
            ) : leaderboardRows.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">No scored entries yet.</div>
            ) : (
              <div className="grid gap-2">
                {leaderboardRows.map((row: any) => (
                  <div key={row.id} className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm md:grid-cols-[44px_1fr_auto] md:items-center">
                    <div className="text-lg font-black text-emerald-200">#{row.rank}</div>
                    <div>
                      <div className="font-bold text-white">{row.familyName}</div>
                      <div className="text-zinc-400">{modeLabel(row.mode)}{row.champion ? ` • champion pick: ${row.champion}` : ""}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Group winners {row.score.groupWinnerPoints} • Advancers {row.score.advancingPoints} • Knockouts {row.score.knockoutPoints}
                      </div>
                    </div>
                    <div className="text-right text-xl font-black text-emerald-300">{row.score.total} pts</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white"><Upload className="h-5 w-5 text-emerald-300" /> Creative Missions</CardTitle>
          </CardHeader>
          <CardContent>
            {!missionSubmissions ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">Loading mission uploads...</div>
            ) : missionSubmissions.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">No creative challenge submissions yet.</div>
            ) : (
              <div className="grid gap-2">
                {missionSubmissions.map((submission: Doc<"worldCupMissionSubmissions">) => (
                  <div key={submission._id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">{submission.familyName}</div>
                        <div className="text-zinc-400">{submission.challengeTitle}</div>
                      </div>
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-100">{submission.status}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">{submission.parentEmail || submission.parentPhone || "No contact"} • {formatDate(submission.createdAt)}</div>
                    {submission.caption && <p className="mt-2 text-sm leading-6 text-zinc-300">{submission.caption}</p>}
                    {submission.socialPostUrl && <a className="mt-2 inline-block text-xs font-bold text-emerald-300" href={submission.socialPostUrl} target="_blank" rel="noreferrer">Open social post</a>}
                    {submission.mediaName && <div className="mt-2 text-xs text-zinc-500">Uploaded: {submission.mediaName}</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ElementType;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
          </div>
          <Icon className="h-5 w-5 text-emerald-300" />
        </div>
        <p className="mt-2 text-xs text-zinc-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function EntryCard({
  entry,
  onStatus,
}: {
  entry: WorldCupEntry;
  onStatus: (status: "active" | "test" | "archived") => void;
}) {
  const contact = [entry.parentEmail, entry.parentPhone].filter(Boolean).join(" • ") || "No contact";
  const status = adminStatus(entry);
  const confirmationSentAt = (entry as any).confirmationTextSentAt as number | undefined;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-white">{entry.familyName}</h3>
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-100">{modeLabel(entry.mode)}</Badge>
            {entry.textOptIn && <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-100">SMS</Badge>}
            {confirmationSentAt && <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-100">Confirmation sent</Badge>}
            {status !== "active" && <Badge className="border-red-500/30 bg-red-500/10 text-red-100">{status}</Badge>}
          </div>
          <p className="mt-1 text-sm text-zinc-400">{contact}</p>
          {entry.groupCodes?.length ? <p className="mt-1 text-xs text-zinc-500">Groups: {entry.groupCodes.join(", ")}</p> : null}
          <p className="mt-2 text-sm text-zinc-300">
            <span className="font-semibold text-zinc-100">{entry.participantName || "Launch interest"}</span>
            {entry.participantDisplayName ? ` • ${entry.participantDisplayName}` : ""}
            {entry.participantType ? ` • ${entry.participantType}` : ""}
            {entry.ageRange ? ` • age ${entry.ageRange}` : ""}
          </p>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-xs uppercase text-zinc-500">{formatDate(entry.createdAt)}</p>
          {confirmationSentAt && <p className="mt-1 text-xs text-zinc-500">Text: {formatDate(confirmationSentAt)}</p>}
          <p className="mt-2 text-sm font-semibold text-white">{entryChampion(entry)}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-400 md:grid-cols-[1fr_auto] md:items-center">
        <span>{entryTeams(entry)}</span>
        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
          <Share2 className="h-3.5 w-3.5" />
          {entry.source}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onStatus("active")}
          disabled={status === "active"}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => onStatus("test")}
          disabled={status === "test"}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
        >
          Mark Test
        </button>
        <button
          type="button"
          onClick={() => onStatus("archived")}
          disabled={status === "archived"}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
        >
          Archive
        </button>
      </div>
    </div>
  );
}
