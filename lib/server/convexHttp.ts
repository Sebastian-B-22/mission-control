import { ConvexHttpClient } from "convex/browser";

const CONVEX_DEPLOYMENTS = {
  prod: {
    cloudUrl: "https://harmless-salamander-44.convex.cloud",
    siteUrl: "https://harmless-salamander-44.convex.site",
  },
  dev: {
    cloudUrl: "https://healthy-flamingo-415.convex.cloud",
    siteUrl: "https://healthy-flamingo-415.convex.site",
  },
} as const;

type ConvexTarget = keyof typeof CONVEX_DEPLOYMENTS;

let cachedClient: ConvexHttpClient | null = null;
let cachedUrl: string | null = null;

export function getConvexDeploymentTarget(): ConvexTarget {
  const target = process.env.MISSION_CONTROL_CONVEX_TARGET || process.env.CONVEX_TARGET;

  if (target === "prod" || target === "dev") {
    return target;
  }

  const override = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (override) {
    const normalized = override.replace(/\/$/, "");
    if (normalized === CONVEX_DEPLOYMENTS.prod.cloudUrl || normalized === CONVEX_DEPLOYMENTS.prod.siteUrl) {
      return "prod";
    }
    if (normalized === CONVEX_DEPLOYMENTS.dev.cloudUrl || normalized === CONVEX_DEPLOYMENTS.dev.siteUrl) {
      return "dev";
    }
  }

  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === "production" ? "prod" : "dev";
  }

  throw new Error(
    'Missing explicit Convex target. Set MISSION_CONTROL_CONVEX_TARGET to exactly "prod" or "dev".',
  );
}

export function getConvexUrl(kind: "cloud" | "site" = "cloud") {
  const target = getConvexDeploymentTarget();
  const expected = CONVEX_DEPLOYMENTS[target];
  const override = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

  if (!override) {
    return kind === "site" ? expected.siteUrl : expected.cloudUrl;
  }

  const normalized = override.replace(/\/$/, "");
  if (normalized !== expected.cloudUrl && normalized !== expected.siteUrl) {
    throw new Error(
      `Convex URL "${normalized}" conflicts with explicit target "${target}". Expected ${expected.cloudUrl} or ${expected.siteUrl}.`,
    );
  }

  return normalized;
}

export function getConvexHttpClient() {
  const convexUrl = getConvexUrl("cloud");

  if (!cachedClient || cachedUrl !== convexUrl) {
    cachedClient = new ConvexHttpClient(convexUrl);
    cachedUrl = convexUrl;
  }

  return cachedClient;
}
