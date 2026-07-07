import { ConvexHttpClient } from 'convex/browser';

const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
client.setAdminAuth(process.env.CONVEX_DEPLOY_KEY);

const updates = [
  { id: 'm17fryk9f5hnmtvm262r589tfn84dt4w', title: 'Astrophysics for Young People in a Hurry' },
  { id: 'm1775n598j71ed6r16fpnqqkqd84c1j7', title: "America's History: A Tuttle Twins Series of Stories (1215-1776)" },
  { id: 'm17b7qrrzb71frvj2wzypa4y9h84dd9k', title: 'Where the Red Fern Grows' },
];

for (const update of updates) {
  await client.mutation('books:updateReadAloudTitleUnsafe' , update);
  console.log(JSON.stringify({ ok: true, ...update }));
}
