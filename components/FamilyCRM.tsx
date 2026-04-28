"use client";

import { useMemo, useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, RefreshCw, Phone, Mail, MessageCircle, X } from "lucide-react";

type Program = "all" | "spring_league" | "camp" | "mini_camp" | "pdp";

type FamilyWithChildren = {
  _id: Id<"families">;
  _creationTime: number;
  parentFirstName: string;
  parentLastName: string;
  email: string;
  phone: string;
  lastQuoMessage?: string;
  lastQuoDate?: number;
  createdAt: number;
  updatedAt: number;
  children: Array<{
    _id: Id<"children">;
    _creationTime: number;
    familyId: Id<"families">;
    firstName: string;
    lastName: string;
    birthYear?: number;
    gender?: string;
    createdAt: number;
  }>;
  enrollmentCount: number;
  programs: string[];
  regions: string[];
};

const PROGRAM_CONFIG: Record<string, { label: string; className: string }> = {
  spring_league: { label: "Spring League", className: "bg-green-500/10 text-green-300 border-green-500/20" },
  camp: { label: "Summer Camp", className: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  mini_camp: { label: "Mini Camp", className: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
  pdp: { label: "PDP", className: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  other: { label: "Other", className: "bg-muted text-muted-foreground border-border" },
};

const REGION_CONFIG: Record<string, { label: string; className: string }> = {
  agoura: { label: "Agoura", className: "bg-red-500/10 text-red-300 border-red-500/20" },
  pali: { label: "Pali", className: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
};

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getFamilyTone(family: FamilyWithChildren) {
  const hasAgoura = family.regions.includes("agoura");
  const hasPali = family.regions.includes("pali");

  if (hasAgoura && !hasPali) {
    return "border-red-500/20 bg-red-500/[0.04] hover:border-red-400/40";
  }

  if (hasPali && !hasAgoura) {
    return "border-amber-500/20 bg-amber-500/[0.04] hover:border-amber-400/40";
  }

  return "border-border bg-background/40 hover:border-primary/40";
}

function FamilyDetailModal({ familyId, onClose }: { familyId: Id<"families"> | null; onClose: () => void }) {
  const family = useQuery(api.families.getFamily, familyId ? { id: familyId } : "skip");

  return (
    <Dialog open={!!familyId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{family ? `${family.parentFirstName} ${family.parentLastName}` : "Loading..."}</DialogTitle>
        </DialogHeader>

        {!family && (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {family && (
          <div className="space-y-5">
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</h3>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${family.email}`} className="text-primary hover:underline">{family.email}</a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{formatPhone(family.phone)}</span>
              </div>
              {family.lastQuoMessage && (
                <div className="flex items-start gap-2 text-sm pt-2 mt-2 border-t">
                  <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="italic text-muted-foreground">&ldquo;{family.lastQuoMessage}&rdquo;</p>
                    {family.lastQuoDate && <p className="text-xs text-muted-foreground mt-1">{timeAgo(family.lastQuoDate)}</p>}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Players ({family.children.length})
              </h3>
              <div className="space-y-2">
                {family.children.map((child: any) => (
                  <div key={child._id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <span className="font-medium">{child.firstName} {child.lastName}</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {child.gender && (
                          <Badge variant="outline" className={child.gender === "Girls" ? "bg-pink-500/10 text-pink-300 border-pink-500/20" : "bg-blue-500/10 text-blue-300 border-blue-500/20"}>
                            {child.gender}
                          </Badge>
                        )}
                        {child.birthYear && <Badge variant="outline">{child.birthYear}</Badge>}
                      </div>
                    </div>
                    {(child as typeof child & { enrollments?: Array<{ _id: string; program: string; region?: string; season?: string; division?: string; practiceDay?: string }> }).enrollments?.map((enr: any) => (
                      <div key={enr._id} className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className={PROGRAM_CONFIG[enr.program]?.className || PROGRAM_CONFIG.other.className}>
                          {PROGRAM_CONFIG[enr.program]?.label || enr.program}
                        </Badge>
                        {enr.region && (
                          <Badge variant="outline" className={REGION_CONFIG[enr.region]?.className || ""}>
                            {REGION_CONFIG[enr.region]?.label || enr.region}
                          </Badge>
                        )}
                        {enr.division && <Badge variant="outline">{enr.division}</Badge>}
                        {enr.practiceDay && <Badge variant="outline">{enr.practiceDay}</Badge>}
                        {enr.season && <span className="text-xs text-muted-foreground self-center">{enr.season}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FamilyCard({ family, onClick }: { family: FamilyWithChildren; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-150 hover:shadow-sm ${getFamilyTone(family)}`}
    >
      <CardContent className="p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold leading-tight">
              {family.parentFirstName} {family.parentLastName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 min-w-0">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[210px]">{family.email}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {formatPhone(family.phone)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 justify-end max-w-[45%]">
            {family.regions.map((r) => (
              <Badge key={r} variant="outline" className={REGION_CONFIG[r]?.className || ""}>
                {REGION_CONFIG[r]?.label || r}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {family.programs.map((p) => (
            <Badge key={p} variant="outline" className={PROGRAM_CONFIG[p]?.className || PROGRAM_CONFIG.other.className}>
              {PROGRAM_CONFIG[p]?.label || p}
            </Badge>
          ))}
          <Badge variant="secondary">{family.enrollmentCount} enrollments</Badge>
        </div>

        {family.children.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {family.children.map((child) => (
              <span key={child._id} className="text-xs rounded-md border bg-background/70 px-2 py-1 text-muted-foreground">
                {child.firstName}
                {child.gender ? ` · ${child.gender === "Girls" ? "G" : "B"}` : ""}
                {child.birthYear ? ` · ${child.birthYear}` : ""}
              </span>
            ))}
          </div>
        )}

        {family.lastQuoMessage ? (
          <div className="rounded-md border bg-background/60 px-2.5 py-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2">{family.lastQuoMessage}</p>
                {family.lastQuoDate && <p className="mt-1 text-[11px]">{timeAgo(family.lastQuoDate)}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <span>{family.children.length} child{family.children.length === 1 ? "" : "ren"}</span>
            <span>Open family</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FamilyCRM() {
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<Program>("all");
  const [selectedFamily, setSelectedFamily] = useState<Id<"families"> | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const families = useQuery(api.families.getFamilies) ?? [];
  const stats = useQuery(api.families.getStats);
  const syncAll = useAction(api.jotformSync.syncAll);

  const filtered = useMemo(() => {
    return families.filter((f: any) => {
      const matchesSearch =
        !search.trim() ||
        `${f.parentFirstName} ${f.parentLastName}`.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase()) ||
        f.phone.includes(search) ||
        f.children.some((c: any) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()));

      const matchesProgram = programFilter === "all" || f.programs.includes(programFilter);
      return matchesSearch && matchesProgram;
    });
  }, [families, programFilter, search]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAll({});
      setSyncResult(`Synced ${result.agoura.synced + result.pali.synced} records (Agoura: ${result.agoura.synced}, Pali: ${result.pali.synced})`);
    } catch {
      setSyncResult("Sync failed, please check the logs.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-3xl font-bold">Family CRM</h1>
            <Badge variant="outline" className="border-fuchsia-400/30 bg-fuchsia-500/12 text-fuchsia-100 px-2 py-0.5 text-[11px]">
              {stats?.totalFamilies ?? filtered.length} families
            </Badge>
          </div>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Refresh CRM"}
        </Button>
      </div>

      {syncResult && (
        <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          <span>{syncResult}</span>
          <button onClick={() => setSyncResult(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {stats && (
        <Card className="border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 shadow-[0_0_40px_rgba(245,158,11,0.04)]">
          <CardContent className="p-4 md:p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-500/28 via-violet-500/12 to-slate-950 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-100/90">Families in CRM</div>
                <div className="text-3xl font-semibold mt-2 text-white">{stats.totalFamilies}</div>
              </div>
              <div className="rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/28 via-teal-500/12 to-slate-950 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/90">Spring families</div>
                <div className="text-3xl font-semibold mt-2 text-white">{stats.springLeagueFamilies}</div>
              </div>
              <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/28 via-orange-500/12 to-slate-950 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-amber-100/90">Camp families</div>
                <div className="text-3xl font-semibold mt-2 text-white">{stats.campFamilies}</div>
              </div>
              <div className="rounded-2xl border border-orange-400/35 bg-gradient-to-br from-orange-500/28 via-red-500/12 to-slate-950 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-orange-100/90">Mini camp</div>
                <div className="text-3xl font-semibold mt-2 text-white">{stats.miniCampFamilies ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-cyan-400/35 bg-gradient-to-br from-cyan-500/26 via-sky-500/12 to-slate-950 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/90">PDP families</div>
                <div className="text-3xl font-semibold mt-2 text-white">{stats.pdpFamilies}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-background/40">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by parent name, child name, email, or phone..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "spring_league", "camp", "mini_camp", "pdp"] as Program[]).map((p) => (
                <Button key={p} size="sm" variant={programFilter === p ? "default" : "outline"} onClick={() => setProgramFilter(p)}>
                  {p === "all" ? "All" : PROGRAM_CONFIG[p]?.label || p}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{filtered.length} shown</Badge>
            <span>{search || programFilter !== "all" ? "Filtered family list" : "All families in CRM"}</span>
          </div>
        </CardContent>
      </Card>

      {families.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">No families yet</p>
              <p className="text-sm text-muted-foreground mt-1">Use the CRM refresh to pull in current Aspire family records.</p>
            </div>
            <Button onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              Refresh CRM
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((family: any) => (
            <FamilyCard key={family._id} family={family} onClick={() => setSelectedFamily(family._id)} />
          ))}
        </div>
      )}

      <FamilyDetailModal familyId={selectedFamily} onClose={() => setSelectedFamily(null)} />
    </div>
  );
}
