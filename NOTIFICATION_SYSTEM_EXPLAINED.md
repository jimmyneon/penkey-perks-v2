# 🔔 NOTIFICATION SYSTEM - COMPLETE EXPLANATION

**How notifications work, priorities, expiry, and database storage**

---

## 📊 NOTIFICATION TYPES

### 1. **In-App Notifications** (Database-Driven)
- **Stored in:** `notifications` table
- **Shows:** Banner at top of dashboard
- **Lifetime:** Controlled by `expires_at` field
- **Priority:** 0-100 (higher = shows first)

### 2. **Push Notifications** (Instant)
- **Stored in:** `push_notifications_log` table (for tracking)
- **Shows:** Browser/device notification
- **Lifetime:** Instant delivery, user dismisses
- **Priority:** Not applicable (all delivered)

### 3. **Email** (Queued)
- **Stored in:** `email_queue` table
- **Shows:** User's inbox
- **Lifetime:** Permanent (in inbox)
- **Priority:** Processed in order

---

## 🎯 PRIORITY SYSTEM (In-App Notifications)

### How Priority Works:
```
Higher Number = Higher Priority = Shows First
```

### Priority Levels:
| Priority | Type | Example | Shows When |
|----------|------|---------|------------|
| **100** | Urgent | Reward expiring in 2 hours | Always shows first |
| **90** | Critical | Birthday, Free coffee ready | Shows above most |
| **80** | **Staff Messages** | Announcements, promotions | **Shows above automated** |
| **75** | High | Game won, Reward earned | Important events |
| **50** | Medium | Daily reminders, Check-ins | Normal notifications |
| **25** | Low | General tips, Suggestions | Background info |
| **0** | Info | Welcome messages | Lowest priority |

### **Staff Messages:**
- **Priority: 80** (hardcoded in `sendStaffMessage`)
- **Shows ABOVE** all automated notifications (games, rewards, etc.)
- **Shows BELOW** only urgent system alerts (expiring rewards)

---

## ⏰ NOTIFICATION LIFECYCLE

### **Staff Message Example:**

```
1. Staff sends message at 2:00 PM
   ↓
2. Created in `notifications` table:
   - priority: 80
   - expires_at: 2:00 PM + 24 hours = 2:00 PM next day
   - active: true
   ↓
3. Shows for ALL users on dashboard
   - Appears in notification banner
   - Rotates with other notifications
   ↓
4. User can dismiss (if dismissible: true)
   - Logged in `notification_dismissals` table
   - Won't show for that user again
   ↓
5. After 24 hours (expires_at reached):
   - Automatically stops showing
   - active: false (set by cleanup job)
   ↓
6. Cleanup job removes old notifications
   - Deletes notifications older than 7 days
```

---

## 🗄️ DATABASE STORAGE

### **In-App Notifications Table:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- 'staff_message', 'game', 'reward', etc.
  priority INTEGER DEFAULT 50, -- 0-100
  active BOOLEAN DEFAULT true,
  dismissible BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ, -- When it stops showing
  created_by UUID, -- Staff member who created it
  conditions JSONB DEFAULT '{}', -- Who sees it
  metadata JSONB DEFAULT '{}', -- Extra data
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Key Fields:**

**`priority`** (0-100):
- Determines display order
- Higher = shows first
- Staff messages = 80

**`expires_at`** (timestamp):
- When notification stops showing
- Staff messages = 24 hours from creation
- Automated = varies (some never expire)
- NULL = never expires

**`active`** (boolean):
- true = shows to users
- false = hidden
- Auto-set to false when `expires_at` is reached

**`dismissible`** (boolean):
- true = user can dismiss
- false = always shows (urgent messages)
- Staff messages = true (can be dismissed)

**`conditions`** (JSON):
- Empty `{}` = shows to everyone
- `{"targetUserId": "123"}` = shows to specific user
- `{"currentStreak": {"gte": 7}}` = shows if streak >= 7

**`created_by`** (UUID):
- Staff member who sent the message
- NULL for automated notifications
- Used for tracking/analytics

---

## 🔄 HOW NOTIFICATIONS ARE SELECTED

### **Selection Process:**

```javascript
1. Fetch all active notifications from database
   WHERE active = true
   AND (expires_at IS NULL OR expires_at > NOW())
   
2. Filter by conditions (user state matching)
   - Check if user meets conditions
   - e.g., hasUnredeemedRewards, currentStreak, etc.
   
3. Remove duplicates (one per category)
   - Only ONE time-based notification
   - Only ONE reward notification
   - But different categories can coexist
   
4. Sort by priority (highest first)
   ORDER BY priority DESC
   
5. Return top 5 notifications
   LIMIT 5
   
6. Rotate through them every 10 seconds
```

### **Example Selection:**

**User State:**
- Has unredeemed reward
- 7-day streak
- Hasn't checked in today

**Notifications Fetched:**
1. Staff Message: "🎊 Double Beans Weekend!" (priority: 80)
2. Reward Ready: "🎁 You have a reward!" (priority: 75)
3. Streak Alert: "🔥 7-Day Streak!" (priority: 43)
4. Check-in Reminder: "☀️ Good Morning!" (priority: 12)

**What Shows:**
- **First:** Staff Message (priority 80)
- **Then rotates to:** Reward Ready → Streak Alert → Check-in
- **Every 10 seconds** it switches

---

## 📱 STAFF MESSAGE FLOW

### **When Staff Sends Message:**

```
Staff clicks "Send to All Customers"
  ↓
API: /api/staff/send-multi-channel-message
  ↓
Calls: sendStaffMessage()
  ↓
  ├─→ IN-APP: Creates notification in database
  │   - title: "🎊 Special Offer"
  │   - message: "Double beans this weekend!"
  │   - priority: 80
  │   - expires_at: NOW() + 24 hours
  │   - conditions: {} (shows to everyone)
  │   - created_by: staff_user_id
  │
  ├─→ PUSH: Sends to all subscribed users
  │   - Fetches all customers with push subscriptions
  │   - Sends push notification immediately
  │   - Logs to push_notifications_log
  │
  └─→ EMAIL: Queues emails for all customers
      - Fetches all customer emails
      - Creates rows in email_queue
      - Processed by cron job every 5 minutes
```

---

## ⏱️ EXPIRY & CLEANUP

### **Automatic Expiry:**

**Staff Messages:**
- **Lifetime:** 24 hours
- **After 24 hours:** Stops showing automatically
- **Cleanup:** Deleted after 7 days

**Automated Notifications:**
- **Varies by type:**
  - Reward expiring: Until reward expires
  - Daily reminders: 24 hours
  - Milestones: Never expire (dismissible)
  - Weather: 6 hours

### **Cleanup Job (Recommended):**

```sql
-- Run daily via cron
DELETE FROM notifications
WHERE expires_at < NOW() - INTERVAL '7 days';

-- Or mark as inactive
UPDATE notifications
SET active = false
WHERE expires_at < NOW();
```

---

## 🎯 PRIORITY EXAMPLES

### **Scenario 1: Staff Sends Promotion**

```
Staff Message: "🎊 Double Beans Weekend!" (priority: 80)
User also has:
- Reward Ready (priority: 75)
- Daily Game (priority: 32)
- Morning Greeting (priority: 12)

Result: Staff message shows FIRST
Then rotates: Reward → Game → Greeting
```

### **Scenario 2: Urgent Reward Expiring**

```
Reward Expiring: "🚨 Last Chance!" (priority: 100)
Staff Message: "🎊 Promotion" (priority: 80)
Game Won: "🎮 You Won!" (priority: 75)

Result: Reward expiring shows FIRST (priority 100)
Then: Staff message → Game won
```

### **Scenario 3: Multiple Staff Messages**

```
Staff Message 1: "New Menu Items" (priority: 80, sent 2 hours ago)
Staff Message 2: "Closing Early Today" (priority: 80, sent 5 minutes ago)

Result: Both show (same priority)
Newer message shows first (sorted by created_at DESC)
```

---

## 📊 TRACKING & ANALYTICS

### **What's Tracked:**

**In-App:**
- `notification_views` - When user sees it
- `notification_dismissals` - When user dismisses it
- `notification_clicks` - When user clicks action button

**Push:**
- `push_notifications_log` - All push sends
  - Status: sent, failed, clicked
  - Delivery time
  - Error messages

**Email:**
- `email_queue` - Queued emails
- `email_logs` - Sent emails
  - Status: pending, sent, failed
  - Sent time
  - Error messages

**Staff Activity:**
- `staff_activity_log` - All staff actions
  - Who sent what
  - When
  - To how many users

---

## 🔧 HOW TO USE IN CODE

### **Send Automated Notification:**

```typescript
import { sendNotification } from '@/lib/messaging/send-notification'

// After game completion
await sendNotification({
  userId: user.id,
  templateName: 'game_won',
  variables: { beans: 50 },
  channels: {
    push: true,  // Send push
    email: false, // Don't send email
    inApp: true   // Show in-app
  },
  expiresInHours: 24 // Show for 24 hours
})
```

### **Send Staff Message:**

```typescript
import { sendStaffMessage } from '@/lib/messaging/send-notification'

// Staff sends announcement
await sendStaffMessage({
  title: '🎊 Double Beans Weekend!',
  message: 'Get double beans on all purchases this weekend!',
  staffId: staff.id,
  channels: {
    push: true,
    email: true,
    inApp: true
  },
  priority: 80, // High priority
  expiresInHours: 48 // Show for 2 days
})
```

---

## ✅ SUMMARY

### **Staff Messages:**
- ✅ Priority: **80** (high, shows above most notifications)
- ✅ Lifetime: **24 hours** (configurable)
- ✅ Storage: `notifications` table
- ✅ Expires: Automatically after 24 hours
- ✅ Shows to: **Everyone** (conditions: {})
- ✅ Dismissible: **Yes** (users can hide)
- ✅ Tracked: Yes (views, dismissals, clicks)

### **Automated Notifications:**
- ✅ Priority: **Varies** (0-100 based on type)
- ✅ Lifetime: **Varies** (some expire, some don't)
- ✅ Storage: `notifications` table
- ✅ Shows to: **Filtered by conditions**
- ✅ Tracked: Yes (all interactions logged)

### **Push Notifications:**
- ✅ Delivery: **Instant**
- ✅ Storage: `push_notifications_log` (tracking only)
- ✅ Lifetime: **User controls** (dismiss anytime)
- ✅ Tracked: Yes (sent, failed, clicked)

### **Emails:**
- ✅ Delivery: **Queued** (processed every 5 min)
- ✅ Storage: `email_queue` → `email_logs`
- ✅ Lifetime: **Permanent** (in user's inbox)
- ✅ Tracked: Yes (sent, failed)

---

**🎉 Everything is database-driven, tracked, and automatically managed!**
