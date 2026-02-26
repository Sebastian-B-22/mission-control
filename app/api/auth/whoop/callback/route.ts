import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";


const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const CLIENT_ID = process.env.WHOOP_CLIENT_ID!;
const CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NODE_ENV === "production"
  ? "https://mission-control-kappa-peach.vercel.app/api/auth/whoop/callback"
  : "http://localhost:3000/api/auth/whoop/callback";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
  console.log("WHOOP callback hit:", request.url);
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("Callback params:", { code: code?.slice(0, 10) + "...", state, error, errorDescription });

  // Handle errors
  if (error) {
    console.error("Whoop OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL("/dashboard?whoop_error=" + error + "&desc=" + encodeURIComponent(errorDescription || ""), request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?whoop_error=missing_params", request.url)
    );
  }

  // Decode state to get userId
  let userId: string;
  try {
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    userId = stateData.userId;
  } catch (e) {
    return NextResponse.redirect(
      new URL("/dashboard?whoop_error=invalid_state", request.url)
    );
  }

  // Exchange code for tokens
  try {
    const tokenResponse = await fetch(WHOOP_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Whoop token exchange failed:", tokenResponse.status, errorText);
      return NextResponse.redirect(
        new URL("/dashboard?whoop_error=token_exchange_failed&status=" + tokenResponse.status + "&detail=" + encodeURIComponent(errorText.slice(0, 100)), request.url)
      );
    }

    const tokens = await tokenResponse.json();
    console.log("WHOOP tokens received, expires_in:", tokens.expires_in, "scope:", tokens.scope);

    // Store tokens in Convex
    await convex.mutation(api.health.storeWhoopTokens, {
      clerkId: userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      scope: tokens.scope,
    });

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      new URL("/dashboard?whoop_connected=true&view=health", request.url)
    );
  } catch (e) {
    console.error("Whoop OAuth callback error:", e);
    return NextResponse.redirect(
      new URL("/dashboard?whoop_error=callback_failed", request.url)
    );
  }
}
