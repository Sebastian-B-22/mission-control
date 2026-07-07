"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexDeployments = {
  prod: "https://harmless-salamander-44.convex.cloud",
  dev: "https://healthy-flamingo-415.convex.cloud",
} as const;

function getConvexUrl() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return process.env.NEXT_PUBLIC_CONVEX_URL;
  }

  const target = process.env.MISSION_CONTROL_CONVEX_TARGET || process.env.CONVEX_TARGET;
  if (target === "prod" || target === "dev") {
    return convexDeployments[target];
  }

  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === "production" ? convexDeployments.prod : convexDeployments.dev;
  }

  return null;
}

const convexUrl = getConvexUrl();
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return <>{children}</>;
  }

  if (!clerkPublishableKey) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
