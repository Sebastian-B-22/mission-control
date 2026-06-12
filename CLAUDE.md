# Mission Control - Project Context

## Stack
- Frontend: Next.js 16.1.6 App Router, React 19.2.3, TypeScript 5, Tailwind CSS 4, shadcn/Radix primitives, lucide-react icons, Recharts charts, Clerk auth.
- Backend/data: Convex - production deployment `harmless-salamander-44`; local development deployment `healthy-flamingo-415`.
- Hosting: Vercel - project `mission-control`, live custom domain `https://mc.aspiresoccercoaching.com`.
- Other: Clerk authentication; Stripe camp payment intents, Checkout fallback, and webhooks in Convex HTTP routes; OpenPhone SMS confirmations; ConvertKit tagging; Telegram outbox routes; Google Calendar sync routes; Whoop/Apple Health API routes; Web Push notifications.

## Structure
- `app/`: Next.js app routes, including `/dashboard`, `/families`, `/family-meeting`, `/hta`, `/tickets`, `/worldcup`, `/knowledge-viewer`, `/knowledge-print`, auth pages, and API routes under `app/api/`.
- `app/dashboard/page.tsx`: main authenticated Mission Control shell; switches `currentView` to render most dashboard views.
- `components/`: shared React components and feature surfaces.
- `components/views/`: domain dashboards and subviews, including Aspire, HTA, homeschool, finance, tickets, health, memory, and knowledge views.
- `components/ui/`: shadcn-style primitives (`button`, `card`, `badge`, `dialog`, `input`, `select`, `tabs`, etc.).
- `convex/`: Convex schema, queries, mutations, actions, HTTP routes, cron jobs, and generated API types.
- `lib/`: shared helpers for utilities, calendar display, category colors, RPM inference, push notifications, and Convex HTTP helpers.
- `hooks/`: client hooks for gateway status and push notifications.
- `public/`: static assets, including HTA icons, knowledge assets, tools, Idaho trip files, and public World Cup Challenge assets.
- `app/globals.css`: Tailwind 4 import, shadcn theme variables, base styles, and a small set of custom utility animations.
- Main views: Daily, Weekly, Monthly, Health, Homeschool, Family Meeting, Finance, Tickets, Home Remodel, Personal RPM, Professional RPM, Aspire Overview, Aspire Family CRM, Aspire Spring Ops, Coach Staffing, Aspire Camps, Aspire PDP, Aspire 7v7, HTA Overview, HTA World Cup, HTA GTM/Product/Curriculum/Marketing/Operations, Agent Ops Queue, Ideas, Content Pipeline, Emails & Texts, Training, Engagement, Huddle, Docs, and Memory Search.

## Conventions
- Component naming pattern: PascalCase React components; feature views usually end in `View` and live in `components/views/`; shadcn primitives are lowercase files under `components/ui/`; Convex functions are lower camel case exports grouped by domain file.
- Styles live primarily in Tailwind utility classes inside components, with shadcn/Tailwind tokens in `app/globals.css`; shared class merging uses `lib/utils.ts`; reusable UI primitives use `class-variance-authority` where needed.
- State management approach: local React `useState` / `useEffect` for UI state, Convex `useQuery` / `useMutation` for live data, Clerk `useUser` / Convex-with-Clerk provider for auth context, query-string `view` param for dashboard deep links, and occasional direct fetches for API route integrations.

## DO NOT TOUCH - hard rules
- Anything imported by or shared with World Cup Challenge code:
  - `app/worldcup/`
  - `components/views/HTAWorldCupView.tsx`
  - `convex/worldCup.ts`
  - `public/worldcup/`
  - World Cup branches inside `convex/http.ts`, especially `sendWorldCupConfirmationSMS`, `sendWorldCupAccessLinkSMS`, and public Challenge HTTP handlers.
- All send/SMS/email tooling and webhook handlers:
  - `convex/http.ts`
  - `convex/telegramOutbox.ts`
  - `convex/emailDrafts.ts`
  - `convex/emailDrafts.delete.ts`
  - `convex/contentOutputGroups.ts`
  - `app/api/agent-hq/send/route.ts`
  - `app/api/tickets/notify/route.ts`
  - `app/api/calendar/update/route.ts`
  - `app/api/cron/update/route.ts`
  - `lib/push-notifications.ts`
  - `convex/push.ts`
  - `convex/pushActions.ts`
- Convex schema and any mutation touching payments or contact data:
  - `convex/schema.ts`
  - `convex/camp.ts`
  - `convex/families.ts`
  - `convex/registrations.ts`
  - `convex/contacts.ts`
  - payment, credit, family, parent phone/email, registration, SMS, and Stripe-related mutations in any file.
- Do not run deploys. Branch commits only. Nothing merges to main without Corinne's explicit approval.

## Workflow
- Work on branch `audit-cleanup` only.
- Commit after each logical change with clear messages.
- First session is read-only: produce `AUDIT_REPORT.md` and `UI_RECOMMENDATIONS.md`; make zero product code changes.
- When uncertain whether a file is Challenge-adjacent, ask - do not guess.
