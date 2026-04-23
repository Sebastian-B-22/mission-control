import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src")?.trim();
  if (!src) {
    return new NextResponse("Missing src", { status: 400 });
  }

  const res = await fetch(src, {
    headers: {
      "User-Agent": "MissionControl/1.0",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return new NextResponse("Poster not found", { status: 404 });
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const body = await res.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
