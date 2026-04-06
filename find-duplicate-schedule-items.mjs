import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://harmless-salamander-44.convex.cloud");

// Get all schedule template items
const items = await client.query('homeschool:getScheduleTemplate');

console.log('Total schedule items:', items.length);

// Group by day + time + title to find duplicates
const groups = new Map();

for (const item of items) {
    const key = `${item.dayOfWeek}|${item.startTime}|${item.endTime}|${item.title}`;
    if (!groups.has(key)) {
        groups.set(key, []);
    }
    groups.get(key).push(item);
}

console.log('\n=== DUPLICATES FOUND ===');
let dupeCount = 0;

for (const [key, items] of groups) {
    if (items.length > 1) {
        dupeCount++;
        const [day, start, end, title] = key.split('|');
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
        console.log(`\n${dayName} ${start}-${end}: ${title}`);
        console.log(`  Found ${items.length} copies:`);
        items.forEach((item, i) => {
            console.log(`    [${i + 1}] ID: ${item._id}, Created: ${new Date(item._creationTime).toLocaleString()}`);
        });
        
        // Mark older ones for deletion (keep the newest)
        const sorted = items.sort((a, b) => b._creationTime - a._creationTime);
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1);
        
        console.log(`  → Keep: ${toKeep._id} (newest)`);
        console.log(`  → Delete: ${toDelete.map(d => d._id).join(', ')}`);
    }
}

console.log(`\n\n=== SUMMARY ===`);
console.log(`Total unique activities: ${groups.size}`);
console.log(`Activities with duplicates: ${dupeCount}`);
console.log(`Total duplicate items to remove: ${items.length - groups.size}`);

process.exit(0);
