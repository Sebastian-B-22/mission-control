import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/registrations/update
 * 
 * Update registration counts from Scout's nightly Jotform sync
 * 
 * Body:
 * {
 *   "counts": [
 *     { "program": "spring-pali", "count": 89 },
 *     { "program": "spring-agoura", "count": 45 },
 *     ...
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.counts || !Array.isArray(body.counts)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected { counts: [...] }" },
        { status: 400 }
      );
    }
    
    // Validate each count entry
    for (const entry of body.counts) {
      if (!entry.program || typeof entry.program !== "string") {
        return NextResponse.json(
          { error: "Each count must have a 'program' string" },
          { status: 400 }
        );
      }
      if (entry.count === undefined || typeof entry.count !== "number") {
        return NextResponse.json(
          { error: "Each count must have a 'count' number" },
          { status: 400 }
        );
      }
    }
    
    // Call Convex mutation
    const result = await convex.mutation(api.registrations.bulkUpdateCounts, {
      counts: body.counts,
    });
    
    return NextResponse.json({
      success: true,
      message: "Registration counts updated successfully",
      results: result.results,
    });
  } catch (error) {
    console.error("Error updating registration counts:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/registrations/update
 * 
 * Return API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/registrations/update",
    method: "POST",
    description: "Update registration counts from Scout's nightly Jotform sync",
    body: {
      counts: [
        { program: "spring-pali", count: 89 },
        { program: "spring-agoura", count: 45 },
        { program: "camps", count: 12 },
        { program: "pdp", count: 7 },
        { program: "7v7", count: 3 },
      ],
    },
    example: `curl -X POST https://mission-control.../api/registrations/update \\
  -H "Content-Type: application/json" \\
  -d '{"counts": [{"program": "spring-pali", "count": 89}, {"program": "spring-agoura", "count": 45}]}'`,
  });
}
