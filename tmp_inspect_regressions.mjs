import { ConvexHttpClient } from 'convex/browser';
const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
const clerkId = 'user_39OvUeL8WpfRGbmQRP5UFiurhNe';
const user = await client.query('users:getUserByClerkId', { clerkId });
console.log('USER', user);
const userId = user?._id;
if (!userId) process.exit(1);
const rpm = await client.query('rpm:getCategories', { userId });
console.log('RPM_COUNT', rpm?.length);
console.log(JSON.stringify(rpm?.map(r => ({id:r._id,name:r.name,type:r.type,role:r.role,purpose:r.purpose,monthlyFocus:r.monthlyFocus?.length,createdAt:r.createdAt})), null, 2));
const read = await client.query('books:getReadAloudBooks', { userId });
const up = await client.query('books:getUpNextBooks', { userId });
console.log('READ_ALOUD', JSON.stringify(read, null, 2));
console.log('UP_NEXT', JSON.stringify(up, null, 2));
for (const subProject of ['gtm','product','curriculum','marketing','operations']) {
  const tasks = await client.query('projectTasks:getTasksByProject', { userId, project: 'hta', subProject });
  console.log('HTA', subProject, tasks.length);
}
