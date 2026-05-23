# 🚀 COMPLETE SETUP & DEPLOYMENT GUIDE

**Penkey Perks - Final Setup Instructions**  
**Date:** 2025-10-10  
**Status:** ✅ Ready to Deploy

---

## 📊 CURRENT STATUS

### ✅ **What's Working:**
- Build compiles successfully (0 errors)
- All components created and integrated
- Points system implemented
- Coffee stamps system ready
- Games system functional
- Admin panel complete
- Authentication working

### ⚠️ **What Needs Attention:**
- Database migrations must be run
- GPS validation disabled (for testing)
- Need to test end-to-end flows

---

## 🎯 SETUP STEPS

### **STEP 1: Database Setup (10 minutes)**

Follow the detailed guide: `DATABASE_SETUP_GUIDE.md`

**Quick version:**
1. Open Supabase SQL Editor
2. Run `20251009_FINAL_FIX_ALL.sql`
3. Run `20251009_three_tier_rewards_system.sql`
4. Run `20251009_badges_milestones.sql`
5. Verify all tables exist

---

### **STEP 2: Environment Variables**

Ensure your `.env.local` has all required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend (Email)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=perks@penkey.co.uk

# Admin
ADMIN_EMAILS=john@penkey.co.uk,amanda@penkey.co.uk

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### **STEP 3: Install Dependencies**

```bash
npm install
```

---

### **STEP 4: Test Locally**

```bash
npm run dev
```

Open http://localhost:3000

---

## 🧪 TESTING CHECKLIST

### **1. Authentication Flow**
- [ ] Sign up with email
- [ ] Verify email confirmation
- [ ] Log in successfully
- [ ] Log out and log back in

### **2. Check-In System**
- [ ] Navigate to `/check-in` or tap NFC
- [ ] Should see "Checking you in..." loading state
- [ ] Should see success with +5 points
- [ ] Try checking in again (should fail with "already checked in")
- [ ] Check dashboard shows correct points balance

### **3. Points System**
- [ ] Dashboard shows points balance
- [ ] Points increase after check-in
- [ ] Points history visible
- [ ] Can view available rewards

### **4. Games System**
- [ ] Dashboard shows today's game
- [ ] Can play game once per day
- [ ] Win prizes (points, stamps, or rewards)
- [ ] Cannot play same game twice in one day
- [ ] Game changes daily

### **5. Coffee Stamps**
- [ ] Navigate to `/add-coffee`
- [ ] Add coffee stamp (GPS disabled for testing)
- [ ] Dashboard shows stamp count
- [ ] At 10 stamps, reward is issued

### **6. Rewards System**
- [ ] Rewards appear in wallet when earned
- [ ] Can view reward details
- [ ] QR code displays correctly
- [ ] Admin can redeem rewards

### **7. Referrals**
- [ ] Can generate referral link
- [ ] Share referral link
- [ ] New user signs up with link
- [ ] Referrer gets bonus points

### **8. Admin Panel**
- [ ] Admin can access `/admin`
- [ ] View dashboard stats
- [ ] Manage customers
- [ ] Create/edit rewards
- [ ] Configure games
- [ ] View transaction logs

---

## 🐛 COMMON ISSUES & FIXES

### **Issue: "Unauthorized" errors**

**Cause:** Supabase credentials not set or incorrect

**Fix:**
1. Check `.env.local` has correct values
2. Restart dev server: `npm run dev`
3. Clear browser cache

---

### **Issue: "Function does not exist"**

**Cause:** Database migrations not run

**Fix:**
1. Go to Supabase SQL Editor
2. Run migrations in order (see DATABASE_SETUP_GUIDE.md)
3. Verify functions exist with verification query

---

### **Issue: Points not showing**

**Cause:** `points_transactions` table missing or RLS blocking

**Fix:**
1. Run `FINAL_FIX_ALL` migration
2. Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'points_transactions';
```
3. Verify function works:
```sql
SELECT get_user_points('your-user-id'::uuid);
```

---

### **Issue: Check-in fails**

**Cause:** `can_check_in` function not working

**Fix:**
1. Check function exists:
```sql
SELECT * FROM information_schema.routines 
WHERE routine_name = 'can_check_in';
```
2. Test manually:
```sql
SELECT can_check_in('your-user-id'::uuid);
```

---

### **Issue: Games not appearing**

**Cause:** Games not seeded in database

**Fix:**
1. Check games exist:
```sql
SELECT * FROM mini_games WHERE enabled = true;
```
2. If empty, seed games:
```sql
INSERT INTO mini_games (name, display_name, description, icon, enabled) VALUES
  ('scratch_card', 'Scratch Card', 'Scratch to reveal your prize!', '🎫', true),
  ('spin_wheel', 'Spin Wheel', 'Spin the wheel of fortune!', '🎡', true),
  ('duck_pond', 'Duck Pond', 'Pick a lucky duck!', '🦆', true);
```

---

## 🚀 DEPLOYMENT TO VERCEL

### **Step 1: Push to GitHub**

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

### **Step 2: Import to Vercel**

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

---

### **Step 3: Add Environment Variables**

In Vercel project settings, add all variables from `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
ADMIN_EMAILS
NEXT_PUBLIC_APP_URL (use your Vercel URL)
```

---

### **Step 4: Deploy**

Click "Deploy" and wait for build to complete.

---

### **Step 5: Run Migrations on Production**

**IMPORTANT:** Run the same migrations on your production Supabase database:

1. Go to production Supabase project
2. Open SQL Editor
3. Run all 3 migrations in order
4. Verify tables exist

---

### **Step 6: Configure Custom Domain**

1. In Vercel project settings, go to "Domains"
2. Add `perks.penkey.co.uk`
3. Update DNS records:
   - Type: `CNAME`
   - Name: `perks`
   - Value: `cname.vercel-dns.com`
4. Wait for DNS propagation (5-30 minutes)

---

## 🔐 PRODUCTION CHECKLIST

Before going live:

### **Security:**
- [ ] Enable GPS validation in `/api/check-in/route.ts`
- [ ] Update shop coordinates in GPS validation
- [ ] Enable GPS validation in `/api/add-coffee/route.ts`
- [ ] Verify all RLS policies are active
- [ ] Test admin access restrictions
- [ ] Review CORS settings

### **Configuration:**
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Verify Resend email domain
- [ ] Test email sending
- [ ] Configure Supabase auth redirects
- [ ] Set up Supabase email templates

### **Content:**
- [ ] Add real rewards to database
- [ ] Configure game prizes and probabilities
- [ ] Set stock limits for prizes
- [ ] Create badge images
- [ ] Update PWA icons

### **Testing:**
- [ ] Test on real mobile devices
- [ ] Test GPS validation at shop location
- [ ] Test NFC tags (if using)
- [ ] Test all user flows end-to-end
- [ ] Test admin panel functions

---

## 📱 NFC TAG SETUP (Optional)

If using NFC tags for check-in:

### **What You Need:**
- NFC tags (NTAG213 or similar)
- NFC writing app (NFC Tools, TagWriter)

### **Setup:**
1. Write URL to tag: `https://perks.penkey.co.uk/check-in`
2. Place tag at counter
3. Test with phone
4. Customers tap phone to tag → auto check-in

---

## 🎨 PWA SETUP

To make app installable:

### **Icons:**
1. Create 512x512 icon
2. Generate all sizes at [realfavicongenerator.net](https://realfavicongenerator.net)
3. Place in `/public/`
4. Update `manifest.json`

### **Service Worker:**
Already configured in `next.config.js`

### **Test:**
1. Open app in Chrome mobile
2. Look for "Install app" prompt
3. Install and test offline functionality

---

## 📊 MONITORING & ANALYTICS

### **Supabase:**
- Monitor database performance
- Check RLS policy performance
- Review error logs
- Set up alerts

### **Vercel:**
- Monitor deployment status
- Check function logs
- Review performance metrics
- Set up error tracking

### **Optional:**
- Add Google Analytics
- Add Sentry for error tracking
- Add PostHog for product analytics

---

## 🎯 POST-LAUNCH TASKS

### **Week 1:**
- [ ] Monitor user signups
- [ ] Check for errors in logs
- [ ] Gather user feedback
- [ ] Fix any bugs

### **Week 2:**
- [ ] Analyze usage patterns
- [ ] Adjust game probabilities if needed
- [ ] Add more rewards based on demand
- [ ] Optimize performance

### **Month 1:**
- [ ] Review analytics
- [ ] Plan feature improvements
- [ ] Consider adding push notifications
- [ ] Implement streak bonuses

---

## 📞 SUPPORT

### **For Development Issues:**
- Check error logs in Vercel
- Review Supabase logs
- Check browser console
- Review this guide

### **For Database Issues:**
- Check Supabase dashboard
- Review RLS policies
- Test functions manually
- Check migration status

---

## 🎉 YOU'RE READY!

If you've completed all steps above, your app is ready to launch!

**Final Steps:**
1. ✅ Run database migrations
2. ✅ Test locally
3. ✅ Deploy to Vercel
4. ✅ Test in production
5. ✅ Enable GPS validation
6. ✅ Launch! 🚀

---

**Good luck with your launch!** 🦆☕
