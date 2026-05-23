# 📧 Additional Email Ideas Based on Your Database

Based on your existing database tables, here are **15+ additional emails** you can set up!

---

## 🎮 Game-Related Emails

### 1. **Big Win Email** 🎉
**Trigger:** `game_plays` table - When user wins a big prize
**Tables:** `game_plays`, `users`, `mini_games`, `game_prizes`
**When to send:** User wins 3+ ducks or instant reward from a game
**Variables:** `{{name}}`, `{{gameName}}`, `{{prizeWon}}`, `{{totalDucks}}`

```sql
-- Trigger on game_plays INSERT
-- IF prize_value >= 3 OR prize_type = 'reward'
```

### 2. **Lucky Streak Email** 🔥
**Trigger:** `game_plays` table - Multiple wins in a row
**Tables:** `game_plays`, `users`
**When to send:** User wins 3 games in a row
**Variables:** `{{name}}`, `{{streakCount}}`, `{{totalWins}}`

### 3. **Game Available Email** 🎮
**Trigger:** Cron job - Daily reminder
**Tables:** `users`, `game_plays`, `mini_games`
**When to send:** User hasn't played their daily game yet (sent at 6pm)
**Variables:** `{{name}}`, `{{gamesAvailable}}`, `{{lastPlayDate}}`

---

## 🦆 Stamp/Duck-Related Emails

### 4. **Halfway There Email** ☕
**Trigger:** `coffee_stamps` table - 5 stamps reached
**Tables:** `coffee_stamps`, `users`
**When to send:** User reaches exactly 5 stamps
**Variables:** `{{name}}`, `{{stampsCount}}`, `{{stampsNeeded}}`

```sql
-- Trigger on coffee_stamps INSERT
-- IF COUNT = 5
```

### 5. **First Stamp Email** 🎊
**Trigger:** `coffee_stamps` table - First stamp ever
**Tables:** `coffee_stamps`, `users`
**When to send:** User's first stamp
**Variables:** `{{name}}`, `{{howItWorks}}`

### 6. **Stamp Streak Email** 🔥
**Trigger:** `coffee_stamps` table - Daily streak
**Tables:** `coffee_stamps`, `users`
**When to send:** User has checked in 7 days in a row
**Variables:** `{{name}}`, `{{streakDays}}`, `{{bonusReward}}`

---

## 🏆 Badge & Achievement Emails

### 7. **Badge Earned Email** 🏅
**Trigger:** `user_badges` table - New badge earned
**Tables:** `user_badges`, `badge_tiers`, `users`
**When to send:** User earns a new badge tier
**Variables:** `{{name}}`, `{{badgeName}}`, `{{badgeTitle}}`, `{{perks}}`

```sql
-- Trigger on user_badges INSERT
-- Already have check_badge_upgrade() function!
```

### 8. **Badge Upgrade Email** ⬆️
**Trigger:** `user_badges` table - Badge tier upgrade
**Tables:** `user_badges`, `badge_tiers`, `users`
**When to send:** User upgrades from Regular → VIP → Champion, etc.
**Variables:** `{{name}}`, `{{oldBadge}}`, `{{newBadge}}`, `{{newPerks}}`

---

## 👥 Referral Emails

### 9. **Referral Pending Email** ⏳
**Trigger:** `referrals` table - Referral sent but not confirmed
**Tables:** `referrals`, `users`
**When to send:** 3 days after referral sent, still not confirmed
**Variables:** `{{name}}`, `{{refereeName}}`, `{{referralLink}}`

### 10. **Referral Milestone Email** 🎯
**Trigger:** `referrals` table - Multiple referrals confirmed
**Tables:** `referrals`, `users`
**When to send:** User reaches 5, 10, 25, 50 confirmed referrals
**Variables:** `{{name}}`, `{{totalReferrals}}`, `{{bonusReward}}`

---

## 📅 Time-Based Emails

### 11. **Birthday Email** 🎂
**Trigger:** Cron job - Daily check
**Tables:** `users` (need to add `birthday` column)
**When to send:** User's birthday
**Variables:** `{{name}}`, `{{birthdayReward}}`, `{{age}}`

**Note:** Need to add `birthday DATE` column to `users` table

### 12. **Anniversary Email** 🎉
**Trigger:** Cron job - Daily check
**Tables:** `users` (use `created_at`)
**When to send:** 1 year, 2 years, etc. since signup
**Variables:** `{{name}}`, `{{yearsAsMember}}`, `{{totalStamps}}`, `{{totalRewards}}`

### 13. **Weekend Special Email** 🌟
**Trigger:** Cron job - Friday 5pm
**Tables:** `users`, `coffee_stamps`
**When to send:** Every Friday to active users
**Variables:** `{{name}}`, `{{weekendBonus}}`, `{{currentStamps}}`

---

## 🎁 Reward-Related Emails

### 14. **Reward Stock Alert Email** 📦
**Trigger:** `rewards` table - Low stock
**Tables:** `rewards`, `users` (who have stamps close to threshold)
**When to send:** Reward stock < 5 and user is close to earning it
**Variables:** `{{name}}`, `{{rewardName}}`, `{{stockLeft}}`, `{{stampsNeeded}}`

### 15. **New Reward Available Email** ✨
**Trigger:** `rewards` table - New reward added
**Tables:** `rewards`, `users`
**When to send:** New reward is added to catalog
**Variables:** `{{name}}`, `{{rewardName}}`, `{{rewardDescription}}`, `{{stampsRequired}}`

```sql
-- Trigger on rewards INSERT
-- WHERE active = true
```

### 16. **Reward Expired Email** 😢
**Trigger:** Cron job or `user_rewards` UPDATE
**Tables:** `user_rewards`, `rewards`, `users`
**When to send:** Reward just expired (status changed to 'expired')
**Variables:** `{{name}}`, `{{rewardName}}`, `{{expiredDate}}`

---

## 📊 Summary & Digest Emails

### 17. **Weekly Summary Email** 📈
**Trigger:** Cron job - Every Monday 9am
**Tables:** `users`, `coffee_stamps`, `game_plays`, `user_rewards`, `referrals`
**When to send:** Weekly digest of activity
**Variables:** 
- `{{name}}`
- `{{stampsThisWeek}}`
- `{{gamesPlayed}}`
- `{{rewardsEarned}}`
- `{{referralsConfirmed}}`
- `{{totalStamps}}`

### 18. **Monthly Report Email** 📊
**Trigger:** Cron job - First day of month
**Tables:** All activity tables
**When to send:** Monthly stats and achievements
**Variables:**
- `{{name}}`
- `{{monthName}}`
- `{{totalStampsMonth}}`
- `{{rewardsEarnedMonth}}`
- `{{badgesEarned}}`
- `{{rank}}` (compared to other users)

---

## 🚨 Alert Emails

### 19. **Account Security Email** 🔒
**Trigger:** `auth.users` - Password change or suspicious activity
**Tables:** `auth.users`, `users`
**When to send:** Password changed, email changed, etc.
**Variables:** `{{name}}`, `{{actionType}}`, `{{timestamp}}`, `{{ipAddress}}`

### 20. **Profile Incomplete Email** ⚠️
**Trigger:** Cron job - 3 days after signup
**Tables:** `users`
**When to send:** User missing phone or avatar
**Variables:** `{{name}}`, `{{missingFields}}`

---

## 🎯 Re-engagement Emails

### 21. **Come Back Email (7 days)** 👋
**Already have this as "Inactive User"**

### 22. **We Really Miss You (30 days)** 💔
**Trigger:** Cron job - Monthly check
**Tables:** `users`, `coffee_stamps`
**When to send:** 30 days since last check-in
**Variables:** `{{name}}`, `{{lastVisit}}`, `{{specialOffer}}`

### 23. **Win-Back Offer Email (60 days)** 🎁
**Trigger:** Cron job - Monthly check
**Tables:** `users`, `coffee_stamps`
**When to send:** 60 days since last check-in
**Variables:** `{{name}}`, `{{bonusStamps}}`, `{{specialReward}}`

---

## 📋 Priority Recommendations

### **High Priority** (Easy to implement, high value)
1. ✅ **Badge Earned Email** - Already have badge system
2. ✅ **First Stamp Email** - Great onboarding
3. ✅ **Halfway There Email** - Encourages completion
4. ✅ **Big Win Email** - Celebrate wins
5. ✅ **Anniversary Email** - Uses existing `created_at`

### **Medium Priority** (Good engagement)
6. ✅ **Weekly Summary Email** - Keep users engaged
7. ✅ **Game Available Email** - Increase game plays
8. ✅ **New Reward Available** - Drive excitement
9. ✅ **Referral Milestone** - Encourage sharing

### **Low Priority** (Nice to have)
10. ✅ **Birthday Email** - Requires adding birthday field
11. ✅ **Monthly Report** - More complex
12. ✅ **Reward Stock Alert** - Edge case

---

## 🚀 Quick Implementation Guide

### Example: Badge Earned Email

**1. Create Email Template:**
```sql
INSERT INTO email_templates (name, display_name, subject, html_body, category)
VALUES (
  'badge_earned',
  'Badge Earned',
  '🏅 You Earned a New Badge!',
  '<html>...</html>',
  'achievement'
);
```

**2. Create Trigger:**
```sql
CREATE OR REPLACE FUNCTION trigger_badge_earned_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_badge RECORD;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = NEW.user_id;
  SELECT * INTO v_badge FROM badge_tiers WHERE tier = NEW.badge_tier;
  
  PERFORM queue_email_from_template(
    'badge_earned',
    v_user.email,
    v_user.id,
    jsonb_build_object(
      'name', v_user.name,
      'badgeName', v_badge.name,
      'badgeTitle', v_badge.fun_title,
      'perks', v_badge.perks
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER send_badge_earned_email
  AFTER INSERT ON user_badges
  FOR EACH ROW
  EXECUTE FUNCTION trigger_badge_earned_email();
```

**3. Done!** Email automatically sends when badge earned.

---

## 💡 Database Changes Needed

### Optional Enhancements:
```sql
-- Add birthday field for birthday emails
ALTER TABLE users ADD COLUMN birthday DATE;

-- Add email preferences
CREATE TABLE email_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  marketing_emails BOOLEAN DEFAULT true,
  achievement_emails BOOLEAN DEFAULT true,
  reminder_emails BOOLEAN DEFAULT true,
  digest_emails BOOLEAN DEFAULT true
);
```

---

## ✅ Summary

You can add **20+ additional emails** based on your existing database structure!

**Easiest to implement:**
- Badge emails (system already exists)
- First stamp email (simple trigger)
- Halfway email (simple trigger)
- Big win email (simple trigger)
- Anniversary email (uses existing data)

**Most impactful:**
- Weekly summary (keeps users engaged)
- Badge earned (celebrates achievements)
- Halfway there (drives completion)
- Game available (increases engagement)

Want me to help you implement any of these? 🚀
