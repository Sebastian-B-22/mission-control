import { ConvexHttpClient } from 'convex/browser';

const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
client.setAdminAuth(process.env.CONVEX_DEPLOY_KEY);

const updates = [
  {
    id: 'm1754ttctjbh6y3kksqf4nf1cn84d3sz',
    title: 'Disappearing Spoon',
    author: 'Sam Kean',
  },
  {
    id: 'm175pk975ssnvr2q5ww392v3e584d0qz',
    title: 'The Way We Work',
    author: 'David Macaulay',
  },
];

for (const update of updates) {
  await client.mutation('books:updateReadAloudBookUnsafe', update);
  console.log(JSON.stringify({ ok: true, ...update }));
}
