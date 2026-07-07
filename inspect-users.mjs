import { ConvexHttpClient } from 'convex/browser';
const client = new ConvexHttpClient('https://harmless-salamander-44.convex.cloud');
const user = await client.query('users:getUserByClerkId', { clerkId: 'user_39OvUeL8WpfRGbmQRP5UFiurhNe' });
console.log('picked', user);
