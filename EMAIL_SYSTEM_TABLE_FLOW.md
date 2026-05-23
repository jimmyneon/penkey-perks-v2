# 📊 Email System - Which Tables Are Checked?

## ✅ Complete Table Flow Diagram

---

## 🎯 Milestone Emails (Database-Driven)

### Tables Checked:
```
┌─────────────────────────────────────────────────────────────┐
│ 1. points_transactions (INSERT trigger)                     │
│    ↓ When user earns points                                 │
│                                                              │
│ 2. check_milestones() function runs                         │
│    ↓ Checks these tables:                                   │
│                                                              │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ • milestones (reads ALL active milestones)          │ │
│    │ • user_milestones (checks if already achieved)      │ │
│    │                                                      │ │
│    │ Then checks based on milestone.requirement_type:    │ │
│    │                                                      │ │
│    │ IF 'points':                                         │ │
│    │   → points_transactions (SUM all positive points)   │ │
│    │                                                      │ │
│    │ IF 'visits':                                         │ │
│    │   → points_transactions (COUNT where source='visit')│ │
│    │                                                      │ │
│    │ IF 'stamps':                                         │ │
│    │   → coffee_stamps (COUNT all stamps)                │ │
│    │                                                      │ │
│    │ IF 'referrals':                                      │ │
│    │   → referrals (COUNT where confirmed=true)          │ │
│    │                                                      │ │
│    │ IF 'games_played':                                   │ │
│    │   → game_plays (COUNT all plays)                    │ │
│    └─────────────────────────────────────────────────────┘ │
│                                                              │
│ 3. If milestone achieved:                                   │
│    ↓ INSERT into user_milestones                            │
│                                                              │
│ 4. Trigger: send_milestone_email()                          │
│    ↓ Reads: users, milestones                               │
│    ↓ Queues email with milestone details                    │
│                                                              │
│ 5. email_queue (email added)                                │
│    ↓ Cron job processes queue                               │
│                                                              │
│ 6. Email sent via Resend API                                │
│    ↓ Log saved                                              │
│                                                              │
│ 7. email_logs (success/failure logged)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎁 Reward Emails (Database-Driven)

### Tables Checked:

```
┌─────────────────────────────────────────────────────────────┐
│ REWARD EARNED EMAIL                                          │
├─────────────────────────────────────────────────────────────┤
│ 1. user_rewards (INSERT trigger)                            │
│    ↓ When reward is issued                                  │
│                                                              │
│ 2. Trigger: send_reward_earned_email()                      │
│    ↓ Reads these tables:                                    │
│    • users (get user.email, user.name)                      │
│    • rewards (get reward.name, reward.value)                │
│                                                              │
│ 3. email_queue (email added with QR code)                   │
│    ↓ Cron job processes                                     │
│                                                              │
│ 4. Email sent with QR code                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ REWARD REDEEMED EMAIL                                        │
├─────────────────────────────────────────────────────────────┤
│ 1. user_rewards (UPDATE trigger)                            │
│    ↓ When status changes to 'redeemed'                      │
│                                                              │
│ 2. Trigger: send_reward_redeemed_email()                    │
│    ↓ Reads these tables:                                    │
│    • users (get user.email, user.name)                      │
│    • rewards (get reward.name)                              │
│                                                              │
│ 3. email_queue (confirmation email added)                   │
│    ↓ Cron job processes                                     │
│                                                              │
│ 4. Email sent                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ REWARD EXPIRING EMAIL (Cron Job)                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Cron: send_expiring_reward_reminders() (daily 9am)      │
│    ↓ Queries these tables:                                  │
│    • user_rewards (WHERE expires_at <= NOW() + 3 days)      │
│    • rewards (JOIN to get reward.name)                      │
│    • users (JOIN to get user.email, user.name)              │
│    • email_logs (check if already sent reminder)            │
│                                                              │
│ 2. email_queue (reminder emails added)                      │
│    ↓ Cron job processes                                     │
│                                                              │
│ 3. Email sent with QR code                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 User Activity Emails

```
┌─────────────────────────────────────────────────────────────┐
│ WELCOME EMAIL                                                │
├─────────────────────────────────────────────────────────────┤
│ 1. users (INSERT trigger)                                   │
│    ↓ When user signs up                                     │
│                                                              │
│ 2. Trigger: send_welcome_email()                            │
│    ↓ Reads: users (email, name)                             │
│                                                              │
│ 3. email_queue (welcome email with referral link)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ REFERRAL CONFIRMED EMAIL                                     │
├─────────────────────────────────────────────────────────────┤
│ 1. referrals (UPDATE trigger)                               │
│    ↓ When confirmed=true                                    │
│                                                              │
│ 2. Trigger: send_referral_confirmed_email()                 │
│    ↓ Reads these tables:                                    │
│    • users (referrer: email, name)                          │
│    • users (referee: name)                                  │
│                                                              │
│ 3. email_queue (confirmation email)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ INACTIVE USER EMAIL (Cron Job)                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Cron: send_inactive_user_emails() (daily 9am)           │
│    ↓ Queries these tables:                                  │
│    • users (all users)                                      │
│    • transactions (check last check_in date)                │
│    • points_transactions (get points balance)               │
│    • email_logs (check if already sent)                     │
│                                                              │
│ 2. email_queue (reminder emails for inactive users)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Summary: All Tables Used by Email System

### **Read Tables** (Data Sources):
1. ✅ **users** - User info (name, email)
2. ✅ **rewards** - Reward details (name, value, type)
3. ✅ **user_rewards** - Issued rewards (status, QR code, expiry)
4. ✅ **milestones** - Milestone definitions (ALL types)
5. ✅ **user_milestones** - Achieved milestones
6. ✅ **points_transactions** - Points history, visits
7. ✅ **coffee_stamps** - Stamp count
8. ✅ **referrals** - Referral count and status
9. ✅ **game_plays** - Games played count
10. ✅ **transactions** - Check-in history
11. ✅ **email_logs** - Prevent duplicate emails
12. ✅ **email_templates** - Email content
13. ✅ **email_triggers** - Trigger configurations

### **Write Tables** (Where Data is Stored):
1. ✅ **email_queue** - Queued emails waiting to send
2. ✅ **email_logs** - Sent email history
3. ✅ **user_milestones** - New milestone achievements

---

## 🎯 Key Points

### ✅ Rewards System is Database-Driven
- **Rewards table** defines all available rewards
- **user_rewards** tracks issued rewards
- Emails automatically sent when:
  - Reward earned (INSERT on user_rewards)
  - Reward redeemed (UPDATE on user_rewards)
  - Reward expiring (Cron checks user_rewards)

### ✅ Milestones System is Database-Driven
- **milestones table** defines ALL milestones
- **user_milestones** tracks achievements
- Supports 5 types: points, visits, stamps, referrals, games
- Emails automatically sent when milestone achieved

### ✅ No Hardcoding!
- Add rewards → SQL INSERT into `rewards`
- Add milestones → SQL INSERT into `milestones`
- Everything else is automatic!

---

## 🚀 Example: How a Points Milestone Email is Sent

```sql
-- 1. User earns 10 points
INSERT INTO points_transactions (user_id, amount, source)
VALUES ('user-123', 10, 'check_in');

-- 2. Trigger fires: auto_check_milestones_on_points()
--    Calls: check_milestones('user-123')

-- 3. check_milestones() reads:
SELECT * FROM milestones WHERE active = true;
-- Finds: "100 Points Milestone" (requirement_value = 100)

-- 4. Checks user's lifetime points:
SELECT SUM(amount) FROM points_transactions WHERE user_id = 'user-123';
-- Result: 100 points (just reached!)

-- 5. Inserts achievement:
INSERT INTO user_milestones (user_id, milestone_id)
VALUES ('user-123', 'milestone-100-points-id');

-- 6. Trigger fires: send_milestone_email()
--    Reads: users, milestones
--    Queues email

-- 7. Email queued:
INSERT INTO email_queue (recipient_email, subject, html_body, ...)
VALUES ('user@email.com', 'You Reached 100 Points!', '<html>...</html>', ...);

-- 8. Cron job (every 5 min) sends email via Resend API

-- 9. Success logged:
INSERT INTO email_logs (recipient_user_id, template_id, sent_at, ...)
VALUES ('user-123', 'milestone-template-id', NOW(), ...);
```

---

## ✅ Answer to Your Question

**Q: Does it check tables for rewards too based on table entries?**

**A: YES! 100% Database-Driven**

- **Rewards** → Defined in `rewards` table
- **Milestones** → Defined in `milestones` table
- **Email triggers** → Automatically fire when data changes
- **No hardcoding** → Everything reads from database

You can add/edit/remove rewards and milestones via SQL without touching any code!
