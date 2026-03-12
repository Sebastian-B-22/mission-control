"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import {
  BN_TRIP_POINTS_TARGET,
  ROBLOX_GC_POINTS_TARGET,
  clampPct,
} from "@/lib/rewardTargets";

type Child = "roma" | "anthony";

export default function KidsRewardsPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [child, setChild] = useState<Child>("roma");

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const balances = useQuery(
    api.rewardEvents.getBalances,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const events = useQuery(
    api.rewardEvents.listUnredeemed,
    convexUser ? { userId: convexUser._id, child } : "skip"
  );

  const redeemEvent = useMutation(api.rewardEvents.redeemEvent);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) router.push("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  const totals = useMemo(() => {
    if (!balances) return null;
    return balances[child];
  }, [balances, child]);

  const familyBnPoints = (balances?.roma?.barnes_points ?? 0) + (balances?.anthony?.barnes_points ?? 0);
  const familyBnPct = clampPct(familyBnPoints / BN_TRIP_POINTS_TARGET);

  const childRobloxPoints = totals?.roblox_points ?? 0;
  const childRobloxPct = clampPct(childRobloxPoints / ROBLOX_GC_POINTS_TARGET);

  if (!isLoaded || (isSignedIn && convexUser === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  if (!isSignedIn) return null;
  if (!convexUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Setting up user...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mx-auto max-w-4xl mb-4 flex items-center justify-between">
        <a className="underline text-sm text-muted-foreground" href="/kids/typing">
          ← Back to typing
        </a>
        <div className="flex items-center gap-2">
          <Button variant={child === "roma" ? "default" : "outline"} onClick={() => setChild("roma")}>
            Roma
          </Button>
          <Button variant={child === "anthony" ? "default" : "outline"} onClick={() => setChild("anthony")}>
            Anthony
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-4">
        <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-950 to-indigo-950/40">
          <div className="relative h-[140px] w-full">
            <Image
              src="/kids/rewards-banner.svg"
              alt="Rewards Vault"
              fill
              className="object-cover"
              priority
            />
          </div>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">
              Rates: Bot +5 min / 250 XP · B&N +10 pts / 500 XP · Roblox +25 pts / 500 XP
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-semibold">B&N trip (family)</div>
                <div className="text-sm text-muted-foreground">
                  {familyBnPoints}/{BN_TRIP_POINTS_TARGET} pts
                </div>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.round(familyBnPct * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Roma: {balances?.roma?.barnes_points ?? 0} pts · Anthony: {balances?.anthony?.barnes_points ?? 0} pts
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-semibold">Roblox gift card ({child})</div>
                <div className="text-sm text-muted-foreground">
                  {childRobloxPoints}/{ROBLOX_GC_POINTS_TARGET} pts
                </div>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.round(childRobloxPct * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Reward balances - {child}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <div>Bonus bot minutes: {totals?.bonus_bot_minutes ?? 0}</div>
            <div>B&N points: {totals?.barnes_points ?? 0}</div>
            <div>Roblox points: {totals?.roblox_points ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Unredeemed events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events && events.length === 0 && (
              <p className="text-sm text-muted-foreground">No unredeemed rewards yet.</p>
            )}

            {events?.map((ev) => (
              <div key={ev._id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="font-semibold">{ev.rewardType} +{ev.amount}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(ev.createdAt).toLocaleString()}
                    {ev.note ? ` - ${ev.note}` : ""}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await redeemEvent({ eventId: ev._id });
                  }}
                >
                  Mark redeemed
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
