# 🎯 Points Configuration System

**Date:** 2025-10-10  
**Status:** ✅ READY TO DEPLOY

---

## 🎉 WHAT THIS SOLVES

### **Before (Hardcoded):**
```typescript
// In /api/check-in/route.ts
await supabase.rpc('add_points', {
  p_amount: 5,  // ❌ Hardcoded!
  p_source: 'visit'
})

// In handle_new_user() trigger
PERFORM add_points(v_user_id, 10, 'signup');  -- ❌ Hardcoded!
```

**Problems:**
- ❌ Point values hardcoded in multiple files
- ❌ Need code deployment to change point amounts
- ❌ No central place to see all point awards
- ❌ No cooldown/limit enforcement at DB level
- ❌ Difficult to track which actions award points

### **After (Database-Driven):**
```typescript
// In /api/check-in/route.ts
const result = await supabase.rpc('add_points_validated', {
  p_user_id: user.id,
  p_action_type: 'daily_checkin'  // ✅ Config-driven!
})
// Points amount, cooldowns, limits all from database!
```

**Benefits:**
- ✅ All point values in one database table
- ✅ Change points without code deployment
- ✅ Automatic cooldown and limit enforcement
- ✅ Admin dashboard to manage points
- ✅ Usage statistics and analytics
- ✅ Flexible and extensible

---

## 📊 DATABASE STRUCTURE

### **Table: `points_config`**

```sql
CREATE TABLE points_config (
  id UUID PRIMARY KEY,
  action_type TEXT UNIQUE,           -- e.g., 'daily_checkin', 'signup'
  points_amount INTEGER,             -- How many points to award
  description TEXT,                  -- Human-readable description
  active BOOLEAN,                    -- Enable/disable action
  min_interval_hours INTEGER,        -- Cooldown period (NULL = no cooldown)
  max_per_day INTEGER,               -- Max times per day (NULL = unlimited)
  requires_verification BOOLEAN,     -- Needs staff approval
  metadata JSONB,                    -- Extra config
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Example Rows:**

| action_type | points_amount | min_interval_hours | max_per_day | requires_verification |
|-------------|---------------|-----------------------|-------------|----------------------|
| `signup` | 10 | NULL | 1 | FALSE |
| `daily_checkin` | 5 | 24 | 1 | FALSE |
| `referral_signup` | 20 | NULL | NULL | FALSE |
| `birthday_bonus` | 25 | NULL | 1 | FALSE |
| `review_posted` | 15 | NULL | 1 | TRUE |
| `game_win_small` | 5 | NULL | NULL | FALSE |
| `game_win_jackpot` | 50 | NULL | NULL | FALSE |
| `manual_award` | 0 (variable) | NULL | NULL | TRUE |

---

## 🔧 NEW FUNCTIONS

### **1. `get_points_for_action(action_type)`**
Get points amount for an action.

```sql
SELECT get_points_for_action('daily_checkin');
-- Returns: 5
```

### **2. `can_perform_points_action(user_id, action_type)`**
Check if user can perform action (validates cooldowns and limits).

```sql
SELECT can_perform_points_action(
  'user-uuid'::uuid, 
  'daily_checkin'
);
```

**Returns:**
```json
{
  "allowed": true,
  "points_amount": 5,
  "requires_verification": false,
  "metadata": {"requires_location": true}
}
```

**Or if blocked:**
```json
{
  "allowed": false,
  "reason": "Cooldown period not elapsed",
  "next_available": "2025-10-11T09:00:00Z"
}
```

### **3. `add_points_validated(user_id, action_type, ...)`**
Award points with automatic validation.

```sql
SELECT add_points_validated(
  'user-uuid'::uuid,
  'daily_checkin',
  'Daily check-in at shop'
);
```

**Returns:**
```json
{
  "success": true,
  "points_awarded": 5,
  "new_balance": 25,
  "action_type": "daily_checkin"
}
```

**Or if blocked:**
```json
{
  "success": false,
  "error": "Daily limit reached",
  "validation": {
    "allowed": false,
    "reason": "Daily limit reached",
    "max_per_day": 1
  }
}
```

---

## 🚀 HOW TO USE IN CODE

### **Update API Endpoints**

#### **Before:**
```typescript
// /api/check-in/route.ts
const { data: newBalance, error: pointsError } = await supabase
  .rpc('add_points', {
    p_user_id: user.id,
    p_amount: 5,  // Hardcoded
    p_source: 'visit',
    p_description: 'Daily visit check-in'
  })
```

#### **After:**
```typescript
// /api/check-in/route.ts
const { data: result, error: pointsError } = await supabase
  .rpc('add_points_validated', {
    p_user_id: user.id,
    p_action_type: 'daily_checkin',  // Config-driven
    p_description: 'Daily visit check-in'
  })

if (pointsError || !result.success) {
  return NextResponse.json(
    { error: result?.error || 'Failed to award points' },
    { status: 400 }
  )
}

return NextResponse.json({
  success: true,
  points_earned: result.points_awarded,
  points_balance: result.new_balance
})
```

### **Update Database Trigger**

#### **Before:**
```sql
CREATE FUNCTION handle_new_user() AS $$
BEGIN
  -- Create user...
  
  PERFORM add_points(v_user_id, 10, 'signup', 'Welcome bonus');
  RETURN NEW;
END;
$$;
```

#### **After:**
```sql
CREATE FUNCTION handle_new_user() AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Create user...
  
  -- Award signup bonus using config
  v_result := add_points_validated(
    v_user_id, 
    'signup',
    'Welcome bonus for new account'
  );
  
  IF NOT (v_result->>'success')::BOOLEAN THEN
    RAISE WARNING 'Failed to award signup points: %', v_result->>'error';
  END IF;
  
  RETURN NEW;
END;
$$;
```

---

## 📋 DEFAULT POINT ACTIONS

The migration creates these default actions:

### **Core Actions**
- `signup` - 10 points - Welcome bonus
- `daily_checkin` - 5 points - Daily visit (24h cooldown)
- `profile_complete` - 5 points - Complete profile

### **Social Actions**
- `referral_signup` - 20 points - Friend signs up
- `referral_first_purchase` - 10 points - Friend makes purchase
- `social_share` - 2 points - Share on social media (24h cooldown)
- `review_posted` - 15 points - Post review (requires verification)

### **Engagement Actions**
- `birthday_bonus` - 25 points - Birthday bonus
- `streak_7_days` - 10 points - 7-day check-in streak
- `streak_30_days` - 50 points - 30-day check-in streak
- `first_game_play` - 5 points - First game played

### **Game Prizes**
- `game_win_small` - 5 points
- `game_win_medium` - 10 points
- `game_win_large` - 20 points
- `game_win_jackpot` - 50 points

### **Staff Actions**
- `manual_award` - Variable - Manual staff award
- `compensation` - Variable - Compensation for issues
- `event_participation` - 10 points - Special events

### **Future Features**
- `purchase_bonus` - 1 point per £1 spent
- `first_purchase` - 20 points - First purchase bonus

---

## 🎨 ADMIN DASHBOARD

### **View All Configs:**
```sql
SELECT * FROM points_config ORDER BY points_amount DESC;
```

### **View Config with Usage Stats:**
```sql
SELECT * FROM points_config_with_usage 
ORDER BY total_points_awarded DESC;
```

**Shows:**
- Action type and description
- Points amount
- Active status
- Cooldowns and limits
- **Unique users** who earned points
- **Total uses** of this action
- **Total points awarded** via this action
- **Last used** timestamp

### **Update Point Amount:**
```sql
UPDATE points_config 
SET points_amount = 10, updated_at = NOW()
WHERE action_type = 'daily_checkin';
```

### **Disable an Action:**
```sql
UPDATE points_config 
SET active = FALSE, updated_at = NOW()
WHERE action_type = 'social_share';
```

### **Add New Action:**
```sql
INSERT INTO points_config (
  action_type, 
  points_amount, 
  description, 
  min_interval_hours,
  max_per_day,
  active
) VALUES (
  'newsletter_signup',
  5,
  'Sign up for newsletter',
  NULL,
  1,
  TRUE
);
```

---

## 🔄 MIGRATION STEPS

### **Step 1: Run Migration**
```bash
# In Supabase SQL Editor
# Run: supabase/migrations/20251010_create_points_config_table.sql
```

### **Step 2: Update API Endpoints**
Update these files to use `add_points_validated`:
- `/app/api/check-in/route.ts`
- `/app/api/games/play/route.ts`
- `/app/api/staff/award-points/route.ts`

### **Step 3: Update Database Trigger**
Update `handle_new_user()` to use `add_points_validated`

### **Step 4: Test**
1. Create new user → Should get 10 points (signup)
2. Check in → Should get 5 points (daily_checkin)
3. Try to check in again → Should be blocked (24h cooldown)
4. Change `daily_checkin` points to 10 in database
5. Next day, check in → Should get 10 points (new amount)

---

## 📊 ANALYTICS QUERIES

### **Most Popular Actions:**
```sql
SELECT 
  action_type,
  total_uses,
  total_points_awarded,
  unique_users
FROM points_config_with_usage
ORDER BY total_uses DESC;
```

### **Highest Value Actions:**
```sql
SELECT 
  action_type,
  points_amount,
  total_points_awarded
FROM points_config_with_usage
ORDER BY total_points_awarded DESC;
```

### **User Points Breakdown:**
```sql
SELECT 
  u.email,
  pt.source as action_type,
  COUNT(*) as times_performed,
  SUM(pt.amount) as total_points_from_action
FROM users u
JOIN points_transactions pt ON u.id = pt.user_id
GROUP BY u.email, pt.source
ORDER BY u.email, total_points_from_action DESC;
```

---

## 🎯 BENEFITS

### **1. Flexibility**
- Change point values instantly
- Add new actions without code changes
- Enable/disable actions on the fly

### **2. Security**
- All validation server-side
- Cooldowns enforced at DB level
- Limits enforced at DB level
- No client-side manipulation possible

### **3. Analytics**
- Track which actions are popular
- See total points awarded per action
- Monitor usage patterns
- Identify abuse or anomalies

### **4. Maintainability**
- Single source of truth
- No hardcoded values scattered in code
- Easy to audit and review
- Self-documenting system

### **5. Scalability**
- Add new actions easily
- Support variable amounts (staff awards)
- Metadata for complex conditions
- Extensible for future features

---

## 🔮 FUTURE ENHANCEMENTS

### **1. Time-Based Multipliers**
```json
{
  "metadata": {
    "happy_hour": {
      "multiplier": 2,
      "days": ["friday", "saturday"],
      "hours": [17, 20]
    }
  }
}
```

### **2. Conditional Awards**
```json
{
  "metadata": {
    "conditions": {
      "min_purchase_amount": 10,
      "required_badge": "vip"
    }
  }
}
```

### **3. Progressive Rewards**
```json
{
  "metadata": {
    "progressive": {
      "base_amount": 5,
      "increment_per_use": 1,
      "max_amount": 20
    }
  }
}
```

### **4. Seasonal Events**
```json
{
  "metadata": {
    "seasonal": {
      "start_date": "2025-12-01",
      "end_date": "2025-12-31",
      "multiplier": 3
    }
  }
}
```

---

## ✅ CHECKLIST

- [ ] Run migration to create `points_config` table
- [ ] Verify default actions are inserted
- [ ] Update API endpoints to use `add_points_validated`
- [ ] Update `handle_new_user()` trigger
- [ ] Test all point-awarding actions
- [ ] Build admin dashboard to manage configs
- [ ] Add analytics dashboard
- [ ] Document for staff training

---

## 🎉 CONCLUSION

**This system makes your points completely server-side controlled and foolproof!**

- ✅ No hardcoded values
- ✅ Change points without deployments
- ✅ Automatic validation and limits
- ✅ Full audit trail
- ✅ Analytics built-in
- ✅ Extensible for future features

**Deploy this and you'll have a professional, flexible, and secure points system!** 🚀
