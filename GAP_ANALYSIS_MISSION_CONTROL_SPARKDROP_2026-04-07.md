# Mission Control x SparkDrop Gap Analysis

Date: 2026-04-07
Author: Sebastian

## Objective
Use SparkDrop's strongest workflow patterns to improve Mission Control, specifically:
- Sebastian's Workspace
- Agent Ideas
- Content Pipeline
- Agent/human collaboration flow

## Current Mission Control state

### 1. Sebastian Workspace
Current implementation:
- `components/SebastianWorkspace.tsx`
- tabbed container with `Daily`, `Calendar`, `Projects`, `Agents`
- task backbone is `convex/sebastianTasks.ts`
- current task model is generic kanban-style work items

Current strengths:
- broad operating-system framing
- already connected to real task data
- supports multi-agent assignment

Current gaps:
- no single command-center summary
- no explicit split between human actions vs agent actions
- no learnings/proposed-learnings surface
- no direct idea conversion workflow
- approvals are detached from workspace rhythm

### 2. Agent Ideas
Current implementation:
- `components/AgentIdeasWidget.tsx`
- ideas are stored in `contentPipeline` using stages:
  - `idea`
  - `priority`
  - `later`
  - `needs-work`

Current strengths:
- already visible in UI
- simple triage states exist
- overnight idea detection exists

Current gaps:
- data model is overloaded: agent ideas live inside content pipeline
- idea cards lack decision metadata:
  - business area
  - confidence
  - effort
  - recommended next action
  - conversion targets
- no lineage from idea -> project / content / SOP / experiment
- no idea-type-specific training

### 3. Content Pipeline
Current implementation:
- `convex/contentPipeline.ts`
- `components/ContentPipeline.tsx`
- stages currently support both ideas and content review states

Current strengths:
- live review queue works
- Corinne approval flow works
- content verification exists
- agent-created content is already centralized

Current gaps:
- no parent-child structure
- content items are flat, not grouped under a core idea
- schedule is not a first-class child of content object
- notes mix agent notes, approval notes, and feedback into one string field
- no platform/content-type training hierarchy
- no structured learning loop

### 4. Existing reusable primitives

#### `sebastianTasks`
Good for:
- durable backlog/task tracking
- board views
- explicit assignee ownership

Not ideal for:
- structured human-vs-agent todo flow
- idea conversion lineage

#### `pendingItems`
Good candidate for:
- lightweight next-up queues
- explicit owner (`corinne`, `sebastian`, `maven`, etc.)
- low-friction action queue

Potential use:
- interim user-vs-agent todo model
- dashboard “Needs Corinne / Needs Agent Work” cards

#### `approvalsQueue`
Currently MVP / placeholder.
Potential future connection:
- content approvals
- outbound-message approvals
- idea conversion approvals

#### `mavenFeedback`
Useful seed for broader learnings system.
Current limitation:
- only tracks reject/edit events for Maven content
- not generalized into reusable learnings or training instructions

## SparkDrop patterns worth adopting

### 1. Training hierarchy
SparkDrop clearly separates:
- General voice
- Spark-type guidance
- Platform guidance
- Newsletter section guidance
- Learnings

Mission Control should adopt:
- Global voice guidance
- Business voice guidance (Aspire / HTA / 7v7 / Sebastian)
- Content-type guidance
- Platform guidance
- Section guidance
- Approved learnings

### 2. User vs Agent todos
SparkDrop explicitly distinguishes:
- user actions
- agent actions

Mission Control should support:
- `needs_corinne`
- `needs_agent`
- optionally `needs_specific_agent`

### 3. Parent -> child content lineage
SparkDrop model:
- Spark -> Flames -> scheduled outputs

Mission Control target model:
- Core Idea -> Child Assets -> Schedule / Publish / Outcomes

### 4. Learning loop
SparkDrop operationalizes learnings.
Mission Control should:
- capture recurring edit patterns
- propose learnings
- approve learnings
- apply them to future generation contexts

## Recommended implementation order

## Phase 1 - safe foundation (overnight-safe)
1. Architecture/spec docs
2. Add structured metadata plan for ideas/content/training
3. Add subtask backlog items for build sequence
4. Prepare schema additions without breaking current UI

## Phase 2 - highest ROI product improvements
1. User vs Agent todo split
2. Agent Ideas redesign as conversion inbox
3. Sebastian Workspace dashboard redesign

## Phase 3 - bigger refactor
1. Parent-child content model
2. Training Center UI + schema
3. Learning review loop tied to content edits and approvals

## Proposed schema additions

### A. `agentIdeas` table (recommended)
Reason: stop overloading `contentPipeline` for non-content triage.

Suggested fields:
- `title`
- `summary`
- `sourceAgent`
- `businessArea`
- `ideaType`
- `confidence`
- `effort`
- `recommendedAction`
- `status` (`new`, `priority`, `later`, `needs-work`, `converted`, `dismissed`)
- `createdAt`
- `updatedAt`
- `convertedTo` (optional references)
- `notes`
- `sourceContext`

### B. `agentLearnings` table
Purpose: generalized, reusable learning layer.

Suggested fields:
- `title`
- `learning`
- `scopeType` (`global`, `business`, `platform`, `contentType`, `agent`, `section`)
- `scopeKey`
- `proposedBy`
- `status` (`proposed`, `approved`, `rejected`, `archived`)
- `sourceType` (`content_edit`, `content_reject`, `manual`, `agent_observation`)
- `sourceId` (optional)
- `confidence`
- `createdAt`
- `approvedAt`

### C. `agentTraining` table
Purpose: canonical instruction hierarchy.

Suggested fields:
- `category` (`voice`, `business`, `platform`, `contentType`, `section`, `ideaType`)
- `key`
- `title`
- `content`
- `active`
- `updatedBy`
- `createdAt`
- `updatedAt`

### D. extend `contentPipeline`
Suggested additions:
- `parentContentId` (optional self-reference)
- `rootIdeaId` (optional reference to `agentIdeas`)
- `platform`
- `contentGoal`
- `scheduledFor`
- `outcomeSummary`
- `feedbackStatus`

## Proposed UI changes

### Sebastian Workspace
New summary sections:
- Needs Corinne
- Needs Agent Work
- Approvals Waiting
- New Learnings Proposed
- Ideas Ready to Convert
- Today’s Content Queue
- Stale / blocked work

### Agent Ideas
Shift from lightweight content-stage widget to conversion inbox.
Each card should show:
- why it matters
- business area
- confidence
- effort
- recommendation
- quick conversions:
  - backlog item
  - content idea
  - experiment
  - SOP
  - dismiss

### Content Pipeline
Refactor to show:
- parent core idea
- child outputs
- schedule visibility
- inline rewrite shortcuts
- training context applied
- outcomes / learnings feedback

## Overnight-safe build tasks
1. Add implementation planning backlog entries (done in Sebastian tasks)
2. Create architecture note (this doc)
3. Inspect current UI entry points and schema constraints (done)
4. Next safe code step: add new schema tables behind existing UI, no breaking changes

## Tomorrow's best build order
1. `agentTraining` + `agentLearnings` schema and minimal admin/query functions
2. User vs Agent todo summary using existing `sebastianTasks` + `pendingItems`
3. Agent Ideas v2 schema (`agentIdeas`) and migration path
4. Sebastian Workspace summary redesign
5. Parent-child content model refactor
