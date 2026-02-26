/**
 * Seed initial registration counts
 * Run: node scripts/seed-registration-counts.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env.local') });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not set in .env.local");
  process.exit(1);
}

const convex = new ConvexHttpClient(convexUrl);

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
    // Import api - we need to dynamically import the generated API
    const { api } = await import("../convex/_generated/api.js");
    
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
