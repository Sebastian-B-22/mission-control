import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://harmless-salamander-44.convex.cloud");

// Corinne's user ID (from earlier queries)
const corinneId = 'kx7a98yjzhtzahbgg37yyjac8n821ac5';
console.log('Corinne user ID:', corinneId);

// Get this week's date range (Monday April 6 - Sunday April 12)
const monday = new Date('2026-04-06T00:00:00-07:00');
const nextMonday = new Date('2026-04-13T00:00:00-07:00');

console.log('\nQuerying events from', monday.toISOString(), 'to', nextMonday.toISOString());
console.log('Timestamps:', monday.getTime(), '-', nextMonday.getTime());

const events = await client.query('calendarEvents:listRange', {
    userId: corinneId,
    startMs: monday.getTime(),
    endMs: nextMonday.getTime()
});

console.log('\n=== EVENTS FOR WEEK OF APRIL 6 ===');
console.log('Total:', events?.length || 0);

if (events && events.length > 0) {
    events.sort((a, b) => a.startMs - b.startMs).forEach(e => {
        const start = new Date(e.startMs);
        const end = new Date(e.endMs);
        const day = start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
        const time = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
        console.log(`\n${day} @ ${time}`);
        console.log(`  ${e.title}`);
        console.log(`  startMs: ${e.startMs} (${start.toISOString()})`);
    });
} else {
    console.log('No events found!');
}

process.exit(0);
