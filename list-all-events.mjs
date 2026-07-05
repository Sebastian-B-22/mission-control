import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://harmless-salamander-44.convex.cloud");

// Get this week's date range
const monday = new Date('2026-04-06T00:00:00-07:00');
const nextMonday = new Date('2026-04-13T00:00:00-07:00');

console.log('Week of April 6:');
console.log('  Start:', monday.toISOString(), '(', monday.getTime(), ')');
console.log('  End:', nextMonday.toISOString(), '(', nextMonday.getTime(), ')');

// Try to query all calendar events (no user filter)
try {
    // First, check the schema to see available queries
    const result = await fetch('https://harmless-salamander-44.convex.cloud/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            path: 'calendarEvents:listRange',
            args: {
                userId: 'kx7a98yjzhtzahbgg37yyjac8n821ac5',  // Try Corinne's ID from Coach Hub
                startMs: monday.getTime(),
                endMs: nextMonday.getTime()
            }
        })
    });
    
    const data = await result.json();
    console.log('\nQuery result:', JSON.stringify(data, null, 2));
} catch (e) {
    console.log('Error:', e.message);
}

process.exit(0);
