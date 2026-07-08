# Canonical Deploy Path

## Mission Control

- GitHub repo: `Sebastian-B-22/mission-control`
- Vercel project: `mission-control`
- Production branch: `main`
- Production domain: `mc.aspiresoccercoaching.com`
- Current recovered production deploy: `mission-control-jqrb2vdls`
- Current recovered production commit: `228538e`

## Normal Flow

1. Create a focused branch.
2. Let Vercel create a preview deploy.
3. Run required parity and smoke gates.
4. Get human approval.
5. Merge to `main`.
6. Verify the production Git deploy and aliases.

## Rollback Flow

If a production regression is user-blocking, promote the last
known-good Vercel deploy and then fix forward through branch,
preview, approval, merge. Do not patch production by hand.

## Cutover Gate

Any recovery or migration must pass the per-layer gate in
`docs/RECOVERY_COMPLETENESS_GATE.md` before aliases move.
