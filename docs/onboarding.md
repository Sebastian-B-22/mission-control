# Onboarding Wizard (Mission Control)

## What it is
A lightweight onboarding modal that:
- Auto-prompts the first time a user opens the dashboard (unless dismissed).
- Is always accessible via **Settings** in the top bar.
- Persists per-user completion state in Convex.

## Checklist steps
- Projects basics
- Pending/Next Up
- Overnight Inbox
- Gateway connectivity (optional)
- Run Health checks

## Data model (Convex)
Table: `onboardingState`
- `userId` (Id<"users">)
- `dismissed` (boolean)
- `steps` (object of booleans)
  - `projectsBasics`
  - `pendingNextUp`
  - `overnightInbox`
  - `gatewayConnectivity`
  - `runHealthChecks`
- `createdAt`, `updatedAt`

## Client behavior
- Dashboard queries `onboarding.getOrCreate`.
- If `dismissed === false` and not all steps are completed, it opens the onboarding modal.
- Settings -> "Reset progress" calls `onboarding.reset`.

## Notes
This is intentionally MVP-level: it’s a checklist + navigation shortcuts, not a multi-step form.
