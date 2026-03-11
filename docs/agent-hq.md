# Agent HQ (Mission Control)

Agent HQ is a lightweight ops panel inside Mission Control.

## What it includes

- **Quick Send** - write a message and choose a topic (Operations / Marketing / Family / Ideas / General). This **queues** the message for delivery to Telegram.
- **What’s happening** - a simple feed of the most recent Agent Huddle messages (filterable by channel).
- **Pings for you** - recent huddle items that mention `@corinne`.

## How Quick Send delivery works

Because the OpenClaw Gateway runs loopback-only on the Mac mini, Vercel can’t directly send Telegram messages.

Instead, Mission Control queues messages into Convex (`telegramOutbox`). A host-side poller (running on the Mac mini) should:

1. **GET** pending items from Convex HTTP:
   - `GET https://<your-convex-site>/telegram/outbox?limit=20`
2. For each item, send to the correct Telegram topic in the Agent HQ supergroup (`-1003760420567`) using OpenClaw’s Telegram routing (default/scout/maven/compass/james).
3. Mark success/failure back to Convex:
   - `POST /telegram/outbox/sent` with `{ id, telegramMessageId? }`
   - `POST /telegram/outbox/failed` with `{ id, error }`

### Topic mapping

The queued payload contains `topic`:

- `operations`
- `marketing`
- `family`
- `ideas`
- `general`

The poller is responsible for mapping these to Telegram **topic/thread IDs** inside the Agent HQ supergroup.

## UI location

Sidebar: **Agent Ops → Agent HQ**

## API route

Mission Control UI calls:

- `POST /api/agent-hq/send` with `{ text, topic }`

This enqueues into Convex `telegramOutbox`.
