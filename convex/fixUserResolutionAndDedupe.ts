import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listUsersByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .collect();
  },
});

export const repointClerkIdToUserByRawId = mutation({
  args: {
    clerkId: v.string(),
    targetRawUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .collect();

    const target = users.find((u) => String(u._id) === args.targetRawUserId);
    if (!target) {
      throw new Error("Target user not found for this clerkId");
    }

    let cleared = 0;
    for (const user of users) {
      if (String(user._id) === args.targetRawUserId) continue;
      await ctx.db.patch(user._id, { clerkId: `${user.clerkId}__legacy__${String(user._id)}` });
      cleared++;
    }

    await ctx.db.patch(target._id, { clerkId: args.clerkId });

    return {
      success: true,
      targetUserId: String(target._id),
      cleared,
      remainingUsersForClerkId: 1,
    };
  },
});

export const dedupeRpmCategoriesForUserRaw = mutation({
  args: { userRawId: v.string() },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("rpmCategories")
      .withIndex("by_user", (q) => q.eq("userId", args.userRawId as any))
      .collect();

    const groups = new Map<string, typeof categories>();
    for (const category of categories) {
      const key = `${category.type}::${category.name.trim().toLowerCase()}`;
      const arr = groups.get(key) ?? [];
      arr.push(category);
      groups.set(key, arr);
    }

    let deleted = 0;
    const groupsList = Array.from(groups.values());
    for (const group of groupsList) {
      if (group.length <= 1) continue;

      group.sort((a, b) => {
        const aScore = (a.purpose ? 2 : 0) + ((a.monthlyFocus?.length ?? 0) > 0 ? 1 : 0) + ((a.yearlyGoals?.length ?? 0) > 0 ? 1 : 0);
        const bScore = (b.purpose ? 2 : 0) + ((b.monthlyFocus?.length ?? 0) > 0 ? 1 : 0) + ((b.yearlyGoals?.length ?? 0) > 0 ? 1 : 0);
        if (bScore !== aScore) return bScore - aScore;
        return (a._creationTime ?? 0) - (b._creationTime ?? 0);
      });

      for (const duplicate of group.slice(1)) {
        await ctx.db.delete(duplicate._id);
        deleted++;
      }
    }

    return { success: true, deleted, kept: categories.length - deleted };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INVESTIGATION QUERIES - Check data ownership before migration
// ─────────────────────────────────────────────────────────────────────────────

export const investigateDataOwnership = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    const results: Record<string, Record<string, number>> = {};
    
    // Tables with userId field that need investigation
    const tables = [
      "rpmCategories",
      "teamMembers",
      "habitTemplates",
      "bookLibrary",
      "sebastianTasks",
      "familyMeetings",
      "movieLibrary",
      "dailyHealth",
      "calendarEvents",
    ] as const;
    
    for (const table of tables) {
      results[table] = {};
      const records = await ctx.db.query(table as any).collect();
      for (const record of records) {
        const uid = String((record as any).userId);
        results[table][uid] = (results[table][uid] || 0) + 1;
      }
    }
    
    return {
      users: users.map(u => ({
        id: String(u._id),
        clerkId: u.clerkId,
        email: u.email,
        name: u.name,
      })),
      tableCounts: results,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// REBIND MUTATION - Migrate records from old user to new user
// ─────────────────────────────────────────────────────────────────────────────

export const rebindDataToNewUser = mutation({
  args: {
    oldUserId: v.string(),
    newUserId: v.string(),
    tables: v.array(v.string()),
    dryRun: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { oldUserId, newUserId, tables, dryRun } = args;
    
    const results: Record<string, { found: number; updated: number }> = {};
    
    for (const tableName of tables) {
      results[tableName] = { found: 0, updated: 0 };
      
      const records = await ctx.db.query(tableName as any).collect();
      
      for (const record of records) {
        if (String((record as any).userId) === oldUserId) {
          results[tableName].found++;
          
          if (!dryRun) {
            await ctx.db.patch(record._id, { userId: newUserId as any });
            results[tableName].updated++;
          }
        }
      }
    }
    
    return {
      success: true,
      dryRun,
      oldUserId,
      newUserId,
      results,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE DUPLICATE RECORDS (after rebind creates dupes in rpmCategories etc)
// ─────────────────────────────────────────────────────────────────────────────

export const cleanupDuplicatesByUser = mutation({
  args: {
    userId: v.string(),
    table: v.string(),
    dedupKeyFields: v.array(v.string()), // e.g. ["name", "type"] for rpmCategories
  },
  handler: async (ctx, { userId, table, dedupKeyFields }) => {
    const records = await ctx.db.query(table as any).collect();
    const userRecords = records.filter((r: any) => String(r.userId) === userId);
    
    // Group by dedup key
    const groups = new Map<string, typeof userRecords>();
    for (const record of userRecords) {
      const key = dedupKeyFields.map(f => String((record as any)[f] ?? "").toLowerCase().trim()).join("::");
      const arr = groups.get(key) ?? [];
      arr.push(record);
      groups.set(key, arr);
    }
    
    let deleted = 0;
    const groupsArray = Array.from(groups.values());
    for (const group of groupsArray) {
      if (group.length <= 1) continue;
      
      // Keep newest (highest _creationTime)
      group.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
      
      for (const dupe of group.slice(1)) {
        await ctx.db.delete(dupe._id);
        deleted++;
      }
    }
    
    return { success: true, deleted, kept: userRecords.length - deleted };
  },
});
