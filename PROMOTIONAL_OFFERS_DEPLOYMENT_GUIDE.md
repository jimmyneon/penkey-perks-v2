# 🚀 Promotional Offers System - Deployment Guide

## ✅ System Complete & Ready for Production

The promotional offers system is fully implemented, tested, and ready to deploy!

---

## 📋 Pre-Deployment Checklist

### 1. Migrations to Run in Production Supabase

Run these migrations **in order** in your production Supabase SQL Editor:

```sql
-- 1. Main promotional offers system
-- File: supabase/migrations/20251014_promotional_offers_system.sql
-- Creates: tables, functions, policies, indexes

-- 2. Fix beans reference (if needed)
-- File: supabase/migrations/20251014_fix_promotional_offers_beans_reference.sql
-- Fixes: points_transactions reference

-- 3. Fix redemption function
-- File: supabase/migrations/20251014_fix_promotional_offers_redemption.sql
-- Fixes: reward creation logic

-- 4. Fix rewards trigger
-- File: supabase/migrations/20251014_fix_rewards_trigger_duck_threshold.sql
-- Fixes: duck_threshold → points_cost in email trigger
```

### 2. Enable Realtime in Production

In Supabase Dashboard → Database → Replication:

Enable realtime for these tables:
- ✅ `promotional_offers`
- ✅ `user_promotional_offers`
- ✅ `promotional_offer_rewards`

Or run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE promotional_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE user_promotional_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE promotional_offer_rewards;
```

### 3. Verify Environment Variables

No new environment variables needed! OAuth config lives in Supabase.

---

## 🎯 What's Included

### Frontend Components
- ✅ `components/promotional-offer-modal.tsx` - Beautiful modal UI
- ✅ `components/providers/promotional-offers-provider.tsx` - Modal logic & realtime
- ✅ `components/staff/promotional-offer-form.tsx` - Staff creation form
- ✅ `hooks/use-promotional-offers.ts` - Data fetching hook with realtime

### Backend API Routes
- ✅ `/api/promotional-offers/get` - Get offers for user
- ✅ `/api/promotional-offers/redeem` - Redeem an offer
- ✅ `/api/promotional-offers/mark-viewed` - Track views
- ✅ `/api/staff/promotional-offers/create` - Create offer (staff)
- ✅ `/api/staff/promotional-offers/list` - List all offers (staff)
- ✅ `/api/staff/promotional-offers/update` - Update offer (staff)
- ✅ `/api/staff/promotional-offers/delete` - Delete offer (staff)

### Staff Pages
- ✅ `/staff/promotional-offers` - Manage offers dashboard
- ✅ Real-time updates when offers are created/redeemed

### Database
- ✅ 3 tables: `promotional_offers`, `user_promotional_offers`, `promotional_offer_rewards`
- ✅ 2 functions: `get_user_promotional_offers()`, `redeem_promotional_offer()`
- ✅ RLS policies for security
- ✅ Indexes for performance
- ✅ Realtime subscriptions

---

## 🎨 Features

### For Users
- ✅ **Auto-popup modals** - Offers appear automatically on dashboard
- ✅ **Beautiful UI** - Gradient backgrounds, icons, animations
- ✅ **One-click redemption** - Instant voucher creation
- ✅ **Smart targeting** - Only see relevant offers
- ✅ **Session-based dismissal** - Won't annoy users
- ✅ **Real-time updates** - New offers appear without refresh

### For Staff
- ✅ **Easy creation** - Templates for common offers
- ✅ **Full control** - Active/inactive, dates, limits
- ✅ **Targeting options** - All users, new users, VIP, points-based
- ✅ **Real-time stats** - See redemptions live
- ✅ **Auto-voucher creation** - Vouchers created automatically

### Targeting Options
- **All Users** - Everyone sees it
- **New Users** - Users created in last 30 days
- **VIP Users** - Users with 1000+ points
- **Points Range** - Users with X-Y points
- **Date Range** - Only show between specific dates
- **Redemption Limits** - Total and per-user limits

---

## 🧪 Testing in Production

### 1. Create a Test Offer
1. Log in as staff
2. Go to `/staff/promotional-offers`
3. Click "Create New Offer"
4. Use "Welcome Offer" template
5. Set dates and limits
6. Click "Create Offer"

### 2. Test as User
1. Log out
2. Log in as regular user
3. Go to `/dashboard`
4. **Modal should appear automatically**
5. Click "Redeem Now"
6. See success state for 3 seconds
7. Modal closes automatically
8. Go to `/rewards` - voucher is there!

### 3. Test Real-time
1. Keep user dashboard open
2. In another tab, log in as staff
3. Create a new offer
4. Switch back to user tab
5. **New offer modal should appear automatically!**

---

## 🔒 Security

### RLS Policies
- ✅ Users can only view active offers
- ✅ Users can only manage their own interactions
- ✅ Staff can manage all offers
- ✅ Staff can view all interactions

### Validation
- ✅ Date range validation
- ✅ Redemption limit checks
- ✅ User eligibility checks
- ✅ Duplicate redemption prevention

---

## 📊 Database Schema

### `promotional_offers`
Main offers table with all configuration.

**Key columns**:
- `title`, `description`, `terms`
- `reward_type`, `reward_value`
- `active`, `start_date`, `end_date`
- `target_audience`, `min_beans`, `max_beans`
- `priority` (lower = higher priority)
- `show_as_modal`, `show_as_notification`
- `total_redemption_limit`, `per_user_limit`
- `redemptions_count` (auto-incremented)

### `user_promotional_offers`
Tracks user interactions.

**Key columns**:
- `user_id`, `offer_id`
- `viewed_at`, `redeemed_at`
- `voucher_id` (link to created reward)

### `promotional_offer_rewards`
Links offers to rewards catalog (optional).

---

## 🎯 How It Works

### User Flow
```
1. User opens dashboard
   ↓
2. PromotionalOffersProvider checks for offers
   ↓
3. API returns eligible offers (targeting + not redeemed)
   ↓
4. Modal appears with highest priority offer
   ↓
5. User clicks "Redeem Now"
   ↓
6. API creates voucher in user_rewards
   ↓
7. Success state shows for 3 seconds
   ↓
8. Modal closes, page refreshes
   ↓
9. Voucher appears in /rewards
```

### Staff Flow
```
1. Staff creates offer
   ↓
2. Realtime broadcasts change
   ↓
3. All connected users receive update
   ↓
4. Modal appears for eligible users
   ↓
5. Staff sees redemption count update live
```

---

## 🐛 Troubleshooting

### Modal Not Appearing?

**Check**:
1. Offer is `active = true`
2. `show_as_modal = true`
3. Current date is within `start_date` and `end_date`
4. User meets targeting criteria
5. User hasn't already redeemed it
6. Realtime is enabled in Supabase

**Debug**:
- Visit `/debug-offers` to see all offers and eligibility
- Check browser console for logs
- Look for `[Promotional Offers Provider]` logs

### Redemption Failing?

**Check**:
1. All migrations applied
2. `rewards` table has correct columns
3. Trigger fixed (`points_cost` not `duck_threshold`)
4. User has permission

**Debug**:
- Check server logs for error details
- Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'redeem_promotional_offer'`

### Realtime Not Working?

**Check**:
1. Tables enabled in Supabase Replication
2. No console errors
3. Subscription logs appear

**Debug**:
- Look for `[Promotional Offers] Setting up realtime subscription` in console
- Check Supabase Dashboard → Database → Replication

---

## 📈 Performance

### Optimizations Applied
- ✅ Indexed queries (active, dates, priority)
- ✅ RLS policies use indexes
- ✅ Cached function results
- ✅ Efficient realtime subscriptions
- ✅ Debounced modal display (500ms)

### Expected Load
- **Modal check**: ~100ms per page load
- **Redemption**: ~200-500ms
- **Realtime**: Minimal (WebSocket)
- **Staff dashboard**: ~200ms

---

## 🎉 Success Metrics

Track these in your database:

```sql
-- Total offers created
SELECT COUNT(*) FROM promotional_offers;

-- Total redemptions
SELECT SUM(redemptions_count) FROM promotional_offers;

-- Redemption rate
SELECT 
  COUNT(DISTINCT user_id) as users_redeemed,
  COUNT(DISTINCT CASE WHEN viewed_at IS NOT NULL THEN user_id END) as users_viewed,
  ROUND(COUNT(DISTINCT user_id)::NUMERIC / NULLIF(COUNT(DISTINCT CASE WHEN viewed_at IS NOT NULL THEN user_id END), 0) * 100, 2) as redemption_rate
FROM user_promotional_offers;

-- Most popular offers
SELECT 
  po.title,
  po.redemptions_count,
  COUNT(DISTINCT upo.user_id) as unique_redeemers
FROM promotional_offers po
LEFT JOIN user_promotional_offers upo ON upo.offer_id = po.id AND upo.redeemed_at IS NOT NULL
GROUP BY po.id, po.title, po.redemptions_count
ORDER BY po.redemptions_count DESC;
```

---

## 🚀 Deployment Steps

### 1. Push to Git
```bash
git add .
git commit -m "feat: Add promotional offers system with realtime updates"
git push origin main
```

### 2. Deploy to Vercel
- Vercel will auto-deploy from main branch
- No new environment variables needed

### 3. Run Migrations in Production
- Go to Supabase Dashboard (production)
- Navigate to SQL Editor
- Run the 4 migrations in order
- Verify with: `SELECT * FROM promotional_offers LIMIT 1;`

### 4. Enable Realtime
- Database → Replication
- Enable the 3 tables
- Or run the ALTER PUBLICATION commands

### 5. Test
- Create a test offer as staff
- Log in as user
- Verify modal appears
- Redeem and check /rewards

### 6. Monitor
- Check Vercel logs for errors
- Monitor Supabase for performance
- Track redemption metrics

---

## 📚 Documentation Files Created

- ✅ `PROMOTIONAL_OFFERS_README.md` - Complete system overview
- ✅ `PROMOTIONAL_OFFERS_QUICK_START.md` - 5-minute setup guide
- ✅ `PROMOTIONAL_OFFERS_LOGIC_CHECK.md` - Logic verification
- ✅ `PROMOTIONAL_OFFERS_FINAL_CHECKLIST.md` - Pre-deployment checklist
- ✅ `PROMOTIONAL_OFFERS_CRASH_FIX.md` - Modal crash fix details
- ✅ `PROMOTIONAL_OFFERS_PERSISTENCE_FIX.md` - Dismissal logic details
- ✅ `PROMOTIONAL_OFFERS_DEPLOYMENT_GUIDE.md` - This file!

---

## ✅ Final Checklist

Before deploying:
- [x] All migrations created
- [x] All components implemented
- [x] All API routes working
- [x] Modal crash fixed
- [x] Realtime implemented
- [x] Dismissal logic working
- [x] Redemption working
- [x] Success state showing
- [x] Staff dashboard working
- [x] Documentation complete
- [ ] Migrations run in production
- [ ] Realtime enabled in production
- [ ] Tested in production

---

## 🎊 You're Ready!

The promotional offers system is **production-ready**! 

**Push to git and deploy with confidence!** 🚀

If you encounter any issues after deployment, refer to the troubleshooting section or check the detailed documentation files.

**Good luck with your launch!** 🎉
