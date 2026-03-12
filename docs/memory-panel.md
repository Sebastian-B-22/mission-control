# Memory Panel (Vercel-safe)

## What it is
A simple, read-only file browser for "memory snapshots".

This is designed for Vercel deployments where direct access to the server filesystem (e.g. `~/.openclaw/workspace/memory`) is not available.

## Data model (Convex)
Table: `memorySnapshots`
- `userId` (Id<"users">)
- `path` (string)
- `content` (string)
- `updatedAt` (number, ms)
- `createdAt` (number, ms)
- `source` (optional string)

## UI
Dashboard view: **Memory Panel**
- Left: file tree (built from paths)
- Right: preview of selected file

## Ingest endpoint
Convex HTTP endpoint:
- `POST /memory/snapshots/ingest`
- Header: `X-Agent-Key: <agent key>`

Body:
```json
{
  "clerkId": "user_xxx",
  "source": "mac-mini-sync",
  "files": [
    { "path": "memory/2026-03-11.md", "content": "...", "updatedAt": 1710000000000 },
    { "path": "MEMORY.md", "content": "..." }
  ]
}
```

Response:
```json
{ "ok": true, "upserted": 2 }
```

## Notes
- This is intentionally MVP-level: it doesn’t attempt backlinks or cross-file graphing.
- It’s compatible with a local sync script that periodically uploads memory files.
