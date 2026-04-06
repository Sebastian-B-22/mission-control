import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://harmless-salamander-44.convex.cloud");

console.log('🔍 Fetching schedule data...\n');

// Get all days
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Use the current user ID (from admin:getAllUsers)
const userId = 'jh70a53f4h7e631dpfs4zazk3h842dyp';

let schedule;
try {
  schedule = await client.query('weeklySchedule:getWeeklySchedule', { 
    userId 
  });
} catch (e) {
  console.log('❌ Failed to query schedule:', e.message);
  console.log('\n💡 Let me try using the Convex HTTP API directly...\n');
  
  // Try direct HTTP approach
  const response = await fetch('https://harmless-salamander-44.convex.cloud/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'weeklySchedule:getWeeklySchedule',
      args: { userId }
    })
  });
  
  const result = await response.json();
  
  if (result.status === 'error') {
    console.log('❌ HTTP query also failed:', result.errorMessage);
    console.log('\n🔧 The user ID is wrong for this deployment.');
    console.log('I need to access the Convex dashboard to find the correct user ID.');
    console.log('\nAlternative: Run the resetSchedule function which finds the user automatically:');
    console.log('cd /Users/sebastian/.openclaw/workspace/mission-control && CONVEX_URL=https://harmless-salamander-44.convex.cloud npx convex run weeklySchedule:resetSchedule');
    process.exit(1);
  }
  
  schedule = result.value;
}

console.log('✅ Got schedule data\n');

let totalDuplicates = 0;
const deletions = [];

for (const day of days) {
  const blocks = schedule[day] || [];
  if (blocks.length === 0) continue;
  
  console.log(`\n${day}: ${blocks.length} blocks`);
  
  // Group by time + activity
  const seen = new Map();
  
  for (const block of blocks) {
    // Normalize activity name (lowercase, trim) to catch case/spacing variations
    const normalizedActivity = block.activity.toLowerCase().trim();
    const key = `${block.startTime}|${block.endTime}|${normalizedActivity}`;
    
    if (seen.has(key)) {
      // This is a duplicate!
      const original = seen.get(key);
      
      console.log(`  🔄 DUPLICATE FOUND: "${block.activity}" (${block.startTime}-${block.endTime})`);
      console.log(`     Original createdAt: ${original.createdAt}, Current createdAt: ${block.createdAt}`);
      
      // Keep the newer one (higher createdAt)
      const toDelete = block.createdAt < original.createdAt ? block : original;
      const toKeep = block.createdAt >= original.createdAt ? block : original;
      
      console.log(`     Deleting: ${toDelete._id} (older)`);
      
      deletions.push(toDelete._id);
      totalDuplicates++;
      
      // Update map to keep the newer one
      if (toKeep._id === block._id) {
        seen.set(key, block);
      }
    } else {
      seen.set(key, block);
    }
  }
}

console.log(`\n📊 Found ${totalDuplicates} duplicates to delete\n`);

if (deletions.length === 0) {
  console.log('✅ No duplicates found!');
  process.exit(0);
}

console.log('🗑️  Deleting duplicates...\n');

for (const id of deletions) {
  try {
    await client.mutation('weeklySchedule:deleteScheduleBlock', { id });
    console.log(`  ✓ Deleted ${id}`);
  } catch (e) {
    console.log(`  ✗ Failed to delete ${id}: ${e.message}`);
  }
}

console.log(`\n✅ Done! Removed ${deletions.length} duplicate schedule items.`);
console.log('📱 Refresh the Mission Control app to see the clean schedule.');

process.exit(0);
