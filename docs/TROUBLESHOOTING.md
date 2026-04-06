# Mission Control Troubleshooting Guide

## Duplicate Schedule Items

**Symptoms:**
- Schedule items appearing twice in Daily/Weekly views
- Same activity showing multiple times at same time slot

**Root Causes:**
1. **Multiple data imports** without clearing old data first
2. **Build failures** preventing cleanup deployments from reaching production
3. **User ID mismatches** when querying wrong user's data

### April 6, 2026 Incident

**What happened:**
- 73 duplicate schedule entries existed from Feb 28 import
- April 1 re-import created duplicates instead of replacing
- Build failures (TypeScript errors) blocked all deployments for 3 days
- Users saw old buggy version while fixes piled up in Git

**Resolution:**

1. **Fixed Build Error:**
   - `AspireOverview.tsx` referenced undefined `onNavigate` function
   - Removed broken button code
   - Verified with `npm run build` before pushing

2. **Found Correct User ID:**
   ```bash
   # Query all users to find the right one
   npx convex run admin:getAllUsers '{}'
   ```

3. **Deleted Duplicates:**
   - Script: `/mission-control/delete-schedule-duplicates.mjs`
   - Strategy: Group by `dayOfWeek + startTime + endTime + normalizedActivity`
   - Keep newest (highest `createdAt`), delete older copies
   - Result: Removed 73 duplicates

**Prevention:**

### 1. Pre-Deployment Checklist

Before pushing to production:

```bash
# ALWAYS test build locally first
cd /Users/sebastian/.openclaw/workspace/mission-control
npm run build

# If build fails, fix it before pushing
# Check recent deployments
vercel ls | head -10

# If seeing Error status, investigate immediately
```

### 2. Data Import Safety

When importing schedule data:

```javascript
// WRONG - creates duplicates
await ctx.db.insert("weeklySchedule", newBlock);

// RIGHT - check for existing first
const existing = await ctx.db
  .query("weeklySchedule")
  .withIndex("by_user_and_day_and_time", q => 
    q.eq("userId", userId)
     .eq("dayOfWeek", dayOfWeek)
     .eq("startTime", startTime)
     .eq("endTime", endTime)
  )
  .first();

if (existing) {
  // Update or skip
  await ctx.db.patch(existing._id, { activity: newActivity });
} else {
  await ctx.db.insert("weeklySchedule", newBlock);
}
```

### 3. Duplicate Detection Query

Run this monthly to catch duplicates early:

```bash
cd /Users/sebastian/.openclaw/workspace/mission-control
node debug-all-schedule.mjs
```

Look for lines showing 2x the expected count (e.g., Monday: 30 items when should be 15).

### 4. Monitor Vercel Deployments

**Set up alerts** when deployments fail:
- Check Vercel dashboard daily
- If 2+ deployments fail in a row → investigate immediately
- Don't let broken builds pile up

**Deployment Health Command:**
```bash
vercel ls | head -5
# Should show "● Ready" for most recent deployment
# If showing "● Error" - stop and fix before continuing
```

## Common Errors

### "Cannot find name 'X'" - TypeScript Error

**Symptom:** Build fails with `Cannot find name` error

**Cause:** Referenced variable/function that doesn't exist (often from incomplete refactor)

**Fix:**
1. Search codebase for the undefined name
2. Either define it or remove the reference
3. Test build locally before pushing

### "weeklySchedule table is empty" but UI shows data

**Symptom:** Database queries return empty but app displays schedule

**Causes:**
1. Querying wrong Convex deployment (dev vs prod)
2. Querying wrong user ID
3. PWA cache showing stale data

**Fix:**
```bash
# 1. Verify production Convex URL
grep CONVEX_URL .env.production.actual

# 2. Get ALL users to find correct ID
CONVEX_URL=<prod-url> npx convex run admin:getAllUsers '{}'

# 3. Query with correct user ID
CONVEX_URL=<prod-url> npx convex run weeklySchedule:getScheduleByDay \
  '{"userId":"<correct-id>","dayOfWeek":"monday"}'
```

### Deployments succeed but changes don't appear

**Symptom:** Git push succeeds, Vercel shows Ready, but app unchanged

**Causes:**
1. Deployment succeeded but user has cached old version
2. Changes were in wrong branch
3. Environment variables not updated

**Fix:**
1. Check which deployment is actually live:
   ```bash
   vercel ls --prod | head -5
   ```

2. Hard refresh PWA (close completely, reopen)

3. Check if custom domain points to latest deployment

## Useful Scripts

Located in `/mission-control/`:

- `debug-all-schedule.mjs` - Show all schedule data for all users
- `delete-schedule-duplicates.mjs` - Remove duplicate entries (keeps newest)
- `find-duplicate-schedule-items.mjs` - Report duplicates without deleting

## Convex Deployment URLs

**Mission Control:**
- Production: `https://harmless-salamander-44.convex.cloud`
- Local Dev: `https://healthy-flamingo-415.convex.cloud`

**Always verify before running mutations:**
```bash
echo $CONVEX_URL
grep CONVEX_URL .env.production.actual
```

## Contact

If stuck, document:
1. What you're seeing (screenshots)
2. What you tried
3. Error messages (full text)
4. Recent changes (git log)

Then ask Sebastian or check this guide first.

---

**Last Updated:** April 6, 2026  
**Incident Count:** 1 (duplicates fixed)
