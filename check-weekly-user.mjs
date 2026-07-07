import { ConvexHttpClient } from 'convex/browser';
const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
const clerkId = 'user_39OvUeL8WpfRGbmQRP5UFiurhNe';
const user = await client.query('users:getUserByClerkId', { clerkId });
console.log('USER', JSON.stringify(user, null, 2));
if (!user?._id) process.exit(1);
const monday = new Date('2026-04-06T00:00:00-07:00');
const nextMonday = new Date('2026-04-13T00:00:00-07:00');
const events = await client.query('calendarEvents:listRange', {
  userId: user._id,
  startMs: monday.getTime(),
  endMs: nextMonday.getTime(),
});
console.log('COUNT', events.length);
for (const e of events.slice(0, 100)) {
  console.log(JSON.stringify({title:e.title,startMs:e.startMs,endMs:e.endMs,allDay:e.allDay,account:e.account}, null, 2));
}
