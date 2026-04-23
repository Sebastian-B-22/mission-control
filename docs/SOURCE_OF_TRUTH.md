# Mission Control source of truth

Use this repo as the only live Mission Control app:

- Live repo: `/Users/sebastian/.openclaw/workspace/mission-control`
- Live Vercel project: `mission-control`
- Live production URL: `https://mc.aspiresoccercoaching.com`

## Do not use

The folder below is a stale duplicate and should not be edited or deployed:

- `/Users/sebastian/.openclaw/workspace/projects/mission-control`

## Rules

1. Make Mission Control app changes in `/Users/sebastian/.openclaw/workspace/mission-control` only.
2. Build and deploy from that repo only.
3. If the PWA looks "reverted", first check whether local changes were left uncommitted or whether someone worked in the stale duplicate.
4. Keep frontend and Convex deploys in sync when Agent Ops or dashboard surfaces change.
