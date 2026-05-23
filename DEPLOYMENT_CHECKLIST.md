# 🚀 DEPLOYMENT CHECKLIST - Penkey Perks

**Pre-deployment checklist for going live**

---

## ⚠️ NEW MIGRATIONS REQUIRED (Oct 13, 2025)

**Before deploying, run these new migrations:**
```bash
# Apply both migrations
supabase db push
```

Or manually:
```bash
# 1. Free coffee signup reward (250 beans + free coffee)
psql -f supabase/migrations/20251013_add_free_coffee_on_signup.sql

# 2. Fix staff email messaging
psql -f supabase/migrations/20251013_fix_staff_email_messaging.sql
```

**Then enable pg_net extension:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**Then set up cron jobs:**
```bash
# Run SUPABASE_CRON_SIMPLE.sql in Supabase SQL Editor
```

See `EMAIL_SYSTEM_SETUP_GUIDE.md` for complete email setup instructions.

---

## ✅ PRE-DEPLOYMENT (Complete these first)

### **Local Testing:**
- [ ] Dev server runs without errors
- [ ] Can sign up and log in
- [ ] Check-in awards 5 points
- [ ] Points display correctly on dashboard
- [ ] Games work (can play once per day)
- [ ] Coffee stamps can be added
- [ ] Rewards appear when earned
- [ ] Referral system works
- [ ] Admin panel accessible (if admin)
- [ ] No console errors

**Use:** `TESTING_CHECKLIST.md` for detailed tests

---

## 🔧 CONFIGURATION

### **Environment Variables:**

Ensure these are set in `.env.local` (for local) and Vercel (for production):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=perks@penkey.co.uk

# Admin
ADMIN_EMAILS=john@penkey.co.uk,amanda@penkey.co.uk

# App URL
NEXT_PUBLIC_APP_URL=https://perks.penkey.co.uk  # Update for production
```

---

## 🗄️ DATABASE

### **Production Database:**

- [ ] Created separate Supabase project for production
- [ ] Ran all 3 migrations in production database:
  - `20251009_FINAL_FIX_ALL.sql`
  - `20251009_three_tier_rewards_system.sql`
  - `20251009_badges_milestones.sql`
- [ ] Verified tables exist
- [ ] Verified functions exist
- [ ] Seeded games (3 games)
- [ ] Created initial rewards
- [ ] RLS policies active

**Verification query:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 'points_transactions', 'coffee_stamps', 
  'user_badges', 'badge_tiers', 'mini_games'
)
ORDER BY table_name;
```

Should return 6+ tables.

---

## 🔐 SECURITY

### **Before Production:**

- [ ] **Enable GPS validation** in `/app/api/check-in/route.ts`
  - Uncomment GPS validation code (lines 23-50)
  - Update `SHOP_LAT` and `SHOP_LNG` with actual coordinates
  - Test at shop location

- [ ] **Enable GPS validation** in `/app/api/add-coffee/route.ts`
  - Same as above

- [ ] **Verify RLS policies** are active on all tables

- [ ] **Test admin access** restrictions

- [ ] **Review CORS settings** in Supabase

- [ ] **Set up Supabase auth redirects:**
  - Go to Supabase → Authentication → URL Configuration
  - Site URL: `https://perks.penkey.co.uk`
  - Redirect URLs: `https://perks.penkey.co.uk/auth/callback`

---

## 📧 EMAIL SETUP

### **Resend Configuration:**

- [ ] Domain verified in Resend (`penkey.co.uk`)
- [ ] API key created and added to env vars
- [ ] Test email sending:
  ```bash
  # Test in Supabase SQL Editor
  SELECT send_email(
    'test@example.com',
    'Test Email',
    'This is a test'
  );
  ```

### **Supabase Email Templates:**

- [ ] Customize confirmation email template
- [ ] Customize password reset template
- [ ] Test email delivery

---

## 🎨 CONTENT & ASSETS

### **Rewards:**

- [ ] Created real rewards in database (not test data)
- [ ] Set appropriate point thresholds
- [ ] Set expiry days
- [ ] Added reward images (optional)
- [ ] Set stock limits if needed

**Example:**
```sql
INSERT INTO rewards (name, description, type, value, duck_threshold, expiry_days, active) VALUES
  ('£5 Off Voucher', 'Get £5 off your next purchase', 'discount', '£5', 50, 30, true),
  ('Free Coffee', 'Enjoy a free coffee on us!', 'free_item', 'Coffee', 30, 14, true),
  ('20% Off', 'Get 20% off your entire order', 'discount', '20%', 75, 14, true);
```

---

### **Games:**

- [ ] Configured game prizes and probabilities
- [ ] Set daily stock limits
- [ ] Tested prize distribution
- [ ] Verified probabilities sum to 100%

**Check:**
```sql
SELECT 
  mg.display_name,
  gp.label,
  gp.probability,
  gp.daily_limit
FROM game_prizes gp
JOIN mini_games mg ON gp.game_id = mg.id
WHERE mg.enabled = true
ORDER BY mg.name, gp.probability DESC;
```

---

### **PWA Assets:**

- [ ] Created 512x512 app icon
- [ ] Generated all icon sizes
- [ ] Updated `public/manifest.json`
- [ ] Tested PWA installation on mobile

---

## 🚀 VERCEL DEPLOYMENT

### **Step 1: Push to GitHub**

```bash
git add .
git commit -m "Production ready - all features complete"
git push origin main
```

---

### **Step 2: Import to Vercel**

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

---

### **Step 3: Add Environment Variables**

In Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
ADMIN_EMAILS
NEXT_PUBLIC_APP_URL
```

**Important:** Use production values, not development!

---

### **Step 4: Deploy**

- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2 minutes)
- [ ] Check deployment logs for errors
- [ ] Visit deployment URL to verify

---

### **Step 5: Custom Domain**

1. In Vercel project → Settings → Domains
2. Add domain: `perks.penkey.co.uk`
3. Update DNS records at your domain provider:
   - **Type:** CNAME
   - **Name:** perks
   - **Value:** cname.vercel-dns.com
   - **TTL:** 3600
4. Wait for DNS propagation (5-30 minutes)
5. Verify SSL certificate is issued

---

## 🧪 PRODUCTION TESTING

### **After Deployment:**

- [ ] Visit production URL
- [ ] Sign up with new account
- [ ] Test check-in flow
- [ ] Verify points awarded
- [ ] Test games
- [ ] Test coffee stamps
- [ ] Test on mobile device
- [ ] Test PWA installation
- [ ] Test admin panel
- [ ] Check all links work
- [ ] Verify emails send correctly

---

### **GPS Testing (Critical!):**

- [ ] Go to physical shop location
- [ ] Try to check in
- [ ] Should succeed (within 50m of shop)
- [ ] Try from outside shop
- [ ] Should fail (too far away)

---

### **Load Testing:**

- [ ] Test with multiple users
- [ ] Verify database performance
- [ ] Check Vercel function logs
- [ ] Monitor Supabase usage

---

## 📱 NFC SETUP (Optional)

### **If Using NFC Tags:**

- [ ] Purchased NFC tags (NTAG213 recommended)
- [ ] Downloaded NFC writing app
- [ ] Programmed tags with URL: `https://perks.penkey.co.uk/check-in`
- [ ] Placed tags at counter
- [ ] Tested with multiple phones
- [ ] Created backup tags

---

## 👥 STAFF TRAINING

### **Before Launch:**

- [ ] Trained staff on how to redeem rewards
- [ ] Showed how to scan QR codes
- [ ] Explained the points system
- [ ] Demonstrated admin panel (if applicable)
- [ ] Created quick reference guide for staff
- [ ] Set up staff accounts in admin panel

---

## 📊 MONITORING

### **Set Up:**

- [ ] Vercel Analytics enabled
- [ ] Supabase monitoring configured
- [ ] Error tracking (Sentry optional)
- [ ] Set up alerts for:
  - High error rates
  - Database issues
  - Function timeouts
  - Deployment failures

---

## 🎯 LAUNCH DAY

### **Final Checks:**

- [ ] All tests passing
- [ ] GPS validation working
- [ ] Staff trained
- [ ] NFC tags working (if used)
- [ ] Backup plan ready
- [ ] Support contact available

### **Go Live:**

- [ ] Announce to customers
- [ ] Post on social media
- [ ] Update website with link
- [ ] Monitor for first few hours
- [ ] Be ready to fix issues quickly

---

## 📞 POST-LAUNCH

### **Week 1:**

- [ ] Monitor error logs daily
- [ ] Check user feedback
- [ ] Fix any critical bugs
- [ ] Adjust game probabilities if needed
- [ ] Monitor database performance

### **Week 2:**

- [ ] Analyze usage patterns
- [ ] Review popular rewards
- [ ] Check referral conversion
- [ ] Optimize based on data

### **Month 1:**

- [ ] Full analytics review
- [ ] Plan feature improvements
- [ ] Consider adding:
  - Push notifications
  - Streak bonuses
  - Seasonal events
  - More games

---

## 🐛 ROLLBACK PLAN

### **If Something Goes Wrong:**

1. **Revert deployment in Vercel:**
   - Go to Deployments
   - Find last working deployment
   - Click "..." → Promote to Production

2. **Database issues:**
   - Restore from Supabase backup
   - Check Point-in-Time Recovery

3. **Communication:**
   - Notify customers of downtime
   - Post status updates
   - Provide ETA for fix

---

## ✅ LAUNCH CHECKLIST SUMMARY

**Must complete before launch:**

- ✅ Local testing passed
- ✅ Database migrations run on production
- ✅ GPS validation enabled and tested
- ✅ Environment variables set in Vercel
- ✅ Deployed to Vercel successfully
- ✅ Custom domain configured
- ✅ Production testing passed
- ✅ Staff trained
- ✅ Monitoring set up

**When all checked → YOU'RE READY TO LAUNCH!** 🚀

---

## 🎉 CONGRATULATIONS!

You've built and deployed a complete loyalty app!

**What you've accomplished:**
- ✅ Full-stack Next.js app
- ✅ 3-tier rewards system
- ✅ Real-time points tracking
- ✅ GPS validation
- ✅ Admin panel
- ✅ PWA support
- ✅ Production deployment

**Good luck with your launch!** 🦆☕🎉
