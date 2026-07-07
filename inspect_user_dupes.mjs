import { ConvexHttpClient } from 'convex/browser';
const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
const clerkId = 'user_39OvUeL8WpfRGbmQRP5UFiurhNe';
const users = await client.query('fixUserResolutionAndDedupe:listUsersByClerkId', { clerkId });
console.log(JSON.stringify(users, null, 2));
