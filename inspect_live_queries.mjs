import { ConvexHttpClient } from 'convex/browser';
const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
const userId = 'jh70a53f4h7e631dpfs4zazk3h842dyp';

async function q(name, args) {
  try {
    const res = await client.query(name, args);
    return { ok: true, summary: Array.isArray(res) ? { length: res.length, sample: res.slice(0,3) } : res };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

const checks = {
  rpmGetCategories: await q('rpm:getCategories', { userId }),
  rpmGetCategoriesByUser: await q('rpm:getCategoriesByUser', { userId }),
  readAloud: await q('books:getReadAloudBooks', { userId }),
  upNext: await q('books:getUpNextBooks', { userId }),
  bookLibrary: await q('books:getBookLibrary', { userId }),
};

for (const subProject of ['gtm','product','curriculum','marketing','operations']) {
  checks[`hta_${subProject}`] = await q('projectTasks:getTasksByProject', { userId, project: 'hta', subProject });
}

console.log(JSON.stringify(checks, null, 2));
