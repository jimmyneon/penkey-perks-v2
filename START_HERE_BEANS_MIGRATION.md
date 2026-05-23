# 🫘 Start Here - Beans Migration Guide

## Quick Start (3 Steps)

### Step 1: Run Pre-Migration Check (2 min)

```bash
# In Supabase SQL Editor, run:
PRE_MIGRATION_CHECKLIST.sql
```

**What it does:**
- ✅ Shows current system state
- ✅ Verifies readiness
- ✅ Estimates impact

**Expected output:** "✅ READY TO MIGRATE"

---

### Step 2: Run Migration (5 min)

```bash
# In Supabase SQL Editor, run:
supabase/migrations/20251011_upgrade_to_beans_system.sql
```

**What it does:**
- ✅ Multiplies all balances by 10x
- ✅ Updates point values (signup: 10 → 250, etc.)
- ✅ Adds new configs (14-day streak, GPS ducks, etc.)
- ✅ Updates reward costs (£5: 50 → 4000 beans)
- ✅ Creates signup bonus (250 beans + free coffee)
- ✅ Adds new rewards (Hoodie, Reusable Cup, Legend Status)

**Time:** ~2-5 minutes depending on data size

---

### Step 3: Verify Migration (2 min)

```bash
# In Supabase SQL Editor, run:
POST_MIGRATION_VERIFICATION.sql
```

**What it does:**
- ✅ Verifies balances multiplied
- ✅ Checks new configs created
- ✅ Confirms signup bonus working
- ✅ Shows migration summary

**Expected output:** "✅ MIGRATION SUCCESSFUL!"

---

## Next: Update Frontend UI

Once migration is complete, update the UI:

### Quick UI Updates (30 min)

See: `UI_BEANS_REBRAND_GUIDE.md` for full details

**Priority files to update:**

1. **Points Card** - `/components/dashboard/points-card.tsx`
2. **Rewards Page** - `/app/rewards/page.tsx`
3. **Dashboard** - `/app/dashboard/page.tsx`
4. **Admin Config** - `/app/admin/points-config/page.tsx`

**Simple find & replace:**
- `points` → `beans`
- `Points` → `Beans`
- Add 🫘 emoji where appropriate

---

## Testing Checklist

After UI updates:

- [ ] Create test user → verify 250 beans + coffee pending
- [ ] Check in → verify pending rewards unlock
- [ ] Play game → verify beans awarded
- [ ] Check rewards page → verify costs show in beans
- [ ] Check admin panel → verify configs show beans

---

## Rollback (If Needed)

If something goes wrong:

```sql
-- Divide all balances back by 10
UPDATE public.points_transactions 
SET amount = amount / 10, 
    balance_after = balance_after / 10;

-- Restore old point values
UPDATE public.points_config SET points_amount = 10 WHERE action_type = 'signup';
UPDATE public.points_config SET points_amount = 5 WHERE action_type = 'daily_checkin';
-- etc...
```

**Better:** Test on staging first!

---

## Support

**Questions?** Check:
- `BEANS_SYSTEM_QUICK_START.md` - Overview
- `POINTS_SYSTEM_AUDIT_AND_UPGRADE.md` - Full analysis
- `BEANS_IMPLEMENTATION_PLAN.md` - Complete plan with creative ideas

---

## Ready? Let's Go! 🚀

1. ✅ Run `PRE_MIGRATION_CHECKLIST.sql`
2. ✅ Run `20251011_upgrade_to_beans_system.sql`
3. ✅ Run `POST_MIGRATION_VERIFICATION.sql`
4. ✅ Update UI components
5. ✅ Test everything
6. ✅ Launch! 🫘
