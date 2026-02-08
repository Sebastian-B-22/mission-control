# Mission Control - Setup Guide

## Current Status ✅

**Completed (Friday Night):**
- ✅ NextJS 14 project scaffolded with App Router
- ✅ Tailwind CSS configured
- ✅ shadcn/ui components installed (button, card, input, label, tabs, textarea)
- ✅ Convex schema defined (users, rpmCategories, dailyCheckIns, habitScores, weeklyRPM)
- ✅ Convex functions created (users, rpm, checkIns, habits)
- ✅ Clerk authentication structure set up
- ✅ Dashboard page with Personal/Professional tabs
- ✅ Morning check-in page
- ✅ Evening check-in page with habit scorecard
- ✅ Git repository initialized
- ✅ README with comprehensive documentation

## Next Steps to Complete Setup

### 1. Configure Convex ⏳

**Status**: Waiting for authentication completion

**Steps**:
```bash
cd /Users/sebastian/.openclaw/workspace/mission-control
npx convex dev
```

When prompted:
1. Choose "Login or create an account"
2. Complete authentication in browser
3. Create a new project named "mission-control"
4. Copy the `NEXT_PUBLIC_CONVEX_URL` provided

This will:
- Create the Convex project
- Generate `convex/_generated/` folder
- Provide deployment URL

### 2. Set Up Clerk Account

**Steps**:
1. Go to https://clerk.com
2. Sign up or login
3. Create new application: "Mission Control"
4. Copy the API keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 3. Create `.env.local` File

```bash
cd /Users/sebastian/.openclaw/workspace/mission-control
cp .env.local.example .env.local
```

Edit `.env.local` with your keys:
```env
# Convex
NEXT_PUBLIC_CONVEX_URL=<from-convex-setup>

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from-clerk>
CLERK_SECRET_KEY=<from-clerk>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 4. Test Locally

```bash
# Terminal 1: Start Convex dev server
npx convex dev

# Terminal 2: Start NextJS dev server
npm run dev
```

Visit http://localhost:3000 and test:
- ✅ Sign up flow
- ✅ Sign in flow
- ✅ Dashboard loads
- ✅ Navigation works

### 5. Create GitHub Repository

```bash
# On GitHub, create new repository "mission-control"

# Then push:
git remote add origin https://github.com/<username>/mission-control.git
git branch -M main
git push -u origin main
```

### 6. Deploy to Vercel

**Option A: Via Dashboard**
1. Go to https://vercel.com
2. Click "New Project"
3. Import from GitHub: mission-control
4. Add environment variables:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`
5. Deploy!

**Option B: Via CLI**
```bash
npm install -g vercel
vercel
# Follow prompts, add env vars
vercel --prod
```

### 7. Configure Convex for Production

```bash
# In Convex dashboard, configure production deployment
npx convex deploy --prod
```

Update Vercel environment variables with production Convex URL if different.

### 8. Configure Clerk Production Settings

In Clerk dashboard:
1. Add production domain from Vercel
2. Configure redirect URLs for production
3. Test authentication on production URL

## Saturday Tasks (Next Phase)

### Morning:
1. ✅ Wire up Convex queries/mutations to Dashboard
2. ✅ Implement RPM category CRUD (add/edit goals and needle movers)
3. ✅ Add visual progress indicators to dashboard cards
4. ✅ Create navigation menu with links to check-ins

### Afternoon:
5. ✅ Implement user initialization (create default RPM categories on signup)
6. ✅ Add proper loading states
7. ✅ Add error handling
8. ✅ Polish UI/UX (spacing, colors, typography)
9. ✅ Test all flows end-to-end

## Sunday Morning Tasks

1. ✅ Wire up morning check-in to save data
2. ✅ Wire up evening check-in to save data
3. ✅ Display recent check-ins on dashboard
4. ✅ Add check-in completion indicators
5. ✅ Add timezone handling (PST)
6. ✅ Test data persistence

## Sunday Evening Tasks

1. ✅ Create habit tracking visualization page
2. ✅ Implement line charts for habit trends (Recharts)
3. ✅ Show ONE THING completion rate
4. ✅ Weekly/monthly summary cards
5. ✅ Create Weekly RPM planning page
6. ✅ Final polish and bug fixes
7. ✅ Production testing
8. ✅ Handoff documentation for Corinne

## Known Issues / TODOs

- [ ] Convex authentication needs to be completed
- [ ] Environment variables need to be configured
- [ ] Dashboard needs to fetch real data from Convex (currently static)
- [ ] Check-in forms need to save to Convex (currently just navigate)
- [ ] User initialization flow needs to be implemented
- [ ] Mobile responsive testing
- [ ] Add loading spinners
- [ ] Add error boundaries
- [ ] Add toast notifications for success/error states

## Files Created

### Core Setup
- `convex/schema.ts` - Database schema
- `convex/users.ts` - User management
- `convex/rpm.ts` - RPM categories with default initialization
- `convex/checkIns.ts` - Daily check-ins
- `convex/habits.ts` - Habit tracking

### UI Components
- `app/layout.tsx` - Root layout with Convex + Clerk providers
- `app/page.tsx` - Landing/login page
- `app/dashboard/page.tsx` - Main dashboard with tabs
- `app/check-in/morning/page.tsx` - Morning check-in form
- `app/check-in/evening/page.tsx` - Evening check-in with scorecard
- `app/sign-in/[[...sign-in]]/page.tsx` - Clerk sign-in
- `app/sign-up/[[...sign-up]]/page.tsx` - Clerk sign-up
- `app/ConvexClientProvider.tsx` - Convex + Clerk integration
- `middleware.ts` - Clerk authentication middleware

### Documentation
- `README.md` - Comprehensive project documentation
- `SETUP.md` - This file
- `.env.local.example` - Environment variables template

## Quick Start (After Setup Complete)

```bash
# Development
npm run dev

# Production build test
npm run build
npm start

# Deploy
git push origin main  # Auto-deploys to Vercel
```

## Support Resources

- **Convex Docs**: https://docs.convex.dev
- **Clerk Docs**: https://clerk.com/docs
- **NextJS 14 Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Recharts**: https://recharts.org

## Timeline Checkpoint

**✅ Friday Night Goal Achieved**: Initial scaffold + deployment structure ready

**Next Milestone**: Saturday - Core dashboard functionality with real data

---

**Last Updated**: February 7, 2026, 9:30 PM PST
