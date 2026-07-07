import { ConvexHttpClient } from 'convex/browser';
const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
for (const id of ['jh70a53f4h7e631dpfs4zazk3h842dyp','kx7998awt72nd1nxx661tfmhzs8437cy','kx77km204g5c9m51b0280eegh1821dne']) {
  try {
    const rpm = await client.query('rpm:getCategories', { userId: id });
    const read = await client.query('books:getReadAloudBooks', { userId: id });
    const up = await client.query('books:getUpNextBooks', { userId: id });
    const gtm = await client.query('projectTasks:getTasksByProject', { userId: id, project: 'hta', subProject: 'gtm' });
    console.log('\nUSER', id);
    console.log('RPM', rpm?.length, rpm?.map(r => `${r.name} | ${r.role || 'NO_ROLE'} | ${(r.monthlyFocus||[]).length}`).slice(0,12));
    console.log('READ', read?.length, 'UP', up?.length, 'GTM', gtm?.length);
  } catch (e) {
    console.log('\nUSER', id, 'ERROR', e.message);
  }
}
