# Mission Control — UI / Visual Design Recommendations

**Audit date:** 2026-06-11 · **Branch:** `audit-cleanup` · **Session:** read-only (no product code changed)

This document ranks recommendations by visual impact vs. effort, with a proposed Phase 1 (color tokens + consistency) and Phase 2 (component polish). All counts below come from grep analysis of `components/` and `app/` (`*.tsx`).

---

## 1. Color audit — what is actually in use

### 1.1 The token system exists but is bypassed

`app/globals.css` defines a complete shadcn OKLCH token set (`--background`, `--card`, `--primary`, `--destructive`, chart and sidebar tokens) and `.dark` is applied at the root (`app/layout.tsx:49`). Almost nothing uses it. Outside `components/ui/`, views hardcode raw Tailwind palette classes:

| Neutral family | Utility instances |
|---|---|
| `zinc-*` | ~1,330 (dominant: `border-zinc-800` ×210, `text-zinc-300/400/500` ×450, `bg-zinc-900` ×135, `bg-zinc-950` ×122, `bg-zinc-800` ×120) |
| `gray-*` | ~430 (`text-gray-500` ×88, `text-gray-400` ×83 — used interchangeably with zinc) |
| `slate-*` | ~60 |
| `stone-*` | a handful |

**Verdict:** `zinc` is the de facto neutral. `gray` and `slate` usage is accidental drift, not intentional — e.g. `CoachHubView` and the agent profile pages use `text-gray-500` where sibling views use `text-zinc-400` for identical secondary copy.

### 1.2 Competing near-blacks (confirmed)

There are at least **five different "app blacks"** layered on top of each other:

1. `bg-black` on `<body>` (`app/layout.tsx:50`) and again on the dashboard wrapper (`app/dashboard/page.tsx:790`)
2. `--background: oklch(0.145 0 0)` (the token nobody renders against)
3. `bg-zinc-950` — sidebar shell and many view panels
4. `bg-zinc-900` / `bg-zinc-800` — ad-hoc card surfaces
5. `Card` primitive hardcodes `bg-zinc-950/40 border-zinc-900/80` (`components/ui/card.tsx:10`), overriding the `--card: oklch(0.205 0 0)` token

Plus `viewport.themeColor: "#0a0a0a"` is a sixth value that matches none of the above. Result: subtle seams between surfaces, and no single place to adjust the shell.

### 1.3 Accent color inventory

Counts of `bg|text|border|from|to|via|ring-{color}-N` across `components/` + `app/`:

| Color | Count | Reading |
|---|---|---|
| amber | **591** | De facto brand accent: sidebar active state (`text-amber-400`), brand gradient (`from-amber-500 to-red-600`), workflow icons, warning states — all mixed together |
| green | 217 | Success / "Live" status |
| emerald | 202 | **Also** success — split brain with green (e.g. cash-flow card uses emerald, agent status uses green) |
| red | 154 | Errors, brand gradient end, alerts |
| cyan | 144 | HTA GTM tone, finance 30-day window, misc |
| blue | 127 | Links, info, category color |
| purple | 105 / violet 83 / fuchsia 35 | Three purples used for different domains with no rule |
| rose 75, orange 72, yellow 64, sky 56, pink 41, indigo 23, teal 16, lime 4 | | Long tail, mostly domain/category palettes |

**Intentional palettes (keep, but document):**
- `lib/categoryColors.ts` — RPM category colors. This is the right pattern (a typed domain-color bridge) and should become the model for the rest.
- HTA public pages (`app/hta/*`) — a real brand system: `#179b57` green, `#102c43` navy, `#f6fbf7` cream, `#b8d7e7` sky, `#405a6d` slate. Cohesive and the closest to the visual direction Corinne prefers. Isolated to `app/hta/` — fine, but worth extracting into named tokens so internal HTA dashboard views can echo it.
- `KidsLifeSkillsChecklist` per-skill gradients and `kids-aurora/shimmer/glow` utilities in `globals.css` — intentional kid-facing surfaces.
- World Cup surfaces — **out of scope, do not touch.**

**Accidental drift (fix):**
- green vs. emerald for success; amber doing triple duty (brand, warning, active-nav); blue vs. sky; purple vs. violet vs. fuchsia without a domain rule.
- `DEFAULT_CATEGORY_COLORS` in `categoryColors.ts` has light-mode values (`bg-gray-100 text-gray-800`) that clash with the dark app when an unknown category appears.
- `HealthDashboard.tsx:47-62` — `getScoreColor` (ring) and `getScoreTextClass` (text) disagree: a 70–84 score gets a **green** ring but **purple** text; 85+ gets pink in both. Likely a bug, definitely drift.
- Raw hex sprinkled in TSX: `#f59e0b`, `#ec4899`, `#22c55e`, `#3b82f6`, `#71717a`, `#27272a` (HealthDashboard rings), `#ffdc4d`, `#111827` and friends elsewhere.

### 1.4 Broken font tokens (small fix, real win)

`@theme` maps `--font-sans: var(--font-geist-sans)` and `--font-mono: var(--font-geist-mono)`, but **those variables are never defined anywhere**. The app actually renders Inter via `inter.className` on `<body>`. Any `font-sans`/`font-mono` utility resolves to an empty var and falls back to browser defaults — `font-mono` in particular does not render a chosen mono font. Fix: register Inter (and a mono) with `next/font` CSS variables and point `@theme` at them.

---

## 2. Proposed design token system

Single source of truth in `app/globals.css` via Tailwind 4 `@theme`, with `lib/categoryColors.ts` (and a small `lib/domainColors.ts` if desired) as the only bridge for domain palettes.

```css
@theme {
  /* Neutrals — pick zinc, kill gray/slate/stone */
  --color-surface-0: oklch(0.13 0.005 260);  /* app shell (replaces bg-black + zinc-950 + #0a0a0a) */
  --color-surface-1: oklch(0.17 0.005 260);  /* card */
  --color-surface-2: oklch(0.21 0.005 260);  /* raised / hover */
  --color-line:      oklch(0.28 0.005 260);  /* borders (replaces zinc-800/700 mix) */
  --color-ink:       oklch(0.95 0 0);        /* primary text */
  --color-ink-soft:  oklch(0.72 0 0);        /* secondary text (zinc-400) */
  --color-ink-faint: oklch(0.55 0 0);        /* tertiary text (zinc-500) */

  /* Brand */
  --color-brand:      /* amber-500 */;
  --color-brand-deep: /* red-600, gradient partner */;

  /* Semantic — one each */
  --color-success: /* emerald-500 */;
  --color-warning: /* amber-400 — distinct usage from brand via component, not hue */;
  --color-danger:  /* red-500 */;
  --color-info:    /* sky-400 */;
}
```

Rules to adopt with it:
1. **Neutrals:** only `zinc` (or the surface tokens) — migrate `gray`/`slate`/`stone` mechanically.
2. **Success = emerald, everywhere.** Green family retired except kid surfaces.
3. **Amber = brand/emphasis; warnings use the warning token** so "active nav" and "expiring cert" stop sharing a color by accident.
4. **Domain palettes live in one file** with the `CATEGORY_COLORS` shape (border / badge / bg / surface), including HTA sub-nav tones currently inlined in `SidebarNew.tsx:85-111`, finance window tones in `FinanceView.tsx:56-72`, and health score colors.
5. Existing shadcn tokens (`--card`, `--muted-foreground`…) get repointed at the new values so `components/ui/*` inherits for free — and the hardcoded zinc override in `ui/card.tsx` is removed.

---

## 3. Typography

Current usage: `text-sm` ×703, `text-xs` ×592, `text-[11px]` ×54, `text-[10px]` ×51, `text-[9px]` few — i.e. **a fifth of all text is below 12px**, much of it operationally important (sidebar grandchildren, agent roles, metric captions).

Inconsistencies found:
- Page headers: most views use `text-3xl font-bold`; Finance, BioMap, and AI Cost Tracker use `text-2xl font-bold`; the dashboard shell adds its own `text-4xl` "Mission Control" header above every page header (see §5.1).
- Metric numbers: `text-2xl font-bold` (Camps, Spring counts, CoachHub) vs. `text-3xl font-semibold` (Aspire Overview, HTA Overview, Spring totals) vs. `text-3xl font-bold` (Health, BioMap) — same role, three treatments.
- Micro-labels: uppercase tracking labels appear as `text-[10px] tracking-[0.16em]`, `text-xs uppercase`, and `text-xs font-medium uppercase` variants.

**Proposed scale (Tailwind-native, no custom sizes):**

| Role | Class |
|---|---|
| Page title | `text-2xl font-semibold` (drop to one size; the shell header provides the "big" moment) |
| Section header | `text-lg font-semibold` |
| Card title | `text-sm font-semibold` (matches `CardTitle`) |
| Metric number | `text-3xl font-semibold tabular-nums` |
| Body | `text-sm` |
| Secondary / meta | `text-xs text-ink-soft` |
| Micro-label (eyebrow) | `text-xs font-medium uppercase tracking-wide` — **retire `text-[10px]`/`text-[11px]`** |

---

## 4. Spacing, radius, and surfaces

- Radius: 7 values in active use — bare `rounded` (×103, the 0.25rem legacy), `rounded-md` ×116, `rounded-lg` ×217, `rounded-xl` ×91, `rounded-2xl` ×37, `rounded-full` ×114. Proposal: `rounded-lg` for cards/panels, `rounded-md` for inputs/buttons (matches `ui/button`), `rounded-full` for pills/avatars, `rounded-2xl+` reserved for kid/marketing surfaces. Bare `rounded` migrates to `rounded-md`.
- Card padding: views mix `p-3`, `p-4`, `p-6`, and `Card`'s built-in `px-6 py-6`, often overridden per-view (`DailyCommandCenter` uses `gap-3 py-4 px-4`). Proposal: standard card = primitive defaults; dense/operational card = one sanctioned compact variant (`py-4 px-4 gap-3`) added to `ui/card.tsx` instead of ad-hoc overrides.
- Page rhythm: standardize top-level view wrapper on `space-y-6` (currently split across `space-y-4/5/6`).

---

## 5. Visual hierarchy — hardest-to-scan surfaces

### 5.1 The double header (every dashboard view)
`app/dashboard/page.tsx:792-801` renders a `text-4xl` gradient "Mission Control" + greeting above almost every view, then each view renders its own `text-3xl` title. Two stacked headers cost ~140px before content on operational pages. Recommendation: move brand into the sidebar (it's already there at `SidebarNew.tsx:366`) or a slim top bar, and let each view's own title lead. (A `standaloneSurfaceViews` set already suppresses it for Agent Ops views — extend that pattern to everything.)

### 5.2 Sidebar "Agent Squad" card (`SidebarNew.tsx:493-576`)
Seven hardcoded agents, each with a hardcoded green "● Live"/"● Active" badge. It is static copy presented as live status — exactly the "technical chrome" the brief flags. Recommendation: either wire it to real heartbeat data or collapse it to a single "Agents" nav entry; permanent green dots that mean nothing train the eye to ignore status colors everywhere else.

### 5.3 Agent profile pages (`agent-scout/maven/compass/james` in `app/dashboard/page.tsx:404-570`)
~170 lines of hardcoded JSX per agent with stale facts baked in ("Recent Work: Spring League parent emails", "Design phase — gathering Roma's preferences", fake "● Live" pills). These should be one data-driven `AgentProfile` component, with status/recent-work coming from Convex or removed.

### 5.4 Finance (`components/views/FinanceView.tsx`)
The MetricCard + tabbed structure is a good base for the "less avoidant" goal, but: payroll names/rates/hours are **hardcoded in the component** (lines 90–115) along with the sheet-sync timestamp, so the dashboard silently goes stale; the scary numbers (payroll total, runway) are `text-lg`, smaller than decorative copy elsewhere. Recommendation: biggest number on the page should be the one that matters (cash position / next payroll), with explicit "as of {date}" freshness labels, and the data moved to Convex (Phase 2+, behavior change — needs approval).

### 5.5 Empty and loading states
Empty states are bare one-liners (`<p class="text-sm text-zinc-500">No claims yet.</p>` — Tickets ×3, KnowledgeFiles, CoachHub, FamilyCRM…). Loading is an assortment of `animate-spin` divs and `animate-pulse` blocks across 21 files; only the dashboard root has a branded spinner. Recommendation: one `EmptyState` component (icon + one-line explanation + optional action button) and one `Skeleton`/spinner pattern. This is the single cheapest "feels polished" win in the app.

### 5.6 Debug chrome
`console.log('[Dashboard] Clerk user.id: …')` ships on every dashboard render (`app/dashboard/page.tsx:105-106`). Remove in Phase 1.

---

## 6. Component upgrade candidates (keep existing stack — no new UI library)

| Candidate | Where it pays off | Notes |
|---|---|---|
| **`StatCard`** (label, value, delta, tone, icon) | Camps, Spring, CoachHub, Aspire/HTA overviews, Health, BioMap — ~25 hand-rolled stat blocks today | Kills the `text-2xl`-vs-`text-3xl` metric drift in one move |
| **`EmptyState`** | Tickets, Docs, CoachHub, FamilyCRM, Huddle | See §5.5 |
| **`StatusBadge`** (semantic variant map) | Tickets statuses, claim statuses, cert expiry, agent status, pipeline stages | Extend `ui/badge.tsx` with `success/warning/danger/info` variants instead of inline `bg-green-500/20 text-green-400` strings |
| **`DataTable`** (or at least a shared `<table>` style) | Raw `<table>` in FinanceView, AspireCampsView, RosterAssignmentQueue, camp-admin | Consistent header/row/zebra/density for the operational "dense and clear" goal |
| **`PageHeader`** (title, description, actions slot) | Every view | Enforces the §3 type scale |
| **`SectionLabel`** (uppercase eyebrow) | Sidebar groups, finance windows, huddle panels | Replaces three competing micro-label styles |
| **Agent status block** | Sidebar squad card + agent pages | Data-driven, one component (§5.2/5.3) |
| **Charts** | Health trends, finance | `recharts` is in `package.json` but **never imported** — either adopt it for health/finance trends in Phase 2 or drop the dependency (see AUDIT_REPORT cleanup list) |
| **Progress ring** | HealthDashboard `ScoreRing` is well-built | Promote to `components/ui/` and reuse for habit/goal completion instead of new one-offs |

---

## 7. Ranked plan: impact vs. effort

### Phase 1 — Color tokens + consistency (high impact, low-to-medium effort, no behavior change)

| # | Item | Impact | Effort |
|---|---|---|---|
| 1 | Define token palette in `globals.css` `@theme` (§2); repoint shadcn vars; fix broken `--font-geist-*` → Inter/mono | ★★★★★ | S |
| 2 | Collapse the five near-blacks onto `surface-0/1/2` + `line` tokens (body, dashboard wrapper, sidebar, `ui/card.tsx` override, `themeColor`) | ★★★★★ | M |
| 3 | Mechanical neutral migration: `gray-`/`slate-`/`stone-` → zinc/tokens (~500 instances, scriptable) | ★★★★ | M |
| 4 | Semantic accents: green→emerald for success; introduce `warning`/`danger`/`info` tokens; fix `HealthDashboard` ring/text mismatch | ★★★★ | M |
| 5 | Move inline domain palettes (HTA sidebar tones, finance windows, health scores) into the `categoryColors`-style bridge; fix dark-mode `DEFAULT_CATEGORY_COLORS` | ★★★ | S |
| 6 | Remove dashboard `console.log` debug lines; remove dead imports (see AUDIT_REPORT) | ★★ | XS |
| 7 | Type scale pass on page headers + metric numbers only (§3 table, top two rows) | ★★★ | S |

### Phase 2 — Component polish (high impact, medium effort)

| # | Item | Impact | Effort |
|---|---|---|---|
| 1 | `EmptyState` + standard loading skeleton, applied to the ~20 bare spots | ★★★★★ | M |
| 2 | `StatCard` + `PageHeader` + `StatusBadge`, rolled through Aspire (Camps, Spring, PDP, 7v7, CoachHub, FamilyCRM) first — the operational-density surfaces | ★★★★★ | L |
| 3 | Single-header shell: retire the double header, slim top bar (§5.1) | ★★★★ | M |
| 4 | Shared table styling for Finance / Camps / Roster / camp-admin | ★★★★ | M |
| 5 | Data-driven agent status (sidebar card + agent pages) or removal of fake status | ★★★ | M |
| 6 | Radius/padding normalization (bare `rounded` → `rounded-md`, compact-card variant) | ★★ | S–M (scriptable) |
| 7 | Finance hierarchy rework (biggest number = most important; freshness labels). Moving hardcoded payroll data to Convex is a behavior change — **separate approval** | ★★★★ | L |
| 8 | Adopt-or-drop decision on `recharts` for health/finance trend charts | ★★★ | M |

**Out of scope for both phases:** anything under `app/worldcup/`, `HTAWorldCupView`, World Cup HTTP branches, all send/SMS/email tooling, Convex schema, payment/contact mutations. HTA public pages (`app/hta/*`) are already the strongest design in the repo — leave them; borrow from them.
