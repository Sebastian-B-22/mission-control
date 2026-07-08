# Recovery Completeness Gate

Use this before any recovery or migration cutover. Every layer gets its
own parity check. A zero in one layer does not clear another layer.

## Required Zeroes

| Layer | Source of truth | Gate output |
|---|---|---|
| Backend functions | Convex generated API/function list | `missing_backend_functions = 0` |
| Frontend routes | `app/**/page.tsx` plus public route smoke URLs | `missing_frontend_routes = 0` |
| Views/components | dashboard render targets and `components/views/*` | `missing_frontend_views = 0` |
| Navigation | sidebar/nav entries, active views, href targets | `missing_nav_entries = 0` |
| Assets | icons, manifest, service worker, public assets | `missing_assets = 0` |
| Config | env target, Vercel aliases, domains, auth guards | `missing_config_items = 0` |

## Cutover Rule

Do not move production aliases until all rows above read zero and the
preview has passed the named smoke checks for the surfaces that were
known to regress.

## Minimum Smoke Checks

- Dashboard root and selected `?view=` routes load behind auth.
- Known public routes return 200.
- The previous regression surfaces are named and checked explicitly.
- Vercel aliases are confirmed before and after the cutover.
- If any pre-alias check fails, hold the known-good deploy and report.
