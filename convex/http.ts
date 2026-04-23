/**
 * HTTP Endpoints for Agent Access
 *
 * These endpoints allow Sebastian (and other agents) to interact with
 * Mission Control's task board programmatically from outside the browser.
 *
 * Base URL (prod):  https://harmless-salamander-44.convex.site
 * Base URL (dev):   https://healthy-flamingo-415.convex.site
 *
 * Auth: Pass X-Agent-Key header. Set AGENT_API_KEY in Convex env vars.
 *       If not set, defaults to "sk-sebastian-mc-2026" for development.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Re-export type so TypeScript can use it
type ContentType = "x-post" | "x-reply" | "email" | "blog" | "landing-page" | "other";
type ContentStage = "idea" | "priority" | "later" | "needs-work" | "review" | "approved" | "published" | "dismissed";

const http = httpRouter();

// ─── Helper: validate agent API key ───────────────────────────────────────

// Convex supports process.env for environment variables
 
declare const process: { env: Record<string, string | undefined> };

function validateApiKey(request: Request): boolean {
  const provided = request.headers.get("X-Agent-Key");
  // Validate against list of allowed agent API keys
  // Set AGENT_API_KEY in Convex env vars for production, or use defaults for dev
  const validKeys = [
    process.env.AGENT_API_KEY,
    "sk-sebastian-mc-2026",
    "sk-scout-mc-2026",
    "sk-maven-mc-2026",
    "sk-james-mc-2026",
    "sk-compass-mc-2026",
  ].filter((k): k is string => !!k);
  
  return provided !== null && validKeys.includes(provided);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Agent-Key",
    "Content-Type": "application/json",
  };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(),
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: corsHeaders(),
  });
}

// ─── OPTIONS (CORS preflight) ──────────────────────────────────────────────

http.route({
  path: "/tasks",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

http.route({
  path: "/tasks/create",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

http.route({
  path: "/tasks/update",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

http.route({
  path: "/tasks/note",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

http.route({
  path: "/pending-items/create",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

// ─── GET /tasks - List tasks ───────────────────────────────────────────────
//
// Query params:
//   clerkId     (required) - Clerk user ID
//   assignedTo  (optional) - Filter by assignee: "sebastian", "corinne", etc.
//   status      (optional) - Filter by status: "todo", "in-progress", "done", "backlog"
//
// Example:
//   curl -H "X-Agent-Key: sk-sebastian-mc-2026" \
//     "https://harmless-salamander-44.convex.site/tasks?clerkId=user_xxx&assignedTo=sebastian"

http.route({
  path: "/tasks",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) {
      return errorResponse("Unauthorized", 401);
    }

    const url = new URL(request.url);
    const clerkId = url.searchParams.get("clerkId");
    const assignedTo = url.searchParams.get("assignedTo") || undefined;
    const status = url.searchParams.get("status") || undefined;

    if (!clerkId) {
      return errorResponse("Missing required param: clerkId");
    }

    const user = await ctx.runQuery(internal.sebastianTasks.getUserByClerkId, { clerkId });
    if (!user) {
      return errorResponse("User not found for clerkId: " + clerkId, 404);
    }

    const tasks = await ctx.runQuery(internal.sebastianTasks.getActiveTasksInternal, {
      userId: user._id,
      assignedTo,
      status,
    });

    return jsonResponse({ tasks, count: tasks.length });
  }),
});

// ─── POST /tasks/create - Create a new task ────────────────────────────────
//
// Body (JSON):
//   clerkId      (required) - Clerk user ID
//   title        (required) - Task title
//   description  (optional) - Longer description
//   priority     (optional) - "low" | "medium" | "high"  (default: "medium")
//   category     (optional) - "infrastructure" | "hta" | "aspire" | "agent-squad" | "skills" | "other"
//   assignedTo   (optional) - "sebastian" | "corinne" | "scout" | "maven" | "compass" | "james"
//   agentNotes   (optional) - Initial note or context
//   status       (optional) - "backlog" | "todo" | "in-progress" | "done"  (default: "todo")
//   lastUpdatedBy (optional) - Who created it (default: "sebastian")
//
// Example:
//   curl -X POST -H "X-Agent-Key: sk-sebastian-mc-2026" \
//     -H "Content-Type: application/json" \
//     -d '{"clerkId":"user_xxx","title":"Review Aspire registrations","assignedTo":"sebastian","priority":"high"}' \
//     https://harmless-salamander-44.convex.site/tasks/create

http.route({
  path: "/tasks/create",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) {
      return errorResponse("Unauthorized", 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const clerkId = body.clerkId as string;
    if (!clerkId) return errorResponse("Missing required field: clerkId");

    const title = body.title as string;
    if (!title) return errorResponse("Missing required field: title");

    const user = await ctx.runQuery(internal.sebastianTasks.getUserByClerkId, { clerkId });
    if (!user) return errorResponse("User not found for clerkId: " + clerkId, 404);

    // Validate priority
    const priority = (body.priority as string) ?? "medium";
    if (!["low", "medium", "high"].includes(priority)) {
      return errorResponse("Invalid priority. Must be: low | medium | high");
    }

    // Validate status
    const status = (body.status as string) ?? "todo";
    if (!["backlog", "todo", "in-progress", "done"].includes(status)) {
      return errorResponse("Invalid status. Must be: backlog | todo | in-progress | done");
    }

    const taskId = await ctx.runMutation(internal.sebastianTasks.createTaskInternal, {
      userId: user._id,
      title,
      description: body.description as string | undefined,
      priority: priority as "low" | "medium" | "high",
      category: (body.category as string) ?? "agent-squad",
      assignedTo: body.assignedTo as string | undefined,
      agentNotes: body.agentNotes as string | undefined,
      status: status as "backlog" | "todo" | "in-progress" | "done",
      lastUpdatedBy: (body.lastUpdatedBy as string) ?? "sebastian",
    });

    return jsonResponse({ success: true, taskId }, 201);
  }),
});

// ─── POST /tasks/update - Update task status ───────────────────────────────
//
// Body (JSON):
//   taskId       (required) - Convex task ID
//   status       (required) - New status
//   agentNotes   (optional) - Updated progress note
//   lastUpdatedBy (optional) - Who updated it (default: "sebastian")
//
// Example:
//   curl -X POST -H "X-Agent-Key: sk-sebastian-mc-2026" \
//     -H "Content-Type: application/json" \
//     -d '{"taskId":"k571hj...","status":"done","agentNotes":"Completed and pushed to Vercel"}' \
//     https://harmless-salamander-44.convex.site/tasks/update

http.route({
  path: "/tasks/update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) {
      return errorResponse("Unauthorized", 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const taskId = body.taskId as string;
    if (!taskId) return errorResponse("Missing required field: taskId");

    const status = body.status as string;
    if (!status) return errorResponse("Missing required field: status");
    if (!["backlog", "todo", "in-progress", "done"].includes(status)) {
      return errorResponse("Invalid status. Must be: backlog | todo | in-progress | done");
    }

    try {
      const result = await ctx.runMutation(internal.sebastianTasks.updateTaskStatusInternal, {
        id: taskId as Id<"sebastianTasks">,
        status: status as "backlog" | "todo" | "in-progress" | "done",
        agentNotes: body.agentNotes as string | undefined,
        lastUpdatedBy: (body.lastUpdatedBy as string) ?? "sebastian",
      });
      return jsonResponse(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResponse("Update failed: " + message, 500);
    }
  }),
});

// ─── POST /tasks/note - Add a progress note to a task ─────────────────────
//
// Body (JSON):
//   taskId       (required) - Convex task ID
//   note         (required) - The note text
//   updatedBy    (optional) - Agent name (default: "sebastian")
//
// Example:
//   curl -X POST -H "X-Agent-Key: sk-sebastian-mc-2026" \
//     -H "Content-Type: application/json" \
//     -d '{"taskId":"k571hj...","note":"Running Quo scan now, 47 messages to review"}' \
//     https://harmless-salamander-44.convex.site/tasks/note

http.route({
  path: "/tasks/note",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) {
      return errorResponse("Unauthorized", 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const taskId = body.taskId as string;
    if (!taskId) return errorResponse("Missing required field: taskId");

    const note = body.note as string;
    if (!note) return errorResponse("Missing required field: note");

    try {
      const result = await ctx.runMutation(internal.sebastianTasks.addAgentNoteInternal, {
        id: taskId as Id<"sebastianTasks">,
        note,
        updatedBy: (body.updatedBy as string) ?? "sebastian",
      });
      return jsonResponse(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResponse("Note update failed: " + message, 500);
    }
  }),
});

// ─── Content Pipeline Endpoints ───────────────────────────────────────────
//
// Base URL (prod):  https://harmless-salamander-44.convex.site
//
// All routes require: X-Agent-Key header
// See CONTENT_PIPELINE_API.md for full documentation

// CORS preflight for content routes
[
  "/content",
  "/content/create",
  "/content/update-stage",
  "/content/update",
  "/content/list",
].forEach((path) => {
  http.route({
    path,
    method: "OPTIONS",
    handler: httpAction(async () => {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }),
  });
});

// ─── POST /content/create ─────────────────────────────────────────────────
//
// Submit a new content draft to the pipeline.
//
// Body (JSON):
//   title       (required) - Content title
//   content     (required) - The actual text/copy
//   type        (required) - "x-post" | "email" | "blog" | "landing-page" | "other"
//   stage       (optional) - "idea" | "review" | "approved" | "published" (default: "review")
//   createdBy   (optional) - Agent name: "sebastian" | "maven" | "scout" (default: "sebastian")
//   assignedTo  (optional) - Who reviews (default: "corinne")
//   notes       (optional) - Agent notes about the content
//
// Response: { success: true, contentId: "..." }
//
// Example:
//   curl -X POST -H "X-Agent-Key: sk-sebastian-mc-2026" \
//     -H "Content-Type: application/json" \
//     -d '{"title":"HTA launch tweet","content":"Excited to announce...","type":"x-post","createdBy":"maven","stage":"review"}' \
//     https://harmless-salamander-44.convex.site/content/create

http.route({
  path: "/content/create",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) return errorResponse("Unauthorized", 401);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const title = body.title as string;
    if (!title) return errorResponse("Missing required field: title");

    const content = body.content as string;
    if (!content) return errorResponse("Missing required field: content");

    const type = body.type as string;
    const validTypes: ContentType[] = ["x-post", "x-reply", "email", "blog", "landing-page", "other"];
    if (!type || !validTypes.includes(type as ContentType)) {
      return errorResponse(`Invalid type. Must be: ${validTypes.join(" | ")}`);
    }

    const stage = (body.stage as string) ?? "review";
    const validStages: ContentStage[] = ["idea", "priority", "later", "needs-work", "review", "approved", "published", "dismissed"];
    if (!validStages.includes(stage as ContentStage)) {
      return errorResponse(`Invalid stage. Must be: ${validStages.join(" | ")}`);
    }

    try {
      const contentId = await ctx.runMutation(internal.contentPipeline.createContentInternal, {
        title,
        content,
        type: type as ContentType,
        stage: stage as ContentStage,
        createdBy: (body.createdBy as string) ?? "sebastian",
        assignedTo: (body.assignedTo as string) ?? "corinne",
        notes: body.notes as string | undefined,
      });

      return jsonResponse({ success: true, contentId }, 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResponse("Create failed: " + message, 500);
    }
  }),
});

// ─── POST /content/update-stage ───────────────────────────────────────────
//
// Move a content item to a new stage.
//
// Body (JSON):
//   contentId    (required) - Convex content ID
//   stage        (required) - New stage
//   notes        (optional) - Feedback or notes
//   publishedUrl (optional) - URL when publishing
//
// Example:
//   curl -X POST -H "X-Agent-Key: sk-sebastian-mc-2026" \
//     -H "Content-Type: application/json" \
//     -d '{"contentId":"j572hj...","stage":"review","notes":"Ready for Corinne review"}' \
//     https://harmless-salamander-44.convex.site/content/update-stage

http.route({
  path: "/content/update-stage",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) return errorResponse("Unauthorized", 401);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const contentId = body.contentId as string;
    if (!contentId) return errorResponse("Missing required field: contentId");

    const stage = body.stage as string;
    const validStages: ContentStage[] = ["idea", "priority", "later", "needs-work", "review", "approved", "published", "dismissed"];
    if (!stage || !validStages.includes(stage as ContentStage)) {
      return errorResponse(`Invalid stage. Must be: ${validStages.join(" | ")}`);
    }

    try {
      await ctx.runMutation(internal.contentPipeline.updateStageInternal, {
        id: contentId as Id<"contentPipeline">,
        stage: stage as ContentStage,
        notes: body.notes as string | undefined,
        publishedUrl: body.publishedUrl as string | undefined,
      });
      return jsonResponse({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResponse("Update failed: " + message, 500);
    }
  }),
});

// ─── GET /content/list ────────────────────────────────────────────────────
//
// List content items with optional filters.
//
// Query params:
//   stage      (optional) - Filter by stage
//   type       (optional) - Filter by type
//   createdBy  (optional) - Filter by agent name
//
// Example:
//   curl -H "X-Agent-Key: sk-sebastian-mc-2026" \
//     "https://harmless-salamander-44.convex.site/content/list?stage=review"

http.route({
  path: "/content/list",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) return errorResponse("Unauthorized", 401);

    const url = new URL(request.url);
    const stage = url.searchParams.get("stage") || undefined;
    const type = url.searchParams.get("type") || undefined;
    const createdBy = url.searchParams.get("createdBy") || undefined;

    const validStages: ContentStage[] = ["idea", "priority", "later", "needs-work", "review", "approved", "published", "dismissed"];
    if (stage && !validStages.includes(stage as ContentStage)) {
      return errorResponse(`Invalid stage. Must be: ${validStages.join(" | ")}`);
    }

    const validTypes: ContentType[] = ["x-post", "x-reply", "email", "blog", "landing-page", "other"];
    if (type && !validTypes.includes(type as ContentType)) {
      return errorResponse(`Invalid type. Must be: ${validTypes.join(" | ")}`);
    }

    const items = await ctx.runQuery(internal.contentPipeline.listAllInternal, {
      stage: stage as ContentStage | undefined,
      type: type as ContentType | undefined,
      createdBy,
    });

    return jsonResponse({ items, count: items.length });
  }),
});

// ─── POST /content/delete ─────────────────────────────────────────────────
//
// Delete a single content item.
//
// Body (JSON):
//   contentId    (required) - Convex content ID

["/content/delete", "/content/bulk-clear"].forEach((path) => {
  http.route({
    path,
    method: "OPTIONS",
    handler: httpAction(async () => {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }),
  });
});

http.route({
  path: "/content/delete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) return errorResponse("Unauthorized", 401);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const contentId = body.contentId as string;
    if (!contentId) return errorResponse("Missing required field: contentId");

    try {
      await ctx.runMutation(api.contentPipeline.deleteContent, {
        id: contentId as Id<"contentPipeline">,
      });
      return jsonResponse({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResponse("Delete failed: " + message, 500);
    }
  }),
});

// ─── POST /content/bulk-clear ─────────────────────────────────────────────
//
// Delete all content items, optionally filtered by stage.
//
// Body (JSON):
//   stage        (optional) - Only delete items in this stage
//   createdBy    (optional) - Only delete items from this agent

http.route({
  path: "/content/bulk-clear",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) return errorResponse("Unauthorized", 401);

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch { /* empty body is fine */ }

    const stage = body.stage as string | undefined;
    const createdBy = body.createdBy as string | undefined;

    const items = await ctx.runQuery(internal.contentPipeline.listAllInternal, {
      stage: stage as ContentStage | undefined,
      createdBy,
    });

    let deleted = 0;
    for (const item of items) {
      await ctx.runMutation(api.contentPipeline.deleteContent, { id: item._id });
      deleted++;
    }

    return jsonResponse({ success: true, deleted });
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// CAMP REGISTRATION API
// Base: https://harmless-salamander-44.convex.site/camp/...
// No auth required for public routes; admin routes require X-Admin-Password header
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = process.env.CAMP_ADMIN_PASSWORD ?? "Aspire2026!";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY ?? "";
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY ?? "";

function campCors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
    "Content-Type": "application/json",
  };
}
function campJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: campCors() });
}
function campError(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: campCors() });
}
function isAdmin(req: Request) {
  return req.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

// Stripe: create payment intent via REST
async function createStripePaymentIntent(amount: number, metadata: Record<string, string>) {
  console.log("[Stripe] Creating payment intent for amount:", amount, "cents:", amount * 100);
  console.log("[Stripe] Secret key present:", !!STRIPE_SECRET_KEY, "length:", STRIPE_SECRET_KEY?.length);
  
  const params = new URLSearchParams({
    amount: String(amount * 100),
    currency: "usd",
    "automatic_payment_methods[enabled]": "true",
    ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, v])),
  });
  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const data = await res.json();
  console.log("[Stripe] Response status:", res.status, "data:", JSON.stringify(data).substring(0, 200));
  
  if (!res.ok) {
    throw new Error(`Stripe error: ${JSON.stringify(data)}`);
  }
  
  return data as { id: string; client_secret: string };
}

// Stripe: verify webhook signature
async function verifyStripeWebhook(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  try {
    const parts = sigHeader.split(",");
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));
    if (!tPart || !v1Part) return false;
    const timestamp = tPart.substring(2);
    const expected = v1Part.substring(3);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
    const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return hex === expected;
  } catch { return false; }
}

// ConvertKit tagging + automation trigger
const AGOURA_SUMMER_CAMP_KIT_TAG_ID = 18708374;

async function tagConvertKit(email: string, firstName: string, weekNumbers: string[]) {
  try {
    const subscriberRes = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kit-Api-Key": CONVERTKIT_API_KEY },
      body: JSON.stringify({
        email_address: email.trim().toLowerCase(),
        first_name: firstName,
        state: "active",
      }),
    });

    const subscriberPayload = await subscriberRes.json();
    if (!subscriberRes.ok) {
      throw new Error(`Kit subscriber upsert failed (${subscriberRes.status}): ${JSON.stringify(subscriberPayload)}`);
    }

    const subscriberId = subscriberPayload?.subscriber?.id;
    if (!subscriberId) throw new Error("Kit subscriber upsert succeeded but returned no subscriber id");

    const tagRes = await fetch(`https://api.kit.com/v4/tags/${AGOURA_SUMMER_CAMP_KIT_TAG_ID}/subscribers/${subscriberId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kit-Api-Key": CONVERTKIT_API_KEY },
      body: JSON.stringify({}),
    });
    if (!tagRes.ok) {
      const errText = await tagRes.text();
      throw new Error(`Kit tag request failed (${tagRes.status}): ${errText}`);
    }

    console.log("[ConvertKit] Tagged subscriber for:", email, "weeks:", weekNumbers.join(",") || "none");
  } catch (e) {
    console.error("[ConvertKit] Error:", e);
  }
}

// OpenPhone SMS confirmation
const OPENPHONE_API_KEY = "k4LxAv80VW7q5nEfzPb0aopWOzA4AbM2";
const OPENPHONE_AGOURA_LINE = "PN2La7sbgD"; // +18052227212

interface CampSession {
  type: string;
  selectedDays?: string[];
}

function formatCampSmsDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  return `${weekday} ${date.getMonth() + 1}/${date.getDate()}`;
}

function expandCampWeekDates(weekNumber: string) {
  const weekDates: Record<string, string[]> = {
    "1": ["2026-06-22", "2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26"],
    "2": ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"],
    "3": ["2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24"],
    "4": ["2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31"],
  };

  return weekDates[weekNumber] ?? [];
}

async function sendCampConfirmationSMS(
  phone: string, 
  childNames: string[], 
  weekNumbers: string[],
  pricing: { subtotal: number; discount: number; total: number },
  childSessions: Array<{ firstName: string; sessions: Record<string, CampSession> }>
) {
  try {
    // Normalize phone to E.164 format
    let normalized = phone.replace(/[^0-9]/g, "");
    if (normalized.length === 10) normalized = "1" + normalized;
    if (!normalized.startsWith("+")) normalized = "+" + normalized;
    
    const names = childNames.join(" & ");
    
    let sessionDetails = "";
    for (const child of childSessions) {
      const sessions = child.sessions || {};
      const parts: string[] = [];
      for (const [wk, sess] of Object.entries(sessions)) {
        const weekNum = wk.replace("week", "");
        if (sess.type === "full") {
          const fullWeekDates = expandCampWeekDates(weekNum).map(formatCampSmsDate).join(", ");
          if (fullWeekDates) parts.push(fullWeekDates);
        } else if (sess.selectedDays && sess.selectedDays.length > 0) {
          const days = [...sess.selectedDays]
            .sort((a, b) => a.localeCompare(b))
            .map(formatCampSmsDate)
            .join(", ");
          parts.push(days);
        }
      }
      if (parts.length > 0) {
        if (childSessions.length > 1) {
          sessionDetails += `\n${child.firstName}: ${parts.join("; ")}`;
        } else {
          sessionDetails = parts.join("; ");
        }
      }
    }
    
    // Build message - no emojis
    let message = `CONFIRMED! ${names} ${childNames.length > 1 ? "are" : "is"} registered for AYSO Region 4 Summer Soccer Camp!\n\n`;
    message += `Days: ${sessionDetails}\n`;
    message += `Total Paid: $${pricing.total}\n\n`;
    message += `Location: Brookside Elementary (enter via Conifer St)\n`;
    message += `Time: 8am-1pm daily\n\n`;
    message += `Bring: Water, lunch, snack, sunscreen\n\n`;
    message += `Questions? Just reply to this text!\n\n-Coach Corinne`;
    
    await fetch("https://api.openphone.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": OPENPHONE_API_KEY,
      },
      body: JSON.stringify({
        from: OPENPHONE_AGOURA_LINE,
        to: [normalized],
        content: message,
      }),
    });
    console.log("[OpenPhone] Sent SMS to:", normalized);
  } catch (e) {
    console.error("[OpenPhone] SMS Error:", e);
  }
}

// ─── Health Data Ingest (from Health Auto Export app) ─────────────────────────

// CORS preflight for health endpoint
http.route({
  path: "/api/health/ingest",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Health-Key",
    },
  })),
});

// POST /api/health/ingest - receive health data from Health Auto Export app
http.route({
  path: "/api/health/ingest",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Simple auth - check for health ingest key (header or URL param)
    const url = new URL(req.url);
    const authKey = req.headers.get("X-Health-Key") || url.searchParams.get("key");
    const validKey = process.env.HEALTH_INGEST_KEY || "hk-corinne-health-2026";
    
    if (authKey !== validKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    try {
      const rawBody = await req.json();
      console.log("[Health Ingest] Received payload, keys:", Object.keys(rawBody));
      
      // Health Auto Export format: { data: { metrics: [...] } }
      // Each metric: { name: "step_count", units: "count", data: [{ qty: 1234, date: "..." }] }
      let date: string;
      let metrics: { steps?: number; activeCalories?: number; sleepHours?: number } = {};
      
      // Check if this is our simple format
      if (rawBody.date && rawBody.metrics) {
        date = rawBody.date;
        metrics = rawBody.metrics;
      } 
      // Check if this is Health Auto Export format
      else if (rawBody.data?.metrics) {
        const metricsArray = rawBody.data.metrics;
        console.log("[Health Ingest] Health Auto Export format, metrics count:", metricsArray?.length);
        
        // Use PST date
        const now = new Date();
        const pst = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
        date = pst.toISOString().split("T")[0];
        
        if (Array.isArray(metricsArray)) {
          for (const m of metricsArray) {
            const metricName = m.name?.toLowerCase() || "";
            
            // Steps: sum all data points for the day
            if (metricName.includes("step")) {
              const dataPoints = m.data || [];
              if (dataPoints.length > 0) {
                // If summarized, use qty directly; else sum
                const total = dataPoints.reduce((sum: number, d: { qty?: number }) => sum + (d.qty || 0), 0);
                metrics.steps = total;
                console.log("[Health Ingest] Steps:", total);
              }
            }
            
            // Active Energy / Calories
            if (metricName.includes("active_energy") || metricName.includes("active energy")) {
              const dataPoints = m.data || [];
              if (dataPoints.length > 0) {
                const total = dataPoints.reduce((sum: number, d: { qty?: number }) => sum + (d.qty || 0), 0);
                metrics.activeCalories = Math.round(total);
                console.log("[Health Ingest] Active Calories:", total);
              }
            }
            
            // Sleep Analysis
            if (metricName.includes("sleep")) {
              const dataPoints = m.data || [];
              if (dataPoints.length > 0) {
                // Sleep data might have totalSleep in minutes or asleep field
                const lastSleep = dataPoints[dataPoints.length - 1];
                let sleepMinutes = lastSleep.totalSleep || lastSleep.asleep || lastSleep.qty || 0;
                // If it looks like hours already (< 24), don't convert
                metrics.sleepHours = sleepMinutes > 24 ? sleepMinutes / 60 : sleepMinutes;
                console.log("[Health Ingest] Sleep hours:", metrics.sleepHours);
              }
            }
          }
        }
      } else {
        console.log("[Health Ingest] Unknown format:", JSON.stringify(rawBody).slice(0, 200));
        return new Response(JSON.stringify({ ok: true, note: "Unknown format, logged for debugging" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      if (!metrics.steps && !metrics.sleepHours && !metrics.activeCalories) {
        console.log("[Health Ingest] No metrics extracted");
        return new Response(JSON.stringify({ ok: true, note: "No relevant metrics found" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Calculate Don't Die score (reverse-engineered)
      // Sleep: 7+ hours = 33 pts, scaled below
      // Steps: 7000+ = 33 pts, scaled below  
      // Active Calories: 300+ = 33 pts, scaled below
      const sleepTarget = 7;
      const stepsTarget = 7000;
      const caloriesTarget = 300;
      
      const sleepScore = metrics.sleepHours 
        ? Math.min(33, Math.round((metrics.sleepHours / sleepTarget) * 33))
        : 0;
      const stepsScore = metrics.steps
        ? Math.min(33, Math.round((metrics.steps / stepsTarget) * 33))
        : 0;
      const caloriesScore = metrics.activeCalories
        ? Math.min(34, Math.round((metrics.activeCalories / caloriesTarget) * 34))
        : 0;
      
      const totalScore = sleepScore + stepsScore + caloriesScore;
      
      // Find Corinne's user by email
      const user = await ctx.runQuery(api.users.getUserByClerkId, { clerkId: "user_39OvUeL8WpfRGbmQRP5UFiurhNe" });
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      const corinneUserId = user._id;
      
      await ctx.runMutation(api.health.upsertDailyHealth, {
        userId: corinneUserId,
        date,
        steps: metrics.steps || 0,
        sleepHours: metrics.sleepHours || 0,
        activeCalories: metrics.activeCalories || 0,
        sleepScore,
        stepsScore,
        caloriesScore,
        healthScore: totalScore,
        restingHeartRate: undefined,
        hrv: undefined,
        source: "health-auto-export",
      });
      
      console.log(`[Health Ingest] Synced ${date}: score=${totalScore}, steps=${metrics.steps}, sleep=${metrics.sleepHours}h, cal=${metrics.activeCalories}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        date,
        score: totalScore,
        breakdown: { sleepScore, stepsScore, caloriesScore }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("[Health Ingest] Error:", e);
      return new Response(JSON.stringify({ error: "Failed to process health data", details: String(e) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// CORS preflight for all camp routes
["/camp/availability", "/camp/trial-day/availability", "/camp/validate-promo", "/camp/register", "/camp/register-free", "/camp/trial-day/register", "/camp/stripe-webhook",
 "/camp/admin/stats", "/camp/admin/registrations", "/camp/admin/checkin", "/camp/admin/promo-codes",
 "/api/family/credit", "/api/family/credit/add", "/api/family/credit/apply"].forEach((path) => {
  http.route({
    path, method: "OPTIONS",
    handler: httpAction(async () => new Response(null, { status: 204, headers: campCors() })),
  });
});

// GET /camp/availability
http.route({
  path: "/camp/availability", method: "GET",
  handler: httpAction(async (ctx) => {
    const data = await ctx.runQuery(api.camp.getAvailability, {});
    return campJson(data);
  }),
});

// GET /camp/trial-day/availability
http.route({
  path: "/camp/trial-day/availability", method: "GET",
  handler: httpAction(async (ctx) => {
    const data = await ctx.runQuery(api.camp.getTrialDayAvailability, {});
    return campJson({ availability: data });
  }),
});

// POST /camp/trial-day/register
http.route({
  path: "/camp/trial-day/register", method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json() as {
        programId: string;
        session: string;
        childFirstName: string;
        childLastName: string;
        dateOfBirth: string;
        age?: number;
        gender: string;
        parentFirstName: string;
        parentLastName: string;
        email: string;
        phone: string;
        emergencyContactName: string;
        emergencyContactPhone: string;
        medicalNotes?: string;
        waiverAccepted?: boolean;
      };

      await ctx.runMutation(api.camp.createTrialDayRegistration, {
        programId: body.programId,
        session: body.session,
        childFirstName: body.childFirstName,
        childLastName: body.childLastName,
        dateOfBirth: body.dateOfBirth,
        age: body.age,
        gender: body.gender,
        parentFirstName: body.parentFirstName,
        parentLastName: body.parentLastName,
        email: body.email,
        phone: body.phone,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
        medicalNotes: body.medicalNotes,
        waiverAccepted: Boolean(body.waiverAccepted),
      });

      const availability = await ctx.runQuery(api.camp.getTrialDayAvailability, {});
      return campJson({
        success: true,
        message: "Spot reserved! You are confirmed for the selected May 3 Brookside session. We will follow up with final details.",
        availability,
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Registration failed";
      const message = rawMessage.replace(/^Uncaught Error:\s*/, "").split("\n")[0] || "Registration failed";
      const availability = await ctx.runQuery(api.camp.getTrialDayAvailability, {});
      const status = message.includes("already has a May 3 trial reservation") || message.includes("session is full") ? 409 : 400;
      return campJson({ error: message, availability }, status);
    }
  }),
});

// POST /camp/validate-promo
http.route({
  path: "/camp/validate-promo", method: "POST",
  handler: httpAction(async (ctx, req) => {
    const { code } = await req.json() as { code: string };
    console.log("[validate-promo] Received code:", code);
    if (!code) return campError("Code required");
    const result = await ctx.runQuery(api.camp.validatePromo, { code });
    console.log("[validate-promo] Query result:", JSON.stringify(result));
    return campJson(result, result.valid ? 200 : 404);
  }),
});

// POST /camp/register
http.route({
  path: "/camp/register", method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return campError("Invalid JSON"); }

    const { parent, children, emergencyContact, waiverAccepted, promoCode, season } = body as {
      parent: { firstName: string; lastName: string; email: string; phone: string };
      children: Array<{ firstName: string; lastName: string; age?: number; gender?: string; allergies?: string; sessions: Record<string, { type: string; selectedDays?: string[] }> }>;
      emergencyContact: { name: string; phone: string };
      waiverAccepted: boolean;
      promoCode?: string;
      season?: string;
    };

    console.log("[register] Received:", JSON.stringify({ parent: parent?.email, childCount: children?.length, waiver: waiverAccepted }));
    
    if (!parent?.email || !parent?.firstName) return campError("Missing parent info");
    if (!children?.length) return campError("At least one child required");
    if (!waiverAccepted) return campError("Waiver must be accepted");

    console.log("[register] Validation passed, calculating pricing...");
    
    // Server-side pricing
    let subtotal = 0;
    for (const child of children) {
      for (const session of Object.values(child.sessions || {})) {
        if (session.type === "full") subtotal += 299;
        else if (session.type === "days") subtotal += (session.selectedDays?.length || 0) * 65;
      }
    }

    // Validate promo (including test codes)
    let discount = 0;
    let validPromoCode: string | undefined;
    if (promoCode) {
      const upperCode = promoCode.toUpperCase();
      // Built-in test codes
      const testCodes: Record<string, { type: string; value: number }> = {
        'TEST100': { type: 'percent', value: 100 },
        'TEST50': { type: 'percent', value: 50 },
      };
      
      if (testCodes[upperCode]) {
        validPromoCode = upperCode;
        const testPromo = testCodes[upperCode];
        if (testPromo.type === 'percent') {
          discount = Math.round(subtotal * testPromo.value / 100);
        }
        discount = Math.min(discount, subtotal);
      } else {
        // Check database for real promo codes
        const promo = await ctx.runQuery(api.camp.validatePromo, { code: promoCode });
        if (promo.valid && "type" in promo) {
          validPromoCode = promo.code as string;
          if (promo.type === "free_days") discount = (promo.value as number) * 65;
          else if (promo.type === "percent_off" || promo.type === "percent") discount = Math.round(subtotal * (promo.value as number) / 100);
          else if (promo.type === "dollar_off" || promo.type === "dollar") discount = promo.value as number;
          discount = Math.min(discount, subtotal);
        }
      }
    }

    const total = Math.max(0, subtotal - discount);
    console.log("[register] Pricing:", { subtotal, discount, total });

    // Create Stripe PaymentIntent
    console.log("[register] Creating Stripe PaymentIntent...");
    const pi = await createStripePaymentIntent(total, {
      parentEmail: parent.email,
      parentName: `${parent.firstName} ${parent.lastName}`,
      childCount: String(children.length),
      season: (season as string) || "summer-2026",
    });

    // Save to Convex
    await ctx.runMutation(api.camp.createRegistration, {
      season: (season as string) || "summer-2026",
      parent,
      children,
      emergencyContact,
      waiverAccepted,
      promoCode: validPromoCode,
      pricing: { subtotal, discount, total },
      stripePaymentIntentId: pi.id,
    });

    const pubKey = STRIPE_PUBLISHABLE_KEY || "pk_live_51QEymGGOalwnslJx5edOTSBfcpscpbd95K9tJQqDxcCczz6zg60D9jlOcPw4tNvVyAXQhOXXFWCaWnk11aQZzuMZ00VE1T8rLM";
    
    return campJson({
      clientSecret: pi.client_secret,
      publishableKey: pubKey,
      amount: total,
      pricing: { subtotal, discount, total },
    });
    } catch (error) {
      console.error("[register] Error:", error);
      return campError(`Registration failed: ${error instanceof Error ? error.message : String(error)}`, 500);
    }
  }),
});

// POST /camp/register-free (for $0 registrations with 100% promo - no Stripe)
http.route({
  path: "/camp/register-free", method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json() as {
        season: string;
        parent: { firstName: string; lastName: string; email: string; phone: string };
        children: Array<{ firstName: string; lastName: string; birthDate?: string; gender?: string; allergies?: string; sessions: Record<string, unknown> }>;
        emergencyContact: { name: string; phone: string };
        waiverAccepted: boolean;
        promoCode?: string;
        pricing: { subtotal: number; discount: number; total: number };
      };
      
      const { parent, children, emergencyContact, waiverAccepted, promoCode, pricing, season } = body;
      
      if (!parent?.email || !parent?.firstName) return campError("Missing parent info");
      if (!children?.length) return campError("At least one child required");
      if (!waiverAccepted) return campError("Waiver must be accepted");
      if (pricing.total > 0) return campError("This endpoint is only for $0 registrations");
      
      const freePaymentIntentId = `free_${Date.now()}`;

      // Create registration directly as paid (no Stripe needed)
      const regId = await ctx.runMutation(api.camp.createRegistration, {
        season: season || "summer-2026",
        parent,
        children,
        emergencyContact,
        waiverAccepted,
        promoCode: promoCode || undefined,
        pricing,
        stripePaymentIntentId: freePaymentIntentId,
      });
      
      // Mark as paid immediately and run the same downstream bookkeeping as Stripe-paid registrations
      await ctx.runMutation(internal.camp.markPaid, {
        stripePaymentIntentId: freePaymentIntentId,
      });
      
      // Get the registration to trigger confirmations
      const reg = { parent, children, pricing };
      
      // Collect child names and weeks for SMS
      const childNames: string[] = [];
      const weekNumbers: string[] = [];
      for (const child of children) {
        childNames.push(child.firstName);
        const sessions = child.sessions as Record<string, { type?: string; selectedDays?: string[] }>;
        for (const [wk, sess] of Object.entries(sessions || {})) {
          if (sess.selectedDays && sess.selectedDays.length > 0) {
            weekNumbers.push(wk.replace("week", ""));
          }
        }
      }
      const uniqueWeeks = [...new Set(weekNumbers)];
      
      // Tag in ConvertKit + trigger email
      await tagConvertKit(parent.email, parent.firstName, uniqueWeeks);
      
      // Send SMS confirmation
      const childSessionData = children.map(c => ({ firstName: c.firstName, sessions: c.sessions as Record<string, CampSession> }));
      await sendCampConfirmationSMS(parent.phone, childNames, uniqueWeeks, pricing, childSessionData);
      
      // Upsert family in CRM
      try {
        await ctx.runMutation(api.families.upsertFamily, {
          parentFirstName: parent.firstName,
          parentLastName: parent.lastName,
          email: parent.email,
          phone: parent.phone,
        });
      } catch (e) {
        console.error("[CRM] Family upsert error:", e);
      }
      
      console.log("[register-free] Completed free registration for:", parent.email);
      return campJson({ success: true, registrationId: regId });
    } catch (error) {
      console.error("[register-free] Error:", error);
      return campError("Registration failed: " + (error as Error).message);
    }
  }),
});

// POST /camp/complete-free (legacy - for $0 registrations with 100% promo)
http.route({
  path: "/camp/complete-free", method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const { registrationId, promoCode } = await req.json() as { registrationId?: string; promoCode?: string };
      
      if (registrationId) {
        // Mark as paid (free) - registrationId is the Convex ID
        await ctx.runMutation(api.camp.markFreeRegistration, { 
          registrationId,
          promoCode: promoCode || undefined
        });
      }
      
      return campJson({ success: true, message: "Free registration completed" });
    } catch (error) {
      console.error("[complete-free] Error:", error);
      return campJson({ success: true, message: "Registration noted" }); // Don't fail the flow
    }
  }),
});

// POST /camp/stripe-webhook
http.route({
  path: "/camp/stripe-webhook", method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature") || "";

    if (STRIPE_WEBHOOK_SECRET) {
      const valid = await verifyStripeWebhook(rawBody, sig, STRIPE_WEBHOOK_SECRET);
      if (!valid) return new Response("Webhook signature failed", { status: 400 });
    }

    let event: { type: string; data: { object: { id: string; metadata?: Record<string, string> } } };
    try { event = JSON.parse(rawBody); } catch { return new Response("Invalid JSON", { status: 400 }); }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const reg = await ctx.runMutation(internal.camp.markPaid, { stripePaymentIntentId: pi.id });

      if (reg) {
        // Collect week numbers and child names
        const weekNumbers: string[] = [];
        const childNames: string[] = [];
        for (const child of reg.children) {
          childNames.push(child.firstName);
          const sessions = child.sessions as Record<string, { type: string; selectedDays?: string[] }>;
          for (const [wk, sess] of Object.entries(sessions)) {
            if (sess.type === "full" || (sess.selectedDays?.length ?? 0) > 0) {
              weekNumbers.push(wk.replace("week", ""));
            }
          }
        }
        const uniqueWeeks = [...new Set(weekNumbers)];
        
        // 1. Tag in ConvertKit + trigger email automation
        await tagConvertKit(reg.parent.email, reg.parent.firstName, uniqueWeeks);
        
        // 2. Send SMS confirmation via OpenPhone
        const childSessionData = reg.children.map((c: { firstName: string; sessions: Record<string, CampSession> }) => ({
          firstName: c.firstName,
          sessions: c.sessions,
        }));
        await sendCampConfirmationSMS(
          reg.parent.phone, 
          childNames, 
          uniqueWeeks,
          reg.pricing,
          childSessionData
        );
        
        // 3. Upsert family in CRM
        try {
          await ctx.runMutation(api.families.upsertFamily, {
            parentFirstName: reg.parent.firstName,
            parentLastName: reg.parent.lastName,
            email: reg.parent.email,
            phone: reg.parent.phone,
          });
          console.log("[CRM] Upserted family:", reg.parent.email);
        } catch (e) {
          console.error("[CRM] Family upsert error:", e);
        }
      }
    }

    return campJson({ received: true });
  }),
});

// GET /camp/admin/stats
http.route({
  path: "/camp/admin/stats", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!isAdmin(req)) return campError("Unauthorized", 401);
    const stats = await ctx.runQuery(api.camp.getStats, {});
    return campJson(stats);
  }),
});

// GET /camp/admin/registrations
http.route({
  path: "/camp/admin/registrations", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!isAdmin(req)) return campError("Unauthorized", 401);
    const url = new URL(req.url);
    const regs = await ctx.runQuery(api.camp.getRegistrations, {
      week: url.searchParams.get("week") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
    });
    return campJson(regs);
  }),
});

// GET /camp/admin/checkin
http.route({
  path: "/camp/admin/checkin", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!isAdmin(req)) return campError("Unauthorized", 401);
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    if (!date) return campError("date query param required");

    const roster = await ctx.runQuery(api.camp.getCheckInRoster, {
      date,
      regionKey: url.searchParams.get("region") ?? "agoura",
    });
    return campJson(roster);
  }),
});

// POST /camp/admin/checkin
http.route({
  path: "/camp/admin/checkin", method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!isAdmin(req)) return campError("Unauthorized", 401);
    let body: any;
    try { body = await req.json(); } catch { return campError("Invalid JSON"); }

    if (body.type === "walkin") {
      const record = await ctx.runMutation(api.camp.addWalkIn, {
        date: body.date,
        regionKey: body.regionKey || "agoura",
        childName: body.childName,
        age: Number(body.age),
        emergencyPhone: body.emergencyPhone,
        parentPhone: body.parentPhone || undefined,
        weekId: body.weekId || undefined,
      });
      return campJson(record, 201);
    }

    const record = await ctx.runMutation(api.camp.recordCheckInAction, {
      key: body.key,
      date: body.date,
      regionKey: body.regionKey || "agoura",
      action: body.action,
      childName: body.childName || undefined,
      age: body.age ?? undefined,
      emergencyPhone: body.emergencyPhone || undefined,
      parentPhone: body.parentPhone || undefined,
      weekId: body.weekId || undefined,
      registrationId: body.registrationId || undefined,
      childIndex: body.childIndex ?? undefined,
      isWalkIn: body.isWalkIn ?? undefined,
    });
    return campJson(record, 200);
  }),
});

// GET /camp/admin/promo-codes
http.route({
  path: "/camp/admin/promo-codes", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!isAdmin(req)) return campError("Unauthorized", 401);
    const codes = await ctx.runQuery(api.camp.getPromoCodes, {});
    return campJson(codes);
  }),
});

// POST /camp/admin/promo-codes
http.route({
  path: "/camp/admin/promo-codes", method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!isAdmin(req)) return campError("Unauthorized", 401);
    const body = await req.json() as { code: string; type: string; value: number; description?: string; maxUses?: number };
    if (!body.code || !body.type || body.value === undefined) return campError("code, type, value required");
    if (!["free_days", "percent_off", "dollar_off"].includes(body.type)) return campError("Invalid type");
    try {
      const id = await ctx.runMutation(api.camp.createPromoCode, {
        code: body.code,
        type: body.type,
        value: body.value,
        description: body.description || "",
        maxUses: body.maxUses,
      });
      return campJson({ success: true, id }, 201);
    } catch (e) {
      return campError(e instanceof Error ? e.message : "Failed", 409);
    }
  }),
});

// PATCH /camp/admin/promo-codes/:code  →  use query param since Convex HTTP doesn't support path params natively
// Call as: PATCH /camp/admin/promo-code?code=REFERRAL  body: { active: true/false }
http.route({
  path: "/camp/admin/promo-code", method: "PATCH",
  handler: httpAction(async (ctx, req) => {
    if (!isAdmin(req)) return campError("Unauthorized", 401);
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) return campError("code query param required");
    const body = await req.json() as { active?: boolean };
    try {
      const result = await ctx.runMutation(api.camp.togglePromoCode, { code, active: body.active });
      return campJson(result);
    } catch (e) {
      return campError(e instanceof Error ? e.message : "Failed", 404);
    }
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Account Credit System
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/family/credit?email=parent@email.com
http.route({
  path: "/api/family/credit", method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    if (!email) return campError("email query param required");
    
    const result = await ctx.runQuery(api.families.getCreditBalance, { email });
    return campJson(result);
  }),
});

// POST /api/family/credit/add
// Body: { familyEmail, amount, type, description, registrationId?, processedBy? }
// Used for issuing refunds as credit
http.route({
  path: "/api/family/credit/add", method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!isAdmin(req)) return campError("Unauthorized", 401);
    
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return campError("Invalid JSON"); }
    
    const { familyEmail, amount, type, description, registrationId, processedBy } = body as {
      familyEmail: string;
      amount: number;
      type: "refund_credit" | "promotional_credit";
      description: string;
      registrationId?: string;
      processedBy?: string;
    };
    
    if (!familyEmail || !amount || !type || !description) {
      return campError("familyEmail, amount, type, and description required");
    }
    
    if (!["refund_credit", "promotional_credit"].includes(type)) {
      return campError("Invalid type. Must be refund_credit or promotional_credit");
    }
    
    try {
      const result = await ctx.runMutation(api.families.addCredit, {
        familyEmail,
        amount,
        type,
        description,
        registrationId,
        processedBy,
      });
      return campJson(result, 201);
    } catch (e) {
      return campError(e instanceof Error ? e.message : "Failed", 400);
    }
  }),
});

// POST /api/family/credit/apply
// Body: { familyEmail, amount, description, registrationId? }
// Used during checkout to apply credit to purchase
http.route({
  path: "/api/family/credit/apply", method: "POST",
  handler: httpAction(async (ctx, req) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return campError("Invalid JSON"); }
    
    const { familyEmail, amount, description, registrationId } = body as {
      familyEmail: string;
      amount: number;
      description: string;
      registrationId?: string;
    };
    
    if (!familyEmail || !amount || !description) {
      return campError("familyEmail, amount, and description required");
    }
    
    try {
      const result = await ctx.runMutation(api.families.applyCredit, {
        familyEmail,
        amount,
        description,
        registrationId,
      });
      return campJson(result);
    } catch (e) {
      return campError(e instanceof Error ? e.message : "Failed", 400);
    }
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Maven Feedback API
// ─────────────────────────────────────────────────────────────────────────────

// GET /maven/feedback - Get all feedback with optional filters
http.route({
  path: "/maven/feedback", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    const url = new URL(req.url);
    const feedbackType = url.searchParams.get("type") as "reject" | "edit" | null;
    const limit = url.searchParams.get("limit");
    
    const feedback = await ctx.runQuery(api.mavenFeedback.listAll, {
      feedbackType: feedbackType || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    
    return jsonResponse({ success: true, feedback });
  }),
});

// GET /maven/feedback/stats - Get feedback statistics
http.route({
  path: "/maven/feedback/stats", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    const stats = await ctx.runQuery(api.mavenFeedback.getFeedbackStats, {});
    return jsonResponse({ success: true, stats });
  }),
});

// GET /maven/feedback/export - Export feedback as JSON (for syncing to voice-feedback.json)
http.route({
  path: "/maven/feedback/export", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    const feedback = await ctx.runQuery(api.mavenFeedback.listAll, { limit: 100 });
    const stats = await ctx.runQuery(api.mavenFeedback.getFeedbackStats, {});
    
    // Generate pattern-based recommendations
    const recommendations: string[] = [];
    if (stats.byReason["too-salesy"] >= 3) {
      recommendations.push("Reduce promotional language - focus on value and education");
    }
    if (stats.byReason["off-brand"] >= 3) {
      recommendations.push("Review SOUL.md voice guidelines - content doesn't match brand");
    }
    if (stats.byReason["wrong-tone"] >= 3) {
      recommendations.push("Adjust tone to be more conversational and authentic");
    }
    if (stats.byReason["factually-wrong"] >= 2) {
      recommendations.push("Double-check facts and data before drafting content");
    }
    
    const exportData = {
      description: "Maven voice feedback - tracking patterns from Corinne's rejections and edits",
      lastExport: new Date().toISOString(),
      feedbackSummary: {
        totalFeedback: stats.total,
        rejects: stats.rejects,
        edits: stats.edits,
        patterns: stats.recentPatterns,
        byReason: stats.byReason,
        recommendations,
      },
      recentFeedback: feedback.slice(0, 20).map((f: any) => ({
        id: f._id,
        type: f.feedbackType,
        reason: f.reason,
        customReason: f.customReason,
        contentTitle: f.contentTitle,
        contentType: f.contentType,
        createdBy: f.createdBy,
        createdAt: new Date(f.createdAt).toISOString(),
        originalContent: f.originalContent?.substring(0, 500),
        finalContent: f.finalContent?.substring(0, 500),
      })),
      notes: "This file is auto-generated from Mission Control feedback. Data is stored in Convex DB.",
    };
    
    return jsonResponse(exportData);
  }),
});

// POST /maven/feedback/reject - Record a rejection
http.route({
  path: "/maven/feedback/reject", method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    const body = await req.json() as {
      contentId?: string;
      contentTitle: string;
      contentType: string;
      createdBy: string;
      reason: "too-salesy" | "off-brand" | "wrong-tone" | "factually-wrong" | "custom";
      customReason?: string;
      originalContent?: string;
    };
    
    if (!body.contentTitle || !body.contentType || !body.createdBy || !body.reason) {
      return jsonResponse({ error: "Missing required fields: contentTitle, contentType, createdBy, reason" }, 400);
    }
    
    const id = await ctx.runMutation(api.mavenFeedback.recordReject, {
      contentId: body.contentId as Id<"contentPipeline"> | undefined,
      contentTitle: body.contentTitle,
      contentType: body.contentType,
      createdBy: body.createdBy,
      reason: body.reason,
      customReason: body.customReason,
      originalContent: body.originalContent,
    });
    
    return jsonResponse({ success: true, id });
  }),
});

// POST /maven/feedback/edit - Record an edit comparison
http.route({
  path: "/maven/feedback/edit", method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    const body = await req.json() as {
      contentId?: string;
      contentTitle: string;
      contentType: string;
      createdBy: string;
      originalContent: string;
      finalContent: string;
    };
    
    if (!body.contentTitle || !body.contentType || !body.createdBy || !body.originalContent || !body.finalContent) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }
    
    const id = await ctx.runMutation(api.mavenFeedback.recordEdit, {
      contentId: body.contentId as Id<"contentPipeline"> | undefined,
      contentTitle: body.contentTitle,
      contentType: body.contentType,
      createdBy: body.createdBy,
      originalContent: body.originalContent,
      finalContent: body.finalContent,
    });
    
    return jsonResponse({ success: true, id });
  }),
});

// OPTIONS for CORS preflight
http.route({
  path: "/maven/feedback", method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});
http.route({
  path: "/maven/feedback/stats", method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});
http.route({
  path: "/maven/feedback/export", method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});
http.route({
  path: "/maven/feedback/reject", method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});
http.route({
  path: "/maven/feedback/edit", method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT HUDDLE ENDPOINTS
// Inter-agent communication organized by channels
// ─────────────────────────────────────────────────────────────────────────────

// Channel definitions
const HUDDLE_CHANNELS = {
  main: { name: "Main Huddle", description: "Daily standups, announcements" },
  "aspire-ops": { name: "Aspire Ops", description: "Registrations, scheduling, coaches" },
  "hta-launch": { name: "HTA Launch", description: "Marketing, product, launch prep" },
  family: { name: "Family", description: "Kids' learning, projects" },
  ideas: { name: "Ideas", description: "Brainstorming, discussions" },
  "overnight-strategy": { name: "Overnight Huddle", description: "Overnight strategy pass for goals, workflow, revenue, retention, and tomorrow's priorities" },
  "joy-support": { name: "Joy Support", description: "Joy asking Sebastian for help with Carolyn" },
};

// GET /huddle - Get recent messages
// Query params: channel (optional), limit (default 50), since (timestamp)
http.route({
  path: "/huddle", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    const url = new URL(req.url);
    const channel = url.searchParams.get("channel") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const since = url.searchParams.get("since") 
      ? parseInt(url.searchParams.get("since")!) 
      : undefined;
    
    const messages = await ctx.runQuery(internal.agentHuddle.getRecentInternal, {
      channel,
      limit,
      since,
    });
    
    return jsonResponse({ 
      messages,
      channels: HUDDLE_CHANNELS,
    });
  }),
});

// POST /huddle - Post a message or start a mission
// Body: { agent: string, message: string, channel: string, mentions?: string[], replyTo?: string, missionId?: string, startMission?: boolean }
http.route({
  path: "/huddle", method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    const body = await req.json() as {
      agent: string;
      message: string;
      channel?: string;
      mentions?: string[];
      replyTo?: string;
      missionId?: string;
      startMission?: boolean;
    };
    
    if (!body.agent || !body.message) {
      return jsonResponse({ error: "Missing required fields: agent, message" }, 400);
    }
    
    const validAgents = ["sebastian", "scout", "maven", "compass", "james", "corinne", "joy"];
    if (!validAgents.includes(body.agent.toLowerCase())) {
      return jsonResponse({ error: `Invalid agent. Must be one of: ${validAgents.join(", ")}` }, 400);
    }
    
    const channel = body.channel || "main";
    
    if (!Object.keys(HUDDLE_CHANNELS).includes(channel)) {
      return jsonResponse({ 
        error: `Invalid channel. Must be one of: ${Object.keys(HUDDLE_CHANNELS).join(", ")}` 
      }, 400);
    }

    if (body.startMission) {
      const result = await ctx.runMutation(api.agentHuddle.startMission, {
        agent: body.agent.toLowerCase(),
        message: body.message,
        channel,
        mentions: body.mentions,
        participants: body.mentions,
      });

      return jsonResponse({
        success: true,
        channel,
        missionId: result.missionId,
        messageId: result.messageId,
        status: result.status,
      });
    }
    
    const messageId = await ctx.runMutation(internal.agentHuddle.postInternal, {
      agent: body.agent.toLowerCase(),
      message: body.message,
      channel,
      missionId: body.missionId as Id<"agentHuddleMissions"> | undefined,
      mentions: body.mentions,
      replyTo: body.replyTo as Id<"agentHuddle"> | undefined,
    });
    
    return jsonResponse({ success: true, messageId, channel, missionId: body.missionId });
  }),
});

// GET /huddle/channels - List available channels
http.route({
  path: "/huddle/channels", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    return jsonResponse({ channels: HUDDLE_CHANNELS });
  }),
});

// OPTIONS for CORS preflight
http.route({
  path: "/huddle", method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

http.route({
  path: "/huddle/channels", method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT TRIGGER ENDPOINTS
// Polling-based system for waking agents when huddle messages arrive
// ─────────────────────────────────────────────────────────────────────────────

// GET /huddle/triggers - Get pending triggers for OpenClaw to process
http.route({
  path: "/huddle/triggers", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
    const triggers = await ctx.runQuery(internal.agentTrigger.getPendingTriggers, { limit });
    
    return jsonResponse({ 
      triggers,
      count: triggers.length,
      pollTime: Date.now(),
    });
  }),
});

// POST /huddle/triggers/:id/processing - Mark trigger as processing
http.route({
  path: "/huddle/triggers/processing", method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    const body = await req.json() as { triggerId: string };
    if (!body.triggerId) {
      return jsonResponse({ error: "Missing triggerId" }, 400);
    }
    
    try {
      await ctx.runMutation(internal.agentTrigger.markProcessing, {
        triggerId: body.triggerId as Id<"agentTriggers">,
      });
      return jsonResponse({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonResponse({ error: message }, 500);
    }
  }),
});

// POST /huddle/triggers/:id/complete - Mark trigger as completed
http.route({
  path: "/huddle/triggers/complete", method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    const body = await req.json() as { triggerId: string };
    if (!body.triggerId) {
      return jsonResponse({ error: "Missing triggerId" }, 400);
    }
    
    try {
      await ctx.runMutation(internal.agentTrigger.markCompleted, {
        triggerId: body.triggerId as Id<"agentTriggers">,
      });
      return jsonResponse({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonResponse({ error: message }, 500);
    }
  }),
});

// POST /huddle/triggers/:id/failed - Mark trigger as failed
http.route({
  path: "/huddle/triggers/failed", method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    const body = await req.json() as { triggerId: string; error: string };
    if (!body.triggerId) {
      return jsonResponse({ error: "Missing triggerId" }, 400);
    }
    
    try {
      await ctx.runMutation(internal.agentTrigger.markFailed, {
        triggerId: body.triggerId as Id<"agentTriggers">,
        error: body.error || "Unknown error",
      });
      return jsonResponse({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonResponse({ error: message }, 500);
    }
  }),
});

// GET /huddle/triggers/stats - Get trigger statistics
http.route({
  path: "/huddle/triggers/stats", method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    const stats = await ctx.runQuery(api.agentTrigger.getTriggerStats, {});
    return jsonResponse(stats);
  }),
});

// OPTIONS for CORS preflight
[
  "/huddle/triggers",
  "/huddle/triggers/processing",
  "/huddle/triggers/complete",
  "/huddle/triggers/failed",
  "/huddle/triggers/stats",
].forEach((path) => {
  http.route({
    path, method: "OPTIONS",
    handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
  });
});

// Debug endpoint for family meeting
http.route({
  path: "/debug/family-meeting",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const weekOf = "2026-03-01";
    
    const result = await ctx.runQuery(internal.familyMeeting.debugGetMeeting, { weekOf });
    
    return new Response(JSON.stringify(result, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }),
});

// ─── Homeschool Progress ─────────────────────────────────────────────────────

// POST /homeschool/progress - Save progress data from scrapers
http.route({
  path: "/homeschool/progress",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) {
      return errorResponse("Unauthorized", 401);
    }
    
    const body = await request.json();
    
    if (!body.studentName || !body.platform) {
      return errorResponse("Missing required fields: studentName, platform");
    }
    
    await ctx.runMutation(api.homeschoolProgress.saveProgress, {
      studentName: body.studentName,
      platform: body.platform,
      lastActivity: body.lastActivity || new Date().toISOString(),
      todayCompleted: body.todayCompleted ?? false,
      weeklyMinutes: body.weeklyMinutes ?? 0,
      streak: body.streak,
      level: body.level,
      details: body.details || {},
      scrapedAt: new Date().toISOString(),
    });
    
    return jsonResponse({ success: true });
  }),
});

// GET /homeschool/progress - Get all progress data
http.route({
  path: "/homeschool/progress",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) {
      return errorResponse("Unauthorized", 401);
    }
    
    const progress = await ctx.runQuery(api.homeschoolProgress.getAllProgress, {});
    return jsonResponse(progress);
  }),
});

// OPTIONS for CORS
http.route({
  path: "/homeschool/progress",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

// ─────────────────────────────────────────────────────────────────────────────
// TELEGRAM OUTBOX ENDPOINTS
// Queue-based delivery to Telegram topics (sent by the host via OpenClaw)
// ─────────────────────────────────────────────────────────────────────────────

// GET /telegram/outbox - Get pending outbox items
// Query params: limit (default 20)
http.route({
  path: "/telegram/outbox",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const items = await ctx.runQuery(internal.telegramOutbox.getPendingInternal, { limit });

    return jsonResponse({ items, count: items.length, pollTime: Date.now() });
  }),
});

// POST /telegram/outbox/sent - Mark an outbox item as sent
// Body: { id: string, telegramMessageId?: string, deliveredAccountId?: string, deliveredThreadId?: string }
http.route({
  path: "/telegram/outbox/sent",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as {
      id?: string;
      telegramMessageId?: string;
      deliveredAccountId?: string;
      deliveredThreadId?: string;
    };
    if (!body.id) return jsonResponse({ error: "Missing id" }, 400);

    await ctx.runMutation(internal.telegramOutbox.markSentInternal, {
      id: body.id as Id<"telegramOutbox">,
      telegramMessageId: body.telegramMessageId,
      deliveredAccountId: body.deliveredAccountId,
      deliveredThreadId: body.deliveredThreadId,
    });

    return jsonResponse({ success: true });
  }),
});

// POST /telegram/outbox/failed - Mark an outbox item as failed
// Body: { id: string, error: string }
http.route({
  path: "/telegram/outbox/failed",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as { id?: string; error?: string };
    if (!body.id || !body.error) {
      return jsonResponse({ error: "Missing required fields: id, error" }, 400);
    }

    await ctx.runMutation(internal.telegramOutbox.markFailedInternal, {
      id: body.id as Id<"telegramOutbox">,
      error: body.error,
    });

    return jsonResponse({ success: true });
  }),
});

// OPTIONS for CORS preflight
http.route({
  path: "/telegram/outbox",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});
http.route({
  path: "/telegram/outbox/sent",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});
http.route({
  path: "/telegram/outbox/failed",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

// POST /telegram/inbox/ingest - Bridge a Telegram reply back into Agent Huddle
// Body: { text: string, topic?: string, channel?: string, author?: string, agent?: string, telegramMessageId?: string, telegramThreadId?: string, replyToTelegramMessageId?: string }
http.route({
  path: "/telegram/inbox/ingest",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

http.route({
  path: "/telegram/inbox/ingest",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!validateApiKey(req)) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as {
      text?: string;
      topic?: string;
      channel?: string;
      author?: string;
      agent?: string;
      telegramMessageId?: string;
      telegramThreadId?: string;
      replyToTelegramMessageId?: string;
    };

    const text = String(body.text || "").trim();
    if (!text) return jsonResponse({ error: "Missing required field: text" }, 400);

    const messageId = await ctx.runMutation(internal.telegramOutbox.ingestTelegramReplyInternal, {
      text,
      topic: body.topic ? String(body.topic) : undefined,
      channel: body.channel ? String(body.channel) : undefined,
      author: body.author ? String(body.author) : undefined,
      agent: body.agent ? String(body.agent) : undefined,
      telegramMessageId: body.telegramMessageId ? String(body.telegramMessageId) : undefined,
      telegramThreadId: body.telegramThreadId ? String(body.telegramThreadId) : undefined,
      replyToTelegramMessageId: body.replyToTelegramMessageId ? String(body.replyToTelegramMessageId) : undefined,
    });

    return jsonResponse({ ok: true, messageId }, 201);
  }),
});

// ─── POST /pending-items/create - Create a Pending / Next Up item ─────────
//
// Body (JSON):
//   title   (required)
//   details (optional)
//   owner   (optional)  - "corinne" | "sebastian" | ... | "unassigned"
//   source  (optional)  - "huddle" | "telegram" | "manual" (default: "huddle")
//   dueAt   (optional)  - ms timestamp
//   tags    (optional)  - string[]
//
// Auth: X-Agent-Key header (same as other agent HTTP endpoints)
http.route({
  path: "/pending-items/create",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) {
      return errorResponse("Unauthorized", 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const title = String(body.title || "").trim();
    if (!title) return errorResponse("Missing required field: title");

    const details = body.details ? String(body.details) : undefined;
    const owner = body.owner ? String(body.owner) : undefined;
    const source = body.source ? String(body.source) : "huddle";
    if (!['huddle','telegram','manual'].includes(source)) {
      return errorResponse('Invalid source. Must be: huddle | telegram | manual');
    }

    const dueAt = body.dueAt !== undefined ? Number(body.dueAt) : undefined;
    const tags = Array.isArray(body.tags) ? (body.tags as unknown[]).map((t) => String(t)) : undefined;

    const id = await ctx.runMutation(api.pendingItems.create, {
      title,
      details,
      owner,
      source: source as "huddle" | "telegram" | "manual",
      dueAt: dueAt && Number.isFinite(dueAt) ? dueAt : undefined,
      tags,
      status: "open",
    });

    return jsonResponse({ ok: true, id });
  }),
});

// ─── Overnight Inbox Ingest ───────────────────────────────────────────────
// POST /overnight-inbox/ingest
// Body (JSON):
//   source  (required) - "huddle" | "telegram"
//   text    (required) - string
//   channel (optional)
//   topic   (optional)
//   author  (optional)
//   tags    (optional) - string[]
//   createdAt (optional) - ms timestamp
//
// Auth: X-Agent-Key header
http.route({
  path: "/overnight-inbox/ingest",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

http.route({
  path: "/overnight-inbox/ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) {
      return errorResponse("Unauthorized", 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const source = String(body.source || "").trim();
    if (!source) return errorResponse("Missing required field: source");
    if (!['huddle','telegram'].includes(source)) {
      return errorResponse("Invalid source. Must be: huddle | telegram");
    }

    const text = String(body.text || "").trim();
    if (!text) return errorResponse("Missing required field: text");

    const tags = Array.isArray(body.tags) ? (body.tags as unknown[]).map((t) => String(t)) : undefined;
    const createdAt = body.createdAt !== undefined ? Number(body.createdAt) : undefined;

    const id = await ctx.runMutation(api.overnightInbox.ingest, {
      source: source as "huddle" | "telegram",
      channel: body.channel ? String(body.channel) : undefined,
      topic: body.topic ? String(body.topic) : undefined,
      text,
      author: body.author ? String(body.author) : undefined,
      tags,
      createdAt: createdAt && Number.isFinite(createdAt) ? createdAt : undefined,
    });

    return jsonResponse({ ok: true, id }, 201);
  }),
});

// ─── Cost Events Ingest (agent/manual) ───────────────────────────────────
// POST /cost-events/ingest
// Body (JSON):
//   clerkId      (required)
//   agent        (required)
//   model        (required)
//   inputTokens  (optional)
//   outputTokens (optional)
//   costUsd      (required)
//   createdAt    (optional) ms timestamp
// Auth: X-Agent-Key header
http.route({
  path: "/cost-events/ingest",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

http.route({
  path: "/cost-events/ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) return errorResponse("Unauthorized", 401);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const clerkId = String(body.clerkId || "").trim();
    if (!clerkId) return errorResponse("Missing required field: clerkId");

    const agent = String(body.agent || "").trim();
    const model = String(body.model || "").trim();
    const costUsd = Number(body.costUsd);
    if (!agent) return errorResponse("Missing required field: agent");
    if (!model) return errorResponse("Missing required field: model");
    if (!Number.isFinite(costUsd)) return errorResponse("Missing/invalid field: costUsd");

    const user = await ctx.runQuery(api.users.getUserByClerkId, { clerkId });
    if (!user) return errorResponse("User not found for clerkId: " + clerkId, 404);

    const createdAt = body.createdAt !== undefined ? Number(body.createdAt) : undefined;

    const id = await ctx.runMutation(api.costTracker.ingest, {
      userId: user._id,
      agent,
      model,
      inputTokens: body.inputTokens !== undefined ? Number(body.inputTokens) : undefined,
      outputTokens: body.outputTokens !== undefined ? Number(body.outputTokens) : undefined,
      costUsd,
      createdAt: createdAt && Number.isFinite(createdAt) ? createdAt : undefined,
    });

    return jsonResponse({ ok: true, id }, 201);
  }),
});

// ─── Memory Snapshots Ingest (Vercel-safe) ───────────────────────────────
// POST /memory/snapshots/ingest
// Body (JSON):
//   clerkId (required)
//   source  (optional)
//   files   (required) [{ path, content, updatedAt? }]
// Auth: X-Agent-Key header
http.route({
  path: "/memory/snapshots/ingest",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

http.route({
  path: "/memory/snapshots/ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) return errorResponse("Unauthorized", 401);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const clerkId = String(body.clerkId || "").trim();
    if (!clerkId) return errorResponse("Missing required field: clerkId");

    const user = await ctx.runQuery(api.users.getUserByClerkId, { clerkId });
    if (!user) return errorResponse("User not found for clerkId: " + clerkId, 404);

    const files = body.files as Array<{ path: string; content: string; updatedAt?: number }>;
    if (!Array.isArray(files) || files.length === 0) {
      return errorResponse("Missing required field: files (non-empty array)");
    }

    const source = body.source ? String(body.source) : undefined;

    let upserted = 0;
    for (const f of files) {
      if (!f || typeof f.path !== "string" || typeof f.content !== "string") continue;
      await ctx.runMutation(api.memorySnapshots.upsert, {
        userId: user._id,
        path: f.path,
        content: f.content,
        updatedAt: f.updatedAt,
        source,
      });
      upserted++;
    }

    return jsonResponse({ ok: true, upserted }, 201);
  }),
});

// ─── Host Health Runs Ingest ─────────────────────────────────────────────
// POST /health/runs/ingest
// Body (JSON):
//   clerkId  (required)
//   kind     (required) "doctor" | "security_audit"
//   status   (required) "ok" | "warn" | "critical"
//   counts   (optional) { critical, warn, info }
//   rawText  (required)
//   createdAt (optional) ms timestamp
// Auth: X-Agent-Key header
http.route({
  path: "/health/runs/ingest",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

http.route({
  path: "/health/runs/ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) return errorResponse("Unauthorized", 401);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const clerkId = String(body.clerkId || "").trim();
    if (!clerkId) return errorResponse("Missing required field: clerkId");

    const user = await ctx.runQuery(api.users.getUserByClerkId, { clerkId });
    if (!user) return errorResponse("User not found for clerkId: " + clerkId, 404);

    const kind = String(body.kind || "").trim();
    if (!kind) return errorResponse("Missing required field: kind");
    if (!["doctor", "security_audit"].includes(kind)) {
      return errorResponse("Invalid kind. Must be: doctor | security_audit");
    }

    const status = String(body.status || "").trim();
    if (!status) return errorResponse("Missing required field: status");
    if (!["ok", "warn", "critical"].includes(status)) {
      return errorResponse("Invalid status. Must be: ok | warn | critical");
    }

    const rawText = String(body.rawText || "");
    if (!rawText.trim()) return errorResponse("Missing required field: rawText");

    const createdAt = body.createdAt !== undefined ? Number(body.createdAt) : undefined;

    let counts:
      | { critical: number; warn: number; info: number }
      | undefined;
    if (body.counts && typeof body.counts === "object") {
      const c = body.counts as Record<string, unknown>;
      const critical = Number(c.critical);
      const warn = Number(c.warn);
      const info = Number(c.info);
      if ([critical, warn, info].every((n) => Number.isFinite(n))) {
        counts = { critical, warn, info };
      }
    }

    const id = await ctx.runMutation(api.healthRuns.ingestHealthRun, {
      userId: user._id,
      kind: kind as "doctor" | "security_audit",
      status: status as "ok" | "warn" | "critical",
      counts,
      rawText,
      createdAt: createdAt && Number.isFinite(createdAt) ? createdAt : undefined,
    });

    return jsonResponse({ ok: true, id }, 201);
  }),
});

// ─── POST /health/apple - Apple Health Auto Export webhook ────────────────
// Receives health data from Health Auto Export iOS app
// Body (JSON): { data: { metrics: [...] } }
// Auth: X-Agent-Key header
http.route({
  path: "/health/apple",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() })),
});

http.route({
  path: "/health/apple",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateApiKey(request)) return errorResponse("Unauthorized", 401);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const data = body.data as { metrics?: Array<{ name: string; units: string; data: Array<{ qty: number; date: string }> }> } | undefined;
    if (!data?.metrics) {
      return errorResponse("Missing data.metrics array");
    }

    // Corinne's user ID (hardcoded for now)
    const userId = "kx77km204g5c9m51b0280eegh1821dne" as Id<"users">;

    // Extract relevant metrics
    let steps: number | undefined;
    let activeCalories: number | undefined;
    let weight: number | undefined;

    for (const metric of data.metrics) {
      const latestData = metric.data?.[metric.data.length - 1];
      if (!latestData) continue;

      const name = metric.name.toLowerCase();
      
      if (name.includes("step") && name.includes("count")) {
        steps = latestData.qty;
      } else if (name.includes("active") && name.includes("energy") || name.includes("active") && name.includes("calor")) {
        // Convert kJ to kcal if needed
        activeCalories = metric.units.toLowerCase().includes("kj") 
          ? Math.round(latestData.qty / 4.184)
          : Math.round(latestData.qty);
      } else if (name.includes("body") && name.includes("mass") || name === "weight") {
        // Convert kg to lbs if needed
        weight = metric.units.toLowerCase().includes("kg")
          ? Math.round(latestData.qty * 2.20462 * 10) / 10
          : Math.round(latestData.qty * 10) / 10;
      }
    }

    // Get today's date in PST
    const now = new Date();
    const pstDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const dateStr = pstDate.toISOString().split("T")[0];

    // Update health record
    await ctx.runMutation(api.health.recordDailyHealth, {
      userId,
      date: dateStr,
      steps,
      activeCalories,
      weight,
      whoopSynced: false, // This is Apple Health data, not Whoop
    });

    return jsonResponse({ 
      ok: true, 
      date: dateStr,
      synced: { steps, activeCalories, weight }
    }, 200);
  }),
});

export default http;
