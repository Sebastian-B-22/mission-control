#!/usr/bin/env node
/**
 * Mission Control Schedule Health Check
 * 
 * Runs monthly to detect duplicate schedule entries before they become a problem.
 * Reports findings but doesn't auto-delete (requires human approval).
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = "https://harmless-salamander-44.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🏥 Mission Control Schedule Health Check");
console.log("=" .repeat(50));

// Get all users
const users = await client.query('admin:getAllUsers', {});
console.log(`\n👥 Found ${users.length} user(s)`);

let totalDuplicates = 0;
const issues = [];

for (const user of users) {
  console.log(`\n🔍 Checking ${user.name} (${user.email})...`);
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    const schedule = await client.query('weeklySchedule:getScheduleByDay', {
      userId: user._id,
      dayOfWeek: day
    });
    
    if (!schedule || schedule.length === 0) continue;
    
    // Detect duplicates
    const seen = new Map();
    let dayDuplicates = 0;
    
    for (const block of schedule) {
      const key = `${block.startTime}|${block.endTime}|${block.activity.toLowerCase().trim()}`;
      
      if (seen.has(key)) {
        dayDuplicates++;
        totalDuplicates++;
        
        issues.push({
          day,
          activity: block.activity,
          time: `${block.startTime}-${block.endTime}`,
          user: user.name
        });
      } else {
        seen.set(key, block);
      }
    }
    
    if (dayDuplicates > 0) {
      console.log(`  ⚠️  ${day}: ${dayDuplicates} duplicate(s)`);
    }
  }
}

console.log("\n" + "=".repeat(50));

if (totalDuplicates === 0) {
  console.log("✅ All clear! No duplicates found.");
} else {
  console.log(`⚠️  Found ${totalDuplicates} total duplicates\n`);
  console.log("📋 Details:");
  issues.forEach((issue, i) => {
    console.log(`  ${i+1}. ${issue.user} - ${issue.day}: "${issue.activity}" (${issue.time})`);
  });
  console.log("\n🔧 To fix, run:");
  console.log("  cd /Users/sebastian/.openclaw/workspace/mission-control");
  console.log("  node delete-schedule-duplicates.mjs");
}

console.log("\n✅ Health check complete");
process.exit(totalDuplicates > 0 ? 1 : 0);
