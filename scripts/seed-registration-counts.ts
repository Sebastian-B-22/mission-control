/**
 * Seed initial registration counts
 * Run: npx tsx scripts/seed-registration-counts.ts
 */

import { api } from "../convex/_generated/api";

const { createConvexHttpClient } = await import("./convex-target.mjs");
const convex = createConvexHttpClient();

const seedCounts = [
  { program: "spring-pali", count: 0 },
  { program: "spring-agoura", count: 0 },
  { program: "camps", count: 0 },
  { program: "pdp", count: 0 },
  { program: "7v7", count: 0 },
];

async function seed() {
  console.log("🌱 Seeding registration counts...");
  
  try {
    const result = await convex.mutation(api.registrations.bulkUpdateCounts, {
      counts: seedCounts,
    });
    
    console.log("✅ Successfully seeded registration counts:");
    console.log(JSON.stringify(result.results, null, 2));
    
    // Verify
    console.log("\n📊 Verifying...");
    const allCounts = await convex.query(api.registrations.getAllCounts);
    console.table(allCounts.map(c => ({
      Program: c.program,
      Count: c.count,
      "Last Updated": new Date(c.lastUpdated).toLocaleString(),
    })));
    
  } catch (error) {
    console.error("❌ Error seeding registration counts:", error);
    process.exit(1);
  }
}

seed().then(() => {
  console.log("\n✨ Done!");
  process.exit(0);
});
