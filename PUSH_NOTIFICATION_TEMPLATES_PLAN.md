# 🔔 PUSH NOTIFICATION TEMPLATES - COMPLETE PLAN

**Unified messaging system: In-app, Email, and Push notifications**

---

## 📊 CURRENT STATE

### What We Have:
- ✅ **In-app notifications** - `notifications` table (68 templates)
- ✅ **Email templates** - `email_templates` table (7 templates)
- ✅ **Push infrastructure** - `push_subscriptions`, `push_notifications_log`
- ❌ **Push templates** - NOT YET CREATED

### What We Need:
- 🎯 Push notification templates table
- 🎯 Unified messaging system
- 🎯 Staff messaging page (send via push + email)
- 🎯 Automated triggers for push notifications

---

## 🎯 PUSH NOTIFICATION USE CASES

### 1. **Automated Triggers** (System-sent)
- 🎮 Game completed → "You won 50 beans!"
- ☕ Coffee stamp earned → "1 more stamp to free coffee!"
- 🎁 Reward earned → "Your reward is ready!"
- ⏰ Reward expiring → "Use your reward in 2 hours!"
- 🔥 Streak at risk → "Don't break your 7-day streak!"
- 🎂 Birthday → "Happy Birthday! Here's a treat!"
- 💤 Win-back → "We miss you! Come back for 100 beans"
- 🎉 Milestone → "You've earned 1000 beans!"

### 2. **Staff-Sent Messages** (Manual)
- 📢 Announcements → "New menu items today!"
- 🎊 Promotions → "Double beans this weekend!"
- ⚠️ Important → "Closing early today"
- 🎁 Special offers → "Flash sale: 50% off rewards!"

### 3. **Scheduled Campaigns** (Automated)
- ⏰ Daily reminders → "Don't forget to check in!"
- 🌅 Morning greetings → "Good morning! Start your day right"
- 🌙 Evening prompts → "Evening coffee run?"

---

## 🗄️ DATABASE DESIGN

### Push Notification Templates Table

```sql
CREATE TABLE push_notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template info
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL, -- 'automated', 'manual', 'scheduled'
  
  -- Trigger conditions (for automated)
  trigger_event TEXT, -- 'game_won', 'reward_earned', 'streak_risk', etc.
  conditions JSONB DEFAULT '{}',
  
  -- Content
  url TEXT DEFAULT '/dashboard',
  icon TEXT DEFAULT '/icon-192.png',
  image TEXT,
  require_interaction BOOLEAN DEFAULT false,
  
  -- Scheduling (for scheduled campaigns)
  schedule_time TIME,
  schedule_days INTEGER[], -- [0,1,2,3,4,5,6] for days of week
  
  -- Settings
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  -- Metadata
  description TEXT,
  variables JSONB DEFAULT '[]', -- Available variables: {{name}}, {{beans}}, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📋 TEMPLATE CATEGORIES

### **1. Automated Triggers**
Templates that fire automatically based on events:

| Template Name | Trigger Event | Title | Message |
|--------------|---------------|-------|---------|
| `game_won` | After game completion | 🎮 You Won! | You earned {{beans}} beans! Keep playing! |
| `coffee_stamp_earned` | After coffee purchase | ☕ Stamp Added! | {{stampsRemaining}} more for a free coffee! |
| `reward_earned` | Reward unlocked | 🎁 Reward Unlocked! | Your {{rewardName}} is ready to use! |
| `reward_expiring_soon` | 24hrs before expiry | ⏰ Expiring Soon! | Use your {{rewardName}} before it expires! |
| `reward_expiring_urgent` | 2hrs before expiry | 🚨 Last Chance! | Your reward expires in 2 hours! |
| `streak_at_risk` | Midnight if no check-in | 🔥 Streak Alert! | Don't break your {{currentStreak}}-day streak! |
| `birthday` | User's birthday | 🎂 Happy Birthday! | Enjoy your special birthday treat! |
| `milestone_reached` | Points milestone | 🎉 Milestone! | You've earned {{totalBeans}} beans! |
| `win_back` | 30 days inactive | 💤 We Miss You! | Come back for 100 bonus beans! |

### **2. Staff Messages**
Templates staff can customize and send:

| Template Name | Category | Default Title | Default Message |
|--------------|----------|---------------|-----------------|
| `staff_announcement` | Announcement | 📢 Announcement | [Staff customizes] |
| `staff_promotion` | Promotion | 🎊 Special Offer | [Staff customizes] |
| `staff_important` | Important | ⚠️ Important Update | [Staff customizes] |
| `staff_reminder` | Reminder | 🔔 Reminder | [Staff customizes] |
| `staff_event` | Event | 🎉 Event | [Staff customizes] |

### **3. Scheduled Campaigns**
Automated messages sent at specific times:

| Template Name | Schedule | Title | Message |
|--------------|----------|-------|---------|
| `daily_checkin_reminder` | 9:00 AM daily | ☀️ Good Morning! | Don't forget to check in today! |
| `lunchtime_prompt` | 12:00 PM daily | ☕ Lunchtime? | Perfect time for a coffee break! |
| `evening_reminder` | 5:00 PM daily | 🌙 Evening Visit? | End your day with a treat! |
| `weekend_special` | 10:00 AM Sat/Sun | 🎊 Weekend Vibes | Double beans on weekends! |

---

## 🔄 UNIFIED MESSAGING FLOW

### When Staff Sends a Message:

```
Staff Message Form
    ↓
Select Channels: [✓ Push] [✓ Email] [✓ In-app]
    ↓
    ├─→ Push: Send to all subscribed users
    ├─→ Email: Queue in email_queue
    └─→ In-app: Create notification in notifications table
```

### When System Triggers:

```
Event Occurs (e.g., game won)
    ↓
Check push_notification_templates
    ↓
Match trigger_event + conditions
    ↓
    ├─→ Send push (if user subscribed)
    ├─→ Queue email (if template exists)
    └─→ Show in-app notification
```

---

## 🎨 STAFF MESSAGING PAGE DESIGN

### `/staff/messages` Features:

1. **Quick Send**
   - Pre-made templates
   - Customize title/message
   - Select channels (push/email/in-app)
   - Preview before send
   - Send to: All customers / Specific segment

2. **Template Library**
   - Browse all templates
   - Edit existing
   - Create new
   - Test send

3. **Scheduled Messages**
   - Schedule for later
   - Recurring messages
   - Campaign calendar

4. **Message History**
   - Sent messages log
   - Delivery stats
   - Click-through rates

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Database Setup ✅ (Do First)
- [ ] Create `push_notification_templates` table
- [ ] Insert default templates
- [ ] Create helper functions

### Phase 2: Template Management UI
- [ ] Admin page: `/admin/push-templates`
- [ ] CRUD operations for templates
- [ ] Template preview
- [ ] Variable testing

### Phase 3: Unified Staff Messaging
- [ ] Upgrade `/staff/messages` page
- [ ] Multi-channel selector
- [ ] Template picker
- [ ] Send to segments (all/active/inactive)
- [ ] Preview all channels

### Phase 4: Automated Triggers
- [ ] Hook into existing events
- [ ] Match templates to triggers
- [ ] Send push + email + in-app
- [ ] Log all sends

### Phase 5: Scheduled Campaigns
- [ ] Cron job for scheduled pushes
- [ ] Daily/weekly campaigns
- [ ] Time-based targeting

---

## 📝 TEMPLATE VARIABLES

### Available Variables:
- `{{name}}` - User's name
- `{{beans}}` - Beans earned/total
- `{{currentStreak}}` - Current check-in streak
- `{{stampsRemaining}}` - Stamps until free coffee
- `{{rewardName}}` - Name of reward
- `{{expiryTime}}` - Time until expiry
- `{{totalBeans}}` - Total beans earned
- `{{appUrl}}` - App URL

### Example:
```json
{
  "title": "🎮 You Won!",
  "message": "Congratulations {{name}}! You earned {{beans}} beans!",
  "url": "/dashboard",
  "variables": ["name", "beans"]
}
```

---

## 🎯 PRIORITY SYSTEM

### Push Notification Priority:
1. **Urgent** (priority: 100) - Reward expiring in 2 hours
2. **High** (priority: 75) - Reward earned, Game won
3. **Medium** (priority: 50) - Streak at risk, Birthday
4. **Low** (priority: 25) - Daily reminders, Promotions
5. **Info** (priority: 0) - General announcements

### Rules:
- Only send 1 push per user per hour (unless urgent)
- Respect quiet hours (10pm - 8am)
- Don't send if user disabled push
- Batch similar notifications

---

## 📊 ANALYTICS & TRACKING

### Metrics to Track:
- **Delivery Rate** - % successfully delivered
- **Click-through Rate** - % clicked
- **Conversion Rate** - % completed action
- **Opt-out Rate** - % unsubscribed
- **Best Times** - When users engage most

### Dashboard:
```
Push Notifications Dashboard
├─ Total Sent: 1,234
├─ Delivered: 1,200 (97%)
├─ Clicked: 450 (37%)
├─ Converted: 120 (10%)
└─ Active Subscriptions: 456
```

---

## 🚀 NEXT STEPS

### Immediate (Today):
1. Create migration for `push_notification_templates`
2. Insert default templates
3. Test template system

### Short-term (This Week):
1. Build admin UI for templates
2. Upgrade staff messaging page
3. Add multi-channel support

### Long-term (Next Week):
1. Hook up automated triggers
2. Add scheduled campaigns
3. Build analytics dashboard

---

## 💡 EXAMPLE WORKFLOWS

### Workflow 1: Staff Sends Promotion
```
1. Staff goes to /staff/messages
2. Selects "Promotion" template
3. Edits: "🎊 Double Beans Weekend!"
4. Selects channels: [✓ Push] [✓ Email]
5. Preview both
6. Click "Send to All Customers"
7. System:
   - Sends push to 456 subscribed users
   - Queues 1,234 emails
   - Shows success: "Sent to 456 devices, 1,234 emails queued"
```

### Workflow 2: User Wins Game
```
1. User completes game, earns 50 beans
2. System checks push_notification_templates
3. Finds template: trigger_event = 'game_won'
4. Substitutes variables: {{beans}} = 50
5. Sends:
   - Push: "🎮 You Won! You earned 50 beans!"
   - In-app: Shows notification banner
   - Email: (if template exists)
6. Logs to push_notifications_log
```

---

**Ready to implement? Let's start with the migration!** 🚀
