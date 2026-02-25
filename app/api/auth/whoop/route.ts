import { NextResponse } from "next/server";

// Whoop OAuth Authorization URL
const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const CLIENT_ID = process.env.WHOOP_CLIENT_ID!;
const REDIRECT_URI = process.env.NODE_ENV === "production"
  ? "https://mission-control-kappa-peach.vercel.app/api/auth/whoop/callback"
  : "http://localhost:3000/api/auth/whoop/callback";

// Scopes we need
const SCOPES = [
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:profile",
  "read:body_measurement",
  "offline", // For refresh token
].join(" ");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Store userId in state for callback
  const state = Buffer.from(JSON.stringify({ userId })).toString("base64");

  const authUrl = new URL(WHOOP_AUTH_URL);
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
