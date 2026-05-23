# 🚀 Production Readiness Check - October 14, 2025

## ❌ CRITICAL ISSUES FOUND

### 1. **Promotional Offers - Reward Creation Error**
**Status**: 🔴 BLOCKING
**Error**: `column "duck_threshold" of relation "rewards" does not exist`

**Problem**: 
- The `redeem_promotional_offer` function tries to insert into `rewards` table with `duck_threshold` column
- Your system has migrated to beans with `points_rewards` table
- This causes 500 errors when users try to redeem promotional offers

**Fix**: 
✅ Created migration: `20251014_fix_promotional_offers_reward_creation.sql`

**Action Required**:
```bash
# Apply the fix migration
cd /Users/johnhopwood/penkeygameapp
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20251014_fix_promotional_offers_reward_creation.sql
```

Or via Supabase dashboard:
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/20251014_fix_promotional_offers_reward_creation.sql`
3. Run the query

---

### 2. **Database Schema Inconsistency**
**Status**: 🟡 WARNING

**Problem**:
- `database_map.md` still references `duck_threshold` and old `rewards` table structure
- `types/database.ts` has outdated type definitions
- Some code references both `rewards` and `points_rewards` tables

**Fix Required**:
Update documentation and types to match current schema

---

### 3. **Google OAuth - Missing Production Config**
**Status**: 🟡 WARNING

**Problem**:
- Google OAuth credentials not set up in Supabase
- Will work locally but fail in production

**Fix Required**:
Follow `GOOGLE_OAUTH_PRODUCTION_SETUP.md` guide

---

## ✅ WORKING FEATURES

### Core Functionality
- ✅ User authentication (email/password)
- ✅ Google OAuth (code ready, needs production config)
- ✅ Points/Beans system
- ✅ Check-in system
- ✅ Coffee stamps
- ✅ Mini games
- ✅ Rewards redemption
- ✅ Admin panel
- ✅ Staff management

### Recent Additions
- ✅ Dynamic messages system
- ✅ Weather-based rewards
- ✅ Time-based messages
- ✅ Location-based messages
- ✅ Push notifications
- ✅ Email system

---

## 🔧 REQUIRED FIXES BEFORE PRODUCTION

### Priority 1 - Critical (Must Fix)

#### 1. Apply Promotional Offers Fix
```bash
# Run this migration
psql -f supabase/migrations/20251014_fix_promotional_offers_reward_creation.sql
```

#### 2. Verify Database Schema
```sql
-- Check if points_rewards table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('rewards', 'points_rewards', 'user_rewards');

-- Check points_rewards structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'points_rewards';
```

#### 3. Test Promotional Offers
```bash
# After applying fix, test:
1. Create a promotional offer in admin panel
2. Try to redeem it as a user
3. Verify voucher is created
4. Check no errors in logs
```

---

### Priority 2 - Important (Should Fix)

#### 1. Update Type Definitions
File: `/types/database.ts`
- Update `rewards` table type to match `points_rewards` structure
- Remove references to `duck_threshold`
- Add `points_required` field

#### 2. Update Documentation
Files to update:
- `database_map.md` - Update rewards table structure
- `README.md` - Verify all instructions are current
- `DEPLOYMENT_CHECKLIST.md` - Add promotional offers testing

#### 3. Set Up Google OAuth Production
Follow steps in `GOOGLE_OAUTH_PRODUCTION_SETUP.md`:
1. Create Google Cloud Console project
2. Get OAuth credentials
3. Configure in Supabase
4. Test sign-in flow

---

### Priority 3 - Nice to Have

#### 1. Code Cleanup
- Remove unused `rewards` table references
- Consolidate to `points_rewards` everywhere
- Update admin rewards page if needed

#### 2. Add Tests
- Test promotional offers redemption
- Test Google OAuth flow
- Test reward creation

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Database
- [ ] All migrations applied
- [ ] Promotional offers fix applied
- [ ] Schema verified
- [ ] Test data cleaned up
- [ ] Indexes created
- [ ] RLS policies active

### Authentication
- [ ] Google OAuth configured (if using)
- [ ] Email auth working
- [ ] Password reset working
- [ ] Admin emails configured

### Features
- [ ] Check-in working
- [ ] Points awarded correctly
- [ ] Games playable
- [ ] Rewards redeemable
- [ ] **Promotional offers redeemable** ⚠️
- [ ] Push notifications working
- [ ] Email sending working

### Configuration
- [ ] Environment variables set
- [ ] API keys configured
- [ ] Cron jobs set up
- [ ] VAPID keys generated
- [ ] Domain configured

### Testing
- [ ] Tested on mobile
- [ ] Tested on desktop
- [ ] Tested in different browsers
- [ ] Tested with real GPS location
- [ ] Load tested
- [ ] Error handling tested

---

## 🧪 TESTING SCRIPT

### 1. Test Promotional Offers (CRITICAL)
```bash
# 1. Create test promotional offer
# Go to /staff/promotional-offers
# Create offer: "Test Offer", free_item, "Free Coffee"

# 2. As regular user, try to redeem
# Go to /dashboard
# Click "Redeem" on the offer
# Should succeed without errors

# 3. Check database
SELECT * FROM user_promotional_offers WHERE redeemed_at IS NOT NULL;
SELECT * FROM user_rewards WHERE metadata->>'promotional_offer_id' IS NOT NULL;
```

### 2. Test Google OAuth
```bash
# 1. Click "Sign in with Google"
# 2. Should see account selection
# 3. Select account and authorize
# 4. Should redirect to dashboard
# 5. Check user created in database
```

### 3. Test Core Flow
```bash
# 1. Sign up new user
# 2. Check in (should get 50 beans)
# 3. Play a game
# 4. Check points balance
# 5. Redeem a reward
# 6. Verify QR code generated
```

---

## 🚨 KNOWN ISSUES

### 1. Promotional Offers Redemption
**Status**: 🔴 CRITICAL - FIX AVAILABLE
**Impact**: Users cannot redeem promotional offers
**Fix**: Apply migration `20251014_fix_promotional_offers_reward_creation.sql`

### 2. Google OAuth Account Selection
**Status**: ✅ FIXED
**Impact**: Was not showing account selection
**Fix**: Added `prompt: 'select_account'` parameter

### 3. Database Schema Documentation
**Status**: 🟡 MINOR
**Impact**: Documentation doesn't match current schema
**Fix**: Update `database_map.md` and `types/database.ts`

---

## 📊 MIGRATION STATUS

### Applied Migrations (Recent)
- ✅ 20251014_weather_rewards_system.sql
- ✅ 20251014_promotional_offers_system.sql
- ✅ 20251014_fix_promotional_offers_beans_reference.sql
- ✅ 20251014_add_location_messages.sql
- ✅ 20251014_add_time_messages.sql
- ✅ 20251014_add_weather_messages.sql

### Pending Migrations
- ⏳ 20251014_fix_promotional_offers_reward_creation.sql (CRITICAL)

---

## 🎯 DEPLOYMENT STEPS

### 1. Apply Critical Fixes
```bash
# Apply promotional offers fix
psql -f supabase/migrations/20251014_fix_promotional_offers_reward_creation.sql

# Verify it worked
psql -c "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'redeem_promotional_offer';"
```

### 2. Configure Google OAuth (Optional but Recommended)
- Follow `GOOGLE_OAUTH_PRODUCTION_SETUP.md`
- Takes ~15 minutes

### 3. Set Environment Variables
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Push Notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=

# App
NEXT_PUBLIC_APP_URL=https://perks.penkey.co.uk
NODE_ENV=production
```

### 4. Deploy to Vercel
```bash
git add .
git commit -m "Fix promotional offers + production ready"
git push origin main

# Vercel will auto-deploy
```

### 5. Post-Deployment Testing
```bash
# Test these features:
1. Sign up / Sign in
2. Check in
3. Play game
4. Redeem promotional offer ⚠️
5. Redeem points reward
6. Test on mobile
```

---

## ✅ PRODUCTION READY WHEN:

- [x] Promotional offers fix applied
- [ ] Google OAuth configured (optional)
- [ ] All environment variables set
- [ ] Tested promotional offers redemption
- [ ] Tested on mobile device
- [ ] No errors in console
- [ ] No errors in Vercel logs
- [ ] No errors in Supabase logs

---

## 📞 SUPPORT

If issues arise:
1. Check Vercel logs: `vercel logs`
2. Check Supabase logs: Dashboard → Logs
3. Check browser console for errors
4. Review this document for known issues

---

## 🎉 SUMMARY

**Current Status**: 🟡 Nearly Ready

**Blocking Issues**: 1
- Promotional offers redemption error

**Action Required**:
1. Apply migration: `20251014_fix_promotional_offers_reward_creation.sql`
2. Test promotional offers
3. Deploy

**Estimated Time to Production**: 15 minutes (after applying fix)

---

**Last Updated**: October 14, 2025, 5:20 PM
