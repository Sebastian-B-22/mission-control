# Piece 10 Cleanup Queue

Status: queued after the July 7 recovery cutover.

## Freeze Lift

The recovery freeze is lifted after production was verified on the new
main deploy. Normal deploy discipline resumes:

1. Branch.
2. Preview.
3. Human approval.
4. Merge.
5. Git-triggered deploy.

Manual production patches remain banned. Production deploys are still
deploys and require the normal approval path.

## Cleanup Items

1. Worktree consolidation
   - Inventory Mission Control worktrees and duplicate checkouts.
   - Identify the canonical repo/worktree.
   - Propose archive or branch actions for duplicates.
   - Do not delete anything without approval.

2. Duplicate Vercel project retirement
   - Inventory Mission Control-related Vercel projects.
   - Confirm the canonical project is `mission-control`.
   - Confirm whether `mission-control-deploy` is obsolete.
   - Retire/archive the duplicate only after explicit approval.

3. Canonical deploy path
   - Document GitHub repo, Vercel project, production branch, custom
     domain, preview flow, and rollback procedure.
   - Include the per-layer completeness gate before cutovers.

4. H1 handoff
   - After Piece 10 is reviewed, continue HTA H1 in the dedicated
     `hta-pwa` repo.
   - H1 scope follows HTA Launch Plan v1.1: installability plus
     trust/legal first; no H2 auth/payment/backend work yet.
