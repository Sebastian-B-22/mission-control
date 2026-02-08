# 🚀 Deploy Mission Control NOW - Step-by-Step Guide

**Goal:** Get Mission Control live on Vercel in 30 minutes  
**Starting Point:** All services configured, code ready, just needs deployment

---

## Prerequisites Check ✅

- [x] Convex project: `healthy-flamingo-415` - **READY**
- [x] Clerk app: `Mission Control` - **READY**
- [x] GitHub repo: `Sebastian-B-22/mission-control` - **CREATED**
- [x] Vercel account: `sebastians-projects-cdde6c70` - **READY**
- [x] Local code: `/Users/sebastian/.openclaw/workspace/mission-control` - **READY**

---

## Step 1: Configure GitHub Authentication (5 min)

### Option A: Personal Access Token (Recommended - Fast)

1. **Generate Token:**
   - Go to: https://github.com/settings/tokens/new
   - Note: "Mission Control Deploy"
   - Expiration: 90 days
   - Scopes: Check ` repo` (all repo access)
   - Click "Generate token"
   - **COPY THE TOKEN** (you'll only see it once)

2. **Configure Git:**
   ```bash
   cd /Users/sebastian/.openclaw/workspace/mission-control
   
   # Replace YOUR_TOKEN with the actual token
   git remote set-url origin https://YOUR_TOKEN@github.com/Sebastian-B-22/mission-control.git
   
   # Push code
   git push -u origin main
   ```

### Option B: SSH Key (If Already Configured)

```bash
cd /Users/sebastian/.openclaw/workspace/mission-control
git remote set-url origin git@github.com:Sebastian-B-22/mission-control.git
git push -u origin main
```

### Verification:
Visit https://github.com/Sebastian-B-22/mission-control - you should see your code!

---

## Step 2: Import to Vercel (10 min)

1. **Open Vercel:**
   - Go to: https://vercel.com/new
   - You should already be logged in

2. **Connect GitHub:**
   - Click "Continue with GitHub"
   - If prompted, authorize Vercel to access your repositories

3. **Select Repository:**
   - Find "mission-control" in the list
   - Click "Import"

4. **Configure Project:**
   - **Project Name:** `mission-control` (or keep default)
   - **Framework:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Settings:** Leave defaults

5. **Add Environment Variables:**
   Click "Environment Variables" section and add ALL of these:

   ```
   CONVEX_DEPLOYMENT=healthy-flamingo-415
   NEXT_PUBLIC_CONVEX_URL=https://healthy-flamingo-415.convex.cloud
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dXB3YXJkLXNoaW5lci04NC5jbGVyay5hY2NvdW50cy5kZXYk
   CLERK_SECRET_KEY=sk_test_ysJvbMIsS0QowGjibxVyVYMYukrviWUclSer58KdbT
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```

   **Pro Tip:** Copy the whole block, paste into first variable, then separate them one by one

6. **Deploy:**
   - Click "Deploy"
   - Wait 2-5 minutes for build
   - Watch the build logs (should complete successfully)

7. **Get Production URL:**
   - After deployment completes, you'll see a URL like:
   - `https://mission-control-abc123.vercel.app`
   - **COPY THIS URL** - you'll need it for Clerk

---

## Step 3: Update Clerk for Production (5 min)

1. **Open Clerk Dashboard:**
   - Go to: https://dashboard.clerk.com/apps/app_39OVbsD5jkTMWYcPCkqCAZVDxQP
   - Select "Mission Control" app

2. **Add Production Domain:**
   - Go to "Configure" → "Domains"
   - Or "Settings" → "Domains"
   - Click "Add domain"
   - Enter your Vercel URL: `mission-control-abc123.vercel.app`
   - Save

3. **Add Redirect URLs:**
   - Go to "Configure" → "Paths" (or "Settings" → "Paths")
   - Add to allowed redirect URLs:
     - `https://mission-control-abc123.vercel.app`
     - `https://mission-control-abc123.vercel.app/dashboard`
   - Save

---

## Step 4: Test Production (10 min)

1. **Visit Production URL:**
   - Open: `https://your-vercel-url.vercel.app`
   - You should see the Mission Control landing page

2. **Test Sign Up:**
   - Click "Create Account"
   - Fill in:
     - First Name: Corinne
     - Last Name: Briers
     - Email: Use a real email (you'll need to verify)
     - Password: Strong password
   - Click "Continue"
   - Check email for verification code
   - Enter code
   - Should redirect to dashboard

3. **Test Dashboard:**
   - Should see "Mission Control" header
   - Personal/Professional tabs should work
   - (Data won't load yet - that's Phase 2: Convex queries)

4. **Test Check-Ins:**
   - Click "Check-Ins" in navigation
   - Try morning check-in page
   - Try evening check-in page
   - (Forms won't save yet - that's Phase 2: Convex mutations)

5. **Test Responsiveness:**
   - Open DevTools
   - Test mobile view (iPhone, Android)
   - Check tablet view
   - Verify all buttons/forms work

---

## Step 5: Verify Backend Connections (5 min)

### Check Convex:
- Go to: https://dashboard.convex.dev/t/sebastian-b/mission-control/healthy-flamingo-415
- Go to "Logs" tab
- Deploy your app again or refresh production URL
- You should see connection logs from your app

### Check Clerk:
- Go to: https://dashboard.clerk.com
- Go to "Users" tab
- You should see the test user you created

---

## 🎉 SUCCESS CHECKLIST

- [ ] Code pushed to GitHub successfully
- [ ] Vercel deployment completed (green ✓)
- [ ] Production URL accessible from any device
- [ ] Clerk sign-up modal appears
- [ ] Can create an account (email verification works)
- [ ] Dashboard page loads after sign-in
- [ ] Check-in pages render correctly
- [ ] Mobile responsive design verified
- [ ] No console errors in browser DevTools
- [ ] User appears in Clerk dashboard

---

## 🐛 Troubleshooting

### Build Fails on Vercel:
- Check build logs for specific error
- Common fix: Ensure all env vars are set
- Try: "Redeploy" from Vercel dashboard

### "Invalid publishable key" error:
- Double-check Clerk env vars in Vercel
- Ensure no extra spaces in values
- Redeploy after fixing

### Clerk sign-in doesn't work:
- Verify production URL is added to Clerk domains
- Check redirect URLs are correct
- Clear browser cache and try again

### Can't access production URL:
- Wait 1-2 minutes after deployment (DNS propagation)
- Try incognito/private browsing
- Check Vercel deployment status (should be "Ready")

### Convex not connecting:
- Verify CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL
- Check Convex dashboard for error logs
- Ensure Convex project is not paused

---

## 📱 Send to Corinne

Once everything works:

1. **Get Production URL** from Vercel dashboard
2. **Create her account** or send her signup link
3. **Send her:**
   - Production URL
   - Brief usage instructions
   - "Your Mission Control is live! 🚀"

---

## 🚨 IF YOU GET STUCK

1. Check Vercel deployment logs
2. Check browser console for errors (F12)
3. Verify all env vars are set correctly
4. Try redeploying from Vercel dashboard
5. Check Clerk and Convex dashboards for issues

---

## ⏱️ Time Budget

| Step | Time | Status |
|------|------|--------|
| GitHub auth | 5 min | ⏳ |
| Vercel import | 10 min | ⏳ |
| Clerk setup | 5 min | ⏳ |
| Testing | 10 min | ⏳ |
| **Total** | **30 min** | 🎯 |

---

## 📞 Support Links

- **Vercel Docs:** https://vercel.com/docs
- **Clerk Docs:** https://clerk.com/docs
- **Convex Docs:** https://docs.convex.dev
- **Next.js Docs:** https://nextjs.org/docs

---

**You got this! 🚀 30 minutes to a live app!**

---

**Questions?** Check DEPLOYMENT-STATUS.md or FINAL-SUMMARY.md for more details.
