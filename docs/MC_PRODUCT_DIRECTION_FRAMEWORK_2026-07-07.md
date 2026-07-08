# Mission Control Product Direction Framework

Date: 2026-07-07
Audience: Corinne, Sebastian, Hermes
Status: Direction approved by Corinne via Fable 5 review; implementation should wait behind Hermes's existing queue: Sprint 1b, HTA PWA audit, recovery merge/worktree consolidation.

## Executive Summary

Mission Control is Corinne's single-user Life OS and Business OS. It should stay single-user by design so it can remain fast, personal, and operationally useful without permissions, onboarding, or public-product polish.

The next Mission Control work should not be a visual redesign first. The priority is to clean up source-of-truth boundaries so Daily, Needs Me, Content Pipeline, Task Board, Send Manifest, Morning Brief, and Agent Huddle stop overlapping.

The guiding implementation rule:

> MC-1 before MC-3. Fix the stores before repainting the surfaces.

## Product Model

Mission Control has two modes in one body.

### Ritual Mode

Corinne comes to MC proactively to be dialed in and present.

Examples:
- Morning Mindset
- Evening reflection
- Habit tracker
- Homeschool learning blocks
- Workouts
- Weekly / Monthly / RPM planning

Ritual mode should follow the Staging Principle: no ritual surface should start blank. Agents prep the context before Corinne arrives; Corinne executes.

Examples:
- Morning Mindset is preloaded with calendar, yesterday's reflection, weekly focus, and current operational context.
- Homeschool blocks are staged the night before.
- Workout cards include prior numbers and Whoop-aware adjustments.
- Evening reflection includes actuals from the day so Corinne reacts to reality instead of reconstructing it.

### Run Mode

The system brings reactive work to Corinne when it needs a decision or action.

Examples:
- Needs Me decisions
- Counter alerts
- Agent work receipts
- Aspire / HTA ops
- Send governance
- Campaign status

Run-mode items should appear inside the Daily spine when they matter today, not as a separate world Corinne has to inspect.

## Daily View Rule

Daily is the spine.

Daily should become a walkable, time-ordered path for the day that blends:
- Ritual blocks
- Calendar context
- Needs Me decisions
- Counter alerts
- Today's main move
- Health context
- Recent agent receipts

Daily owns ritual entries and nothing else. Everything else in Daily is a projection from canonical stores.

## Expulsion Rule

The moment another human needs to use or inspect a surface, that surface leaves Mission Control.

Mission Control stays single-user. That is a feature, not a limitation.

Already applied:
- HTA public pages belong outside MC.

Likely future applications:
- Coach Hub remains or becomes a staff-facing product separate from MC.
- 7v7 surfaces that Vicky or others touch should move to a 7v7 platform or agent layer.
- Kids' direct learning surfaces should eventually move to a child-facing agent/product layer.

MC can still hold strategy, planning, source data, and internal operating context for those areas.

## Source-Of-Truth Map

One canonical home per data species. Everything else is a projection.

| Data Species | Canonical Home | Projections / Consumers |
| --- | --- | --- |
| Work, projects, tasks | Task Board | Daily task list, Morning Brief Agent Work, agent huddle summaries |
| Open decisions | Pending Items / Needs Me | Morning Brief Needs Me, Daily intrusions |
| Outbound drafts and approval state | Content Pipeline | Needs Me pointers, Daily review cards |
| Executed sends | Send Manifest | Send reporting, Morning Brief send status, July 10 checkpoint |
| Ritual entries | Daily ritual store | Evening staging, counters, streaks |
| Durable reference | Library / Knowledge areas | Ritual staging, agent planning, context retrieval |

## Source-Of-Truth Rules

1. Daily is a view. It composes today from Task Board, Calendar, Needs Me, counters, health, and ritual entries.
2. Daily owns ritual entries only.
3. Email Drafts should merge into Content Pipeline.
4. Content Pipeline should support one lifecycle across email, SMS, social, post, page, and other outbound artifacts.
5. Approval state lives only on the Content Pipeline item.
6. Needs Me items are questions with options. They point to a subject and do not duplicate the subject content.
7. Needs Me items die when answered.
8. Send Manifest records execution, not intent. Operationally, create or stage the manifest immediately before sending, then finalize it as sent after execution.
9. Morning Brief outbound-send lines must come from Send Manifest, not task or draft state.
10. An unsent draft with no manifest execution should never appear as an already-sent item or as a reappearing approval request.

## Staleness And TTL Rules

These rules prevent stale work from resurfacing in Morning Brief or campaign decisions.

### Agent Tasks

If an agent task has no status change in 7 days:
- Auto-flag as `STALE`.
- Exclude from Morning Brief.
- Surface only in Monday triage.

Monday triage actions:
- Close
- Delegate
- Kill
- Reschedule

### Pending Items

If a Pending Item is unanswered for 14 days:
- Move to `EXPIRED`.
- Exclude from Morning Brief and Daily.
- Resurrection requires Monday triage or explicit human action.

### Campaign Artifacts

Campaign artifacts need an event horizon.

Examples:
- World Cup artifacts horizon: 2026-07-19.
- Camp week artifacts horizon should match the relevant week end date.

When the horizon passes:
- Auto-archive if not explicitly pinned.
- Do not show in Morning Brief.
- Do not re-enter Needs Me without a fresh human or agent action.

### Morning Brief

Agent Work should only include meaningful work with a status change in the last 24 hours.

Needs Me should show current live decisions even if older than 24 hours, as long as they are not expired.

This is a slight adjustment to the Fable rule: a decision can still matter after 24 hours; old agent receipts usually do not.

## Information Architecture

Use two wings, shared services, and one spine.

### Life Wing

- Daily
- Weekly / Monthly / RPM
- Time
- Health
- Homeschool
- Family Meeting
- Personal CRM
- Finance
- Home Remodel

### Ops Wing

- Aspire
- Camps
- PDP
- 7v7
- Staffing
- Region tasks
- HTA strategy / curriculum / marketing ops
- Agent Ops
- Content Pipeline
- Huddle
- Training
- Memory / Knowledge

### Shared Services

Shared services should be domain-tagged rather than duplicated per wing.

- Task Board
- Needs Me
- Send Manifest
- Calendar
- Counters
- Cron / Preflight Board

## Agent Scope

Agent scope should follow the Life / Ops / Shared split.

Working target:
- Sebastian spans Life and Ops as chief of staff.
- Maven and Scout primarily read Ops surfaces.
- Compass and James read only the kids' Homeschool / Family surfaces they need.
- Hermes reads structure, schema, UI, and build context; Hermes should not need private family content to implement the product direction.

This should eventually become an access/query rule, not just an instruction.

## Prune Order

1. Duplicate Mission Control worktrees and recovery-merge issues.
   - Reason: live deploy risk.
   - Owner: Hermes recovery-merge scope.

2. Duplicate Pending Items.
   - Reason: direct daily attention cost.
   - Owner: Sebastian first pass, Hermes schema enforcement later.

3. Content Pipeline backlog.
   - Reason: noisy review queue.
   - Method: add event horizons and archive old artifacts.

4. Old campaign artifacts.
   - Reason: low priority once event horizons exist.
   - Method: archive-only sweep.

## Build Sequencing

Hermes's existing queue stands:
1. Sprint 1b build passes.
2. HTA PWA audit.
3. Recovery merge and worktree consolidation.
4. Mission Control work below.

## Sprint MC-1: One Truth

Focus: backend/data model and enforcement. No visual redesign.

Goals:
- Merge Email Drafts into Content Pipeline.
- Add or normalize Content Pipeline lifecycle:
  - draft
  - review
  - approved
  - sent with manifest reference
  - killed
- Add content type field:
  - email
  - SMS
  - social
  - post
  - page
  - other
- Convert Needs Me to question-with-pointer.
- Add TTL/staleness fields.
- Add event horizon field for campaign artifacts.
- Add domain tags across shared services.
- Add Monday triage feed.
- Make Morning Brief send reporting read only from Send Manifest.

Acceptance criteria:
- Approval state exists in exactly one place for outbound artifacts.
- A Needs Me item can point to a pipeline item, task, or verdict without duplicating content.
- Stale agent work cannot appear in Morning Brief.
- Expired Pending Items cannot silently resurface.
- Executed send reporting can cite Send Manifest only.
- Sebastian's five recurring questions have schema-level answers:
  - What belongs in Daily?
  - What belongs in Pending Items?
  - What belongs in Task Board?
  - Where does approval state live?
  - Where does send execution live?

## Sprint MC-2: Staging

Focus: ritual payoff.

Start with the highest-value staging surfaces first.

Phase A:
- Morning Mindset prefill.
- Evening Reflection actuals pull.

Phase B:
- Homeschool block staging.

Phase C:
- Workout card with Whoop-aware variant.

Acceptance criteria:
- For one full week, the selected ritual surfaces never present blank pages.
- Corinne can enter the ritual and do it without planning at the point of use.
- Staged data is useful but not overwhelming.

## Sprint MC-3: Spine

Focus: UI once source-of-truth conflicts are resolved.

Goals:
- Daily becomes the walkable, time-ordered spine.
- Needs Me becomes first-class and one-tap.
- Sidebar regroups under Life / Ops / Shared.
- Counters gain drill-downs.
- Existing UI recommendations are applied where they fit.
- Instrument time-from-Needs-Me-to-decided.

Acceptance criteria:
- Corinne can open Daily and understand what to do next without checking five other pages.
- Needs Me items can be answered quickly.
- Run-mode alerts appear in context, not as a separate dashboard chore.
- Time-from-Needs-Me-to-decided is measurable.

## Immediate Sebastian Tasks For Tomorrow

Before Hermes begins MC implementation:
- Keep Segment D operational work separate from MC architecture work.
- Deduplicate obvious Pending Items.
- Review existing Content Pipeline and Email Drafts overlap.
- Mark old campaign artifacts with likely event horizons where obvious.
- Ensure Morning Brief outbound-send lines continue reading from Send Manifest.
- Capture any MC-specific tasks for Hermes after the HTA audit and recovery merge are complete.

## Hermes Implementation Notes

Hermes should treat this file as the product framework, not a request to begin immediately.

Do not:
- Redesign Daily before MC-1.
- Delete old data without an archive path.
- Move private family/kid content into broader agent-readable surfaces.
- Rebuild public HTA or Coach Hub inside MC.
- Treat Send Manifest as draft intent.

Do:
- Inspect current schema before proposing migrations.
- Prefer additive migrations and compatibility shims where needed.
- Keep visual changes out of MC-1 unless required to expose the new model.
- Leave a clear migration path from Email Drafts to Content Pipeline.
- Preserve existing send governance: no outbound send without Corinne approval and a manifest path.

## Deferred Items

Deliberately not in the first MC pass:
- Coach Hub extraction.
- Kids' surfaces moving to a child-facing agent layer.
- Deep Finance or Home Remodel investment unless Corinne starts using them weekly.
- Two-way ritual entry by Telegram reply.

Two-way Telegram ritual entry is worth testing after MC-2 staging works.

