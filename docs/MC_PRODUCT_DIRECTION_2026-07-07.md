# Mission Control - Product Direction Brief

Version 1.0 - July 7, 2026
Output of the Fable 5 product session with Corinne.
For: Sebastian (operations), Hermes (build sprints)
Status: Approved direction. Build work sequences behind Hermes's
existing queue (1b -> HTA audit -> recovery merge), then this.

---

## 1. What Mission Control Is

MC is Corinne's Life OS - single-user by design, forever. It has two
modes that share one body:

**Ritual mode** (proactive - Corinne comes to it, daily):
Morning Mindset, evening reflection, habit tracker, homeschool
learning blocks, workouts, weekly/monthly RPM. This is where "dialed
in and present" is manufactured. The existing Daily view is the
right foundation - keep it.

**Run mode** (reactive - the system brings things to her):
Needs Me decisions, counters, agent work receipts, Aspire/HTA ops,
send governance. This is where the week of July 1-7 lived.

The Daily view is the spine where both modes meet: rituals rendered
as a walkable, time-ordered path, with run-mode intrusions (Needs Me
items, counter alerts) appearing IN the spine, not as a separate
world.

**Design law for ritual mode - the Staging Principle:**
The ritual surface never presents a blank page. Every ritual is
prepped by agents before Corinne arrives:
- Learning block: today's homeschool plan staged the night before -
  she hits the block and executes, zero planning at point of use.
- Morning Mindset: today's calendar, yesterday's evening answers,
  and weekly focus pre-loaded as context.
- Workout: last session's numbers + today's Whoop recovery staged,
  with a lighter variant auto-suggested on yellow/red days.
- Evening reflection: the day's actuals (tasks done, counters moved)
  pulled in, so reflection responds to the real day instead of
  reconstructing it.
Agents' ritual-mode job is staging. Corinne's is doing.

**The Expulsion Rule:** the moment any other human needs to look at
a surface, it leaves MC. Already fired once (HTA public pages ->
separate project). Applies next to: Coach Hub (staff-facing ->
eventually its own product), anything Vicky touches for 7v7 (-> 7v7
platform / future 7v7 agent), kids' learning surfaces (-> agent
layer, longer term). Single-user is why MC can stay fast and
unpolished: no permissions, no onboarding. Keep that discount.

**Success metric:** time-from-Needs-Me-to-decided. Measured from
pending-item timestamps. Secondary: ritual completion staying
effortless (streaks without willpower). Not engagement, not feature
count.

---

## 2. Source-of-Truth Rulings

These resolve the overlapping-stores problem. One canonical home per
data species; everything else is a projection.

| Species | Canonical home | Everything else is |
|---|---|---|
| Work (tasks/projects) | Task Board | projections (Daily's task list, brief's Agent Work) |
| Open decisions | Pending Items / Needs Me | pointers (brief's NEEDS ME section) |
| Outbound artifact + approval state | Content Pipeline (absorbs Email Drafts) | pointers from Needs Me |
| Executed sends | Send Manifest | the only source any send reporting may cite |
| Ritual entries (reflections, habits, logs) | Daily's own store | feeds evening staging + counters |
| Durable reference (curriculum, doctrine, SOPs, libraries) | Library areas | staging sources for ritual mode |

Rules:
2.1 Daily is a VIEW. It composes today from Task Board + calendar +
    Needs Me + ritual store. It owns ritual entries and nothing else.
2.2 Email Drafts merges into Content Pipeline: one review queue, a
    type field (email/SMS/social/post), one lifecycle:
    draft -> review -> approved -> sent (manifest ref) | killed.
    Approval state exists in exactly one place: the pipeline item.
2.3 A Needs Me item is a QUESTION with options. It is created
    pointing at its subject (pipeline item, task, verdict), and it
    dies when answered. It never stores content.
2.4 The manifest records execution, not intention. Created at send
    time, citing the approval reference. (Doctrine 2.1/2.2 apply.)

---

## 3. Staleness / TTL Rules

3.1 Agent tasks with no status change in 7 days auto-flag STALE.
    Stale items appear only in Monday triage (close/delegate/kill),
    never in the Morning Brief.
3.2 Pending Items expire at 14 days to state EXPIRED. Expired items
    never silently resurface; resurrection requires a human in
    Monday triage.
3.3 Campaign artifacts carry an event horizon (e.g., "camp week 2
    ends July 24") and auto-archive when it passes. World Cup
    artifacts horizon: July 19.
3.4 The brief may only list items with a status change in the last
    24h (existing yesterday-before-today rule) - TTLs keep the
    stores honest so the brief rule has less to fight.

---

## 4. Information Architecture

Two wings + shared services + one spine. NOT two apps.

**Life wing:** Daily (spine), Weekly/Monthly/RPM, Time, Health,
Homeschool, Family Meeting, Personal CRM, Finance, Home Remodel.

**Ops wing:** Aspire (Family CRM, camps, PDP, 7v7, staffing, region
tasks), HTA (post-separation: strategy/curriculum/marketing ops -
the public product lives outside MC), Agent Ops (queue, Content
Pipeline, huddle, training, memory).

**Shared services (domain-tagged):** Task Board, Needs Me, Send
Manifest, Calendar, Counters, Cron/Preflight Board.

Agent scoping follows the wings: Maven/Scout read Ops only;
Compass/James read their kids' Homeschool/Family surfaces only;
Sebastian spans both as chief of staff; Hermes reads structure, not
family content. This is a security posture, not tidiness.

Navigation implication: the sidebar's ~20 flat entries regroup under
Life / Ops / Shared. Tickets and Home Remodel are fine as minor Life
entries; nothing is deleted in this pass, only regrouped.

---

## 5. Prune Order

1. Duplicate MC worktrees - live deploy risk. Already in Hermes's
   recovery-merge scope; one canonical worktree survives.
2. Duplicate Pending Items - direct daily attention cost. Sebastian
   de-dupes, then rule 2.3 + TTLs prevent regrowth.
3. Content Pipeline backlog - apply event horizons (3.3); most of it
   self-archives.
4. Old campaign artifacts - archive-only sweep, anytime, low
   priority.

---

## 6. Build Sequencing

Hermes queue stands: Sprint 1b (build passes) -> HTA launch audit ->
recovery merge (stranded branch -> main, worktree consolidation,
Vercel project cleanup). THEN:

Sprint MC-1 - "One Truth" (backend/data, no visual redesign):
  Email Drafts -> Content Pipeline merge; Needs Me as
  question-with-pointer; TTL/staleness fields + Monday triage feed;
  domain tags on shared services. Success: Sebastian's five
  questions have enforced answers in the schema.

Sprint MC-2 - "Staging" (the ritual payoff):
  Nightly staging jobs: homeschool block plan, morning context
  pre-fill, workout card with Whoop-aware variant, evening actuals
  pull. Success: for one full week, no ritual surface presents a
  blank page.

Sprint MC-3 - "Spine" (UI):
  Daily view as time-ordered walkable path; Needs Me as a
  first-class one-tap screen; sidebar regrouped Life/Ops; counters
  with drill-downs. Uses the parked UI_RECOMMENDATIONS work where it
  fits. Success metric instrumented: Needs-Me-to-decided time.

Rule: MC-1 before MC-3. Repainting surfaces over conflicting stores
would decorate the confusion.

---

## 7. Open Items Deliberately Deferred

- Coach Hub extraction (expulsion rule) - after fall season starts.
- Kids' surfaces moving to agent layer - revisit when homeschool
  resumes.
- Finance/Home Remodel depth - fine as-is; no investment until used
  weekly.
- Two-way ritual entry via Telegram (answer morning questions by
  replying to Sebastian) - experiment after MC-2 staging exists.
