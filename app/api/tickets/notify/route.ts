import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const TEAM_LABELS: Record<string, string> = {
  acfc: "Angel City FC",
  lafc: "LAFC",
  galaxy: "LA Galaxy",
};

function formatDate(value: string) {
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

type TicketListingForMessage = {
  team: string;
  quantity: number;
  eventDate: string;
  opponent?: string;
  seatInfo: string;
  pricePerTicket?: number;
  notes?: string;
};

function buildMessage(listing: TicketListingForMessage, publicBaseUrl: string) {
  const teamLabel = TEAM_LABELS[listing.team] || listing.team;
  const opponent = listing.opponent ? ` vs ${listing.opponent}` : "";
  const price = typeof listing.pricePerTicket === "number" ? `$${listing.pricePerTicket}/ticket` : "at cost";
  const notes = listing.notes ? ` ${listing.notes}` : "";
  const claimUrl = `${publicBaseUrl.replace(/\/$/, "")}/tickets`;

  return `Hi! Corinne has ${listing.quantity} ${teamLabel} ticket${listing.quantity === 1 ? "" : "s"} available for ${formatDate(listing.eventDate)}${opponent}. Seats: ${listing.seatInfo}. ${price}.${notes} Reply CLAIM ${listing.quantity} if you want them, or join/update preferences here: ${claimUrl}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const listingId = body?.listingId as Id<"ticketListings"> | undefined;
  const dryRun = Boolean(body?.dryRun);

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Missing Convex URL" }, { status: 500 });
  }

  const client = new ConvexHttpClient(convexUrl);
  const listing = await client.query(api.tickets.getListing, { listingId });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const contacts = await client.query(api.tickets.listContacts, { team: listing.team });
  const publicBaseUrl = process.env.TICKETS_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const message = buildMessage(listing, publicBaseUrl);

  if (dryRun) {
    return NextResponse.json({ dryRun: true, recipientCount: contacts.length, message });
  }

  const openPhoneApiKey = process.env.OPENPHONE_API_KEY;
  const openPhoneLineId = process.env.OPENPHONE_PALI_PHONE_LINE_ID;
  if (!openPhoneApiKey || !openPhoneLineId) {
    return NextResponse.json({
      error: "Missing OpenPhone env. Set OPENPHONE_API_KEY and OPENPHONE_PALI_PHONE_LINE_ID.",
      recipientCount: contacts.length,
      message,
    }, { status: 500 });
  }

  const errors: string[] = [];
  let sentCount = 0;

  for (const contact of contacts) {
    const response = await fetch("https://api.openphone.com/v1/messages", {
      method: "POST",
      headers: {
        Authorization: openPhoneApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: openPhoneLineId,
        to: [contact.phone],
        content: message,
      }),
    });

    if (response.ok) {
      sentCount += 1;
    } else {
      const text = await response.text().catch(() => "");
      errors.push(`${contact.phone}: ${response.status} ${text.slice(0, 180)}`);
    }
  }

  await client.mutation(api.tickets.recordNotificationBatch, {
    listingId,
    team: listing.team,
    recipientCount: contacts.length,
    sentCount,
    failedCount: errors.length,
    message,
    errors: errors.length ? errors : undefined,
  });

  return NextResponse.json({
    success: errors.length === 0,
    recipientCount: contacts.length,
    sentCount,
    failedCount: errors.length,
    errors,
    message,
  });
}
