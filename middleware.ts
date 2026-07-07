import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/hta(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/manifest.json",
  "/ping",
  "/ping/health",
  "/tickets",
  "/api/auth/whoop(.*)",
  "/api/health/apple(.*)",
  "/api/health/steps(.*)",
  "/api/registrations/update(.*)",
  "/api/cron/update(.*)",
  "/api/health-check(.*)",
  "/api/movie-meta(.*)",
  "/api/movie-poster(.*)",
  "/knowledge(.*)",
  "/knowledge-viewer(.*)",
  "/worldcup(.*)",
]);


export default clerkMiddleware(async (auth, request) => {
  const hostname = (request.headers.get("host") || request.nextUrl.hostname).split(":")[0].replace(/^www\./, "");
  if (hostname === "hometeamacademy.com" && request.nextUrl.pathname === "/favicon.ico") {
    return NextResponse.rewrite(new URL("/hta-favicon-32.png", request.url));
  }

  if (request.nextUrl.pathname === "/worldcup" || request.nextUrl.pathname === "/worldcup/") {
    const url = request.nextUrl.clone();
    url.pathname = "/worldcup/index.html";
    return NextResponse.rewrite(url);
  }

  if (hostname === "hometeamacademy.com" && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/hta", request.url));
  }

  if (!isPublicRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", request.url).toString(),
    });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/favicon.ico",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
