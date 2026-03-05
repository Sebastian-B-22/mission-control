import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type OpenClawCronList = {
  jobs?: Array<{
    id: string;
    name: string;
    enabled: boolean;
    schedule?: { kind?: string; expr?: string };
    state?: {
      nextRunAtMs?: number;
      lastRunAtMs?: number;
      lastStatus?: string;
      lastRunStatus?: string;
    };
    payload?: { agentId?: string };
  }>;
};

function toIso(ms?: number): string {
  if (!ms || Number.isNaN(ms)) return "";
  return new Date(ms).toISOString();
}

/**
 * POST /api/cron/update
 *
 * Called from the host (Mac mini) to push OpenClaw cron job state into Convex.
 * This route is safe for Vercel because it does NOT shell out; it accepts the
 * cron list JSON as input.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OpenClawCronList;

    if (!body.jobs || !Array.isArray(body.jobs)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected { jobs: [...] }" },
        { status: 400 }
      );
    }

    const jobs = body.jobs.map((j) => {
      const expr = j.schedule?.kind === "cron" ? j.schedule?.expr : undefined;
      const schedule = expr ? `cron ${expr}` : j.schedule?.expr || "";
      const status = j.enabled ? "active" : "disabled";
      const nextRun = toIso(j.state?.nextRunAtMs);
      const lastRun = toIso(j.state?.lastRunAtMs);

      return {
        jobId: j.id,
        name: j.name,
        schedule,
        nextRun,
        lastRun,
        status,
        agentId: j.payload?.agentId,
      };
    });

    await convex.mutation(api.cronJobs.syncCronJobs, { jobs });

    return NextResponse.json({ success: true, count: jobs.length });
  } catch (error) {
    console.error("Error syncing cron jobs:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/cron/update",
    method: "POST",
    description:
      "Push OpenClaw cron jobs (from openclaw cron list --json) into Convex.",
    example:
      "openclaw cron list --json | curl -X POST https://<vercel>/api/cron/update -H 'Content-Type: application/json' -d @-",
  });
}
