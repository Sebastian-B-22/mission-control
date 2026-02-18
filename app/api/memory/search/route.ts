import { NextResponse } from 'next/server';

// The Memory API server runs locally on the Mac mini.
// Set MEMORY_API_URL in .env.local (dev) or Vercel env vars (prod).
// Default: http://localhost:3001
const MEMORY_API_URL = process.env.MEMORY_API_URL || 'http://localhost:3001';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  const upstreamParams = new URLSearchParams({ q });
  if (type && type !== 'all') upstreamParams.set('type', type);
  if (dateFrom) upstreamParams.set('dateFrom', dateFrom);
  if (dateTo) upstreamParams.set('dateTo', dateTo);

  try {
    const response = await fetch(`${MEMORY_API_URL}/api/search?${upstreamParams}`, {
      headers: { 'Content-Type': 'application/json' },
      // Short timeout - if the local server is down, fail fast
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: 'Memory API error', details: text },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    const message = isTimeout
      ? 'Memory API timeout - is the memory-api server running on the Mac mini?'
      : `Memory API unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`;

    return NextResponse.json(
      {
        error: message,
        hint: `Start the server: cd workspace/memory-api && node server.js`,
        results: [],
        count: 0,
      },
      { status: 503 }
    );
  }
}
