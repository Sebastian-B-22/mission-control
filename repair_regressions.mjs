import { ConvexHttpClient } from 'convex/browser';
const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
const clerkId = 'user_39OvUeL8WpfRGbmQRP5UFiurhNe';
const targetUserId = 'kx77km204g5c9m51b0280eegh1821dne';

console.log('repointing clerk id...');
console.log(await client.mutation('fixUserResolutionAndDedupe:repointClerkIdToUser', { clerkId, targetUserId }));
console.log('deduping rpm...');
console.log(await client.mutation('fixUserResolutionAndDedupe:dedupeRpmCategoriesForUser', { userId: targetUserId }));
console.log('verify user...');
console.log(await client.query('users:getUserByClerkId', { clerkId }));
const read = await client.query('books:getReadAloudBooks', { userId: targetUserId });
const up = await client.query('books:getUpNextBooks', { userId: targetUserId });
console.log('read/up', read.length, up.length);
for (const subProject of ['gtm','product','curriculum','marketing','operations']) {
  const tasks = await client.query('projectTasks:getTasksByProject', { userId: targetUserId, project: 'hta', subProject });
  console.log('HTA', subProject, tasks.length);
}
