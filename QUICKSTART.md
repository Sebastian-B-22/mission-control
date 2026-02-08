# Mission Control - Quick Start (Get It Live in 30 Minutes!)

This guide gets you from zero to deployed as fast as possible.

## Step 1: Convex Setup (5 min)

```bash
cd /Users/sebastian/.openclaw/workspace/mission-control
npx convex dev
```

1. Choose **"Login or create an account"**
2. Complete browser authentication
3. Create new project: **"mission-control"**
4. Copy the `NEXT_PUBLIC_CONVEX_URL` it provides

Keep the terminal running! This starts your Convex dev server.

## Step 2: Clerk Setup (10 min)

1. Go to **https://clerk.com** → Sign up/Login
2. Create Application → Name: **"Mission Control"**
3. From dashboard, copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Step 3: Environment Variables (2 min)

```bash
cp .env.local.example .env.local
nano .env.local  # or use your preferred editor
```

Paste your keys:
```env
NEXT_PUBLIC_CONVEX_URL=https://xxxxx.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Step 4: Test Locally (5 min)

Open a **second terminal**:

```bash
cd /Users/sebastian/.openclaw/workspace/mission-control
npm run dev
```

Visit **http://localhost:3000**

Test:
- ✅ Sign up works
- ✅ Sign in works
- ✅ Dashboard loads
- ✅ Check-in pages load

If everything works → Move to deployment!

## Step 5: Create GitHub Repo (3 min)

**On GitHub.com:**
1. Create new repository: **"mission-control"**
2. Keep it private
3. Don't initialize with README (we already have one)

**In terminal:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/mission-control.git
git branch -M main
git push -u origin main
```

## Step 6: Deploy to Vercel (5 min)

1. Go to **https://vercel.com**
2. Sign in with GitHub
3. Click **"New Project"**
4. Import **"mission-control"**
5. In **Environment Variables**, add:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/dashboard`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/dashboard`
6. Click **Deploy**!

Wait ~2 minutes for build to complete.

## Step 7: Configure Production (5 min)

### Update Clerk
1. In Clerk dashboard → **Domains**
2. Add your Vercel domain: `your-app.vercel.app`
3. Save

### Deploy Convex to Production
```bash
npx convex deploy --prod
```

This creates your production Convex deployment.

### Test Production
Visit your Vercel URL:
- ✅ Sign up
- ✅ Dashboard loads
- ✅ Everything works!

---

## 🎉 You're Live!

**Project Location**: `/Users/sebastian/.openclaw/workspace/mission-control`

**Local Dev**:
- Terminal 1: `npx convex dev`
- Terminal 2: `npm run dev`
- URL: http://localhost:3000

**Production**:
- URL: `https://your-app.vercel.app`
- Auto-deploys on `git push origin main`

---

## Troubleshooting

### "Convex URL not found"
→ Make sure `.env.local` exists and has `NEXT_PUBLIC_CONVEX_URL`

### "Clerk keys not found"
→ Check `.env.local` has both Clerk keys

### "Build failed on Vercel"
→ Check Vercel environment variables are set correctly
→ Check Vercel build logs for specific error

### "Can't sign in"
→ Make sure your Vercel domain is added to Clerk dashboard

---

## What's Next?

Saturday morning tasks:
1. Wire up dashboard to real Convex data
2. Implement RPM category editing
3. Hook up check-in forms to save data
4. Add habit tracking visualization
5. Polish and test

See **SETUP.md** for detailed Saturday plan.

---

**Time to live app**: ~30 minutes
**Current status**: ✅ All code written, just needs deployment setup
