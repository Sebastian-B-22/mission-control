# Whoop API - Ready for Integration

✅ **Setup Complete** (2026-02-07 22:55 PST)

---

## Credentials

Add these to your `.env.local` file:

```bash
# Whoop API
WHOOP_CLIENT_ID=071a1407-8802-4ae6-94ac-0fabe0a305e9
WHOOP_CLIENT_SECRET=490a9fa5c1e80eaaec0214d674f7d28ea241ff1d3d3f2fef69cbaab93c905b1a
```

---

## App Details

- **App Name:** Mission Control
- **Team:** Corinne's Apps
- **Account:** corinnebriers@gmail.com (Whoop member account)
- **Status:** Testing mode (10 test users available)
- **Contact:** sebastian@aspiresoccercoaching.com

---

## OAuth Configuration

**Redirect URL (configured):**
- `http://localhost:3000/api/auth/whoop/callback`

**TODO:** Add production URL after Vercel deployment:
- Go to https://developer-dashboard.whoop.com/apps/071a1407-8802-4ae6-94ac-0fabe0a305e9/edit
- Add: `https://[your-vercel-url]/api/auth/whoop/callback`

---

## Scopes (All Enabled)

✅ `read:recovery` - Recovery score, HRV, resting HR  
✅ `read:cycles` - Daily strain, avg heart rate  
✅ `read:sleep` - Sleep performance, duration, stages  
✅ `read:workout` - Workout strain, heart rate, calories  
✅ `read:profile` - Name, email  
✅ `read:body_measurement` - Height, weight, max HR  

---

## API Endpoints

Base URL: `https://api.prod.whoop.com`

**Key endpoints:**
- `/developer/v2/user/profile/basic` - User info
- `/developer/v2/recovery` - Recovery data
- `/developer/v2/cycle` - Daily cycles
- `/developer/v2/sleep` - Sleep data
- `/developer/v2/workout` - Workout data
- `/developer/v2/user/measurement/body` - Body measurements

---

## Rate Limits

- **Daily:** 10,000 requests
- **Per Minute:** 100 requests

---

## Integration Steps (Phase 2)

1. Create OAuth flow (`/api/auth/whoop/auth` and `/api/auth/whoop/callback`)
2. Store access token securely in Convex (per user)
3. Create Whoop data sync functions (pull latest recovery/sleep/workout)
4. Add dashboard widgets:
   - Today's recovery score
   - Weekly recovery trend
   - Sleep performance tracking
   - Workout strain vs recovery balance
5. Set fitness goals in RPM "Bangin' Ass Body" category
6. Track progress automatically from Whoop data

---

## Dashboard Access

View/edit app: https://developer-dashboard.whoop.com/apps/071a1407-8802-4ae6-94ac-0fabe0a305e9

---

**Next Step:** Wait for Mission Control MVP to be deployed, then integrate Whoop API in Phase 2.
