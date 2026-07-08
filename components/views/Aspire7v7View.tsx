"use client";

import { ProjectTaskList } from "@/components/ProjectTaskList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { WorkSurfacePageHeader } from "@/components/work-surface";
import { CalendarDays, ClipboardList, ExternalLink, MapPin, Users } from "lucide-react";

interface Aspire7v7ViewProps {
  userId: Id<"users">;
}

export function Aspire7v7View({ userId }: Aspire7v7ViewProps) {
  const soccer7v7BaseUrl = "https://soccer7v7-os.vercel.app";
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
