import { NextResponse } from 'next/server';

const MEMORY_API_URL = process.env.MEMORY_API_URL || 'http://localhost:3001';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${MEMORY_API_URL}/api/content?path=${encodeURIComponent(filePath)}`,
      {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    );

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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Memory API unreachable: ${message}` },
      { status: 503 }
    );
  }
}
