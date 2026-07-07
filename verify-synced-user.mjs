import { ConvexHttpClient } from 'convex/browser';
const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
const user = await client.query('users:getUserByClerkId', { clerkId: 'user_39OvUeL8WpfRGbmQRP5UFiurhNe' });
console.log('resolved user', JSON.stringify(user, null, 2));
const monday = new Date('2026-04-06T00:00:00-07:00');
const nextMonday = new Date('2026-04-13T00:00:00-07:00');
const events = await client.query('calendarEvents:listRange', { userId: user._id, startMs: monday.getTime(), endMs: nextMonday.getTime() });
console.log('count', events.length);
const counts = {};
for (const e of events) {
  const day = new Date(e.startMs).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Los_Angeles' });
  counts[day] = (counts[day] || 0) + 1;
}
console.log(counts);
