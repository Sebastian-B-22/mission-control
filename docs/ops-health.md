# Ops - Health (Doctor + Security Audit)

Mission Control can *display* operator-host health info, but it cannot run local shell commands itself (Vercel/Next is sandboxed).

So the UI proxies health commands through an **OpenClaw Gateway** running on the operator host (Mac mini).

## What shipped

- Agent Ops -> Agent HQ -> **Health** panel
  - **Run OpenClaw Doctor** (read-only)
  - **Run Security Audit (deep)**
  - Results are summarized by severity (Critical/Warn/Info) and the raw output is expandable.
- Dashboard top-bar badge: **Gateway Connected / Disconnected**
- When gateway is disconnected, health actions are disabled and we show a small callout instead of noisy errors.

## Configuration

Set this env var for the Next app:

- `OPENCLAW_GATEWAY_URL=https://<your-gateway-host>:<port>`

The app probes:

- `GET ${OPENCLAW_GATEWAY_URL}/healthz`

and runs ops commands via:

- `POST ${OPENCLAW_GATEWAY_URL}/ops/doctor` (expected to return `{ output: string }` or raw text)
- `POST ${OPENCLAW_GATEWAY_URL}/ops/security-audit` (expected to return `{ output: string }` or raw text)

## Notes

- This is UI-only for now - **no autofix**.
- If the gateway routes differ on your host, update the proxy routes in:
  - `app/api/gateway/status/route.ts`
  - `app/api/gateway/doctor/route.ts`
  - `app/api/gateway/security-audit/route.ts`
