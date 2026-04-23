import { NextRequest, NextResponse } from "next/server";

type MovieMeta = {
  posterUrl?: string;
  year?: string;
  rating?: string;
};

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchOmdb(title: string): Promise<MovieMeta | null> {
  const searchUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=564727fa`;
  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent": "MissionControl/1.0",
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data || data.Response === "False") return null;

  const poster = typeof data.Poster === "string" && data.Poster !== "N/A" ? data.Poster : undefined;

  return {
    posterUrl: poster ? `/api/movie-poster?src=${encodeURIComponent(poster)}` : undefined,
    year: typeof data.Year === "string" ? data.Year : undefined,
    rating: typeof data.Rated === "string" && data.Rated !== "N/A" ? data.Rated : undefined,
  };
}

async function fetchImdbSuggestion(title: string): Promise<MovieMeta | null> {
  const trimmed = title.trim();
  if (!trimmed) return null;

  const first = normalizeTitle(trimmed)[0] || "a";
  const url = `https://v2.sg.media-imdb.com/suggestion/${first}/${encodeURIComponent(trimmed)}.json`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "MissionControl/1.0",
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const items = Array.isArray(data?.d) ? data.d : [];
  if (items.length === 0) return null;

  const normalizedQuery = normalizeTitle(trimmed);
  const scored = items
    .filter((item: any) => item?.i?.imageUrl)
    .map((item: any) => {
      const label = normalizeTitle(item?.l || "");
      let score = 0;
      if (label === normalizedQuery) score += 100;
      else if (label.includes(normalizedQuery) || normalizedQuery.includes(label)) score += 60;
      if (item?.qid === "movie" || item?.q === "feature") score += 20;
      if (typeof item?.rank === "number") score += Math.max(0, 20 - Math.min(item.rank / 100, 20));
      return { item, score };
    })
    .sort((a: any, b: any) => b.score - a.score);

  const best = scored[0]?.item;
  if (!best?.i?.imageUrl) return null;

  return {
    posterUrl: `/api/movie-poster?src=${encodeURIComponent(best.i.imageUrl)}`,
    year: best?.y ? String(best.y) : undefined,
    rating: undefined,
  };
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title")?.trim();
  if (!title) {
    return NextResponse.json({}, { status: 400 });
  }

  try {
    const omdb = await fetchOmdb(title);
    if (omdb?.posterUrl || omdb?.year || omdb?.rating) {
      return NextResponse.json(omdb);
    }

    const imdb = await fetchImdbSuggestion(title);
    if (imdb) {
      return NextResponse.json(imdb);
    }

    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}
