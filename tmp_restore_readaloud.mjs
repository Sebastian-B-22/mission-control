import { ConvexHttpClient } from 'convex/browser';

const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
client.setAdminAuth(process.env.CONVEX_DEPLOY_KEY);

const userId = 'jh70a53f4h7e631dpfs4zazk3h842dyp';

const books = [
  { title: 'Astrophysics for You...', status: 'reading' },
  { title: 'Blood & Guts - A Wor...', status: 'reading' },
  { title: 'Disappearing Spoon', status: 'reading' },
  { title: "Don't Tell Ma I Can'!", status: 'reading' },
  { title: 'The Way We Work', status: 'reading' },
  { title: "Tuttle Twins America'...", status: 'reading' },
  { title: 'Where The Red Fern...', status: 'reading' },
  { title: 'Lord of the Rings', status: 'up-next' },
  { title: "Surely You're Joking, Mr. Feynman", status: 'up-next' },
];

for (const book of books) {
  const id = await client.mutation('books:addReadAloudBook', {
    userId,
    title: book.title,
    status: book.status,
  });
  console.log(JSON.stringify({ ok: true, id, ...book }));
}
