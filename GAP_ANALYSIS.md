# Mission Control - Gap Analysis
**Compared Against:** Alex Finn's Mission Control (X article)  
**Date:** February 18, 2026  
**Our Stack:** Next.js + Convex + Clerk + Vercel  
**Prod URL:** mission-control-kappa-peach.vercel.app  
**Convex Prod:** harmless-salamander-44

---

## Executive Summary

Alex Finn built a 6-component Mission Control focused on AI agent management and content creation. Our Mission Control is deeper on **life/business operations** (RPM, habits, homeschool, Aspire) but shallower on **AI-native features** (shared task board, memory UI, agent status). This makes sense - ours was built for Corinne's day-to-day, not for monitoring AI.

**Where we're strong:** Task management (HTA, Aspire, Homeschool), daily check-ins, calendar skeleton  
**Where we're weak:** Shared AI task board, content pipeline, memory search, agent status visibility  

**Overall:** 3 of 6 components have meaningful implementations, 2 are partial, 1 is missing.

---

## Component-by-Component Analysis

---

### 1. Tasks Board

**Alex Finn's Vision:** Shared task list between human and AI. AI proactively picks up and completes tasks. Shows status (todo/in-progress/done) and who's assigned (human or AI).

**What We Have:** PARTIAL ✓✗

We have **two task systems** that don't quite meet this standard:

**A. Sebastian's Kanban** (`components/SebastianKanban.tsx`)
- Full Convex-backed kanban with backlog/todo/in-progress/done columns
- Schema: `sebastianTasks` table in `convex/schema.ts`
- Categories: infrastructure, hta, aspire, agent-squad, skills
- Priority levels: low/medium/high
- ✅ Has task creation, status moves, deletion
- ❌ No `assignedTo` field for agents (only human categories)
- ❌ No AI-side interaction (Sebastian can't write/update tasks via API)
- ❌ No visible distinction between "human does this" vs "AI does this"

**B. Project Task Lists** (`components/ProjectTaskList.tsx`)
- Used for HTA (58 tasks), Aspire (Spring League, etc.), Homeschool
- Schema: `projectTasks` table with `assignedToId` linking to `teamMembers`
- Has real assignment via `teamMembers` table
- ❌ Team members are Allie, coaches, etc. - not AI agents specifically
- ❌ No agent pickup flow

**What's Missing:**
1. `agentId` field or `assignedToAgent` field on `sebastianTasks` (or a unified tasks table)
2. A Convex HTTP action / API endpoint so agents can query and update tasks
3. "Assigned to AI" vs "Assigned to Human" visual indicator
4. Agent-written task notes or completion summaries

**How Hard:** Easy-Medium  
**Effort:** ~4 hours
- Add `assignedTo: v.optional(v.union(v.literal("human"), v.literal("ai"), v.literal("sebastian"), v.literal("scout"), v.literal("maven"), ...))` to `sebastianTasks` schema
- Expose a Convex HTTP route: `GET /api/tasks?status=todo&assignedTo=ai` for agent consumption
- Add agent name badge in `SebastianKanban.tsx` column cards
- Sebastian can then call Convex directly via `npx convex run sebastianTasks:updateSebastianTask`

**Priority for Corinne:** HIGH  
This is the most immediately useful gap. Corinne should be able to see "what is Sebastian working on right now" without asking in Telegram.

**Schema Change (convex/schema.ts):**
```typescript
sebastianTasks: defineTable({
  // ... existing fields ...
  assignedTo: v.optional(v.union(
    v.literal("corinne"),
    v.literal("sebastian"),
    v.literal("scout"),
    v.literal("maven"),
    v.literal("compass"),
    v.literal("james"),
  )),
  agentNotes: v.optional(v.string()), // AI can write completion summary here
  source: v.optional(v.union(v.literal("human"), v.literal("ai"), v.literal("cron"))),
})
```

---

### 2. Content Pipeline

**Alex Finn's Vision:** Kanban for content creation stages (ideas → scripts → thumbnails → filming). AI writes scripts, generates thumbnails, moves items through pipeline.

**What We Have:** NO ✗

Nothing resembling a content pipeline exists in our codebase. The `HTA Marketing` view is just a `ProjectTaskList` with generic tasks. Maven isn't connected to any pipeline.

**What's Missing:** Everything.

**Why This Matters for Our Setup:**
- Maven is our marketing agent (HTA launch, X posts, email sequences)
- HTA launch needs: blog posts, Instagram content, email sequences, landing page copy, maybe YouTube scripts
- Corinne needs visibility into what Maven is creating, not just Telegram updates
- Content stages for HTA: Idea → Brief → Draft → Corinne Review → Approved → Published

**Proposed Design:**
New `contentPipeline` table:
```typescript
contentPipeline: defineTable({
  userId: v.id("users"),
  title: v.string(),
  type: v.union(
    v.literal("x_post"),
    v.literal("email"),
    v.literal("blog"),
    v.literal("instagram"),
    v.literal("script"),
    v.literal("thumbnail"),
    v.literal("landing_page"),
  ),
  project: v.union(v.literal("hta"), v.literal("aspire"), v.literal("personal")),
  stage: v.union(
    v.literal("idea"),
    v.literal("brief"),
    v.literal("draft"),
    v.literal("review"),     // waiting for Corinne
    v.literal("approved"),
    v.literal("published"),
  ),
  content: v.optional(v.string()),    // The actual draft text
  notes: v.optional(v.string()),      // Corinne's feedback
  assignedAgent: v.optional(v.string()), // "maven", "sebastian"
  dueDate: v.optional(v.string()),
  publishedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_project_stage", ["project", "stage"])
```

**New Component:** `ContentPipeline.tsx`
- Kanban with 6 columns (idea → published)
- Maven can write content directly into Convex via `npx convex run`
- "Review" column highlights items waiting for Corinne
- Corinne can click any card to approve or leave feedback

**How Hard:** Medium  
**Effort:** ~6-8 hours
- New Convex table + mutations
- New kanban component (can reuse `SebastianKanban` pattern)
- New sidebar entry under "Maven" or "AI Squad"
- Agent-side script to push content drafts to Convex

**Priority for Corinne:** HIGH (for HTA launch specifically)  
Maven needs somewhere to drop scripts, posts, and email drafts that Corinne can review without going through Telegram history.

---

### 3. Calendar

**Alex Finn's Vision:** Visual calendar showing all cron jobs and scheduled tasks. Lets the human verify the AI is scheduling correctly and not going rogue.

**What We Have:** PARTIAL ✓✗

**`SebastianCalendarView.tsx`** - A week grid showing:
- Daily recurring crons: Morning Brief (8 AM), Evening Check-in (9 PM), Quo Monitor (9:30 PM)
- Weekly: RPM Review (Sunday 9:15 PM)
- Active project tasks listed below the grid
- Today highlighted in amber

**What's Good:**
- ✅ Week grid is already there
- ✅ Recurring cron schedule is visible
- ✅ Part of `SebastianWorkspace` (under Sebastian tab)

**What's Missing:**
1. **Static schedule** - Crons are hardcoded in the component, not pulled from a real source. If a cron changes, the UI won't know.
2. **No actual cron status** - Can't tell if yesterday's Morning Brief actually ran successfully
3. **No future view** - Only shows current week, can't see next 30 days
4. **Not Corinne-facing** - Lives inside "Sebastian" tab which Corinne may not check
5. **No one-off scheduled tasks** - If Sebastian schedules "send Allie an email Thursday at 2pm," it won't appear here

**Improvements Needed:**

**A. Cron Registry Table (schema change):**
```typescript
cronJobs: defineTable({
  name: v.string(),           // "Morning Brief"
  schedule: v.string(),       // "Daily 8:00 AM PST"
  description: v.string(),
  agent: v.string(),          // "sebastian"
  enabled: v.boolean(),
  lastRanAt: v.optional(v.number()),
  lastStatus: v.optional(v.union(v.literal("success"), v.literal("failed"), v.literal("skipped"))),
  nextRunAt: v.optional(v.number()),
})
```

**B. Scheduled Events Table:**
```typescript
scheduledEvents: defineTable({
  userId: v.id("users"),
  title: v.string(),
  scheduledAt: v.number(),    // Unix timestamp
  type: v.union(v.literal("cron"), v.literal("one-off"), v.literal("reminder")),
  agent: v.optional(v.string()),
  status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
  notes: v.optional(v.string()),
})
```

**C. Sebastian writes cron status after each run** - simple `npx convex run` call at end of each cron job

**How Hard:** Medium  
**Effort:** ~4-6 hours for full implementation

**Priority for Corinne:** MEDIUM  
She currently trusts the crons are running (and gets the outputs). But visibility matters as we add more agents. Especially for Scout's Quo monitor.

---

### 4. Memory

**Alex Finn's Vision:** Searchable UI for all memory files. Beautiful document view. Global search across all memories and conversations.

**What We Have:** NO ✗

Nothing. Our memory system lives entirely in the filesystem:
- `memory/YYYY-MM-DD.md` daily files
- `MEMORY.md` long-term curated memory
- `second-brain/` folder (for knowledge articles)

There is zero UI for Corinne to see what Sebastian remembers about her, what's been learned, or what's in the daily notes.

**Why This Matters:**
- Corinne could search "when did Sebastian set up Quo monitoring?" and find it
- She could see what Sebastian thinks her priorities are
- Transparency: she can verify AI understands her situation correctly
- Creepy-cool: seeing your AI's memory of you is actually very compelling UX

**Proposed Design:**

**New `memories` table:**
```typescript
memories: defineTable({
  userId: v.id("users"),
  date: v.string(),             // YYYY-MM-DD
  type: v.union(
    v.literal("daily"),         // from memory/YYYY-MM-DD.md
    v.literal("long_term"),     // from MEMORY.md sections
    v.literal("decision"),      // key decisions made
    v.literal("user_fact"),     // things learned about Corinne
  ),
  title: v.string(),
  content: v.string(),
  tags: v.array(v.string()),    // ["hta", "aspire", "corinne", "agent"]
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_date", ["date"])
  .searchIndex("search_content", {
    searchField: "content",
    filterFields: ["userId", "type"],
  })
```

**New Component:** `MemoryView.tsx`
- List of memory entries with date and type badges
- Full-text search box (Convex has native search)
- Clicking an entry expands to full document view
- Sidebar agent can push daily summaries here each morning

**Agent writes memory:** Sebastian's morning cron pushes yesterday's key points:
```bash
npx convex run memories:createMemory --args '{"date":"2026-02-17","type":"daily","title":"Feb 17 Summary",...}'
```

**How Hard:** Medium  
**Effort:** ~5-7 hours
- New Convex table with search index
- Import/sync script to pull from filesystem to Convex (one-time)
- New `MemoryView.tsx` component with search
- Agent-side: Sebastian adds memory push to end of daily brief cron

**Priority for Corinne:** MEDIUM  
Not urgent, but becomes very valuable once we have 3+ months of history. Also builds trust - she can see what Sebastian knows about her life.

---

### 5. Team (Agent Org Chart)

**Alex Finn's Vision:** Org chart for sub-agents with roles/responsibilities. Shows who does what. Keeps AI accountable for agent management. Human can see who's active, who's responsible for what.

**What We Have:** PARTIAL ✓✗

**`SebastianAgentView.tsx`** - Shows:
- 3 agent cards: Sebastian, Scout, Maven (with their responsibilities, model, last activity)
- "Recent Handoffs" section
- Future agents (Closer, Compass, Builder, Champion) shown as greyed-out cards
- Agent economics ($200/month, 3 deployed, 7 target)

**The Sidebar** also has a mini agent status card at the bottom (hardcoded).

**What's Good:**
- ✅ Visual cards with roles
- ✅ Future roadmap visible
- ✅ Handoffs section (even if static)
- ✅ Matches `THE-SQUAD.md` structure

**What's Missing:**
1. **All hardcoded** - Agent list, status, last activity are static strings. If we add Compass or James, the code must be updated manually.
2. **No real-time status** - "last activity" says "Yesterday 9:30 PM" forever. It doesn't update when Scout actually runs.
3. **No Convex backing** - Should be a `agents` table so agent status can be written by agents themselves
4. **Missing agents** - Compass and James exist per our actual squad but aren't in the UI (they're listed as future)
5. **No org chart visualization** - Alex Finn's vision had an actual org chart hierarchy

**Schema Change:**
```typescript
agentSquad: defineTable({
  name: v.string(),           // "Scout"
  emoji: v.string(),          // "🔍"
  role: v.string(),           // "Operations Commander"
  model: v.string(),          // "claude-sonnet-4-5"
  status: v.union(
    v.literal("active"),
    v.literal("live"),
    v.literal("idle"),
    v.literal("planned"),
  ),
  responsibilities: v.array(v.string()),
  lastActivityAt: v.optional(v.number()),
  lastActivityNote: v.optional(v.string()),  // "Ran Quo monitor, found 2 action items"
  tasksCompleted: v.optional(v.number()),    // running count
  phase: v.number(),           // 1-5 (build order)
})
```

**Agents write their own status:** At end of each cron run:
```bash
npx convex run agentSquad:updateStatus --args '{"name":"Scout","lastActivityNote":"Quo monitor complete. 2 parent action items found."}'
```

**"Office" view** (see Component 6 below) handles the real-time visualization.

**How Hard:** Easy-Medium  
**Effort:** ~3-4 hours
- New Convex table (or add to existing `teamMembers` which already exists but is human-focused)
- Update `SebastianAgentView.tsx` to pull from Convex instead of hardcoded
- Add Compass and James to the roster
- Agent-side: each cron job pushes a lastActivity update

**Priority for Corinne:** MEDIUM  
She likes seeing her "squad" - this was exciting for her early on. Making it live/dynamic would be a nice moment.

**Note:** `convex/teamMembers.ts` already exists but is for human team (Allie, coaches). Agent squad should be a separate table to avoid confusion.

---

### 6. Office (Agent Visualization)

**Alex Finn's Vision:** Fun visualization of agents at virtual desks working. Shows real-time status of each agent - which desk is "active" (agent running), which is "idle". Gamified, visual, makes the AI team feel alive.

**What We Have:** NO ✗

Nothing remotely like this exists. The closest thing is the static sidebar card with colored dots.

**Why This Would Be Valuable (and Fun):**
- Corinne would love seeing "Scout is at their desk right now scanning Quo messages"
- Makes the abstract AI team feel tangible and alive
- Alex Finn said this is the most engaging view for visitors/family

**Proposed Design:**

Simple implementation (not a complex 3D office):
- Grid of agent "desk" cards
- Each card has: agent emoji, name, role
- Status indicator: pulsing green = running NOW, blue dot = ran today, grey = idle
- "What I'm doing": Last activity note with timestamp
- Optional: tasks completed this week counter

**Component:** `AgentOffice.tsx`
- Could replace or augment `SebastianAgentView.tsx`
- Pull from `agentSquad` Convex table (see #5 above)
- Simple CSS animations for "active" state (pulsing ring around card)

**Real-time status:** If a cron job marks itself as "running" at start and "done" at end, we can show exactly when an agent is mid-task.

**More ambitious:** Convex real-time subscriptions mean the UI would update live without refresh - when Scout starts its 9:30 PM run, the office view would instantly show Scout's desk go active.

**How Hard:** Medium  
**Effort:** ~4-5 hours (depends on how fancy the visualization gets)
- Requires the `agentSquad` table from #5
- Add `isRunning: v.boolean()` and `runStartedAt: v.optional(v.number())` to track live status
- New `AgentOffice.tsx` component with animated cards
- Agents write `isRunning: true` at cron start, `false` at end

**Priority for Corinne:** LOW (fun/delight, not operational)  
Build after the operational gaps are filled. But would be a great "wow" feature.

---

## Prioritized Build Queue

Based on operational value for Corinne (Aspire Soccer Coaching + HTA launch):

| Priority | Feature | Component | Effort | Value |
|----------|---------|-----------|--------|-------|
| 🔴 HIGH | Shared Task Board (AI assignee + agent API) | SebastianKanban.tsx + schema | 4h | Agent accountability |
| 🔴 HIGH | Content Pipeline for Maven | New ContentPipeline.tsx | 6-8h | HTA launch visibility |
| 🟡 MED | Calendar - Live Cron Status | SebastianCalendarView.tsx + schema | 4-6h | AI oversight |
| 🟡 MED | Agent Team - Convex-backed | SebastianAgentView.tsx + schema | 3-4h | Dynamic, real |
| 🟡 MED | Memory View - Search UI | New MemoryView.tsx + schema | 5-7h | Transparency |
| 🟢 LOW | Office Visualization | New AgentOffice.tsx | 4-5h | Delight |

**Total effort:** ~27-34 hours of development

---

## What Alex Has That We Don't (Summary)

| Feature | Alex Finn | Us |
|---------|-----------|-----|
| Task board with AI assignee | ✅ Full | ✓ Partial (no agent field) |
| Content pipeline kanban | ✅ Full | ✗ None |
| Calendar with cron visibility | ✅ Full | ✓ Partial (static, hardcoded) |
| Memory search UI | ✅ Full | ✗ None (filesystem only) |
| Agent org chart (live data) | ✅ Full | ✓ Partial (hardcoded static) |
| Office visualization | ✅ Full | ✗ None |

## What We Have That Alex Doesn't (Our Strengths)

| Feature | Us |
|---------|-----|
| Daily check-ins (morning/evening) | ✅ Full |
| Habit tracking (HPH framework) | ✅ Full |
| RPM categories (personal + professional) | ✅ Full |
| Project task management (HTA, Aspire, Homeschool) | ✅ Full |
| Homeschool planner (schedule, books, field trips) | ✅ Full |
| Aspire Soccer operational views (Spring, PDP, 7v7, Camps) | ✅ Full |
| Self-improvement feedback widget | ✅ Partial |

---

## Our-Specific Recommendations

### For Corinne's Use Case

**Sprint 1 - Make AI Visible (this week, ~8h)**
1. Add `assignedTo` (agent field) to `sebastianTasks` schema
2. Update `SebastianKanban.tsx` to show agent badges and filter by assignee
3. Expose a Convex HTTP endpoint for agents to update task status programmatically
4. Make the Sebastian tab on the sidebar more prominent (or add "AI Squad" as a top-level nav item)

**Sprint 2 - Content Pipeline for Maven (HTA launch, ~8h)**
1. New `contentPipeline` Convex table
2. New kanban component with content-specific columns
3. Maven skill: after generating X posts or email drafts, push to Convex pipeline
4. Corinne can review/approve without digging through Telegram

**Sprint 3 - Live Agent Status (~6h)**
1. New `agentSquad` Convex table
2. Each cron job writes status updates to Convex
3. Update `SebastianAgentView.tsx` to pull live data
4. Add Compass and James to the roster (even if status = "planned")

### Agent-Specific Notes

**Sebastian** - Already has the Kanban. Main gap: make himself the assignee for tasks he's working on, and write completion notes.

**Scout** - Quo monitor cron should write results to both memory and agentSquad status. Today it just sends a Telegram message.

**Maven** - Needs the Content Pipeline most urgently for HTA launch. Every piece of content Maven generates should land in the pipeline for Corinne's review before posting.

**Compass** - Not yet deployed, but Finance Director role. When built, should feed a `financialMetrics` table visible in Mission Control.

**James** - Not mentioned in existing code. If deployed, add to agent squad roster.

### Aspire Soccer Operational Notes

The Aspire section of Mission Control is actually well-built for what it does (Spring League, Camps, PDP, 7v7). The gap is that Scout's Quo monitoring results don't surface in Mission Control - they go to Telegram only. 

**Quick win:** Scout's evening report should create a daily `contentPipeline`-style entry in a `scoutReports` table that Corinne can see at a glance in Mission Control without needing to scroll Telegram.

---

## Technical Notes

### Files to Modify

| File | Change Needed |
|------|--------------|
| `convex/schema.ts` | Add: `contentPipeline`, `cronJobs`, `scheduledEvents`, `agentSquad`, `memories`, `scoutReports` tables; modify `sebastianTasks` |
| `components/SebastianKanban.tsx` | Add assignedTo badge, filter by agent, agent-writable endpoint |
| `components/SebastianAgentView.tsx` | Pull from Convex, show live status, add all 7 squad members |
| `components/SebastianCalendarView.tsx` | Pull from `cronJobs` table, show last run + status |
| `components/SidebarNew.tsx` | Add Content Pipeline + Memory to nav |
| `app/dashboard/page.tsx` | Add new view cases for pipeline, memory, office |
| New: `components/ContentPipeline.tsx` | Maven's content kanban |
| New: `components/MemoryView.tsx` | Memory search UI |
| New: `components/AgentOffice.tsx` | Agent desk visualization |
| New: `convex/contentPipeline.ts` | CRUD for content items |
| New: `convex/agentSquad.ts` | Agent status mutations |
| New: `convex/memories.ts` | Memory CRUD + search |
| New: `convex/cronRegistry.ts` | Cron job status tracking |

### Convex API Access for Agents

Agents (running as cron jobs) can interact with Convex using:
```bash
# Query tasks
npx convex run sebastianTasks:getSebastianTasks '{"userId":"<id>"}'

# Update task status
npx convex run sebastianTasks:updateSebastianTask '{"id":"<taskId>","status":"done","agentNotes":"Completed X"}'

# Push content to pipeline
npx convex run contentPipeline:createItem '{"type":"x_post","stage":"draft","content":"..."}'
```

This is the key bridge: agents write to Convex, Corinne reads it in the UI. No more "Sebastian only exists in Telegram."

---

*Generated by Sebastian subagent | Feb 18, 2026*  
*Reference codebase: `/Users/sebastian/.openclaw/workspace/mission-control/`*
