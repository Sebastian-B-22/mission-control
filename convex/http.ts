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
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Re-export type so TypeScript can use it
type ContentType = "x-post" | "email" | "blog" | "landing-page" | "other";
type ContentStage = "idea" | "draft" | "review" | "approved" | "published";

const http = httpRouter();

// ─── Helper: validate agent API key ───────────────────────────────────────

// Convex supports process.env for environment variables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
//   stage       (optional) - "idea" | "draft" | "review" | "approved" | "published" (default: "draft")
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

    const stage = (body.stage as string) ?? "draft";
    const validStages: ContentStage[] = ["idea", "draft", "review", "approved", "published"];
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
    const validStages: ContentStage[] = ["idea", "draft", "review", "approved", "published"];
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

    const validStages: ContentStage[] = ["idea", "draft", "review", "approved", "published"];
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

export default http;
