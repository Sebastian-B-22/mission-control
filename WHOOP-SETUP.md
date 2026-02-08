# Whoop API Setup Guide

**Account:** sebastian@aspiresoccercoaching.com  
**Purpose:** Integrate Whoop fitness data into Mission Control dashboard

---

## Step 1: Create Whoop Developer Account (5 min)

1. Go to: https://developer-dashboard.whoop.com
2. Click "Sign In" or "Get Started"
3. **Login with your existing Whoop account credentials**
   - If you don't have a Whoop account yet, you'll need to create one first at whoop.com
   - Use your Whoop member login (the account tied to your Whoop device)
4. You'll be redirected to id.whoop.com for authentication
5. Authorize the Developer Dashboard to access your account

---

## Step 2: Create a Team (2 min)

After first login, you'll be prompted to create a team:

1. Click "Get Started"
2. **Team Name:** "Corinne's Apps" (or whatever you prefer)
3. Click "Create Team"

---

## Step 3: Create Your First App (5 min)

1. Go to: https://developer-dashboard.whoop.com/apps/create
2. **App Name:** "Mission Control"
3. **App Description:** "Personal life OS dashboard with fitness tracking"

### Scopes (Select ALL of these):
- ✅ `read:recovery` - Recovery scores, HRV, resting heart rate
- ✅ `read:sleep` - Sleep performance, duration, stages
- ✅ `read:workout` - Workout strain, heart rate, calories
- ✅ `read:cycles` - Daily strain and physiological cycles
- ✅ `read:body_measurement` - Height, weight, max heart rate
- ✅ `read:profile` - Name and email

### Redirect URIs:
Add these two URLs (we need both for local dev + production):

1. `http://localhost:3000/api/auth/whoop/callback`
2. `https://mission-control.vercel.app/api/auth/whoop/callback` (update with actual Vercel URL after deploy)

4. Click "Create" at the bottom

---

## Step 4: Get Your Credentials

After creating the app:

1. You'll see your **Client ID** and **Client Secret**
2. **COPY BOTH** - you'll need these for Mission Control

**Security Note:** Never share your Client Secret publicly or commit it to git. It should only be used server-side.

---

## What These Credentials Enable

Once integrated into Mission Control, you'll automatically sync:

### Recovery (Daily AM):
- Recovery score (0-100%)
- Resting heart rate
- HRV (heart rate variability)
- SpO2 levels
- Skin temperature

### Sleep (Nightly):
- Sleep performance %
- Sleep consistency %
- Time in REM/deep/light/awake
- Sleep efficiency
- Respiratory rate

### Workouts:
- Activity strain score
- Avg/max heart rate
- Calories burned
- Distance, altitude changes
- Heart rate zone breakdown

### Daily Cycles:
- Day strain
- Average heart rate throughout day

### Body Metrics:
- Current height/weight
- Max heart rate

---

## Next Steps (After Mission Control is Live)

1. Add Whoop OAuth flow to Mission Control
2. Implement data sync (pull latest recovery/sleep/workout data)
3. Add dashboard widgets for:
   - Today's recovery score (prominent display)
   - Weekly recovery trend graph
   - Sleep performance tracking
   - Workout strain vs recovery balance
4. Set fitness goals (e.g., "85%+ recovery 5 days/week")
5. Track progress against "Bangin' Ass Body" RPM goals

---

## Accessing Your App Later

To view or edit your app credentials:

1. Go to: https://developer-dashboard.whoop.com
2. Click on "Mission Control" app
3. View Client ID/Secret
4. Edit scopes or redirect URIs if needed

---

## Additional Resources

- **API Docs:** https://developer.whoop.com/api
- **OAuth Guide:** https://developer.whoop.com/docs/developing/oauth
- **Rate Limits:** Check API docs for current limits

---

**Created:** 2026-02-07  
**For:** Mission Control Phase 2 - Whoop Integration
