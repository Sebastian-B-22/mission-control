import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const TEAM = v.union(v.literal("acfc"), v.literal("lafc"), v.literal("galaxy"));
const LISTING_STATUS = v.union(v.literal("draft"), v.literal("available"), v.literal("claimed"), v.literal("sold"), v.literal("archived"));
const CLAIM_STATUS = v.union(v.literal("new"), v.literal("confirmed"), v.literal("declined"), v.literal("fulfilled"));

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return phone.trim();
}

export const joinInterestList = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    teams: v.array(TEAM),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const phone = normalizePhone(args.phone);
    const email = args.email?.trim() || undefined;
    const teams = Array.from(new Set(args.teams));

    if (!args.name.trim()) throw new Error("Name is required");
    if (!phone || phone.replace(/\D/g, "").length < 10) throw new Error("A valid phone number is required");
    if (teams.length === 0) throw new Error("Pick at least one team");

    const existing = await ctx.db
      .query("ticketContacts")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();

    if (existing) {
      const mergedTeams = Array.from(new Set([...(existing.teams || []), ...teams]));
      await ctx.db.patch(existing._id, {
        name: args.name.trim(),
        email,
        teams: mergedTeams,
        optedOut: false,
        updatedAt: now,
      });
      return { id: existing._id, updated: true };
    }

    const id = await ctx.db.insert("ticketContacts", {
      name: args.name.trim(),
      phone,
      email,
      teams,
      source: args.source || "public-form",
      optedOut: false,
      createdAt: now,
      updatedAt: now,
    });

    return { id, updated: false };
  },
});

export const listContacts = query({
  args: { team: v.optional(TEAM), includeOptedOut: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let contacts = await ctx.db.query("ticketContacts").collect();
    if (args.team) contacts = contacts.filter((contact) => contact.teams.includes(args.team!));
    if (!args.includeOptedOut) contacts = contacts.filter((contact) => !contact.optedOut);
    return contacts.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getListing = query({
  args: { listingId: v.id("ticketListings") },
  handler: async (ctx, args) => ctx.db.get(args.listingId),
});

export const listListings = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let listings = await ctx.db.query("ticketListings").collect();
    if (!args.includeArchived) listings = listings.filter((listing) => listing.status !== "archived");
    return listings.sort((a, b) => {
      if (a.eventDate !== b.eventDate) return a.eventDate.localeCompare(b.eventDate);
      return b.updatedAt - a.updatedAt;
    });
  },
});

export const createListing = mutation({
  args: {
    team: TEAM,
    eventDate: v.string(),
    opponent: v.optional(v.string()),
    seatInfo: v.string(),
    quantity: v.number(),
    pricePerTicket: v.optional(v.number()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.optional(LISTING_STATUS),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (!args.eventDate) throw new Error("Event date is required");
    if (!args.seatInfo.trim()) throw new Error("Seat info is required");
    if (args.quantity < 1) throw new Error("Quantity must be at least 1");

    return await ctx.db.insert("ticketListings", {
      team: args.team,
      eventDate: args.eventDate,
      opponent: args.opponent?.trim() || undefined,
      seatInfo: args.seatInfo.trim(),
      quantity: args.quantity,
      pricePerTicket: args.pricePerTicket,
      notes: args.notes?.trim() || undefined,
      imageUrl: args.imageUrl?.trim() || undefined,
      status: args.status || "available",
      createdAt: now,
      updatedAt: now,
      notifiedAt: undefined,
    });
  },
});

export const updateListingStatus = mutation({
  args: { listingId: v.id("ticketListings"), status: LISTING_STATUS },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.listingId, { status: args.status, updatedAt: Date.now() });
    return { success: true };
  },
});

export const createClaim = mutation({
  args: {
    listingId: v.id("ticketListings"),
    contactId: v.optional(v.id("ticketContacts")),
    name: v.string(),
    phone: v.string(),
    quantity: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const phone = normalizePhone(args.phone);
    if (args.quantity < 1) throw new Error("Quantity must be at least 1");

    return await ctx.db.insert("ticketClaims", {
      listingId: args.listingId,
      contactId: args.contactId,
      name: args.name.trim(),
      phone,
      quantity: args.quantity,
      note: args.note?.trim() || undefined,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listClaims = query({
  args: { listingId: v.optional(v.id("ticketListings")) },
  handler: async (ctx, args) => {
    let claims = await ctx.db.query("ticketClaims").collect();
    if (args.listingId) claims = claims.filter((claim) => claim.listingId === args.listingId);

    const enriched = await Promise.all(
      claims.map(async (claim) => ({
        ...claim,
        listing: await ctx.db.get(claim.listingId),
      }))
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const updateClaimStatus = mutation({
  args: { claimId: v.id("ticketClaims"), status: CLAIM_STATUS },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.claimId, { status: args.status, updatedAt: Date.now() });
    return { success: true };
  },
});

export const recordNotificationBatch = mutation({
  args: {
    listingId: v.id("ticketListings"),
    team: TEAM,
    recipientCount: v.number(),
    sentCount: v.number(),
    failedCount: v.number(),
    message: v.string(),
    errors: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("ticketNotificationBatches", {
      listingId: args.listingId,
      team: args.team,
      recipientCount: args.recipientCount,
      sentCount: args.sentCount,
      failedCount: args.failedCount,
      message: args.message,
      errors: args.errors,
      createdAt: now,
    });
    await ctx.db.patch(args.listingId, { notifiedAt: now, updatedAt: now });
    return id;
  },
});

export const listNotificationBatches = query({
  args: { listingId: v.optional(v.id("ticketListings")) },
  handler: async (ctx, args) => {
    let batches = await ctx.db.query("ticketNotificationBatches").collect();
    if (args.listingId) batches = batches.filter((batch) => batch.listingId === args.listingId);
    return batches.sort((a, b) => b.createdAt - a.createdAt);
  },
});
