# 📧 Database-Driven Email System Plan

## Current State Analysis

### ✅ What Exists
- **Email Templates** (`lib/email/templates.tsx`):
  - `WelcomeEmail` - Signup confirmation with referral link
  - `RewardEarnedEmail` - Reward issued notification with QR code
  - `RewardExpiringEmail` - Expiry reminder
  - `ReferralConfirmedEmail` - Referral bonus notification
  
- **Email Sender** (`lib/email/send.ts`):
  - Resend API integration
  - Basic error handling
  - Reply-to support

- **Notification System** (Database):
  - `notifications` table - In-app banner notifications
  - `notification_dismissals` table - User dismissal tracking
  - Condition-based matching system

### ❌ What's Missing
- **No email templates in database** - Templates are hardcoded in code
- **No email queue/logs** - Can't track sent emails or audit
- **No automated triggers** - Emails must be manually sent from code
- **No email preferences** - Users can't opt out of certain emails
- **No QR code generation in DB** - QR codes created ad-hoc
- **No email scheduling** - Can't schedule reminder emails
- **No template versioning** - Can't A/B test or update templates

---

## 🎯 Proposed Database Schema

### 1. `email_templates` Table
Stores reusable email templates with dynamic variables.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Template identifier (e.g., 'welcome_email') |
| `subject` | TEXT | Email subject line (supports variables) |
| `html_body` | TEXT | HTML email body (supports variables) |
| `text_body` | TEXT | Plain text fallback |
| `variables` | JSONB | Required variables (e.g., `["name", "referralUrl"]`) |
| `category` | TEXT | 'transactional', 'marketing', 'notification' |
| `active` | BOOLEAN | Whether template is enabled |
| `version` | INTEGER | Template version for A/B testing |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### 2. `email_triggers` Table
Defines when emails should be automatically sent.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Trigger name (e.g., 'user_signup') |
| `template_id` | UUID | FK to email_templates |
| `event_type` | TEXT | Database event ('insert', 'update', 'delete') |
| `table_name` | TEXT | Table to watch (e.g., 'users', 'user_rewards') |
| `conditions` | JSONB | Conditions to check before sending |
| `delay_minutes` | INTEGER | Delay before sending (0 = immediate) |
| `active` | BOOLEAN | Whether trigger is enabled |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### 3. `email_queue` Table
Queues emails to be sent (for reliability and retry logic).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `template_id` | UUID | FK to email_templates |
| `trigger_id` | UUID | FK to email_triggers (nullable) |
| `recipient_email` | TEXT | Email address |
| `recipient_user_id` | UUID | FK to users (nullable) |
| `subject` | TEXT | Rendered subject |
| `html_body` | TEXT | Rendered HTML body |
| `variables` | JSONB | Template variables used |
| `status` | TEXT | 'pending', 'sent', 'failed', 'cancelled' |
| `scheduled_for` | TIMESTAMPTZ | When to send |
| `sent_at` | TIMESTAMPTZ | When actually sent |
| `error_message` | TEXT | Error if failed |
| `retry_count` | INTEGER | Number of retry attempts |
| `created_at` | TIMESTAMPTZ | Queue timestamp |

### 4. `email_logs` Table
Audit log of all sent emails.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `queue_id` | UUID | FK to email_queue |
| `template_id` | UUID | FK to email_templates |
| `recipient_email` | TEXT | Email address |
| `recipient_user_id` | UUID | FK to users (nullable) |
| `subject` | TEXT | Email subject |
| `status` | TEXT | 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed' |
| `resend_id` | TEXT | Resend API email ID |
| `metadata` | JSONB | Additional tracking data |
| `sent_at` | TIMESTAMPTZ | Send timestamp |
| `created_at` | TIMESTAMPTZ | Log timestamp |

### 5. `email_preferences` Table
User email notification preferences.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `category` | TEXT | Email category |
| `enabled` | BOOLEAN | Whether user wants these emails |
| `updated_at` | TIMESTAMPTZ | Last preference change |

---

## 📋 Email Templates to Create

### Transactional Emails (Always Sent)
1. **Welcome Email** (`welcome_email`)
   - Trigger: User signup
   - Variables: `name`, `referralUrl`
   - Includes: How to use the app, referral link

2. **Reward Earned** (`reward_earned`)
   - Trigger: `user_rewards` insert
   - Variables: `name`, `rewardName`, `rewardValue`, `qrCode`, `expiryDays`
   - Includes: QR code, expiry date, redemption instructions

3. **Reward Redeemed** (`reward_redeemed`)
   - Trigger: `user_rewards` status = 'redeemed'
   - Variables: `name`, `rewardName`, `redeemedAt`
   - Includes: Confirmation, encourage next visit

4. **Referral Confirmed** (`referral_confirmed`)
   - Trigger: `referrals` confirmed = true
   - Variables: `name`, `refereeName`, `ducksEarned`
   - Includes: Bonus ducks awarded, share link again

### Marketing/Reminder Emails (Opt-out Available)
5. **Reward Expiring Soon** (`reward_expiring`)
   - Trigger: Scheduled job (daily check)
   - Condition: Reward expires in 3 days
   - Variables: `name`, `rewardName`, `daysLeft`, `qrCode`

6. **Inactive User** (`inactive_user`)
   - Trigger: Scheduled job (weekly)
   - Condition: No check-in for 7 days
   - Variables: `name`, `lastVisit`, `ducksBalance`

7. **Milestone Reached** (`milestone_reached`)
   - Trigger: Points milestone (50, 100, 250, 500)
   - Variables: `name`, `milestone`, `totalPoints`

8. **Birthday Reward** (`birthday_reward`)
   - Trigger: Scheduled job (daily)
   - Condition: User's birthday
   - Variables: `name`, `birthdayReward`

9. **Weekly Summary** (`weekly_summary`)
   - Trigger: Scheduled job (weekly)
   - Variables: `name`, `weeklyPoints`, `totalPoints`, `rank`

---

## 🔧 Database Functions Needed

### 1. `send_email_from_template()`
```sql
CREATE FUNCTION send_email_from_template(
  p_template_name TEXT,
  p_recipient_email TEXT,
  p_recipient_user_id UUID,
  p_variables JSONB,
  p_delay_minutes INTEGER DEFAULT 0
) RETURNS UUID
```
- Validates template exists and is active
- Renders template with variables
- Queues email for sending
- Returns queue_id

### 2. `process_email_queue()`
```sql
CREATE FUNCTION process_email_queue(
  p_batch_size INTEGER DEFAULT 10
) RETURNS TABLE(queue_id UUID, status TEXT, error TEXT)
```
- Fetches pending emails from queue
- Calls external API (via pg_net or webhook)
- Updates queue status
- Logs results

### 3. `check_email_triggers()`
```sql
CREATE FUNCTION check_email_triggers(
  p_table_name TEXT,
  p_event_type TEXT,
  p_record JSONB
) RETURNS VOID
```
- Called by database triggers
- Checks if any email triggers match
- Evaluates conditions
- Queues emails if conditions met

### 4. `schedule_reminder_emails()`
```sql
CREATE FUNCTION schedule_reminder_emails() RETURNS VOID
```
- Runs daily via cron job
- Checks for expiring rewards
- Checks for inactive users
- Checks for birthdays
- Queues reminder emails

---

## 🎨 Template Variable System

### Variable Syntax
Use `{{variable_name}}` in templates, e.g.:
```html
<h1>Hi {{name}}!</h1>
<p>You earned {{rewardName}} worth {{rewardValue}}!</p>
```

### Common Variables
- `{{name}}` - User's name
- `{{email}}` - User's email
- `{{appUrl}}` - App URL
- `{{qrCode}}` - QR code image URL
- `{{unsubscribeUrl}}` - Unsubscribe link

### Conditional Blocks
```html
{{#if expiryDays}}
  <p>Expires in {{expiryDays}} days!</p>
{{/if}}
```

---

## 🔄 Email Flow

### 1. Transactional Email Flow
```
User Action (e.g., signup)
  ↓
Database Trigger Fires
  ↓
check_email_triggers() called
  ↓
Conditions evaluated
  ↓
Email queued in email_queue
  ↓
process_email_queue() called (via cron or webhook)
  ↓
Email sent via Resend API
  ↓
Result logged in email_logs
```

### 2. Scheduled Email Flow
```
Cron Job runs schedule_reminder_emails()
  ↓
Checks for conditions (expiring rewards, etc.)
  ↓
Queues emails for matching users
  ↓
process_email_queue() sends emails
  ↓
Results logged
```

---

## 🚀 Implementation Steps

### Phase 1: Database Schema ✅
1. Create migration file
2. Create all 5 tables
3. Add indexes and constraints
4. Enable RLS policies
5. Add comments

### Phase 2: Core Functions
1. Create `send_email_from_template()`
2. Create `process_email_queue()`
3. Create `check_email_triggers()`
4. Create `schedule_reminder_emails()`

### Phase 3: Seed Templates
1. Migrate existing templates to database
2. Create new templates (birthday, milestone, etc.)
3. Set up email triggers
4. Configure default preferences

### Phase 4: Integration
1. Create API endpoint for processing queue
2. Set up cron job for scheduled emails
3. Update existing code to use new system
4. Add admin UI for template management

### Phase 5: Testing
1. Test each email trigger
2. Test queue processing
3. Test retry logic
4. Test user preferences
5. Test unsubscribe flow

---

## 🎯 Benefits

### For Admins
- ✅ Edit email templates without code changes
- ✅ A/B test different email versions
- ✅ Track email delivery and engagement
- ✅ Schedule reminder campaigns
- ✅ Audit all sent emails

### For Users
- ✅ Opt out of marketing emails
- ✅ Consistent email experience
- ✅ Reliable email delivery
- ✅ Beautiful, branded emails

### For Developers
- ✅ No hardcoded templates
- ✅ Easy to add new email types
- ✅ Centralized email logic
- ✅ Better error handling
- ✅ Testable email system

---

## 📊 Email Types Summary

| Email Type | Trigger | Category | Opt-out? | Priority |
|------------|---------|----------|----------|----------|
| Welcome | User signup | Transactional | No | High |
| Reward Earned | Reward issued | Transactional | No | High |
| Reward Redeemed | Reward used | Transactional | No | Medium |
| Referral Confirmed | Referral complete | Transactional | No | Medium |
| Reward Expiring | 3 days before expiry | Marketing | Yes | High |
| Inactive User | 7 days no visit | Marketing | Yes | Low |
| Milestone | Points milestone | Notification | Yes | Medium |
| Birthday | User's birthday | Marketing | Yes | High |
| Weekly Summary | Every Monday | Marketing | Yes | Low |

---

**Next Steps**: Create the migration file and implement Phase 1.
