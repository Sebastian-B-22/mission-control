"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { useMutation, useQuery } from "convex/react";
import { Award, CalendarDays, Download, Lock, MessageSquare, RotateCcw, Share2, ShieldCheck, Sparkles, Trophy, Upload, Users } from "lucide-react";

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

function normalizedParticipantName(entry: WorldCupEntry) {
  return (entry.participantName || entry.participantDisplayName || "Family entry").trim();
}

type RaffleFamily = {
  id: string;
  familyName: string;
  participantNames: string[];
  baseEntries: number;
  fantasyEntries: number;
  missionEntries: number;
  groupEntries: number;
  totalEntries: number;
};

type RaffleWinner = {
  familyId: string;
  familyName: string;
  prize: string;
  ticketNumber: number;
  drawnAt: string;
};

type LockedRaffle = {
  lockedAt: string;
  fingerprint: string;
  families: RaffleFamily[];
  prizes: string[];
};

const DEFAULT_RAFFLE_PRIZES = ["$50 HTA credit", "Soccer surprise pack / mini ball", "Soccer cards or stickers pack"];
const RAFFLE_STORAGE_KEY = "hta-world-cup-raffle-draw-v1";

function missionFamilyKey(submission: Doc<"worldCupMissionSubmissions">) {
  return raffleFamilyKey(submission.familyName, submission.parentEmail || submission.parentPhone || String(submission._id));
}

function raffleFamilyKey(familyName: string | undefined, fallback: string) {
  const normalizedName = (familyName || "")
    .normalize("NFKD")
    .replace(/[’‘]/g, "'")
    .replace(/[^a-zA-Z0-9']+/g, " ")
    .trim()
    .toLowerCase();
  if (normalizedName && normalizedName !== "family team" && normalizedName !== "family entry") return normalizedName;
  return fallback.trim().toLowerCase();
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function secureRandomInt(maxExclusive: number) {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) throw new Error("Invalid raffle range");
  const range = 0x1_0000_0000;
  const limit = range - (range % maxExclusive);
  const values = new Uint32Array(1);
  do crypto.getRandomValues(values); while (values[0] >= limit);
  return values[0] % maxExclusive;
}

function buildRaffleFamilies(entries: WorldCupEntry[], missions: Doc<"worldCupMissionSubmissions">[]) {
  const activeLatest = new Map<string, WorldCupEntry>();
  entries.forEach((entry) => {
    if (entry.mode === "launch-list" || adminStatus(entry) !== "active") return;
    if (/^test$/i.test(normalizedParticipantName(entry))) return;
    const key = latestEntryKey(entry);
    const current = activeLatest.get(key);
    if (!current || entry.createdAt > current.createdAt) activeLatest.set(key, entry);
  });

  const familyRows = new Map<string, WorldCupEntry[]>();
  activeLatest.forEach((entry) => {
    const key = raffleFamilyKey(entry.familyName, familyKey(entry));
    familyRows.set(key, [...(familyRows.get(key) || []), entry]);
  });

  const missionCounts = new Map<string, number>();
  const missionKeys = new Set<string>();
  missions.forEach((mission) => {
    if (mission.status === "dismissed") return;
    const key = missionFamilyKey(mission);
    const uniqueKey = `${key}::${mission.challengeKey}`;
    if (missionKeys.has(uniqueKey)) return;
    missionKeys.add(uniqueKey);
    missionCounts.set(key, (missionCounts.get(key) || 0) + 1);
  });

  return Array.from(familyRows.entries()).map(([id, familyEntries]) => {
    const participants = new Map<string, string>();
    familyEntries.forEach((entry) => {
      const name = normalizedParticipantName(entry);
      participants.set(name.toLowerCase(), name);
    });
    const participantNames = Array.from(participants.values()).sort((a, b) => a.localeCompare(b));
    const fantasyParticipants = new Set(
      familyEntries
        .filter((entry) => entry.mode === "fantasy-five")
        .map((entry) => normalizedParticipantName(entry).toLowerCase()),
    );
    const groupCodes = new Set(
      familyEntries.flatMap((entry) => entry.groupCodes || []).map((code) => code.trim().toUpperCase()).filter(Boolean),
    );
    const baseEntries = participantNames.length;
    const fantasyEntries = Math.min(fantasyParticipants.size, 3);
    const missionEntries = missionCounts.get(id) || 0;
    const groupEntries = Math.min(groupCodes.size, 3);
    return {
      id,
      familyName: familyEntries.find((entry) => entry.familyName)?.familyName || "Family entry",
      participantNames,
      baseEntries,
      fantasyEntries,
      missionEntries,
      groupEntries,
      totalEntries: baseEntries + fantasyEntries + missionEntries + groupEntries,
    };
  }).sort((a, b) => a.familyName.localeCompare(b.familyName));
}

function HTAWorldCupRaffle({
  entries,
  missions,
}: {
  entries: WorldCupEntry[];
  missions: Doc<"worldCupMissionSubmissions">[];
}) {
  const [prizes, setPrizes] = useState(DEFAULT_RAFFLE_PRIZES);
  const [locked, setLocked] = useState<LockedRaffle | null>(null);
  const [winners, setWinners] = useState<RaffleWinner[]>([]);
  const [drawingName, setDrawingName] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  const raffleFamilies = useMemo(() => buildRaffleFamilies(entries, missions), [entries, missions]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RAFFLE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { locked: LockedRaffle; winners: RaffleWinner[] };
        setLocked(parsed.locked);
        setPrizes(parsed.locked.prizes);
        setWinners(parsed.winners || []);
      }
    } catch {
      localStorage.removeItem(RAFFLE_STORAGE_KEY);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady || !locked) return;
    localStorage.setItem(RAFFLE_STORAGE_KEY, JSON.stringify({ locked, winners }));
  }, [locked, winners, storageReady]);

  const displayedFamilies = locked?.families || raffleFamilies;
  const totalTickets = displayedFamilies.reduce((sum, family) => sum + family.totalEntries, 0);
  const remainingFamilies = displayedFamilies.filter((family) => !winners.some((winner) => winner.familyId === family.id));
  const remainingTickets = remainingFamilies.reduce((sum, family) => sum + family.totalEntries, 0);
  const nextPrize = locked?.prizes[winners.length];

  const lockRaffle = async () => {
    const lockedAt = new Date().toISOString();
    const snapshot = { lockedAt, families: raffleFamilies, prizes };
    const fingerprint = await sha256(JSON.stringify(snapshot));
    setLocked({ ...snapshot, fingerprint });
    setWinners([]);
  };

  const drawWinner = () => {
    if (!locked || !nextPrize || remainingTickets === 0 || isDrawing) return;
    setIsDrawing(true);
    const winningOffset = secureRandomInt(remainingTickets);
    let cursor = 0;
    let selected = remainingFamilies[remainingFamilies.length - 1];
    for (const family of remainingFamilies) {
      cursor += family.totalEntries;
      if (winningOffset < cursor) {
        selected = family;
        break;
      }
    }

    let spins = 0;
    const animation = window.setInterval(() => {
      const preview = remainingFamilies[secureRandomInt(remainingFamilies.length)];
      setDrawingName(preview.familyName);
      spins += 1;
      if (spins < 24) return;
      window.clearInterval(animation);
      setDrawingName(selected.familyName);
      setWinners((current) => [...current, {
        familyId: selected.id,
        familyName: selected.familyName,
        prize: nextPrize,
        ticketNumber: winningOffset + 1,
        drawnAt: new Date().toISOString(),
      }]);
      setIsDrawing(false);
    }, 90);
  };

  const resetRaffle = () => {
    if (!window.confirm("Reset the locked raffle and all draw results? This creates a new draw record.")) return;
    localStorage.removeItem(RAFFLE_STORAGE_KEY);
    setLocked(null);
    setWinners([]);
    setDrawingName("");
    setPrizes(DEFAULT_RAFFLE_PRIZES);
  };

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/20">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white"><Sparkles className="h-5 w-5 text-amber-300" /> Recorded Raffle Draw</CardTitle>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              One base entry per unique player, plus Fantasy 5, eligible mission, and private-group participation bonuses. Winners are drawn by family and removed before the next prize.
            </p>
          </div>
          {locked && (
            <button type="button" onClick={resetRaffle} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 text-xs font-bold text-zinc-300 hover:bg-zinc-900">
              <RotateCcw className="h-4 w-4" /> Reset draw
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric icon={Users} label="Eligible families" value={displayedFamilies.length} detail="Unique family contacts" />
          <Metric icon={Award} label="Total tickets" value={totalTickets} detail={locked ? `${remainingTickets} remain` : "Before locking"} />
          <Metric icon={Trophy} label="Prizes" value={locked?.prizes.length || prizes.length} detail={`${winners.length} drawn`} />
        </div>

        {!locked ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-300">Prizes in draw order</div>
              <div className="space-y-2">
                {prizes.map((prize, index) => (
                  <input
                    key={index}
                    value={prize}
                    onChange={(event) => setPrizes((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}
                    className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-amber-400"
                    aria-label={`Prize ${index + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={lockRaffle}
                disabled={!raffleFamilies.length || prizes.some((prize) => !prize.trim())}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 text-sm font-black text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Lock className="h-4 w-4" /> Lock entry list for recording
              </button>
            </div>
            <RaffleEntryTable families={displayedFamilies} />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <div className="flex items-center gap-2 font-black"><ShieldCheck className="h-5 w-5" /> Entry list locked</div>
              <div className="mt-2 break-all font-mono text-xs text-emerald-200/80">SHA-256: {locked.fingerprint}</div>
              <div className="mt-1 text-xs text-emerald-200/70">Locked {new Date(locked.lockedAt).toLocaleString()}</div>
            </div>

            {nextPrize ? (
              <div className="rounded-2xl border border-amber-400/40 bg-zinc-900/80 px-5 py-8 text-center shadow-2xl shadow-amber-950/30">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Drawing now</div>
                <div className="mt-2 text-xl font-black text-white">{nextPrize}</div>
                <div className={`mx-auto mt-6 flex min-h-28 max-w-2xl items-center justify-center rounded-2xl border px-5 text-3xl font-black sm:text-5xl ${isDrawing ? "border-amber-300 bg-amber-400/15 text-amber-100" : "border-zinc-700 bg-zinc-950 text-zinc-500"}`}>
                  {drawingName || `${remainingFamilies.length} families • ${remainingTickets} tickets`}
                </div>
                <button
                  type="button"
                  onClick={drawWinner}
                  disabled={isDrawing || remainingTickets === 0}
                  className="mt-6 inline-flex h-14 min-w-56 items-center justify-center gap-2 rounded-xl bg-amber-400 px-8 text-lg font-black text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-5 w-5" /> {isDrawing ? "Drawing…" : `Draw prize ${winners.length + 1}`}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
                <Trophy className="mx-auto h-10 w-10 text-emerald-300" />
                <div className="mt-3 text-2xl font-black text-white">Raffle complete</div>
                <div className="mt-1 text-sm text-emerald-100/70">All results are saved in this browser.</div>
              </div>
            )}

            {winners.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {winners.map((winner, index) => (
                  <div key={`${winner.familyId}-${winner.prize}`} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="text-xs font-black uppercase tracking-wide text-amber-300">Winner {index + 1}</div>
                    <div className="mt-2 text-xl font-black text-white">{winner.familyName}</div>
                    <div className="mt-1 text-sm text-zinc-300">{winner.prize}</div>
                    <div className="mt-3 text-xs text-zinc-500">Random ticket #{winner.ticketNumber} • {new Date(winner.drawnAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            <RaffleEntryTable families={displayedFamilies} winners={winners} />
          </div>
        )}

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-xs leading-5 text-zinc-500">
          Random selection uses <span className="font-mono text-zinc-400">crypto.getRandomValues()</span> with rejection sampling to avoid modulo bias. Obvious QA participants named “Test” are excluded. Mission bonuses count one non-dismissed submission per family per challenge. Private-group winner bonuses are not automatically applied because no eligible group-winner awards have been approved.
        </div>
      </CardContent>
    </Card>
  );
}

function RaffleEntryTable({ families, winners = [] }: { families: RaffleFamily[]; winners?: RaffleWinner[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
      <div className="border-b border-zinc-800 px-4 py-3 text-sm font-black uppercase tracking-wide text-zinc-300">Official weighted entry list</div>
      <div className="max-h-[28rem] overflow-auto">
        {families.map((family) => {
          const won = winners.some((winner) => winner.familyId === family.id);
          return (
            <div key={family.id} className={`grid gap-2 border-b border-zinc-800/70 px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center ${won ? "bg-emerald-500/10 opacity-60" : ""}`}>
              <div>
                <div className="font-bold text-white">{family.familyName}{won ? " • winner removed" : ""}</div>
                <div className="mt-1 text-xs text-zinc-500">Players: {family.participantNames.join(", ")}</div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-lg font-black text-amber-300">{family.totalEntries} {family.totalEntries === 1 ? "ticket" : "tickets"}</div>
                <div className="text-[11px] text-zinc-500">{family.baseEntries} player + {family.fantasyEntries} fantasy + {family.missionEntries} mission + {family.groupEntries} group</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  const raffleFamilies = useMemo(
    () => buildRaffleFamilies(rows, missionSubmissions || []),
    [rows, missionSubmissions],
  );
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
    downloadCsv(
      "hta-world-cup-entries.csv",
      rows.map((entry) => {
        const groupCodes = entry.groupCodes || [];
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
          textOptIn: entry.textOptIn ? "yes" : "no",
          confirmationTextSentAt: (entry as any).confirmationTextSentAt ? new Date((entry as any).confirmationTextSentAt).toISOString() : "",
          adminStatus: adminStatus(entry),
          source: entry.source,
          submissionId: entry._id,
        };
      })
    );
  };

  const exportRaffle = () => {
    downloadCsv(
      "hta-world-cup-final-raffle.csv",
      raffleFamilies.map((family) => ({
        familyName: family.familyName,
        players: family.participantNames.join(", "),
        basePlayerEntries: family.baseEntries,
        fantasyFiveBonusEntries: family.fantasyEntries,
        missionBonusEntries: family.missionEntries,
        privateGroupEntries: family.groupEntries,
        totalRaffleEntries: family.totalEntries,
      })),
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
            onClick={exportRaffle}
            disabled={!raffleFamilies.length}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-500/40 px-4 text-sm font-bold text-amber-100 hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export Raffle
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

      <HTAWorldCupRaffle entries={rows} missions={missionSubmissions || []} />

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
