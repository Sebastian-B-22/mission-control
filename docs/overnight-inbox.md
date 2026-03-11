# Overnight Inbox (MVP)

A lightweight buffer for overnight ideas/messages that need human triage in the morning.

## What it is

- Convex table: `overnightInbox`
- UI: **Agent Ops → Agent HQ** shows **Overnight Inbox (since 9pm)**
- Actions:
  - Promote to Projects (creates a `sebastianTasks` card)
  - Promote to Pending / Next Up (creates a `pendingItems` entry)
  - Archive

No automatic parsing/LLM extraction - the goal is simply: ingest + triage + promote.

## Data model

`overnightInbox` fields:
- `source`: `"huddle" | "telegram"`
- `channel`: optional string (e.g. huddle channel)
- `topic`: optional string (e.g. telegram topic)
- `text`: string
- `author`: optional string
- `createdAt`: ms timestamp
- `triageStatus`: `"new" | "promoted" | "archived"`
- `promotedTo`: optional `{ taskId?: Id<"sebastianTasks">, pendingItemId?: Id<"pendingItems"> }`
- `tags`: string[]

## HTTP ingest endpoint

Convex HTTP endpoint:

- `POST /overnight-inbox/ingest`
- Auth: `X-Agent-Key` header (same key as other agent HTTP endpoints)
- Base URL:
  - Prod: `https://harmless-salamander-44.convex.site`
  - Dev: `https://healthy-flamingo-415.convex.site`

### Request body

```json
{
  "source": "huddle",
  "channel": "ideas",
  "topic": "ideas",
  "text": "Idea: Add an Overnight Inbox triage panel.",
  "author": "scout",
  "tags": ["triage"],
  "createdAt": 1760000000000
}
```

### Response

```json
{ "ok": true, "id": "..." }
```

## Mac mini poller snippet (huddle-trigger-poll.mjs)

Add a helper to push messages into the inbox during a window (example: 9pm - 7am local).

```js
async function ingestOvernightInbox({ source, channel, topic, text, author, tags, createdAt }) {
  const CONVEX_SITE = process.env.MC_CONVEX_SITE || "https://harmless-salamander-44.convex.site";
  const AGENT_KEY = process.env.MC_AGENT_KEY || "sk-sebastian-mc-2026";

  const res = await fetch(`${CONVEX_SITE}/overnight-inbox/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Agent-Key": AGENT_KEY,
    },
    body: JSON.stringify({
      source,
      channel,
      topic,
      text,
      author,
      tags,
      createdAt,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Overnight inbox ingest failed: ${res.status} ${body}`);
  }

  return res.json();
}

function isOvernightWindow(d = new Date()) {
  const hour = d.getHours();
  // 21:00 - 06:59
  return hour >= 21 || hour < 7;
}

// When you detect a new huddle message worth capturing:
if (isOvernightWindow()) {
  await ingestOvernightInbox({
    source: "huddle",
    channel: msg.channel || "main",
    topic: undefined,
    text: msg.message,
    author: msg.agent,
    tags: ["overnight"],
    createdAt: msg.createdAt,
  });
}
```

Notes:
- Keep it conservative: only ingest the messages you actually want to triage.
- `createdAt` can be the original message timestamp; otherwise omit and Convex will use `Date.now()`.
