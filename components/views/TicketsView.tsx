"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Ticket, Users } from "lucide-react";

const TEAMS = [
  { id: "acfc", label: "Angel City FC", short: "ACFC" },
  { id: "lafc", label: "LAFC", short: "LAFC" },
  { id: "galaxy", label: "LA Galaxy", short: "Galaxy" },
] as const;

type Team = (typeof TEAMS)[number]["id"];
type ListingStatus = "draft" | "available" | "claimed" | "sold" | "archived";
type ClaimStatus = "new" | "confirmed" | "declined" | "fulfilled";
type TicketClaimWithListing = Doc<"ticketClaims"> & { listing: Doc<"ticketListings"> | null };

function teamLabel(team: string) {
  return TEAMS.find((item) => item.id === team)?.label || team;
}

function formatDate(value: string) {
  if (!value) return "No date";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function TicketsView() {
  const contactsQuery = useQuery(api.tickets.listContacts, {});
  const listingsQuery = useQuery(api.tickets.listListings, { includeArchived: false });
  const claimsQuery = useQuery(api.tickets.listClaims, {});
  const batchesQuery = useQuery(api.tickets.listNotificationBatches, {});
  const contacts = useMemo(() => contactsQuery || [], [contactsQuery]);
  const listings = useMemo(() => listingsQuery || [], [listingsQuery]);
  const claims = useMemo(() => (claimsQuery || []) as TicketClaimWithListing[], [claimsQuery]);
  const batches = useMemo(() => batchesQuery || [], [batchesQuery]);
  const createListing = useMutation(api.tickets.createListing);
  const updateListingStatus = useMutation(api.tickets.updateListingStatus);
  const updateClaimStatus = useMutation(api.tickets.updateClaimStatus);

  const [team, setTeam] = useState<Team>("acfc");
  const [eventDate, setEventDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [seatInfo, setSeatInfo] = useState("");
  const [quantity, setQuantity] = useState("2");
  const [pricePerTicket, setPricePerTicket] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [notifyPreview, setNotifyPreview] = useState<Record<string, string>>({});
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  const countsByTeam = useMemo(() => {
    return Object.fromEntries(
      TEAMS.map((item) => [item.id, contacts.filter((contact) => contact.teams?.includes(item.id)).length])
    ) as Record<Team, number>;
  }, [contacts]);

  const claimsByListing = useMemo(() => {
    const map: Record<string, number> = {};
    for (const claim of claims) {
      map[claim.listingId] = (map[claim.listingId] || 0) + 1;
    }
    return map;
  }, [claims]);

  const handleCreateListing = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      await createListing({
        team,
        eventDate,
        opponent: opponent.trim() || undefined,
        seatInfo,
        quantity: Number(quantity) || 1,
        pricePerTicket: pricePerTicket ? Number(pricePerTicket) : undefined,
        notes: notes.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        status: "available",
      });
      setNotice("Ticket listing saved.");
      setEventDate("");
      setOpponent("");
      setSeatInfo("");
      setQuantity("2");
      setPricePerTicket("");
      setNotes("");
      setImageUrl("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save listing.");
    } finally {
      setSaving(false);
    }
  };

  const notifyListing = async (listingId: Id<"ticketListings">, dryRun: boolean) => {
    setNotifyingId(listingId);
    setNotice("");

    try {
      const response = await fetch("/api/tickets/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, dryRun }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Notification failed");

      if (dryRun) {
        setNotifyPreview((current) => ({
          ...current,
          [listingId]: `${data.recipientCount} recipients\n\n${data.message}`,
        }));
      } else {
        setNotice(`Sent ${data.sentCount}/${data.recipientCount} texts.`);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Notification failed.");
    } finally {
      setNotifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-amber-300/80">Private tool</p>
          <h2 className="text-3xl font-black text-white">Soccer Tickets</h2>
          <p className="text-sm text-zinc-400">Build opt-in lists, add available tickets, and text only the right people.</p>
        </div>
        <Button asChild className="bg-amber-500 font-bold text-black hover:bg-amber-400">
          <a href="/tickets" target="_blank" rel="noreferrer">Open public form</a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TEAMS.map((item) => (
          <Card key={item.id} className="border-zinc-800 bg-zinc-950 text-zinc-50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-zinc-400"><Users className="h-4 w-4" /> {item.short} list</CardDescription>
              <CardTitle className="text-3xl">{countsByTeam[item.id]}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="border-zinc-800 bg-zinc-950 text-zinc-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-amber-300" /> Add tickets</CardTitle>
            <CardDescription className="text-zinc-400">This does not text anyone until you press notify.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={team} onValueChange={(value) => setTeam(value as Team)}>
                  <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="border-zinc-700 bg-zinc-900" required />
              </div>

              <div className="space-y-2">
                <Label>Opponent / event</Label>
                <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="San Diego Wave" className="border-zinc-700 bg-zinc-900" />
              </div>

              <div className="space-y-2">
                <Label>Seats</Label>
                <Input value={seatInfo} onChange={(e) => setSeatInfo(e.target.value)} placeholder="Section 123, Row B" className="border-zinc-700 bg-zinc-900" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Qty</Label>
                  <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="border-zinc-700 bg-zinc-900" />
                </div>
                <div className="space-y-2">
                  <Label>Price each</Label>
                  <Input type="number" min="0" value={pricePerTicket} onChange={(e) => setPricePerTicket(e.target.value)} placeholder="optional" className="border-zinc-700 bg-zinc-900" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photo URL</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="optional screenshot/link" className="border-zinc-700 bg-zinc-900" />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Parking, transfer details, deadline..." className="border-zinc-700 bg-zinc-900" />
              </div>

              {notice ? <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-200">{notice}</p> : null}

              <Button type="submit" disabled={saving} className="w-full bg-amber-500 font-bold text-black hover:bg-amber-400">
                {saving ? "Saving..." : "Save listing"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-950 text-zinc-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-amber-300" /> Current listings</CardTitle>
              <CardDescription className="text-zinc-400">Preview the text before sending. Sending uses the Pali Quo/OpenPhone line.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {listings.length === 0 ? <p className="text-sm text-zinc-500">No ticket listings yet.</p> : null}

              {listings.map((listing) => (
                <div key={listing._id} className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className="bg-amber-500/15 text-amber-100">{teamLabel(listing.team)}</Badge>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-300">{listing.status}</Badge>
                        {claimsByListing[listing._id] ? <Badge className="bg-emerald-500/15 text-emerald-100">{claimsByListing[listing._id]} claim(s)</Badge> : null}
                      </div>
                      <h3 className="text-lg font-bold text-white">{formatDate(listing.eventDate)}{listing.opponent ? ` vs ${listing.opponent}` : ""}</h3>
                      <p className="text-sm text-zinc-300">{listing.quantity} ticket(s) - {listing.seatInfo}</p>
                      <p className="text-sm text-zinc-400">{typeof listing.pricePerTicket === "number" ? `$${listing.pricePerTicket}/ticket` : "At cost / TBD"}</p>
                      {listing.notes ? <p className="mt-2 text-sm text-zinc-400">{listing.notes}</p> : null}
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button size="sm" variant="outline" disabled={notifyingId === listing._id} onClick={() => notifyListing(listing._id, true)}>
                        Preview text
                      </Button>
                      <Button size="sm" className="bg-amber-500 text-black hover:bg-amber-400" disabled={notifyingId === listing._id} onClick={() => notifyListing(listing._id, false)}>
                        Text {countsByTeam[listing.team as Team] || 0}
                      </Button>
                      <Select value={listing.status} onValueChange={(value) => updateListingStatus({ listingId: listing._id, status: value as ListingStatus })}>
                        <SelectTrigger className="h-9 w-32 border-zinc-700 bg-zinc-950"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["available", "claimed", "sold", "archived"] as ListingStatus[]).map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {notifyPreview[listing._id] ? (
                    <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-black/50 p-3 text-xs text-zinc-300">{notifyPreview[listing._id]}</pre>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950 text-zinc-50">
            <CardHeader>
              <CardTitle>Recent claims</CardTitle>
              <CardDescription className="text-zinc-400">Manual queue for replies/claims. Auto-reply parsing can come next.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {claims.length === 0 ? <p className="text-sm text-zinc-500">No claims yet.</p> : null}
              {claims.slice(0, 8).map((claim) => (
                <div key={claim._id} className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{claim.name} - {claim.quantity} ticket(s)</p>
                    <p className="text-xs text-zinc-400">{claim.phone} · {claim.listing ? `${teamLabel(claim.listing.team)} ${formatDate(claim.listing.eventDate)}` : "listing missing"}</p>
                  </div>
                  <Select value={claim.status} onValueChange={(value) => updateClaimStatus({ claimId: claim._id, status: value as ClaimStatus })}>
                    <SelectTrigger className="h-9 w-36 border-zinc-700 bg-zinc-950"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["new", "confirmed", "declined", "fulfilled"] as const).map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950 text-zinc-50">
            <CardHeader>
              <CardTitle>Notification history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {batches.slice(0, 6).map((batch) => (
                <div key={batch._id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-300">
                  {teamLabel(batch.team)} - sent {batch.sentCount}/{batch.recipientCount} - {new Date(batch.createdAt).toLocaleString()}
                </div>
              ))}
              {batches.length === 0 ? <p className="text-sm text-zinc-500">No texts sent yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
