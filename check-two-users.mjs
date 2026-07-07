import { ConvexHttpClient } from 'convex/browser';
const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
const monday = new Date('2026-04-06T00:00:00-07:00');
const nextMonday = new Date('2026-04-13T00:00:00-07:00');
for (const userId of ['kx7998awt72nd1nxx661tfmhzs8437cy','jh70a53f4h7e631dpfs4zazk3h842dyp']) {
  try {
    const events = await client.query('calendarEvents:listRange', { userId, startMs: monday.getTime(), endMs: nextMonday.getTime() });
    console.log(userId, events.length);
  } catch (e) {
    console.log(userId, 'ERROR', e.message);
  }
}
