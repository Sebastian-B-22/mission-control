# Mission Control — Audit Report

**Audit date:** 2026-06-11 · **Branch:** `audit-cleanup` · **Session:** read-only — zero product code changes. Deliverables: this report + `UI_RECOMMENDATIONS.md`.

**Method:** static analysis of `app/`, `components/`, `lib/`, `hooks/`, plus an import-graph pass (every internal `from "@/components/..."` / relative import was enumerated and cross-checked against the file inventory) and dependency usage greps. No deploys, no Convex calls, no DO-NOT-TOUCH files modified.

---

## 1. Summary of findings

1. **Design tokens exist but are bypassed.** `app/globals.css` has a full shadcn OKLCH token set and `.dark` is applied at the root, but ~2,000 hardcoded Tailwind palette utilities (zinc/gray/slate + 17 accent families) do the actual styling. Five different "app blacks" are layered (body `bg-black`, `--background`, `bg-zinc-950`, `bg-zinc-900`, the `Card` primitive's hardcoded `bg-zinc-950/40`), plus a sixth in `themeColor: "#0a0a0a"`. Full color audit and remediation plan: `UI_RECOMMENDATIONS.md` §1–2.
2. **Broken font tokens.** `@theme` references `--font-geist-sans`/`--font-geist-mono`, which are never defined; the app actually loads Inter via `inter.className`. `font-mono` utilities silently fall back to browser defaults. (`app/globals.css:10-11`, `app/layout.tsx:7,50`)
3. **11 components are imported by nothing** and 4 dashboard views are unreachable from navigation (details in §3/CLEANUP_CANDIDATES).
4. **2 declared dependencies are never imported** (`recharts`, `date-fns`) — noting that `CLAUDE.md` describes the stack as including "Recharts charts", so this is flagged as a question, not a deletion.
5. **Static content presented as live status.** The sidebar Agent Squad card hardcodes seven agents with permanent green "● Live" badges (`SidebarNew.tsx:493-576`); the four agent profile views hardcode "Recent Work"/"Current Project" facts in JSX (`app/dashboard/page.tsx:404-570`). These match the "stale Agent Ops panels" concern in the brief.
6. **Hardcoded operational data in UI code.** `FinanceView.tsx:90-119` embeds coach names, hourly rates, hours, and payment methods (and a hardcoded "synced Jun 8" timestamp) directly in the component. Visual concern (stale-looking dashboard) and a data-hygiene concern (pay rates in git history). Documented only — payroll-adjacent, no changes made.
7. **Security: committed credential.** `WHOOP-CREDENTIALS.md` contains a live `WHOOP_CLIENT_SECRET` in the repo. Recommend rotating the secret and removing the file (left untouched this session). `convex/health.ts` / API routes were not modified or inspected beyond confirming the doc's nature.
8. **Debug logging in production dashboard.** `console.log('[Dashboard] Clerk user.id', …)` runs on every render (`app/dashboard/page.tsx:105-106`).
9. **Health score color logic disagrees with itself.** `getScoreColor` (ring) and `getScoreTextClass` (text) map the 70–84 band to green vs. purple respectively (`components/views/HealthDashboard.tsx:47-62`). Likely an unnoticed bug.
10. **Legacy `/families` page is live but unlinked**, renders a light `bg-gray-50` theme inside an otherwise dark app, and fetches from a **hardcoded production Convex URL** (`app/families/page.tsx:38,45`). Superseded by the dashboard Family CRM (`aspire-families`). It reads family/contact data, so it is listed as a cleanup candidate only — no change made.

## 2. Navigation vs. rendered views (verification requested by brief)

Every view the sidebar (`SidebarNew.tsx`) can emit was checked against the `renderContent()` switch in `app/dashboard/page.tsx`. Results:

- **All sidebar entries resolve to a rendered case.** No dead nav links found, including dynamic RPM category children, `aspire-pali`/`aspire-agoura`, the HTA children, and the Agent Ops group. Agent Squad card clicks (`agent-scout`, `agent-maven`, `agent-compass`, `agent-james`) also resolve.
- **Four switch cases are unreachable from any navigation** (deep-linkable only via `?view=`):
  - `agent-hq` → `AgentHQ`
  - `memory-panel` → `MemoryPanelView` (the "Memory Panel" the brief flags; sidebar "Memory Search" points at the separate `memory` → `MemoryView`)
  - `cost-tracker` → `CostTrackerView` ("AI Costs"-style panel flagged in the brief; its companion `CostTrackerCard` is imported by the dashboard but never rendered)
  - `agent-huddle` → duplicate of `agent-huddle-main`
- **"Telegram Bridge" panel:** no component or view by that name exists anymore; nothing to remove. (Telegram links appear only inside agent profile copy and the protected `convex/telegramOutbox.ts` tooling, which was not touched.)
- `homeschool-progress` renders `HomeschoolProgressViewNew`; the old `HomeschoolProgressView` is imported by the dashboard (`page.tsx:56`) **but never rendered** — confirming the brief's duplicate-view suspicion.

## 3. Dead/duplicate code verification highlights

- `Sidebar.tsx` vs `SidebarNew.tsx`: only `SidebarNew` is imported. Old `Sidebar.tsx` has zero importers.
- `ReadAloudList.tsx` vs `ReadAloudListDB.tsx`: only the DB variant is imported (×2). Same pattern for `BookLibrary.tsx` (dead) vs `BookLibraryDB`/`BookLibraryVisual` (live), and `TaskList.tsx` (dead) vs `ProjectTaskList` (live, ×8).
- Root-level one-off inspection/repair scripts (16 files, most untracked) and `tmp-*.json` data dumps exist at the repo root; several JSON dumps appear to contain real registration/payment-shaped data (`tmp-paid-regs.json`, `tmp-camp-regs.json`) — recommend deleting locally and gitignoring rather than committing.
- Historical docs at root (`DEPLOY-NOW.md`, `DEPLOYMENT-STATUS.md`, `FINAL-SUMMARY.md`, `STATUS.md`, `SEBASTIAN-TAB-UPDATE.md`, etc.) describe past one-off deployments/updates and do not reflect the live app.

## 4. Open questions for Corinne (documented instead of changed)

1. **`recharts` / `date-fns`:** never imported, but CLAUDE.md lists Recharts as part of the stack. Drop the deps, or is chart work planned (Health/Finance trends in UI Phase 2)?
2. **Orphaned views** (`agent-hq`, `memory-panel`, `cost-tracker`, legacy `agent-huddle`): are any reached via saved `?view=` deep links (bookmarks, agent-sent links, Telegram messages)? If not, remove cases + components; if yes, decide which earn a nav entry.
3. **`/families` legacy page:** confirm nobody (including agents or old bookmarks) still uses it before removal. It hits production Convex directly.
4. **Agent profile pages and the sidebar Agent Squad card:** should agent status/recent-work become data-driven, or should the static panels be removed from primary navigation?
5. **`HomeschoolProgressView` (old):** safe to delete once the dashboard import is dropped, or is it kept deliberately as a fallback?
6. **`WHOOP-CREDENTIALS.md`:** confirm the client secret can be rotated; the file should then be deleted from the repo (history scrub optional but recommended).
7. **FinanceView hardcoded payroll table:** move to Convex (behavior change, payroll-adjacent — explicitly out of scope for the cleanup pass without approval)?
8. **Uncommitted work on `audit-cleanup`:** the branch carries ~40 modified files and many untracked product files that predate this audit session. None were touched, but the working tree is not clean — worth committing or stashing that work under its own message before cleanup phases begin, so cleanup diffs stay reviewable.

---

## CLEANUP_CANDIDATES

List only — **nothing deleted, nothing modified.** Each item verified by import-graph analysis (zero importers unless noted). DO-NOT-TOUCH files excluded.

### A. Unused components (zero importers)

| File | Superseded by / note |
|---|---|
| `components/Sidebar.tsx` | `SidebarNew.tsx` |
| `components/TaskList.tsx` | `ProjectTaskList.tsx` |
| `components/ReadAloudList.tsx` | `ReadAloudListDB.tsx` |
| `components/BookLibrary.tsx` | `BookLibraryDB.tsx` / `BookLibraryVisual.tsx` |
| `components/AgentTrainingCenter.tsx` | `AgentLearningsReview` ("Training" view) |
| `components/AspireMonthSwimlanes.tsx` | (HTAMonthSwimlanes is still used; the Aspire one is not) |
| `components/CoachHubWidget.tsx` | `views/CoachHubView.tsx` |
| `components/DashboardTopBar.tsx` | not rendered anywhere |
| `components/GatewayBadge.tsx` | not rendered anywhere (note: `hooks/` gateway-status hook may also become unused if removed — verify) |
| `components/JournalPrompts.tsx` | `MorningMindset` / `EveningReflection` |
| `components/MonthlyItinerary.tsx` | `MonthlyRPMView` / `MonthlyFocus` |
| `components/CostTrackerCard.tsx` | imported in `app/dashboard/page.tsx:81` but never rendered — dead import **and** dead component |

### B. Dead imports / unreachable views in `app/dashboard/page.tsx`

- Import of `HomeschoolProgressView` (line 56) — never rendered; `homeschool-progress` uses `HomeschoolProgressViewNew`. Old view file becomes deletable once import is removed (pending Q5).
- Import of `CostTrackerCard` (line 81) — never rendered.
- Switch cases unreachable from navigation (pending Q2): `agent-hq`, `memory-panel`, `cost-tracker`, legacy `agent-huddle` duplicate.
- `console.log` debug lines 105–106.

### C. Legacy standalone routes

- `app/families/page.tsx` — pre-dashboard Family CRM; unlinked; light theme; hardcoded production Convex URL; reads family/contact data (pending Q3 — flag, don't guess).

### D. Unused dependencies (`package.json`)

- `recharts` — zero imports (pending Q1)
- `date-fns` — zero imports

(All other deps verified in use, including `canvas-confetti`, `jspdf`/`jspdf-autotable`, `web-push`, the `radix-ui` monolith + the three scoped `@radix-ui/*` packages, and `shadcn` as a devDependency CLI.)

### E. Root-level one-off scripts and data dumps

Inspection/debug/repair scripts (one-time use; several connect to production):
`check-two-users.mjs`, `check-weekly-user.mjs`, `debug-all-schedule.mjs`, `debug-calendar-events.mjs`, `delete-schedule-duplicates.mjs`, `find-duplicate-schedule-items.mjs`, `fix-duplicate-schedule.mjs`, `inspect-users.mjs`, `inspect_live_queries.mjs`, `inspect_user_dupes.mjs`, `list-all-events.mjs`, `list-all-schedule-blocks.mjs`, `list_users_by_clerk.mjs`, `repair_regressions.mjs`, `tmp_fix_readaloud_from_library.mjs`, `tmp_fix_readaloud_titles.mjs`, `tmp_inspect_regressions.mjs`, `tmp_restore_readaloud.mjs`, `verify-synced-user.mjs`

Data/artifact dumps (some contain real registration/payment-shaped data — delete locally + gitignore, do not commit):
`tmp-camp-regs.json`, `tmp-paid-regs.json`, `tmp-pali-migration-*.json` (×3), `tmp/` (World Cup printable PDFs/PNGs — **verify not Challenge-adjacent before removal; if uncertain, leave**), `tsconfig.tsbuildinfo` (build artifact)

`scripts/` also contains likely-stale one-offs (`reimport-books*.mjs` ×4, `delete-dupes.mjs`, `delete-books.mjs`, `seed-registration-counts.*`) — lower priority, some may still be operational tooling; confirm before removal.

### F. Historical / stale docs at repo root

`DEPLOY-NOW.md`, `DEPLOYMENT-STATUS.md`, `FINAL-SUMMARY.md`, `STATUS.md`, `SEBASTIAN-TAB-UPDATE.md`, `HEALTH-DASHBOARD.md`, `QUICKSTART.md`, `SETUP.md`, `WHOOP-SETUP.md` — describe past states/one-off deployments. Candidates to archive into `docs/archive/` rather than delete.

**Special case:** `WHOOP-CREDENTIALS.md` — contains a live client secret. Rotate first, then remove (Q6). Highest-priority item in this list.

### G. Explicitly NOT candidates (verified in use, or protected)

- `HomeschoolProgressViewNew.tsx`, `SidebarNew.tsx`, `ReadAloudListDB.tsx`, `BookLibraryDB/Visual.tsx`, `ProjectTaskList.tsx`, `FieldTripList.tsx`, `WeeklySchedule.tsx`, `PersonalCRM.tsx`, `MavenVerificationDashboard.tsx`, `AgentSquad.tsx`, `SebastianWorkspace/Kanban/DailyView/CalendarView/AgentView`, all `components/views/*` except as noted — all have live importers.
- Everything on the CLAUDE.md DO-NOT-TOUCH list (World Cup, SMS/email/webhooks, schema, payments/contacts) was excluded from candidacy regardless of usage.
