# Mission Control - Task Board API

**Built:** Feb 18, 2026  
**Status:** Live on prod (harmless-salamander-44)  
**Purpose:** Allows Sebastian and other agents to programmatically read/write tasks on Mission Control's Kanban board

---

## Overview

The Shared Task Board upgrade added:
1. **New schema fields** on `sebastianTasks`: `assignedTo`, `agentNotes`, `lastUpdatedBy`
2. **HTTP endpoints** so agents can call Convex without the browser
3. **Updated Kanban UI** with assignee badges, color coding, agent notes, and "Assign to Sebastian" button

Corinne sees the task board at [mission-control-kappa-peach.vercel.app](https://mission-control-kappa-peach.vercel.app) → Sebastian tab → Projects.

---

## Quick Start

```bash
# List Sebastian's active tasks
curl -s -H "X-Agent-Key: sk-sebastian-mc-2026" \
  "https://harmless-salamander-44.convex.site/tasks?clerkId=user_39OvUeL8WpfRGbmQRP5UFiurhNe&assignedTo=sebastian"

# Create a task
curl -s -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{"clerkId":"user_39OvUeL8WpfRGbmQRP5UFiurhNe","title":"My new task","assignedTo":"sebastian","priority":"high"}' \
  "https://harmless-salamander-44.convex.site/tasks/create"
```

---

## Connection Details

| Key | Value |
|-----|-------|
| **Prod HTTP Base URL** | `https://harmless-salamander-44.convex.site` |
| **Dev HTTP Base URL** | `https://healthy-flamingo-415.convex.site` |
| **API Key** | `sk-sebastian-mc-2026` (default; change in Convex env vars) |
| **Clerk ID (Corinne)** | `user_39OvUeL8WpfRGbmQRP5UFiurhNe` |
| **Convex User ID** | `jh75gmnnm3fbybwq09fy4z1mzd80s3kt` |
| **Convex Dashboard** | `https://dashboard.convex.dev/d/harmless-salamander-44` |

---

## Authentication

All endpoints require the `X-Agent-Key` header.

```
X-Agent-Key: sk-sebastian-mc-2026
```

To change the key: set `AGENT_API_KEY` in the [Convex environment variables dashboard](https://dashboard.convex.dev/d/harmless-salamander-44/settings/environment-variables).

Without the correct key, all endpoints return:
```json
{"error": "Unauthorized"}
```

---

## Endpoints

### `GET /tasks` - List Tasks

List tasks, with optional filters.

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `clerkId` | ✅ Yes | Clerk user ID (use Corinne's ID above) |
| `assignedTo` | No | Filter by assignee: `sebastian`, `corinne`, `scout`, `maven`, `compass`, `james` |
| `status` | No | Filter by status: `backlog`, `todo`, `in-progress`, `done` |

**Example - Get Sebastian's in-progress tasks:**
```bash
curl -s -H "X-Agent-Key: sk-sebastian-mc-2026" \
  "https://harmless-salamander-44.convex.site/tasks?clerkId=user_39OvUeL8WpfRGbmQRP5UFiurhNe&assignedTo=sebastian&status=in-progress"
```

**Example - Get all tasks:**
```bash
curl -s -H "X-Agent-Key: sk-sebastian-mc-2026" \
  "https://harmless-salamander-44.convex.site/tasks?clerkId=user_39OvUeL8WpfRGbmQRP5UFiurhNe"
```

**Response:**
```json
{
  "tasks": [
    {
      "_id": "m57fb8kr...",
      "title": "Set up Google Calendar integration",
      "status": "in-progress",
      "priority": "high",
      "category": "infrastructure",
      "assignedTo": "sebastian",
      "agentNotes": "OAuth flow complete, now setting up webhook",
      "lastUpdatedBy": "sebastian",
      "createdAt": 1771446009203,
      "completedAt": null,
      "userId": "jh75gmnn..."
    }
  ],
  "count": 1
}
```

---

### `POST /tasks/create` - Create a Task

Create a new task on the board.

**Body (JSON):**
| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `clerkId` | ✅ Yes | - | Clerk user ID |
| `title` | ✅ Yes | - | Task title |
| `description` | No | - | Longer description |
| `priority` | No | `"medium"` | `"low"` \| `"medium"` \| `"high"` |
| `category` | No | `"agent-squad"` | `"infrastructure"` \| `"hta"` \| `"aspire"` \| `"agent-squad"` \| `"skills"` \| `"other"` |
| `assignedTo` | No | - | `"corinne"` \| `"sebastian"` \| `"scout"` \| `"maven"` \| `"compass"` \| `"james"` |
| `agentNotes` | No | - | Initial note or context |
| `status` | No | `"todo"` | `"backlog"` \| `"todo"` \| `"in-progress"` \| `"done"` |
| `lastUpdatedBy` | No | `"sebastian"` | Who created this task |

**Example - Sebastian creates a task for itself:**
```bash
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "clerkId": "user_39OvUeL8WpfRGbmQRP5UFiurhNe",
    "title": "Review Aspire Spring registrations",
    "description": "Check Quo for new registration inquiries and update Corinne",
    "priority": "high",
    "category": "aspire",
    "assignedTo": "sebastian",
    "status": "in-progress",
    "agentNotes": "Starting review now. Found 3 new inquiries in Quo."
  }' \
  "https://harmless-salamander-44.convex.site/tasks/create"
```

**Response:**
```json
{"success": true, "taskId": "m57fb8kr3ydkb30xtpqggppqx581d8n9"}
```

Save the `taskId` - you'll need it to update the task later.

**Example - Scout creates a task after Quo monitor:**
```bash
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "clerkId": "user_39OvUeL8WpfRGbmQRP5UFiurhNe",
    "title": "Follow up with 3 Quo inquiries from tonight",
    "category": "aspire",
    "assignedTo": "corinne",
    "priority": "high",
    "agentNotes": "Scout 9:30 PM run found: 2 PDP inquiries (Maria & David), 1 Spring League question (Jessica). All need reply by tomorrow.",
    "lastUpdatedBy": "scout"
  }' \
  "https://harmless-salamander-44.convex.site/tasks/create"
```

---

### `POST /tasks/update` - Update Task Status

Move a task between columns or update its state.

**Body (JSON):**
| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `taskId` | ✅ Yes | - | Convex task ID (from create response or GET) |
| `status` | ✅ Yes | - | New status |
| `agentNotes` | No | - | Updated progress note |
| `lastUpdatedBy` | No | `"sebastian"` | Who made this update |

**Example - Mark a task as done:**
```bash
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "m57fb8kr3ydkb30xtpqggppqx581d8n9",
    "status": "done",
    "agentNotes": "Completed! Sent follow-up emails to all 3 families. Allie confirmed receipts.",
    "lastUpdatedBy": "sebastian"
  }' \
  "https://harmless-salamander-44.convex.site/tasks/update"
```

**Example - Start working on a task:**
```bash
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "m57fb8kr3ydkb30xtpqggppqx581d8n9",
    "status": "in-progress",
    "agentNotes": "Running Quo scan now...",
    "lastUpdatedBy": "scout"
  }' \
  "https://harmless-salamander-44.convex.site/tasks/update"
```

**Response:**
```json
{"success": true}
```

---

### `POST /tasks/note` - Add a Progress Note

Update just the agent notes on a task (without changing status).

**Body (JSON):**
| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `taskId` | ✅ Yes | - | Convex task ID |
| `note` | ✅ Yes | - | The note text (replaces previous note) |
| `updatedBy` | No | `"sebastian"` | Agent name |

**Example - Mid-task progress update:**
```bash
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "m57fb8kr3ydkb30xtpqggppqx581d8n9",
    "note": "47 Quo messages scanned. Found 3 action items. Preparing summary for Corinne.",
    "updatedBy": "scout"
  }' \
  "https://harmless-salamander-44.convex.site/tasks/note"
```

**Response:**
```json
{"success": true}
```

---

## Using `npx convex run` (Alternative - No HTTP)

If you have access to the deployment credentials, you can also call mutations directly via CLI:

```bash
cd /Users/sebastian/.openclaw/workspace/mission-control

# Create a task
CONVEX_DEPLOY_KEY="prod:harmless-salamander-44|..." \
npx convex run sebastianTasks:createTask '{
  "userId": "jh75gmnnm3fbybwq09fy4z1mzd80s3kt",
  "title": "My task",
  "assignedTo": "sebastian",
  "priority": "high"
}'

# Update status
CONVEX_DEPLOY_KEY="prod:harmless-salamander-44|..." \
npx convex run sebastianTasks:updateTaskStatus '{
  "id": "TASK_ID_HERE",
  "status": "done",
  "agentNotes": "Completed successfully"
}'

# Add a note
CONVEX_DEPLOY_KEY="prod:harmless-salamander-44|..." \
npx convex run sebastianTasks:addAgentNote '{
  "id": "TASK_ID_HERE",
  "note": "Progress update: halfway done",
  "updatedBy": "sebastian"
}'

# Query tasks
CONVEX_DEPLOY_KEY="prod:harmless-salamander-44|..." \
npx convex run sebastianTasks:getActiveTasks '{
  "userId": "jh75gmnnm3fbybwq09fy4z1mzd80s3kt",
  "assignedTo": "sebastian",
  "status": "todo"
}'
```

Note: Use the full deploy key from `.env.production.local`.

---

## Schema Reference

The `sebastianTasks` table now has these fields:

```typescript
{
  _id: string,              // Convex ID (use as taskId in API calls)
  userId: string,           // Convex user ID (internal)
  title: string,            // Task title
  description?: string,     // Optional longer description
  status: "backlog" | "todo" | "in-progress" | "done",
  priority: "low" | "medium" | "high",
  category: string,         // "infrastructure" | "hta" | "aspire" | "agent-squad" | "skills" | "other"
  
  // NEW FIELDS (Sprint 1 upgrade)
  assignedTo?: string,      // "corinne" | "sebastian" | "scout" | "maven" | "compass" | "james"
  agentNotes?: string,      // Agent status/progress note (shown on card in UI)
  lastUpdatedBy?: string,   // Who last touched this task
  
  createdAt: number,        // Unix timestamp ms
  completedAt?: number,     // Set automatically when status → "done"
}
```

---

## UI Changes

The Kanban board at Mission Control now shows:
- **Assignee badge** on each card (color-coded by person/agent)
- **Agent notes** displayed in a chat bubble style below description
- **Filter buttons** at top: All / Corinne / Sebastian / Scout / Maven
- **Color-coded left borders** by assignee (amber=Sebastian, purple=Corinne, blue=Scout, green=Maven)
- **"Assign to Sebastian" button** (⚡ icon) appears on hover for any unassigned or non-Sebastian card
- **Stats bar** showing total tasks, Sebastian tasks, in-progress count

---

## Patterns for Agents

### Pattern 1: Scout Quo Monitor

At the end of each Quo scan, Scout should:

```bash
# 1. Create a task for any action items found
TASK_RESP=$(curl -s -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d "{
    \"clerkId\": \"user_39OvUeL8WpfRGbmQRP5UFiurhNe\",
    \"title\": \"Quo action items - $(date +%Y-%m-%d)\",
    \"category\": \"aspire\",
    \"assignedTo\": \"corinne\",
    \"priority\": \"high\",
    \"agentNotes\": \"Scout found: X families need follow-up. Details: ...\",
    \"lastUpdatedBy\": \"scout\"
  }" \
  "https://harmless-salamander-44.convex.site/tasks/create")
echo "Created: $TASK_RESP"
```

### Pattern 2: Sebastian Starting a Task

When Sebastian picks up a task from the board:

```bash
# Mark as in-progress with context
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"TASK_ID\",
    \"status\": \"in-progress\",
    \"agentNotes\": \"Starting now. ETA ~20 minutes.\",
    \"lastUpdatedBy\": \"sebastian\"
  }" \
  "https://harmless-salamander-44.convex.site/tasks/update"
```

### Pattern 3: Sebastian Completing a Task

```bash
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"TASK_ID\",
    \"status\": \"done\",
    \"agentNotes\": \"Completed. Summary: [what was done]. No follow-up needed.\",
    \"lastUpdatedBy\": \"sebastian\"
  }" \
  "https://harmless-salamander-44.convex.site/tasks/update"
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `{"error":"Unauthorized"}` | Check your `X-Agent-Key` header value |
| `{"error":"User not found..."}` | Use clerkId `user_39OvUeL8WpfRGbmQRP5UFiurhNe` |
| `{"error":"Task not found..."}` | The taskId is wrong; re-query GET /tasks to find it |
| Schema errors in Convex | Run `npx convex dev --once` from the mission-control dir |

---

## Files Changed

| File | Change |
|------|--------|
| `convex/schema.ts` | Added `assignedTo`, `agentNotes`, `lastUpdatedBy` to `sebastianTasks` |
| `convex/sebastianTasks.ts` | Added `createTask`, `updateTaskStatus`, `addAgentNote`, `getActiveTasks` mutations/queries + internal versions for HTTP |
| `convex/http.ts` | **NEW** - HTTP router with 4 endpoints |
| `components/SebastianKanban.tsx` | Assignee badges, color coding, filter bar, agent notes, "Assign to Sebastian" button |

---

*Written by Sebastian subagent | Feb 18, 2026*
