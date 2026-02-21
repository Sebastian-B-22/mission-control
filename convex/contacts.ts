import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ─── Helper ───────────────────────────────────────────────────────────────

async function getUserId(ctx: { db: { query: Function } }, clerkId: string): Promise<Id<"users"> | null> {
  const user = await ctx.db.query("users").withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId)).first();
  return user?._id ?? null;
}

// ─── Queries ──────────────────────────────────────────────────────────────

/** List all contacts for the current user, sorted by last contact (oldest first) */
export const list = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.clerkId);
    if (!userId) return [];
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    return contacts.sort((a: any, b: any) => {
      // Null lastContactDate goes to top (needs contact)
      if (!a.lastContactDate && !b.lastContactDate) return b.createdAt - a.createdAt;
      if (!a.lastContactDate) return -1;
      if (!b.lastContactDate) return 1;
      return a.lastContactDate - b.lastContactDate; // oldest contact first
    });
  },
});

/** Get a single contact by ID */
export const get = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Get contacts due for outreach: has nextAction set, or hasn't been contacted in 30+ days, or has upcoming occasion */
export const getDueForOutreach = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.clerkId);
    if (!userId) return [];
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    // Check if an occasion (MM-DD) is coming up in next 14 days
    function isOccasionSoon(dateStr: string): boolean {
      const [month, day] = dateStr.split("-").map(Number);
      const today = new Date();
      const thisYear = today.getFullYear();
      let occasion = new Date(thisYear, month - 1, day);
      if (occasion.getTime() < today.getTime() - 86400000) {
        occasion = new Date(thisYear + 1, month - 1, day);
      }
      return occasion.getTime() - today.getTime() <= fourteenDaysMs;
    }

    return contacts
      .filter((c: any) => {
        if (c.nextAction && c.nextAction !== "nothing") return true;
        if (!c.lastContactDate || c.lastContactDate < thirtyDaysAgo) return true;
        if (c.birthday && isOccasionSoon(c.birthday)) return true;
        if (c.occasions?.some((o: any) => isOccasionSoon(o.date))) return true;
        return false;
      })
      .sort((a: any, b: any) => {
        // Priority: high > medium > low > undefined
        const pMap: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const pa = pMap[a.priority ?? "low"] ?? 2;
        const pb = pMap[b.priority ?? "low"] ?? 2;
        if (pa !== pb) return pa - pb;
        // Then oldest contact first
        if (!a.lastContactDate) return -1;
        if (!b.lastContactDate) return 1;
        return a.lastContactDate - b.lastContactDate;
      });
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

/** Create a new contact */
export const create = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    relationship: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    birthday: v.optional(v.string()),
    keyFacts: v.optional(v.string()),
    memories: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    nextActionNote: v.optional(v.string()),
    occasions: v.optional(v.array(v.object({ name: v.string(), date: v.string() }))),
    priority: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.clerkId);
    if (!userId) throw new Error("User not found");
    const now = Date.now();
    return await ctx.db.insert("contacts", {
      userId,
      name: args.name,
      relationship: args.relationship,
      phone: args.phone,
      email: args.email,
      birthday: args.birthday,
      keyFacts: args.keyFacts,
      memories: args.memories,
      nextAction: args.nextAction,
      nextActionNote: args.nextActionNote,
      occasions: args.occasions,
      priority: args.priority,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Update a contact's fields */
export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.optional(v.string()),
    relationship: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    birthday: v.optional(v.string()),
    keyFacts: v.optional(v.string()),
    memories: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    nextActionNote: v.optional(v.string()),
    occasions: v.optional(v.array(v.object({ name: v.string(), date: v.string() }))),
    priority: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Log a contact interaction - updates last contact info and clears nextAction */
export const logContact = mutation({
  args: {
    id: v.id("contacts"),
    method: v.string(), // "voice-text" | "call" | "text" | "in-person" | "card" | "gift"
    note: v.optional(v.string()),
    clearNextAction: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      lastContactDate: Date.now(),
      lastContactMethod: args.method,
      updatedAt: Date.now(),
    };
    if (args.note) patch.lastContactNote = args.note;
    if (args.clearNextAction !== false) patch.nextAction = "nothing";
    await ctx.db.patch(args.id, patch);
  },
});

/** Remove a contact */
export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
