# Pending / Next Up (MVP)

Mission Control’s lightweight tracker for open items (formerly called “open loops”).

## Data model

Convex table: `pendingItems`

Fields:
- `title` (string)
- `details` (string, optional)
- `owner` (string) - e.g. `corinne`, `sebastian`, `scout`, or `unassigned`
- `status` (`open` | `blocked` | `done`)
- `source` (`huddle` | `telegram` | `manual`)
- `dueAt` (number ms timestamp, optional)
- `tags` (string[])
- `createdAt` (number ms timestamp)
- `updatedAt` (number ms timestamp)

## UI

Location: **Agent Ops → Agent HQ**

Panel: **Pending / Next Up**
- Quick add (title + optional details + owner + tags)
- List view
- Actions: Mark done, Block, Unblock
- Filters: owner (free text), tag, include done

## Agent / poller API (optional)

Convex HTTP endpoint:

- `POST /pending-items/create`

Headers:
- `X-Agent-Key: <agent key>`

Body:
```json
{
  "title": "OPEN LOOP: send updated schedule to parents",
  "details": "Include April dates",
  "owner": "corinne",
  "source": "huddle",
  "tags": ["aspire", "comms"],
  "dueAt": 1760000000000
}
```

Notes:
- The poller (or any agent) can call this when it detects a marker like `OPEN LOOP:` in a huddle message.
- Mission Control currently does **not** auto-parse huddle messages into pending items; the poller can do that upstream.
