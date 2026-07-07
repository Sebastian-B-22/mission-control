import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const cleanupOldPlatformNames = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete old platform name entries (capitalized versions)
    const oldPlatforms = ["Math Academy", "Membean", "Rosetta Stone", "Typing.com"];
    
    let deleted = 0;
    for (const platform of oldPlatforms) {
      const entries = await ctx.db
        .query("homeschoolProgress")
        .withIndex("by_platform", (q) => q.eq("platform", platform))
        .collect();
      
      for (const entry of entries) {
        await ctx.db.delete(entry._id);
        deleted++;
      }
    }
    
    return { deleted };
  },
});

export const deleteById = mutation({
  args: { id: v.id("homeschoolProgress") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});
