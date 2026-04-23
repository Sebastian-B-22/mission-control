import { ConvexHttpClient } from "convex/browser";

let cachedClient: ConvexHttpClient | null = null;

export function getConvexHttpClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }

  if (!cachedClient) {
    cachedClient = new ConvexHttpClient(convexUrl);
  }

  return cachedClient;
}
