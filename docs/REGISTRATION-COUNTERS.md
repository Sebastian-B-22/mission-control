# Registration Counters - Implementation Summary

**Status:** ✅ Complete and tested  
**Committed:** Yes (commit `2c8b87e`)  
**Date:** 2026-02-26

## What Was Built

### 1. Convex Schema & Functions ✅

**Schema Addition** (`convex/schema.ts`):
```typescript
registrationCounts: defineTable({
  program: v.string(), // "spring-pali", "spring-agoura", "camps", "pdp", "7v7"
  count: v.number(),
  lastUpdated: v.number(),
}).index("by_program", ["program"]),
```

**New File** (`convex/registrations.ts`):
- `getCount(program)` - Query to get count for a single program
- `getAllCounts()` - Query to get all counts with defaults
- `updateCount(program, count)` - Mutation to update single count
- `bulkUpdateCounts(counts)` - Mutation for Scout's batch updates

### 2. Sidebar Integration ✅

**Updated** (`components/SidebarNew.tsx`):
- Imported and used `api.registrations.getAllCounts` query
- Created `countsMap` for quick lookups
- Added badges to Aspire children:
  - **Spring League**: `Pali: 42 | Agoura: 0`
  - **Camps**: `15`
  - **PDP**: `0`
  - **7v7**: `0`

Badge styling: `bg-zinc-800 text-zinc-300 text-xs px-1.5 py-0.5 rounded`

### 3. API Endpoint for Scout ✅

**New File** (`app/api/registrations/update/route.ts`):
- POST endpoint accepts `{ counts: [{program, count}] }`
- Validates request body and each count entry
- Calls Convex `bulkUpdateCounts` mutation
- Returns success/error response
- GET endpoint returns API documentation

**Middleware Update** (`middleware.ts`):
- Added `/api/registrations/update(.*)` to public routes
- Allows Scout to call without Clerk authentication

### 4. Seed Data ✅

**Created** (`scripts/seed-registration-counts.mjs`):
- Seeds initial counts (all programs start at 0)
- Can be run with: `node scripts/seed-registration-counts.mjs`
- Verifies data after seeding

**Initial data seeded:**
- spring-pali: 0
- spring-agoura: 0
- camps: 0
- pdp: 0
- 7v7: 0

## How to Test

### 1. View the Sidebar
```bash
npm run dev
# Visit http://localhost:3000
# Login and check Aspire section sidebar badges
```

### 2. Test API Endpoint
```bash
# Update counts
curl -X POST http://localhost:3000/api/registrations/update \
  -H "Content-Type: application/json" \
  -d '{"counts": [{"program": "spring-pali", "count": 89}, {"program": "camps", "count": 25}]}'

# Expected response:
# {"success":true,"message":"Registration counts updated successfully","results":[...]}
```

### 3. Verify in Database
```bash
node -e "
import { ConvexHttpClient } from 'convex/browser';
import { config } from 'dotenv';
import { api } from './convex/_generated/api.js';

config({ path: '.env.local' });
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

convex.query(api.registrations.getAllCounts).then(counts => {
  console.table(counts);
  process.exit(0);
});
"
```

### 4. Re-seed if Needed
```bash
node scripts/seed-registration-counts.mjs
```

## For Scout's Nightly Sync

Scout should call the API endpoint with the current Jotform counts:

```bash
curl -X POST https://mission-control.vercel.app/api/registrations/update \
  -H "Content-Type: application/json" \
  -d '{
    "counts": [
      {"program": "spring-pali", "count": 89},
      {"program": "spring-agoura", "count": 45},
      {"program": "camps", "count": 12},
      {"program": "pdp", "count": 7},
      {"program": "7v7", "count": 3}
    ]
  }'
```

## Current Test Data

As of last test (2026-02-26 11:43 AM):
- spring-pali: 42
- spring-agoura: 0
- camps: 15
- pdp: 0
- 7v7: 0

## Issues & Notes

✅ **Resolved:** Initial 404 errors were due to Clerk middleware protecting the route.  
   **Fix:** Added `/api/registrations/update(.*)` to public routes in middleware.ts

✅ **Sidebar Updates:** Badges update automatically when counts change (reactive Convex query)

✅ **Badge Placement:** Shows on child menu items, not parent, for better space utilization

## Next Steps

1. **Scout Integration:**
   - Update Scout's nightly Jotform sync to call this endpoint
   - Map Jotform submission counts to program names:
     - `spring-pali` = Spring League Pali submissions
     - `spring-agoura` = Spring League Agoura submissions
     - `camps` = Summer Camps submissions
     - `pdp` = PDP submissions
     - `7v7` = 7v7 Tournament submissions

2. **Production Deployment:**
   - Changes are committed and ready to deploy
   - Verify Convex schema migration in production
   - Test API endpoint on production URL

3. **Optional Enhancements:**
   - Add date range filtering (e.g., "this week" vs "all time")
   - Show growth indicators (↑ +5 from yesterday)
   - Alert when approaching capacity limits
   - Add last-synced timestamp to UI
