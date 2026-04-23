import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title")?.trim();
  if (!title) {
    return NextResponse.json({}, { status: 400 });
  }

  const searchUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=564727fa`;
  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent": "MissionControl/1.0",
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return NextResponse.json({}, { status: 502 });
  }

  const data = await res.json();
  if (!data || data.Response === "False") {
    return NextResponse.json({});
  }

  const poster = typeof data.Poster === "string" && data.Poster !== "N/A"
    ? data.Poster
    : undefined;

  return NextResponse.json({
    posterUrl: poster ? `/api/movie-poster?src=${encodeURIComponent(poster)}` : undefined,
    year: typeof data.Year === "string" ? data.Year : undefined,
    rating: typeof data.Rated === "string" && data.Rated !== "N/A" ? data.Rated : undefined,
  });
}
