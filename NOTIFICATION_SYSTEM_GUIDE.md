# 🔔 Notification System - Complete Guide

## 🎯 Overview

The notification system is **database-driven** and **admin-controlled**. You can create, edit, and manage all dashboard notifications from the admin panel without touching code!

---

## 📊 Database Tables

### **1. `notifications` Table**
Stores all notification configurations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `type` | TEXT | reward, streak, checkin, stamp, game, milestone, custom |
| `priority` | INTEGER | 1 = highest, 10 = lowest |
| `title` | TEXT | Notification title |
| `message` | TEXT | Notification message |
| `icon` | TEXT | Emoji or icon |
| `variant` | TEXT | default, streak, success, reward |
| `dismissible` | BOOLEAN | Can user dismiss? |
| `conditions` | JSONB | When to show (flexible) |
| `active` | BOOLEAN | Is notification active? |
| `start_date` | TIMESTAMP | When to start showing |
| `end_date` | TIMESTAMP | When to stop showing |
| `days_of_week` | INTEGER[] | Which days (0=Sun, 6=Sat) |
| `time_of_day_start` | TIME | Show after this time |
| `time_of_day_end` | TIME | Show before this time |

### **2. `notification_dismissals` Table**
Tracks which users dismissed which notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Who dismissed |
| `notification_id` | UUID | What notification |
| `dismissed_at` | TIMESTAMP | When dismissed |

---

## 🎛️ Admin Panel

### **Access:**
`/admin/notifications`

### **Features:**
- ✅ View all notifications
- ✅ Toggle active/inactive
- ✅ See priority order
- ✅ Edit notifications (coming soon)
- ✅ Create new notifications (coming soon)
- ✅ Delete notifications (coming soon)

### **Dashboard Stats:**
- Total notifications
- Active notifications
- Inactive notifications
- Critical (non-dismissible) notifications

---

## 🎨 Notification Types

### **1. Reward** 🎁
- **When:** User has unredeemed rewards
- **Priority:** 1 (highest)
- **Dismissible:** No
- **Variant:** reward (pulsing orange/yellow)

### **2. Streak** 🔥
- **When:** User has 7+ day streak and hasn't checked in
- **Priority:** 2
- **Dismissible:** No
- **Variant:** streak (pulsing red/orange)

### **3. Check-In** 📍
- **When:** User hasn't checked in today
- **Priority:** 4
- **Dismissible:** Yes
- **Variant:** default

### **4. Coffee Stamp** ☕
- **When:** User hasn't got stamp today
- **Priority:** 3-5 (depends on stamps remaining)
- **Dismissible:** Yes (except 1 stamp away)
- **Variant:** default or reward

### **5. Game** 🎮
- **When:** User hasn't played today
- **Priority:** 6
- **Dismissible:** Yes
- **Variant:** default

### **6. Milestone** 🎯
- **When:** Close to next reward
- **Priority:** 6
- **Dismissible:** Yes
- **Variant:** default

### **7. Custom** ✨
- **When:** Any custom condition
- **Priority:** Variable
- **Dismissible:** Variable
- **Variant:** Variable

---

## ⚙️ How It Works

### **Priority System:**
1. System fetches all **active** notifications
2. Filters by conditions (user state, time, date)
3. Removes dismissed notifications (< 24 hours)
4. Sorts by priority (1 = highest)
5. Shows **only the highest priority** notification

### **Conditions (JSONB):**
```json
{
  "hasCheckedInToday": false,
  "hasUnredeemedRewards": true,
  "stampsUntilReward": 1,
  "currentStreak": {"min": 7},
  "timeOfDay": "morning",
  "allComplete": true
}
```

### **Time-Based Display:**
- `days_of_week`: [0, 1, 2, 3, 4, 5, 6] (null = all days)
- `time_of_day_start`: "09:00" (show after 9am)
- `time_of_day_end`: "17:00" (show before 5pm)
- `start_date`: "2025-01-01" (campaign start)
- `end_date`: "2025-12-31" (campaign end)

---

## 🎯 Example Notifications

### **Morning Check-In:**
```sql
INSERT INTO notifications (
  type, priority, title, message, icon,
  variant, dismissible,
  time_of_day_start, time_of_day_end,
  conditions
) VALUES (
  'checkin', 4,
  '☀️ Good Morning!',
  'Start your day with us! Pop in for your check-in and earn 5 points! ✨',
  '☀️',
  'default', true,
  '06:00', '10:00',
  '{"hasCheckedInToday": false}'::jsonb
);
```

### **Weekend Special:**
```sql
INSERT INTO notifications (
  type, priority, title, message, icon,
  variant, dismissible,
  days_of_week,
  start_date, end_date
) VALUES (
  'custom', 3,
  '🎉 Weekend Special!',
  'Double points this weekend! Come visit us! 💕',
  '🎉',
  'reward', false,
  ARRAY[0, 6], -- Saturday and Sunday
  '2025-01-01', '2025-01-31'
);
```

### **Holiday Promotion:**
```sql
INSERT INTO notifications (
  type, priority, title, message, icon,
  variant, dismissible,
  start_date, end_date
) VALUES (
  'custom', 2,
  '🎄 Christmas Special!',
  'Free mince pie with any coffee! Limited time! 🎅',
  '🎄',
  'reward', false,
  '2025-12-20', '2025-12-25'
);
```

---

## 🔧 Admin Actions

### **Toggle Active/Inactive:**
- Click eye icon (👁️) to activate
- Click eye-off icon to deactivate
- Inactive notifications won't show to customers

### **Edit Notification:**
- Click edit icon (✏️)
- Modify title, message, conditions
- Change priority, variant, dismissibility

### **Delete Notification:**
- Click trash icon (🗑️)
- Confirm deletion
- Permanently removes notification

### **Create New:**
- Click "New Notification" button
- Fill in all fields
- Set conditions and scheduling
- Save and activate

---

## 📱 Customer Experience

### **What They See:**
- One notification at a time (highest priority)
- X button on dismissible notifications
- No X on critical notifications
- Resets after 24 hours if dismissed

### **Dismissal:**
- Click X to dismiss
- Notification hidden for 24 hours
- Reappears next day if still relevant
- Critical notifications can't be dismissed

---

## 🎨 Variants & Styling

### **Default:**
- Orange gradient background
- Standard border
- No animation

### **Streak:**
- Red/orange/yellow gradient
- Pulsing animation
- Urgent feel

### **Success:**
- Green gradient
- Celebratory
- Positive vibe

### **Reward:**
- Orange/yellow gradient
- Pulsing animation
- Exciting feel

---

## 🚀 Setup Instructions

### **1. Run Migration:**
```bash
# In Supabase SQL Editor, run:
supabase/migrations/20251010_notifications_system.sql
```

### **2. Access Admin Panel:**
```
https://your-app.com/admin/notifications
```

### **3. Manage Notifications:**
- Toggle active/inactive
- Edit existing
- Create new ones
- Set schedules

### **4. Test:**
- View dashboard as customer
- Check which notification shows
- Dismiss and verify it hides
- Check it reappears next day

---

## 💡 Best Practices

### **Priority Guidelines:**
1. **Critical (1-2):** Rewards, streaks, urgent
2. **Important (3-4):** Check-ins, stamps
3. **Normal (5-6):** Games, milestones
4. **Low (7-10):** General info, tips

### **Dismissibility:**
- **Not Dismissible:** Rewards ready, streak at risk, 1 stamp away
- **Dismissible:** Check-in reminders, game prompts, general info

### **Message Style:**
- Keep Amanda's bubbly personality
- Use emojis liberally 💕✨🎉
- Be encouraging and friendly
- Create urgency when appropriate

### **Timing:**
- Morning: Motivational, fresh start
- Afternoon: Pick-me-up, coffee break
- Evening: Last chance, urgency
- Weekend: Special offers, relaxed

---

## 🔮 Future Enhancements

### **Could Add:**
- [ ] A/B testing different messages
- [ ] Click-through tracking
- [ ] Conversion metrics
- [ ] User segmentation (VIP, new, returning)
- [ ] Personalized messages (use customer name)
- [ ] Multi-language support
- [ ] Rich media (images, videos)
- [ ] Action buttons (not just dismiss)

---

## 📊 Analytics Ideas

### **Track:**
- Notification impressions
- Dismiss rate
- Click-through rate
- Conversion rate (did they take action?)
- Most effective messages
- Best times to show

### **Optimize:**
- Test different messages
- Adjust priorities
- Refine conditions
- Improve timing
- Increase engagement

---

## 🎯 Example Use Cases

### **Flash Sale:**
```sql
-- 2-hour flash sale notification
INSERT INTO notifications (
  type, priority, title, message,
  variant, dismissible,
  start_date, end_date
) VALUES (
  'custom', 1,
  '⚡ FLASH SALE!',
  '50% off all pastries for the next 2 hours! Hurry! 🏃',
  'reward', false,
  NOW(), NOW() + INTERVAL '2 hours'
);
```

### **Rainy Day Offer:**
```sql
-- Show only on rainy days (would need weather API integration)
INSERT INTO notifications (
  type, priority, title, message,
  variant, dismissible
) VALUES (
  'custom', 3,
  '☔ Rainy Day Special!',
  'Free upgrade to large on any hot drink! Stay cozy! ☕',
  'reward', true
);
```

### **Birthday Month:**
```sql
-- Show to users with birthday this month
INSERT INTO notifications (
  type, priority, title, message,
  variant, dismissible,
  conditions
) VALUES (
  'custom', 2,
  '🎂 Happy Birthday Month!',
  'Come claim your free birthday treat! 🎉',
  'reward', false,
  '{"birthdayMonth": true}'::jsonb
);
```

---

**The notification system is now fully database-driven and admin-controlled! 🔔✨**
