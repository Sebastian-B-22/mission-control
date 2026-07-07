"use client";

import type React from "react";
import {
  CalendarDays,
  Car,
  CircleDollarSign,
  Clock3,
  Download,
  Map,
  MapPin,
  Mountain,
  Trees,
  Waves,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const overview = [
  { label: "Dates", value: "Jul 17-30", detail: "14 days / 13 nights" },
  { label: "Idaho", value: "5 nights", detail: "Four full lake days plus arrival" },
  { label: "Budget", value: "$2,000-$2,500", detail: "Lodging + gas target" },
  { label: "Total Drive", value: "42-46 hrs", detail: "Spread across both loops" },
];

const outbound = [
  { day: "Fri Jul 17", route: "LA to Las Vegas", drive: "4.5-5 hrs", note: "Rewards night, arcades, easy first push" },
  { day: "Sat Jul 18", route: "Las Vegas to Zion / St. George", drive: "2.5-3 hrs", note: "Short scenic leg, low-stress exploring" },
  { day: "Sun Jul 19", route: "World Cup Final + SLC / Park City", drive: "4.5-5.5 hrs", note: "Watch final first, then drive north" },
  { day: "Mon Jul 20", route: "SLC / Park City to Coeur d'Alene", drive: "9-10 hrs", note: "Biggest outbound push; arrive late" },
];

const idaho = [
  "Tue Jul 21: Lake day / settle in",
  "Wed Jul 22: Coeur d'Alene exploring",
  "Thu Jul 23: Flexible friend/family day",
  "Fri Jul 24: Lake day / local adventure",
  "Sat Jul 25: Final Idaho day",
];

const returned = [
  { day: "Sun Jul 26", route: "Coeur d'Alene to Portland", drive: "6-7 hrs", note: "Return loop begins; city break" },
  { day: "Mon Jul 27", route: "Portland to Humboldt / Redwoods", drive: "7.5-8.5 hrs", note: "Family stay, redwoods access" },
  { day: "Tue Jul 28", route: "Humboldt / Redwoods", drive: "Local", note: "Second night with Joey's niece" },
  { day: "Wed Jul 29", route: "Humboldt to Santa Cruz", drive: "6-7 hrs", note: "Arrive, sleep, no rushed Boardwalk" },
  { day: "Thu Jul 30", route: "Santa Cruz Boardwalk + drive home", drive: "5.5-6 hrs", note: "Full Boardwalk day, Joey can push home" },
];

const budget = [
  { item: "Las Vegas", range: "$0-$150", note: "Assumes rewards cover most/all lodging" },
  { item: "Zion / St. George", range: "$180-$260", note: "One practical hotel night" },
  { item: "SLC / Park City", range: "$180-$280", note: "One night after World Cup final" },
  { item: "Portland", range: "$220-$320", note: "One night, likely pricier in July" },
  { item: "Santa Cruz", range: "$450-$700", note: "Two nights near Boardwalk" },
  { item: "Gas", range: "$650-$850", note: "Toyota 4Runner estimate for the full loop" },
];

function RouteColumn({
  title,
  tone,
  icon,
  legs,
}: {
  title: string;
  tone: string;
  icon: React.ReactNode;
  legs: typeof outbound;
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className={`rounded-md p-2 ${tone}`}>{icon}</div>
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      </div>
      <div className="space-y-3">
        {legs.map((leg) => (
          <div key={leg.day} className="rounded-md border border-zinc-800 bg-black/35 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-100">{leg.day}</p>
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                {leg.drive}
              </Badge>
            </div>
            <p className="mt-1 text-sm font-medium text-zinc-200">{leg.route}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{leg.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TripsOnHorizon() {
  return (
    <div className="space-y-5">
      <Card className="border-zinc-800 bg-zinc-950 text-zinc-100">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-300">
                <Map className="h-4 w-4" />
                Idaho Summer Loop
              </div>
              <CardTitle className="text-2xl">Vegas, Zion, Idaho, Redwoods, Santa Cruz</CardTitle>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                Working review version for the July road trip. Outbound is the desert and Utah route;
                return is the Oregon, Humboldt, redwoods, and Boardwalk route.
              </p>
            </div>
            <Button asChild variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
              <a href="/idaho-road-trip-july-2026.pdf" target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                PDF
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overview.map((item) => (
              <div key={item.label} className="rounded-lg border border-zinc-800 bg-black/35 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</p>
                <p className="mt-1 text-xl font-semibold text-zinc-100">{item.value}</p>
                <p className="mt-1 text-xs text-zinc-400">{item.detail}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <RouteColumn
              title="Way There Loop"
              tone="bg-amber-500/15 text-amber-300"
              icon={<Mountain className="h-4 w-4" />}
              legs={outbound}
            />
            <RouteColumn
              title="Return Loop"
              tone="bg-emerald-500/15 text-emerald-300"
              icon={<Trees className="h-4 w-4" />}
              legs={returned}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1.25fr]">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-md bg-blue-500/15 p-2 text-blue-300">
                  <Waves className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold">Idaho Anchor</h2>
              </div>
              <div className="space-y-2">
                {idaho.map((line) => (
                  <div key={line} className="rounded-md border border-zinc-800 bg-black/35 px-3 py-2 text-sm text-zinc-300">
                    {line}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-md bg-green-500/15 p-2 text-green-300">
                  <CircleDollarSign className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold">Budget Target</h2>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {budget.map((row) => (
                  <div key={row.item} className="rounded-md border border-zinc-800 bg-black/35 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-100">{row.item}</p>
                      <p className="text-sm font-semibold text-green-300">{row.range}</p>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">{row.note}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                Food is intentionally excluded because most meals can be packed, casual, or shared with friends/family.
              </p>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-black/35 p-4">
              <Clock3 className="mt-0.5 h-4 w-4 text-amber-300" />
              <div>
                <p className="text-sm font-semibold">World Cup Final</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  July 19 should stay anchored around a watchable location before the SLC/Park City leg.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-black/35 p-4">
              <Car className="mt-0.5 h-4 w-4 text-blue-300" />
              <div>
                <p className="text-sm font-semibold">Longest Drives</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  SLC to Idaho is the biggest push. Portland to Humboldt is the other heavy leg.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-black/35 p-4">
              <MapPin className="mt-0.5 h-4 w-4 text-emerald-300" />
              <div>
                <p className="text-sm font-semibold">Santa Cruz Choice</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  Two nights makes the Boardwalk day feel like a real stop instead of a drive-by.
                </p>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
