# Unified Cost Tracker (MVP)

## What it is
A minimal cost tracking system for AI usage inside Mission Control.

It includes:
- A small dashboard card (Daily view)
- A dedicated page: **AI Costs**
- An agent-ingest HTTP endpoint for automation

## Data model (Convex)
Table: `costEvents`
- `userId` (Id<"users">)
- `agent` (string)
- `model` (string)
- `inputTokens` (optional number)
- `outputTokens` (optional number)
- `costUsd` (number)
- `createdAt` (number, ms)

## Aggregations
Convex query: `costTracker.getSummary`
- Today total (Los Angeles day boundary)
- Last 7 days total
- Top models (by cost)
- Top agents (by cost)

## Ingest endpoint (for agents)
Convex HTTP endpoint:
- `POST /cost-events/ingest`
- Header: `X-Agent-Key: <agent key>`

Body:
```json
{
  "clerkId": "user_xxx",
  "agent": "sebastian",
  "model": "gpt-4.1",
  "inputTokens": 1200,
  "outputTokens": 450,
  "costUsd": 0.0123,
  "createdAt": 1710000000000
}
```

Response:
```json
{ "ok": true, "id": "..." }
```

## Notes
This MVP intentionally does NOT pull provider billing feeds. It only tracks what Mission Control can ingest reliably.
