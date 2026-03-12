"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import {
  BN_TRIP_MIN_PER_CHILD,
  BN_TRIP_POINTS_TARGET,
  ROBLOX_GC_POINTS_TARGET,
  clampPct,
} from "@/lib/rewardTargets";

export type ChildProfile = "roma" | "anthony";

type Props = {
  userId: Id<"users">;
};

const WORDS = {
  dragonNames: [
    "Emberwing",
    "Moonscale",
    "Stormtail",
    "Sunspark",
    "Frostflame",
    "Riverclaw",
    "Cinder",
    "Jade",
    "Aurora",
    "Ash",
  ],
  places: [
    "Jade Mountain",
    "Obsidian Cove",
    "Sky Ridge",
    "Ruby Canyon",
    "Foggy Marsh",
    "Sunlit Mesa",
    "Crystal Lake",
    "Thunder Plains",
  ],
  things: [
    "map",
    "scroll",
    "amulet",
    "torch",
    "shield",
    "bundle of berries",
    "satchel",
    "secret message",
  ],
  verbs: ["glides", "sprints", "tiptoes", "circles", "dives", "rests", "listens", "practices"],
  adjectives: ["brave", "quiet", "curious", "swift", "clever", "kind", "steady", "fearless"],
};

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePrompt() {
  // Original, simple sentences with dragon-adventure flavor (no book text).
  const templates = [
    "{name} {verb} over {place} with a {thing}.",
    "A {adj} dragon carries a {thing} to {place}.",
    "At {place}, {name} practices careful typing and calm breathing.",
    "The {adj} dragon reads a {thing} and chooses the safest path.",
    "{name} listens for clues near {place} and stays alert.",
    "A {thing} might help {name} solve the riddle at {place}.",
  ];

  const t = pick(templates);
  return t
    .replaceAll("{name}", pick(WORDS.dragonNames))
    .replaceAll("{verb}", pick(WORDS.verbs))
    .replaceAll("{place}", pick(WORDS.places))
    .replaceAll("{thing}", pick(WORDS.things))
    .replaceAll("{adj}", pick(WORDS.adjectives));
}

function formatPct(x: number) {
  return `${Math.round(x * 100)}%`;
}

export default function KidsTypingGame({ userId }: Props) {
  const [child, setChild] = useState<ChildProfile>("roma");
  const [rewardChoice, setRewardChoice] = useState<"bot" | "barnes" | "roblox">("bot");
  const [prompt, setPrompt] = useState<string>(() => generatePrompt());
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convex
  const profile = useQuery(api.typing.getProfile, { userId, child });
  const balances = useQuery(api.rewardEvents.getBalances, { userId });
  const addSession = useMutation(api.typing.addSession);

  const popConfetti = async () => {
    // Lightweight client-side confetti burst.
    const mod = await import("canvas-confetti");
    const confetti = mod.default;
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 35,
      origin: { y: 0.6 },
    });
    confetti({
      particleCount: 40,
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      origin: { y: 0.55 },
    });
  };

  const done = typed.length === prompt.length;

  const romaBn = balances?.roma?.barnes_points ?? 0;
  const anthonyBn = balances?.anthony?.barnes_points ?? 0;
  const familyBnPoints = romaBn + anthonyBn;

  const familyBnPct = clampPct(familyBnPoints / BN_TRIP_POINTS_TARGET);
  const bnRomaPctToMin = clampPct(romaBn / BN_TRIP_MIN_PER_CHILD);
  const bnAnthonyPctToMin = clampPct(anthonyBn / BN_TRIP_MIN_PER_CHILD);
  const bnTripUnlocked = romaBn >= BN_TRIP_MIN_PER_CHILD && anthonyBn >= BN_TRIP_MIN_PER_CHILD;

  const childRobloxPoints = balances?.[child]?.roblox_points ?? 0;
  const childRobloxPct = clampPct(childRobloxPoints / ROBLOX_GC_POINTS_TARGET);

  const { correctChars, accuracy } = useMemo(() => {
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === prompt[i]) correct++;
    }
    const acc = typed.length === 0 ? 0 : correct / typed.length;
    return { correctChars: correct, accuracy: acc };
  }, [typed, prompt]);

  const wpm = useMemo(() => {
    if (!startedAt) return 0;
    const end = finishedAt ?? Date.now();
    const minutes = Math.max(0.001, (end - startedAt) / 60000);
    return Math.round(((correctChars / 5) / minutes) * 10) / 10;
  }, [startedAt, finishedAt, correctChars]);

  // Auto-focus the hidden input (iPad + keyboard)
  useEffect(() => {
    inputRef.current?.focus();
  }, [child, prompt]);

  // When finished, post to backend once.
  useEffect(() => {
    const run = async () => {
      if (!done) return;
      if (!startedAt) return;
      if (finishedAt) return;

      const finished = Date.now();
      setFinishedAt(finished);

      try {
        const res = await addSession({
          userId,
          child,
          rewardChoice,
          prompt,
          wpm,
          accuracy,
        });

        const granted =
          (res?.rewardsGranted?.bonus_bot_minutes ?? 0) +
          (res?.rewardsGranted?.barnes_points ?? 0) +
          (res?.rewardsGranted?.roblox_points ?? 0);

        if (granted > 0) {
          await popConfetti();
        }
      } catch (e) {
        console.error(e);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const reset = () => {
    setTyped("");
    setStartedAt(null);
    setFinishedAt(null);
    setPrompt(generatePrompt());
    // focus after state updates
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") return;

    // Keep focus on input, and prevent iPad browser shortcuts.
    if (e.key === "Escape") {
      e.preventDefault();
      reset();
      return;
    }

    if (done) {
      if (e.key === "Enter") {
        e.preventDefault();
        reset();
      }
      return;
    }

    if (!startedAt && e.key.length === 1) {
      setStartedAt(Date.now());
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      setTyped((t) => t.slice(0, -1));
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      setTyped((t) => (t.length < prompt.length ? t + e.key : t));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={child === "roma" ? "default" : "outline"}
            onClick={() => {
              setChild("roma");
              reset();
            }}
          >
            Roma
          </Button>
          <Button
            variant={child === "anthony" ? "default" : "outline"}
            onClick={() => {
              setChild("anthony");
              reset();
            }}
          >
            Anthony
          </Button>

          <div className="ml-2 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Reward this session:</span>
              <Button
                size="sm"
                variant={rewardChoice === "bot" ? "default" : "outline"}
                onClick={() => setRewardChoice("bot")}
              >
                Bot
              </Button>
              <Button
                size="sm"
                variant={rewardChoice === "barnes" ? "default" : "outline"}
                onClick={() => setRewardChoice("barnes")}
              >
                B&N
              </Button>
              <Button
                size="sm"
                variant={rewardChoice === "roblox" ? "default" : "outline"}
                onClick={() => setRewardChoice("roblox")}
              >
                Roblox
              </Button>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Bot: +5 min / 250 XP · B&N: +10 pts / 500 XP · Roblox: +25 pts / 500 XP
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>XP: {profile?.totalXp ?? 0}</span>
          <span>Best WPM: {profile?.bestWpm?.toFixed(1) ?? "-"}</span>
          <span>Best Acc: {profile?.bestAccuracy !== undefined ? formatPct(profile.bestAccuracy) : "-"}</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Wings Typing - Dragon Training</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tip: press <span className="font-mono">Enter</span> for next sentence when finished. <span className="font-mono">Esc</span> resets.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-lg border bg-black/20 p-4"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="text-3xl leading-relaxed tracking-wide">
              {prompt.split("").map((ch, i) => {
                const typedCh = typed[i];
                const isTyped = typedCh !== undefined;
                const ok = isTyped && typedCh === ch;
                const bad = isTyped && typedCh !== ch;
                return (
                  <span
                    key={i}
                    className={cn(
                      "whitespace-pre-wrap",
                      ok && "text-green-400",
                      bad && "text-red-400 underline",
                      !isTyped && "text-gray-300"
                    )}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
            <input
              ref={inputRef}
              className="absolute -left-[9999px] opacity-0"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={onKeyDown}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">WPM</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{wpm.toFixed(1)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Accuracy</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{formatPct(accuracy)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Progress</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {typed.length}/{prompt.length}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={reset} variant="outline">
              New sentence
            </Button>
            <Button onClick={() => inputRef.current?.focus()}>
              Focus keyboard
            </Button>
            {done && (
              <span className="ml-2 text-green-400 font-semibold">Nice! Press Enter for the next one.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Rewards (unredeemed)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <div className="font-semibold text-foreground">B&N trip (family)</div>
              <div className="text-muted-foreground">
                {familyBnPoints}/{BN_TRIP_POINTS_TARGET} pts
              </div>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Unlock rule: Roma ≥ {BN_TRIP_MIN_PER_CHILD} AND Anthony ≥ {BN_TRIP_MIN_PER_CHILD}
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={bnTripUnlocked ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-amber-500"}
                style={{ width: `${Math.round(familyBnPct * 100)}%` }}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
                  <span>Roma</span>
                  <span>
                    {romaBn}/{BN_TRIP_MIN_PER_CHILD}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round(bnRomaPctToMin * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
                  <span>Anthony</span>
                  <span>
                    {anthonyBn}/{BN_TRIP_MIN_PER_CHILD}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round(bnAnthonyPctToMin * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <div className="font-semibold text-foreground">Roblox gift card ({child})</div>
              <div className="text-muted-foreground">
                {childRobloxPoints}/{ROBLOX_GC_POINTS_TARGET} pts
              </div>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.round(childRobloxPct * 100)}%` }} />
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              <span className="font-semibold text-foreground">Roma</span>: {balances?.roma?.bonus_bot_minutes ?? 0} bot minutes, {balances?.roma?.barnes_points ?? 0} B&N points, {balances?.roma?.roblox_points ?? 0} Roblox points
            </div>
            <div>
              <span className="font-semibold text-foreground">Anthony</span>: {balances?.anthony?.bonus_bot_minutes ?? 0} bot minutes, {balances?.anthony?.barnes_points ?? 0} B&N points, {balances?.anthony?.roblox_points ?? 0} Roblox points
            </div>
          </div>

          <div>
            <a className="underline text-sm text-muted-foreground" href="/kids/rewards">Open rewards panel</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
