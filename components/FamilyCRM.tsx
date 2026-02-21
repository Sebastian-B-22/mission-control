"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, RefreshCw, Phone, Mail, MessageCircle, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type Program = "all" | "spring_league" | "camp" | "pdp";

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

// ─── Config ───────────────────────────────────────────────────────────────

const PROGRAM_CONFIG: Record<string, { label: string; color: string }> = {
  spring_league: { label: "Spring League", color: "bg-green-100 text-green-800 border-green-200" },
  camp:          { label: "Summer Camp",   color: "bg-amber-100 text-amber-800 border-amber-200" },
  pdp:           { label: "PDP",           color: "bg-blue-100 text-blue-800 border-blue-200"    },
  other:         { label: "Other",         color: "bg-gray-100 text-gray-700 border-gray-200"    },
};

const REGION_CONFIG: Record<string, { label: string; color: string }> = {
  agoura: { label: "Agoura", color: "bg-purple-100 text-purple-800 border-purple-200" },
  pali:   { label: "Pali",   color: "bg-sky-100 text-sky-800 border-sky-200"          },
};

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
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

// ─── Family Detail Modal ──────────────────────────────────────────────────

function FamilyDetailModal({ familyId, onClose }: { familyId: Id<"families"> | null; onClose: () => void }) {
  const family = useQuery(api.families.getFamily, familyId ? { id: familyId } : "skip");

  return (
    <Dialog open={!!familyId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{family ? `${family.parentFirstName} ${family.parentLastName}` : "Loading..."}</DialogTitle>
        </DialogHeader>

        {!family && <div className="flex justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-gray-400" /></div>}

        {family && (
          <div className="space-y-5">
            {/* Contact */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</h3>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${family.email}`} className="text-blue-600 hover:underline">{family.email}</a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{formatPhone(family.phone)}</span>
              </div>
              {family.lastQuoMessage && (
                <div className="flex items-start gap-2 text-sm pt-2 mt-2 border-t border-gray-200">
                  <MessageCircle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-700 italic">&ldquo;{family.lastQuoMessage}&rdquo;</p>
                    {family.lastQuoDate && <p className="text-gray-400 text-xs mt-1">{timeAgo(family.lastQuoDate)}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Players */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Players ({family.children.length})</h3>
              <div className="space-y-2">
                {family.children.map((child) => (
                  <div key={child._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{child.firstName} {child.lastName}</span>
                      <div className="flex gap-1">
                        {child.gender && (
                          <Badge variant="outline" className={`text-xs ${child.gender === "Girls" ? "bg-pink-50 text-pink-700 border-pink-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                            {child.gender}
                          </Badge>
                        )}
                        {child.birthYear && (
                          <Badge variant="outline" className="text-xs text-gray-600">{child.birthYear}</Badge>
                        )}
                      </div>
                    </div>
                    {(child as typeof child & { enrollments?: Array<{ _id: string; program: string; region?: string; season?: string; division?: string; practiceDay?: string }> }).enrollments?.map((enr) => (
                      <div key={enr._id} className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className={`text-xs ${PROGRAM_CONFIG[enr.program]?.color || "bg-gray-100 text-gray-700"}`}>
                          {PROGRAM_CONFIG[enr.program]?.label || enr.program}
                        </Badge>
                        {enr.region && <Badge variant="outline" className={`text-xs ${REGION_CONFIG[enr.region]?.color || "bg-gray-100 text-gray-700"}`}>{REGION_CONFIG[enr.region]?.label || enr.region}</Badge>}
                        {enr.division && <Badge variant="outline" className="text-xs text-gray-600">{enr.division}</Badge>}
                        {enr.practiceDay && <Badge variant="outline" className="text-xs text-gray-500">{enr.practiceDay.charAt(0) + enr.practiceDay.slice(1).toLowerCase()}</Badge>}
                        {enr.season && <span className="text-xs text-gray-400 self-center">{enr.season}</span>}
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

// ─── Family Card ──────────────────────────────────────────────────────────

function FamilyCard({ family, onClick }: { family: FamilyWithChildren; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="border border-gray-200 hover:border-amber-300 hover:shadow-sm cursor-pointer transition-all duration-150 bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-semibold text-gray-900">{family.parentFirstName} {family.parentLastName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{family.email}</p>
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {family.programs.map((p) => (
              <Badge key={p} variant="outline" className={`text-xs ${PROGRAM_CONFIG[p]?.color || "bg-gray-100 text-gray-700"}`}>
                {PROGRAM_CONFIG[p]?.label || p}
              </Badge>
            ))}
            {family.regions.map((r) => (
              <Badge key={r} variant="outline" className={`text-xs ${REGION_CONFIG[r]?.color || "bg-gray-100 text-gray-700"}`}>
                {REGION_CONFIG[r]?.label || r}
              </Badge>
            ))}
          </div>
        </div>

        {family.children.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {family.children.map((child) => (
              <span key={child._id} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                {child.firstName}{child.gender ? ` · ${child.gender === "Girls" ? "G" : "B"}` : ""}
              </span>
            ))}
          </div>
        )}

        {family.lastQuoMessage && (
          <div className="flex items-start gap-1.5 pt-2 border-t border-gray-100">
            <MessageCircle className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 line-clamp-1 flex-1">{family.lastQuoMessage}</p>
            {family.lastQuoDate && <span className="text-xs text-gray-400 shrink-0">{timeAgo(family.lastQuoDate)}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function FamilyCRM() {
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<Program>("all");
  const [selectedFamily, setSelectedFamily] = useState<Id<"families"> | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const families = useQuery(api.families.getFamilies) ?? [];
  const stats = useQuery(api.families.getStats);
  const syncAll = useAction(api.jotformSync.syncAll);

  const filtered = families.filter((f) => {
    const matchesSearch =
      !search.trim() ||
      `${f.parentFirstName} ${f.parentLastName}`.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      f.phone.includes(search) ||
      f.children.some((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()));
    const matchesProgram = programFilter === "all" || f.programs.includes(programFilter);
    return matchesSearch && matchesProgram;
  });

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAll({});
      setSyncResult(`Synced ${result.agoura.synced + result.pali.synced} families (Agoura: ${result.agoura.synced}, Pali: ${result.pali.synced})`);
    } catch {
      setSyncResult("Sync failed - check console");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Family CRM</h1>
          <p className="text-muted-foreground mt-1">All Aspire families across Spring League, Camp, and PDP</p>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Jotform"}
        </Button>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          <span>{syncResult}</span>
          <button onClick={() => setSyncResult(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Families", value: stats.totalFamilies, icon: "👨‍👩‍👧‍👦" },
            { label: "Spring League",  value: stats.springLeagueFamilies, icon: "⚽" },
            { label: "Summer Camp",    value: stats.campFamilies, icon: "🏕️" },
            { label: "PDP",            value: stats.pdpFamilies, icon: "🏃" },
          ].map((s) => (
            <Card key={s.label} className="border border-gray-200 bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by parent name, child name, email, or phone..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "spring_league", "camp", "pdp"] as Program[]).map((p) => (
            <Button key={p} size="sm" variant={programFilter === p ? "default" : "outline"} onClick={() => setProgramFilter(p)}>
              {p === "all" ? "All" : PROGRAM_CONFIG[p]?.label || p}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {filtered.length} {filtered.length === 1 ? "family" : "families"}
        {search || programFilter !== "all" ? " matching filters" : ""}
      </p>

      {/* Grid */}
      {families.length === 0 ? (
        <Card className="border border-dashed border-gray-200">
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <Users className="h-12 w-12 text-gray-300" />
            <div>
              <p className="text-lg font-medium text-gray-600">No families yet</p>
              <p className="text-sm text-gray-400 mt-1">Click &ldquo;Sync Jotform&rdquo; to import Spring League families</p>
            </div>
            <Button onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((family) => (
            <FamilyCard key={family._id} family={family} onClick={() => setSelectedFamily(family._id)} />
          ))}
        </div>
      )}

      <FamilyDetailModal familyId={selectedFamily} onClose={() => setSelectedFamily(null)} />
    </div>
  );
}
