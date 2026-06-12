# Mission Control Audit Brief

## Goal 1 (primary): UI/Visual Design Review
The app is functional but visually inconsistent. Audit and recommend:
- Color audit: every color currently used across the app (pull actual hex/class/OKLCH/RGB values), grouped by where they appear. Flag inconsistencies such as repeated near-blacks (`zinc-950`, `zinc-900`, `zinc-800`, custom black overlays), several amber/orange/red accent patterns, and multiple one-off domain palettes.
- Propose a design token system: one centralized palette - primary, secondary, accent, semantic colors (success/warning/error), neutrals - with `app/globals.css` / Tailwind 4 `@theme` as the recommended single source of truth, plus a small `lib/categoryColors.ts` bridge for domain/category colors.
- Typography: font sizes/weights in use, propose a consistent scale. Pay attention to dashboard cards, sidebar labels, table text, page headers, metric numbers, kid/family surfaces, and operational dense views.
- Spacing & layout: inconsistent padding/margins/card styles across views; propose standard spacing scale and card/table/button components using the existing `components/ui` primitives.
- Visual hierarchy: identify dashboards that are hard to scan and recommend what should be emphasized (status, numbers, alerts, next actions) vs. de-emphasized (secondary copy, old debug/status details, repeated labels).
- Component upgrade candidates: where nicer elements would help - stat cards, progress indicators, status badges, charts, empty states, loading states, tables, section headers, filters, calendar rows, agent status blocks, finance cards, and Aspire roster/session cards. Recommend specific improvements while keeping the existing stack; do not add a heavy UI library without flagging the tradeoff.
- Deliverable: `UI_RECOMMENDATIONS.md` ranked by visual impact vs. effort, with a proposed phase 1 (color tokens + consistency) and phase 2 (component polish).

## Goal 2 (secondary): Dead Code Cleanup
- Unused components, routes/views no longer linked from anywhere.
- Unused dependencies in `package.json`.
- Stale code from parked projects: legacy standalone `/families` page that predates dashboard Family CRM, old/duplicate homeschool progress views (`HomeschoolProgressView.tsx` and `HomeschoolProgressViewNew.tsx`), old `Sidebar.tsx` vs current `SidebarNew.tsx`, old Read Aloud components (`ReadAloudList.tsx`, `ReadAloudListDB.tsx`) if no longer routed, old registration/admin surfaces superseded by Aspire dashboard views, root-level temporary inspection/repair scripts, and historical deployment/status docs that may not reflect the live app.
- Deliverable: append a `CLEANUP_CANDIDATES` section to `AUDIT_REPORT.md` - list only, nothing deleted without approval.

## Known issues to verify
- Mission Control has accumulated many feature palettes quickly: dark zinc/amber admin shell, bright public World Cup pages, HTA/kid gradients, Aspire operational cards, finance colors, health colors, and knowledge/docs surfaces. The audit should identify which colors are intentional brand/domain colors and which are accidental drift.
- Corinne has preferred the more polished Fable/Claude visual direction on HTA work: richer but cleaner hierarchy, cohesive cards, brighter intentional accents, rounded/gradient kid-facing surfaces, and less technical chrome.
- Corinne previously noticed stale or duplicate Mission Control surfaces when an isolated deploy regressed the live app; verify current navigation against actual rendered views before calling anything dead.
- Agent Ops has had stale/internal panels questioned before: Memory Panel, Telegram Bridge, and old AI Costs-style operational sections should be checked for current usefulness and whether they belong in primary navigation.
- Docs/Knowledge viewer had mobile/PWA back/print/PDF issues; verify the current visual layout is cohesive, but do not change file handling behavior without approval.
- Finance was requested as a less-avoidant personal + business finance dashboard; audit whether the current visual design makes the scary parts scannable and approachable.
- Aspire pages should feel operational, dense, and clear, not like a marketing page. Review Camps, Spring, PDP, 7v7, Family CRM, and Coach Staffing for table/card consistency.

## Constraints
- Read-only first session: produce `AUDIT_REPORT.md` + `UI_RECOMMENDATIONS.md`, zero code changes.
- All later changes in small approved phases on `audit-cleanup` branch.
- Nothing Challenge-adjacent merges or deploys before July 19.
- Do not run deploys from Claude Code.
- Do not edit Convex schema, payment/contact mutations, SMS/email senders, Stripe webhooks, or public World Cup Challenge code during the audit cleanup pass.
