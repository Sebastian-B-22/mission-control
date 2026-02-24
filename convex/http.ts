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
type ContentType = "x-post" | "email" | "blog" | "landing-page" | "other";
type ContentStage = "idea" | "review" | "approved" | "published";

const http = httpRouter();

// ─── Helper: validate agent API key ───────────────────────────────────────

// Convex supports process.env for environment variables
 
declare const process: { env: Record<string, string | undefined> };

function validateApiKey(request: Request): boolean {
  const provided = request.headers.get("X-Agent-Key");
  // Use Convex env var AGENT_API_KEY if set, otherwise fall back to default dev key
  // Set this in: https://dashboard.convex.dev/d/harmless-salamander-44/settings/environment-variables
  const expected = process.env.AGENT_API_KEY ?? "sk-sebastian-mc-2026";
  return provided === expected;
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
    const validTypes: ContentType[] = ["x-post", "email", "blog", "landing-page", "other"];
    if (!type || !validTypes.includes(type as ContentType)) {
      return errorResponse(`Invalid type. Must be: ${validTypes.join(" | ")}`);
    }

    const stage = (body.stage as string) ?? "review";
    const validStages: ContentStage[] = ["idea", "review", "approved", "published"];
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
    const validStages: ContentStage[] = ["idea", "review", "approved", "published"];
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

    const validStages: ContentStage[] = ["idea", "review", "approved", "published"];
    if (stage && !validStages.includes(stage as ContentStage)) {
      return errorResponse(`Invalid stage. Must be: ${validStages.join(" | ")}`);
    }

    const validTypes: ContentType[] = ["x-post", "email", "blog", "landing-page", "other"];
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
  return res.json() as Promise<{ id: string; client_secret: string }>;
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

// ConvertKit tagging
async function tagConvertKit(email: string, firstName: string, weekNumbers: string[]) {
  const tags = ["Summer Camp 2026", ...weekNumbers.map((n) => `Camp-Week-${n}`)];
  try {
    await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kit-Api-Key": CONVERTKIT_API_KEY },
      body: JSON.stringify({ email_address: email, first_name: firstName, tags }),
    });
  } catch { /* non-fatal */ }
}

// CORS preflight for all camp routes
["/camp/availability", "/camp/validate-promo", "/camp/register", "/camp/stripe-webhook",
 "/camp/admin/stats", "/camp/admin/registrations", "/camp/admin/promo-codes"].forEach((path) => {
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

// POST /camp/validate-promo
http.route({
  path: "/camp/validate-promo", method: "POST",
  handler: httpAction(async (ctx, req) => {
    const { code } = await req.json() as { code: string };
    if (!code) return campError("Code required");
    const result = await ctx.runQuery(api.camp.validatePromo, { code });
    return campJson(result, result.valid ? 200 : 404);
  }),
});

// POST /camp/register
http.route({
  path: "/camp/register", method: "POST",
  handler: httpAction(async (ctx, req) => {
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

    if (!parent?.email || !parent?.firstName) return campError("Missing parent info");
    if (!children?.length) return campError("At least one child required");
    if (!waiverAccepted) return campError("Waiver must be accepted");

    // Server-side pricing
    let subtotal = 0;
    for (const child of children) {
      for (const session of Object.values(child.sessions || {})) {
        if (session.type === "full") subtotal += 299;
        else if (session.type === "days") subtotal += (session.selectedDays?.length || 0) * 65;
      }
    }

    // Validate promo
    let discount = 0;
    let validPromoCode: string | undefined;
    if (promoCode) {
      const promo = await ctx.runQuery(api.camp.validatePromo, { code: promoCode });
      if (promo.valid && "type" in promo) {
        validPromoCode = promo.code as string;
        if (promo.type === "free_days") discount = (promo.value as number) * 65;
        else if (promo.type === "percent_off") discount = Math.round(subtotal * (promo.value as number) / 100);
        else if (promo.type === "dollar_off") discount = promo.value as number;
        discount = Math.min(discount, subtotal);
      }
    }

    const total = Math.max(0, subtotal - discount);

    // Create Stripe PaymentIntent
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

    return campJson({
      clientSecret: pi.client_secret,
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      amount: total,
      pricing: { subtotal, discount, total },
    });
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
        // Tag in ConvertKit
        const weekNumbers: string[] = [];
        for (const child of reg.children) {
          const sessions = child.sessions as Record<string, { type: string; selectedDays?: string[] }>;
          for (const [wk, sess] of Object.entries(sessions)) {
            if (sess.type === "full" || (sess.selectedDays?.length ?? 0) > 0) {
              weekNumbers.push(wk.replace("week", ""));
            }
          }
        }
        await tagConvertKit(reg.parent.email, reg.parent.firstName, [...new Set(weekNumbers)]);
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
      recentFeedback: feedback.slice(0, 20).map(f => ({
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

export default http;
