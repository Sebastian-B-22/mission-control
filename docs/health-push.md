# Health push (safer default)

Mission Control can show host health check results even when the OpenClaw Gateway is offline.

This works by **pushing** results from the operator host (Mac mini) into Convex via an **agent-key-protected HTTP endpoint**, then rendering the latest persisted results in Agent HQ.

## What gets pushed

- `openclaw doctor` → stored as `kind: "doctor"`
- `openclaw security audit --deep` → stored as `kind: "security_audit"`

Each pushed run is stored in Convex table `healthRuns`:

- `userId`
- `kind` (`doctor` | `security_audit`)
- `status` (`ok` | `warn` | `critical`)
- `counts` (optional) `{ critical, warn, info }`
- `rawText`
- `createdAt`

Agent HQ shows the latest run for each kind under **Health → Latest pushed checks**.

## HTTP endpoint

Base URL (prod): `https://harmless-salamander-44.convex.site`

- `POST /health/runs/ingest`
  - Header: `X-Agent-Key: <MC_AGENT_KEY>`
  - Body:
    - `clerkId` (required)
    - `kind` (required) `doctor` | `security_audit`
    - `status` (required) `ok` | `warn` | `critical`
    - `counts` (optional) `{ critical, warn, info }`
    - `rawText` (required)
    - `createdAt` (optional)

## Mac mini scripts

From workspace root:

### Push memory snapshots

```bash
MC_HTTP_BASE_URL=https://harmless-salamander-44.convex.site \
MC_AGENT_KEY=sk-sebastian-mc-2026 \
MC_CLERK_ID=<clerk_user_id> \
node scripts/mc-push-memory-snapshots.mjs
```

### Run + push health

```bash
MC_HTTP_BASE_URL=https://harmless-salamander-44.convex.site \
MC_AGENT_KEY=sk-sebastian-mc-2026 \
MC_CLERK_ID=<clerk_user_id> \
node scripts/mc-run-and-push-health.mjs
```

## Recommended cadence (not scheduled yet)

Suggested starting point:

- `mc-run-and-push-health.mjs`: 1-2x/day (morning + evening), and after major upgrades
- `mc-push-memory-snapshots.mjs`: 1x/day (early morning) or after noteworthy work sessions

If you want, we can add cron entries later once the endpoint + UI are stable.
