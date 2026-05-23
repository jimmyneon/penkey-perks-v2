# 🚀 UNIFIED MESSAGING SYSTEM - IMPLEMENTATION PLAN
**Date:** October 11, 2025  
**Goal:** Server-driven, foolproof messaging across all channels

---

## 🎯 VISION

**One unified system to manage ALL customer communications:**
- ✅ In-app notifications
- ✅ Email campaigns
- ✅ Push notifications
- ✅ SMS (future)

**Key Principles:**
1. **100% Server-Driven** - No hardcoded messages
2. **Admin-Controlled** - Non-technical users can manage
3. **Multi-Channel** - Send same message across channels
4. **Analytics-First** - Track everything
5. **Foolproof** - Cannot break, graceful degradation

---

## 📋 PHASE 1: ELIMINATE HARDCODED MESSAGES (2-3 days)

### Step 1.1: Migrate Hardcoded Notifications to Database

**Current Problem:** 285 lines of hardcoded fallback in `notification-banner.tsx`

**Action Items:**

1. **Create Migration Script** (`scripts/migrate-notifications.ts`)
   - Parse hardcoded messages
   - Generate INSERT statements
   - Map conditions to JSONB

2. **Database Notifications to Create:**

```sql
-- Reward Expiry: Critical (< 3 hours)
INSERT INTO notifications (type, priority, title, message, icon, conditions, variant, dismissible)
VALUES (
  'reward', 1,
  '🚨 LAST CHANCE!',
  'Only {{hoursUntilExpiry}} hours left! Your free coffee expires VERY soon! Rush in NOW! 🏃‍♀️💨',
  '🎁',
  '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"max": 3}}',
  'streak', false
);

-- Reward Expiry: Urgent (4-12 hours)
INSERT INTO notifications (type, priority, title, message, icon, conditions, variant, dismissible)
VALUES (
  'reward', 2,
  '⚠️ EXPIRING TODAY!',
  'Your free coffee expires in {{hoursUntilExpiry}} hours! Come redeem it today or lose it! 🏃‍♀️',
  '🎁',
  '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"min": 4, "max": 12}}',
  'streak', false
);

-- Continue for all 20+ message variants...
```

3. **Update Conditions Engine**
   - Add support for `hoursUntilExpiry` calculation
   - Add `timeOfDay` matching (morning/afternoon/evening)
   - Add `dayOfWeek` rotation logic
   - Add comparison operators (min, max, equals)

4. **Remove Fallback Function**
   - Delete `getNotification()` function (lines 288-573)
   - Keep minimal error fallback:
   ```typescript
   if (!notification) {
     return null // Show nothing instead of hardcoded message
   }
   ```

**Files to Modify:**
- `components/dashboard/notification-banner.tsx` (remove fallback)
- `app/api/notifications/get-for-user/route.ts` (enhance conditions)
- `supabase/migrations/20251011_migrate_notifications.sql` (new)

---

### Step 1.2: Enhance Conditions Engine

**Current:** Basic JSONB matching  
**Needed:** Advanced condition evaluation

**New Condition Types:**

```typescript
// Numeric comparisons
{ "currentStreak": { "min": 7, "max": 30 } }
{ "hoursUntilExpiry": { "equals": 24 } }
{ "stampsUntilReward": { "lte": 3 } }

// Boolean checks
{ "hasCheckedInToday": false }
{ "hasUnredeemedRewards": true }

// Time-based
{ "timeOfDay": "morning" }  // 5am-12pm
{ "dayOfWeek": [1, 2, 3, 4, 5] }  // Mon-Fri

// Weather-based (already exists)
{ "weather": "rainy" }
{ "temperature": { "max": 10 } }

// Combined (AND logic)
{
  "hasCheckedInToday": true,
  "hasCoffeeStampToday": false,
  "timeOfDay": "afternoon"
}
```

**Implementation:**

```typescript
// File: lib/notification-matcher.ts
export function matchesConditions(
  conditions: Record<string, any>,
  userState: Record<string, any>
): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    if (!matchCondition(key, value, userState)) {
      return false
    }
  }
  return true
}

function matchCondition(key: string, condition: any, state: any): boolean {
  const stateValue = state[key]
  
  // Direct equality
  if (typeof condition !== 'object') {
    return stateValue === condition
  }
  
  // Numeric comparisons
  if ('min' in condition && stateValue < condition.min) return false
  if ('max' in condition && stateValue > condition.max) return false
  if ('equals' in condition && stateValue !== condition.equals) return false
  if ('lte' in condition && stateValue > condition.lte) return false
  if ('gte' in condition && stateValue < condition.gte) return false
  
  return true
}
```

---

## 📋 PHASE 2: EMAIL TEMPLATES TO DATABASE (1-2 days)

### Step 2.1: Migrate Email Templates

**Current:** Hardcoded in `lib/email/templates.tsx`  
**Target:** Use `email_templates` table

**Migration Steps:**

1. **Insert Templates into Database:**

```sql
-- Welcome Email
INSERT INTO email_templates (name, display_name, subject, html_body, variables, category)
VALUES (
  'welcome_email',
  'Welcome Email',
  'Welcome to Penkey Perks, {{name}}! 🦆',
  '<!DOCTYPE html>...',  -- Full HTML from templates.tsx
  '["name", "referralUrl"]',
  'transactional'
);

-- Reward Earned
INSERT INTO email_templates (name, display_name, subject, html_body, variables, category)
VALUES (
  'reward_earned',
  'Reward Earned Email',
  'You Earned a Reward! 🎁',
  '<!DOCTYPE html>...',
  '["name", "rewardName", "rewardValue", "expiryDays"]',
  'notification'
);

-- Continue for all templates...
```

2. **Update Email Sending Code:**

```typescript
// BEFORE (hardcoded):
import { WelcomeEmail } from '@/lib/email/templates'
const html = WelcomeEmail({ name, referralUrl })
await sendEmail({ to, subject: 'Welcome!', html })

// AFTER (database-driven):
await queue_email_from_template(
  'welcome_email',
  email,
  userId,
  { name, referralUrl }
)
```

3. **Create Admin UI:**
   - `/admin/emails` - List all templates
   - `/admin/emails/create` - Create new template
   - `/admin/emails/edit/[id]` - Edit template
   - Preview with test data
   - Variable documentation

---

### Step 2.2: Email Template Admin UI

**Components to Create:**

```typescript
// app/admin/emails/page.tsx
export default function EmailTemplatesPage() {
  // List all templates
  // Filter by category
  // Quick actions (edit, preview, duplicate)
}

// app/admin/emails/edit/[id]/page.tsx
export default function EditEmailTemplate() {
  // Rich text editor for HTML
  // Variable picker
  // Live preview
  // Test send functionality
}

// components/admin/email-template-editor.tsx
export function EmailTemplateEditor() {
  // Monaco editor for HTML
  // Variable autocomplete
  // Preview pane
  // Mobile/desktop preview toggle
}
```

---

## 📋 PHASE 3: PUSH NOTIFICATIONS (3-5 days)

### Step 3.1: Web Push Infrastructure

**Components Needed:**

1. **Service Worker** (`public/sw.js`)
2. **Push Subscription Table**
3. **Push Sending Service**
4. **Permission Flow**

**Database Schema:**

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  
  UNIQUE(endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active) WHERE active = true;
```

---

### Step 3.2: Service Worker Implementation

**File:** `public/sw.js`

```javascript
self.addEventListener('push', function(event) {
  const data = event.data.json()
  
  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.url || '/dashboard',
      notificationId: data.id
    },
    actions: data.actions || []
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
```

---

### Step 3.3: Push Subscription Flow

**Component:** `components/push-notification-prompt.tsx`

```typescript
'use client'

export function PushNotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  
  const requestPermission = async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
    
    if (result === 'granted') {
      await subscribeToPush()
    }
  }
  
  const subscribeToPush = async () => {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    })
    
    // Save to database
    await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription)
    })
  }
  
  // Show prompt UI...
}
```

---

### Step 3.4: Push Sending Service

**API:** `/api/push/send`

```typescript
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:nfdrepairs@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(
  userId: string,
  notification: {
    title: string
    message: string
    url?: string
  }
) {
  // Get user's subscriptions
  const subscriptions = await getActiveSubscriptions(userId)
  
  const payload = JSON.stringify(notification)
  
  // Send to all devices
  await Promise.all(
    subscriptions.map(sub =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        payload
      ).catch(err => {
        // Handle expired subscriptions
        if (err.statusCode === 410) {
          markSubscriptionInactive(sub.id)
        }
      })
    )
  )
}
```

---

## 📋 PHASE 4: UNIFIED MESSAGE MANAGEMENT (5-7 days)

### Step 4.1: Unified Message Schema

**New Table:** `messages` (replaces/extends notifications)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Message details
  name TEXT NOT NULL UNIQUE,  -- Internal reference
  display_name TEXT NOT NULL,  -- Admin UI display
  type TEXT NOT NULL,  -- 'notification', 'email', 'push', 'sms'
  category TEXT NOT NULL,  -- 'reward', 'streak', 'engagement', etc.
  
  -- Multi-channel content
  in_app_title TEXT,
  in_app_message TEXT,
  in_app_icon TEXT,
  in_app_variant TEXT DEFAULT 'default',
  
  email_subject TEXT,
  email_template_id UUID REFERENCES email_templates(id),
  
  push_title TEXT,
  push_message TEXT,
  push_url TEXT,
  
  -- Delivery settings
  channels TEXT[] DEFAULT ARRAY['in_app'],  -- Which channels to use
  priority INTEGER DEFAULT 10,
  
  -- Conditions (same as before)
  conditions JSONB DEFAULT '{}',
  
  -- Scheduling
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

---

### Step 4.2: Campaign Builder UI

**Component:** `components/admin/campaign-builder.tsx`

Features:
- **Multi-channel selection** (checkboxes for in-app, email, push)
- **Channel-specific content** (different message per channel)
- **Condition builder** (visual UI for conditions)
- **Preview** (see how it looks on each channel)
- **Scheduling** (start/end dates, recurring)
- **A/B testing** (create variants)

---

### Step 4.3: Unified Sending Service

**Function:** `lib/messaging/send-message.ts`

```typescript
export async function sendMessage(
  messageId: string,
  userId: string,
  userState: Record<string, any>
) {
  const message = await getMessage(messageId)
  
  if (!matchesConditions(message.conditions, userState)) {
    return { sent: false, reason: 'conditions_not_met' }
  }
  
  const results = {
    inApp: false,
    email: false,
    push: false
  }
  
  // Send to each enabled channel
  if (message.channels.includes('in_app')) {
    results.inApp = await sendInAppNotification(message, userId)
  }
  
  if (message.channels.includes('email')) {
    results.email = await sendEmailNotification(message, userId)
  }
  
  if (message.channels.includes('push')) {
    results.push = await sendPushNotification(message, userId)
  }
  
  // Log delivery
  await logMessageDelivery(messageId, userId, results)
  
  return results
}
```

---

## 📋 PHASE 5: ANALYTICS & OPTIMIZATION (3-5 days)

### Step 5.1: Unified Analytics Dashboard

**Page:** `/admin/analytics/messages`

**Metrics to Track:**
- **Delivery Rate** (sent vs failed per channel)
- **Open Rate** (email opens, push clicks)
- **Click Rate** (in-app actions, email links)
- **Dismiss Rate** (how often dismissed)
- **Conversion Rate** (desired action taken)
- **Channel Performance** (which channel works best)

**Database Tables:**

```sql
CREATE TABLE message_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id),
  user_id UUID NOT NULL REFERENCES users(id),
  channel TEXT NOT NULL,  -- 'in_app', 'email', 'push'
  
  -- Events
  delivered_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- Metadata
  user_agent TEXT,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_message_analytics_message ON message_analytics(message_id);
CREATE INDEX idx_message_analytics_user ON message_analytics(user_id);
CREATE INDEX idx_message_analytics_channel ON message_analytics(channel);
```

---

### Step 5.2: A/B Testing Framework

**Feature:** Test different message variants

**Schema:**

```sql
CREATE TABLE message_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id),
  variant_name TEXT NOT NULL,  -- 'A', 'B', 'C'
  
  -- Variant content (overrides base message)
  in_app_title TEXT,
  in_app_message TEXT,
  email_subject TEXT,
  
  -- Distribution
  traffic_percentage INTEGER DEFAULT 50,  -- % of users to show this
  
  -- Results
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Usage:**
1. Create message with variants
2. System randomly assigns users to variants
3. Track performance per variant
4. Promote winning variant to 100%

---

## 📋 IMPLEMENTATION TIMELINE

### Week 1: Foundation
- ✅ Day 1-2: Migrate hardcoded notifications to database
- ✅ Day 3: Enhance conditions engine
- ✅ Day 4-5: Migrate email templates to database

### Week 2: Push Notifications
- ✅ Day 1-2: Service worker + subscription flow
- ✅ Day 3-4: Push sending infrastructure
- ✅ Day 5: Testing + debugging

### Week 3: Unified System
- ✅ Day 1-2: Unified message schema
- ✅ Day 3-4: Campaign builder UI
- ✅ Day 5: Multi-channel sending

### Week 4: Analytics & Polish
- ✅ Day 1-2: Analytics dashboard
- ✅ Day 3-4: A/B testing framework
- ✅ Day 5: Documentation + training

---

## 🎯 SUCCESS CRITERIA

### Must Have:
- ✅ Zero hardcoded messages in code
- ✅ All messages manageable via admin UI
- ✅ Push notifications working
- ✅ Email templates in database
- ✅ Multi-channel message delivery

### Should Have:
- ✅ Unified analytics dashboard
- ✅ A/B testing capability
- ✅ Message scheduling
- ✅ Preview functionality

### Nice to Have:
- ✅ SMS integration
- ✅ WhatsApp integration
- ✅ Advanced segmentation
- ✅ Automated campaigns

---

## 📚 NEXT STEPS

1. **Review this plan** with team
2. **Prioritize phases** based on business needs
3. **Start with Phase 1** (eliminate hardcoded messages)
4. **Test thoroughly** before moving to next phase
5. **Document everything** for future maintenance

---

**Questions? See `MESSAGING_SYSTEM_AUDIT.md` for detailed analysis.**
