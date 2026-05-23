# 🏗️ MESSAGING SYSTEM ARCHITECTURE
**Visual guide to current vs proposed architecture**

---

## 📊 CURRENT ARCHITECTURE (BEFORE)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DASHBOARD                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION BANNER COMPONENT                  │
│                                                                   │
│  ┌─────────────────┐                  ┌────────────────────┐   │
│  │  Fetch from DB  │ ───Error?───▶    │  HARDCODED LOGIC   │   │
│  │  /api/notif...  │                  │  (285 lines!)      │   │
│  └─────────────────┘                  └────────────────────┘   │
│         │                                       │                │
│         │ Success                               │                │
│         ▼                                       ▼                │
│  ┌─────────────────┐                  ┌────────────────────┐   │
│  │ Show Database   │                  │ Show Hardcoded     │   │
│  │ Notification    │                  │ Fallback Message   │   │
│  └─────────────────┘                  └────────────────────┘   │
│         ✅                                      ❌               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ❌ CANNOT UPDATE WITHOUT DEPLOY
```

### Problems:
- **Dual source of truth** (database vs hardcoded)
- **Fallback triggers too easily** (any error = hardcoded)
- **Cannot update messages** without code deployment
- **No analytics** on hardcoded messages
- **Inconsistent behavior** between database and fallback

---

## 🚀 PROPOSED ARCHITECTURE (AFTER QUICK WIN)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DASHBOARD                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION BANNER COMPONENT                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  1. Calculate user state (streak, points, expiry, etc.)     ││
│  │  2. Send to /api/notifications/get-for-user                 ││
│  │  3. API matches conditions against database                 ││
│  │  4. Returns top 3 matching notifications                    ││
│  │  5. Rotate through notifications every 10 seconds           ││
│  │  6. Substitute variables ({{currentStreak}} → "7")          ││
│  │  7. Track views/clicks/dismissals                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────┐                                            │
│  │  Show Database  │  ◀── ONLY SOURCE                           │
│  │  Notification   │                                             │
│  └─────────────────┘                                            │
│         ✅                                                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ✅ UPDATE VIA ADMIN UI - NO DEPLOY NEEDED
```

### Benefits:
- **Single source of truth** (database only)
- **Admin-controlled** (update via UI)
- **Full analytics** (track everything)
- **Consistent behavior** (same logic everywhere)
- **A/B testing ready** (test different messages)

---

## 🎯 UNIFIED MESSAGING ARCHITECTURE (FUTURE)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN INTERFACE                           │
│                     /admin/messages                              │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Create      │  │  Schedule    │  │  Analytics   │          │
│  │  Campaign    │  │  Delivery    │  │  Dashboard   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UNIFIED MESSAGE TABLE                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Message: "Reward Expiring Soon"                         │  │
│  │  ├─ In-App: "⏰ Expires Tomorrow!"                       │  │
│  │  ├─ Email: Subject + HTML template                       │  │
│  │  ├─ Push: "Don't forget your free coffee!"              │  │
│  │  ├─ Conditions: hasUnredeemedRewards + daysUntil = 1    │  │
│  │  └─ Channels: [in-app, email, push]                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
         ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
         │   IN-APP    │ │    EMAIL    │ │    PUSH     │
         │ NOTIFICATION│ │    QUEUE    │ │   SERVICE   │
         └─────────────┘ └─────────────┘ └─────────────┘
                    │            │            │
                    └────────────┼────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   ANALYTICS TRACKING    │
                    │  - Delivery rate        │
                    │  - Open rate            │
                    │  - Click rate           │
                    │  - Conversion rate      │
                    └─────────────────────────┘
```

### Features:
- **One message, multiple channels** (write once, send everywhere)
- **Unified analytics** (compare channel performance)
- **Cross-channel campaigns** (coordinate timing)
- **A/B testing** (test variants across channels)
- **Scheduling** (send at optimal times)

---

## 📋 DATABASE SCHEMA EVOLUTION

### Current (Notifications Only)

```
notifications
├── id
├── type (reward, streak, checkin, etc.)
├── priority
├── title
├── message
├── icon
├── conditions (JSONB)
├── variant
├── dismissible
├── active
└── created_at

notification_dismissals
├── id
├── user_id
├── notification_id
└── dismissed_at
```

### After Email Migration

```
notifications (same as before)

email_templates ✅ (EXISTS, NOT USED)
├── id
├── name
├── subject
├── html_body
├── variables (JSONB)
├── category
└── active

email_queue ✅ (EXISTS, USED)
├── id
├── template_id
├── recipient_email
├── status
├── scheduled_for
└── sent_at
```

### After Push Notifications

```
(All previous tables)

push_subscriptions (NEW)
├── id
├── user_id
├── endpoint
├── p256dh
├── auth
├── active
└── created_at
```

### After Unified System

```
messages (NEW - replaces notifications)
├── id
├── name
├── display_name
├── category
├── channels (ARRAY: in-app, email, push)
│
├── in_app_title
├── in_app_message
├── in_app_icon
├── in_app_variant
│
├── email_subject
├── email_template_id
│
├── push_title
├── push_message
├── push_url
│
├── conditions (JSONB)
├── priority
├── active
└── created_at

message_analytics (NEW)
├── id
├── message_id
├── user_id
├── channel
├── delivered_at
├── viewed_at
├── clicked_at
├── dismissed_at
└── converted_at
```

---

## 🔄 MESSAGE FLOW COMPARISON

### Current Flow (Hardcoded)

```
1. User loads dashboard
2. Component calculates user state
3. Component calls getNotification() function
4. Function has 285 lines of if/else logic
5. Returns hardcoded message
6. Component displays message
7. ❌ No tracking, no updates possible
```

### New Flow (Database-Driven)

```
1. User loads dashboard
2. Component calculates user state
3. Component calls /api/notifications/get-for-user
4. API queries database with conditions
5. Database returns matching notifications
6. API filters and prioritizes
7. Component receives top 3 notifications
8. Component rotates through them
9. Component substitutes variables
10. Component displays message
11. ✅ Tracks view/click/dismiss
12. ✅ Admin can update anytime
```

### Future Flow (Unified Multi-Channel)

```
1. Admin creates campaign in UI
2. Sets message for each channel
3. Sets conditions and schedule
4. Saves to unified messages table

When triggered:
5. System evaluates conditions
6. Matches eligible users
7. Queues for each channel:
   ├─ In-app: Show immediately
   ├─ Email: Queue for sending
   └─ Push: Send to devices
8. Tracks delivery across all channels
9. Aggregates analytics
10. ✅ A/B test variants
11. ✅ Optimize based on performance
```

---

## 🎯 CONDITION MATCHING LOGIC

### Current (Limited)

```typescript
// Simple JSONB matching
WHERE conditions @> userState

// Example:
conditions: {"hasUnredeemedRewards": true}
userState: {"hasUnredeemedRewards": true}
// ✅ Match!
```

### After Enhancement

```typescript
// Advanced matching with operators
{
  "hasUnredeemedRewards": true,
  "daysUntilExpiry": {"equals": 1},
  "currentStreak": {"min": 7, "max": 30},
  "timeOfDay": "morning",
  "stampsUntilReward": {"lte": 3}
}

// Supports:
// - Equality: {"key": value}
// - Min/Max: {"key": {"min": 5, "max": 10}}
// - Comparison: {"key": {"lte": 3, "gte": 1}}
// - Time-based: {"timeOfDay": "morning"}
// - Weather: {"weather": "rainy"}
```

---

## 📊 ANALYTICS ARCHITECTURE

### Current (Basic)

```
notification_views
├── notification_id
├── user_id
├── viewed_at
└── session_id

notification_actions
├── notification_id
├── user_id
├── action_type (click, dismiss)
└── created_at
```

### Future (Comprehensive)

```
message_analytics
├── message_id
├── user_id
├── channel (in-app, email, push)
├── variant_id (for A/B testing)
│
├── delivered_at
├── viewed_at (email open, push shown)
├── clicked_at (link click, notification tap)
├── dismissed_at (closed, unsubscribed)
├── converted_at (desired action taken)
│
├── user_agent
├── session_id
└── metadata (JSONB)

Aggregated Metrics:
├── Delivery Rate = delivered / sent
├── Open Rate = viewed / delivered
├── Click Rate = clicked / viewed
├── Conversion Rate = converted / clicked
└── Channel Performance = compare across channels
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Current

```
Code Deploy Required For:
├── ❌ Notification messages (hardcoded)
├── ❌ Email templates (hardcoded)
├── ❌ Message logic (hardcoded)
└── ❌ Any message changes

Database Changes For:
├── ✅ Notification settings (priority, active)
└── ✅ User preferences
```

### After Quick Win

```
Code Deploy Required For:
├── ✅ New features only
└── ✅ Bug fixes only

Database Changes For:
├── ✅ All notification messages
├── ✅ Notification conditions
├── ✅ Priority changes
├── ✅ Scheduling
└── ✅ Targeting rules

Admin UI Changes For:
├── ✅ Message content
├── ✅ Message activation
├── ✅ Message scheduling
└── ✅ Everything else!
```

### After Full Implementation

```
Admin UI Controls:
├── ✅ All notification messages
├── ✅ All email templates
├── ✅ All push notifications
├── ✅ Multi-channel campaigns
├── ✅ Scheduling
├── ✅ A/B testing
├── ✅ Analytics
└── ✅ Everything!

Zero Code Deploys Needed! 🎉
```

---

## 📈 SCALABILITY

### Current Limitations

```
Hardcoded Messages:
├── ❌ Cannot scale to 100+ messages
├── ❌ Cannot personalize per user
├── ❌ Cannot A/B test
├── ❌ Cannot schedule
└── ❌ Cannot analyze performance
```

### After Implementation

```
Database-Driven:
├── ✅ Unlimited messages
├── ✅ Per-user personalization
├── ✅ A/B testing at scale
├── ✅ Advanced scheduling
├── ✅ Real-time analytics
├── ✅ Multi-channel coordination
└── ✅ Automated campaigns
```

---

## 🎯 SUMMARY

**Current:** Hardcoded → Limited → Cannot scale  
**After Quick Win:** Database → Flexible → Can scale  
**After Full Plan:** Unified → Enterprise-grade → Unlimited scale

**Start with Quick Win, evolve to full system as needed.**

---

**See other documents for implementation details.**
