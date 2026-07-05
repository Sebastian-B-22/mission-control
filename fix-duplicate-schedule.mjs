import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://harmless-salamander-44.convex.cloud");

// Corinne's user ID
const userId = 'kx7a98yjzhtzahbgg37yyjac8n821ac5';

// Get all schedule blocks
const schedule = await client.query('weeklySchedule:getWeeklySchedule', { userId });

console.log('=== ANALYZING SCHEDULE FOR DUPLICATES ===\n');

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
let totalDupes = 0;
const toDelete = [];

for (const day of days) {
    const blocks = schedule[day];
    if (!blocks || blocks.length === 0) continue;
    
    // Group by time + activity
    const groups = new Map();
    for (const block of blocks) {
        const key = `${block.startTime}|${block.endTime}|${block.activity}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(block);
    }
    
    // Find duplicates
    const dupes = Array.from(groups.values()).filter(g => g.length > 1);
    
    if (dupes.length > 0) {
        console.log(`${day.toUpperCase()}:`);
        dupes.forEach(group => {
            const first = group[0];
            console.log(`  ${first.startTime}-${first.endTime}: ${first.activity}`);
            console.log(`    → ${group.length} copies found`);
            
            // Keep the newest, delete the rest
            const sorted = group.sort((a, b) => b.createdAt - a.createdAt);
            const keep = sorted[0];
            const deleteList = sorted.slice(1);
            
            deleteList.forEach(d => {
                toDelete.push(d._id);
                console.log(`    ✗ Delete: ${d._id} (created ${new Date(d.createdAt).toLocaleString()})`);
            });
            console.log(`    ✓ Keep: ${keep._id} (created ${new Date(keep.createdAt).toLocaleString()})`);
        });
        totalDupes += dupes.length;
    }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total duplicate groups: ${totalDupes}`);
console.log(`Total items to delete: ${toDelete.length}`);

if (toDelete.length > 0) {
    console.log(`\nDeleting ${toDelete.length} duplicate items...`);
    
    for (const id of toDelete) {
        try {
            await client.mutation('weeklySchedule:deleteScheduleBlock', { id });
            console.log(`  ✓ Deleted ${id}`);
        } catch (e) {
            console.log(`  ✗ Failed to delete ${id}: ${e.message}`);
        }
    }
    
    console.log(`\n✅ Done! Removed ${toDelete.length} duplicates.`);
} else {
    console.log(`\n✅ No duplicates found!`);
}

process.exit(0);
