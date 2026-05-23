# 📧 Email System Setup Guide

## Overview

The Penkey Perks app now has a complete database-driven email system that:
- ✅ Stores email templates in the database (no hardcoded templates)
- ✅ Automatically sends emails based on database triggers
- ✅ Queues emails for reliable delivery with retry logic
- ✅ Logs all sent emails for audit and analytics
- ✅ Respects user email preferences (opt-out for marketing emails)
- ✅ Supports scheduled reminder emails

---

## 🗄️ Database Tables

### 1. `email_templates`
Stores all email templates with dynamic variables.

**Key Fields:**
- `name` - Unique identifier (e.g., 'welcome_email')
- `subject` - Email subject with {{variables}}
- `html_body` - HTML email body with {{variables}}
- `category` - 'transactional', 'marketing', or 'notification'
- `active` - Whether template is enabled

### 2. `email_triggers`
Defines when emails should be automatically sent.

**Key Fields:**
- `name` - Trigger identifier
- `template_id` - Which template to use
- `event_type` - 'insert', 'update', 'delete', or 'scheduled'
- `table_name` - Which table to watch
- `conditions` - JSON conditions to check

### 3. `email_queue`
Queues emails for sending with retry logic.

**Key Fields:**
- `status` - 'pending', 'sent', 'failed', or 'cancelled'
- `scheduled_for` - When to send the email
- `retry_count` - Number of retry attempts
- `error_message` - Error if failed

### 4. `email_logs`
Audit log of all sent emails.

**Key Fields:**
- `status` - 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
- `resend_id` - Resend API email ID for tracking
- `sent_at` - When email was sent

### 5. `email_preferences`
User email notification preferences.

**Key Fields:**
- `user_id` - User
- `category` - 'marketing' or 'notification'
- `enabled` - Whether user wants these emails

---

## 📨 Email Templates

### Transactional Emails (Always Sent)
1. **Welcome Email** - Sent when user signs up
2. **Reward Earned** - Sent when user earns a reward
3. **Reward Redeemed** - Sent when reward is redeemed
4. **Referral Confirmed** - Sent when referral completes first check-in

### Marketing Emails (Can Opt-Out)
5. **Reward Expiring** - Sent 3 days before reward expires
6. **Inactive User** - Sent after 7 days of inactivity

### Notification Emails (Can Opt-Out)
7. **Milestone Reached** - Sent when user reaches points milestone

---

## 🔧 Setup Instructions

### Step 1: Run Database Migrations

Run these migrations in order:

```bash
# 1. Create email system tables
psql -f supabase/migrations/20251011_email_system.sql

# 2. Seed email templates
psql -f supabase/migrations/20251011_seed_email_templates.sql

# 3. Set up email triggers
psql -f supabase/migrations/20251011_seed_email_triggers.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy and paste each migration file
3. Run them in order

### Step 2: Configure Environment Variables

Add to your `.env.local`:

```bash
# Resend Email (already configured)
RESEND_API_KEY=re_gCRZG5u7_LFyC36xo8YiMPR21FKH1Anu6
RESEND_FROM_EMAIL=noreply@rewards.penkey.co.uk
RESEND_REPLY_TO_EMAIL=nfdrepairs@gmail.com

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://perks.penkey.co.uk

# Cron Secret (for scheduled emails)
CRON_SECRET=your-random-secret-here
```

Generate a cron secret:
```bash
openssl rand -base64 32
```

### Step 3: Set Up Cron Jobs

You need two cron jobs:

#### 1. Process Email Queue (Every 5 minutes)
Sends queued emails via Resend API.

**Vercel Cron:**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/emails/process-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Manual Cron:**
```bash
*/5 * * * * curl -X POST https://perks.penkey.co.uk/api/emails/process-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### 2. Send Reminder Emails (Daily at 9 AM)
Checks for expiring rewards and inactive users.

**Vercel Cron:**
```json
{
  "path": "/api/emails/send-reminders",
  "schedule": "0 9 * * *"
}
```

**Manual Cron:**
```bash
0 9 * * * curl -X POST https://perks.penkey.co.uk/api/emails/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Step 4: Test the System

#### Test Welcome Email
```bash
# Sign up a new user - should automatically receive welcome email
```

#### Test Reward Earned Email
```sql
-- Manually insert a reward to test
INSERT INTO user_rewards (user_id, reward_id, qr_code, status)
VALUES ('user-uuid', 'reward-uuid', 'TEST-QR-123', 'active');
```

#### Test Email Queue Processing
```bash
curl -X POST http://localhost:3000/api/emails/process-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### Test Reminder Emails
```bash
curl -X POST http://localhost:3000/api/emails/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🎨 Template Variables

### Available Variables

All templates support these common variables:
- `{{name}}` - User's name
- `{{email}}` - User's email
- `{{appUrl}}` - App URL

Template-specific variables:
- **Welcome Email**: `{{referralUrl}}`
- **Reward Earned**: `{{rewardName}}`, `{{rewardValue}}`, `{{qrCodeUrl}}`, `{{expiryDays}}`
- **Reward Expiring**: `{{rewardName}}`, `{{daysLeft}}`, `{{daysLeftPlural}}`, `{{qrCodeUrl}}`
- **Referral Confirmed**: `{{refereeName}}`, `{{pointsEarned}}`
- **Reward Redeemed**: `{{rewardName}}`, `{{redeemedAt}}`
- **Inactive User**: `{{pointsBalance}}`
- **Milestone**: `{{milestone}}`

### Editing Templates

Templates can be edited via:
1. **Database** - Direct SQL updates
2. **Admin API** - `/api/admin/email-templates`
3. **Admin UI** - (To be built)

Example SQL update:
```sql
UPDATE email_templates
SET subject = 'New Subject Line',
    html_body = '<html>New body with {{variables}}</html>'
WHERE name = 'welcome_email';
```

---

## 📊 Email Analytics

### View Email Logs

**API Endpoint:**
```bash
GET /api/admin/email-logs?limit=50&offset=0&status=sent
```

**Response:**
```json
{
  "logs": [...],
  "summary": {
    "total": 1234,
    "sent": 1200,
    "delivered": 1150,
    "opened": 800,
    "clicked": 200,
    "bounced": 10,
    "failed": 24
  }
}
```

### Query Email Logs

```sql
-- Get all emails sent to a user
SELECT * FROM email_logs
WHERE recipient_user_id = 'user-uuid'
ORDER BY sent_at DESC;

-- Get failed emails
SELECT * FROM email_logs
WHERE status = 'failed'
ORDER BY sent_at DESC;

-- Get emails by template
SELECT el.*, et.name as template_name
FROM email_logs el
JOIN email_templates et ON el.template_id = et.id
WHERE et.name = 'welcome_email';
```

---

## 🔒 User Preferences

### Default Behavior
- **Transactional emails**: Always sent (welcome, reward earned, etc.)
- **Marketing emails**: Sent by default, user can opt-out
- **Notification emails**: Sent by default, user can opt-out

### Opt-Out

Users can opt-out via:
```sql
INSERT INTO email_preferences (user_id, category, enabled)
VALUES ('user-uuid', 'marketing', false);
```

Or via API (to be built):
```bash
POST /api/account/email-preferences
{
  "category": "marketing",
  "enabled": false
}
```

---

## 🛠️ Admin Functions

### Manually Queue an Email

```sql
SELECT queue_email_from_template(
  'welcome_email',                    -- template name
  'user@example.com',                 -- recipient email
  'user-uuid',                        -- recipient user ID
  '{"name": "John", "referralUrl": "https://..."}', -- variables
  0,                                  -- delay in minutes
  NULL                                -- trigger ID (optional)
);
```

### Check Queue Status

```sql
SELECT 
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;
```

### Retry Failed Emails

```sql
UPDATE email_queue
SET status = 'pending',
    retry_count = 0,
    scheduled_for = NOW()
WHERE status = 'failed'
  AND retry_count < max_retries;
```

---

## 🚨 Troubleshooting

### Emails Not Sending

1. **Check Queue:**
```sql
SELECT * FROM email_queue WHERE status = 'pending';
```

2. **Check Cron Job:**
```bash
curl -X POST https://perks.penkey.co.uk/api/emails/process-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

3. **Check Resend API:**
- Verify API key is correct
- Check Resend dashboard for errors
- Verify sender email is verified

### Emails Going to Spam

1. **Verify Domain:**
- Add SPF, DKIM, and DMARC records
- Verify domain in Resend dashboard

2. **Improve Content:**
- Avoid spam trigger words
- Include unsubscribe link
- Use proper HTML structure

### Database Triggers Not Firing

1. **Check Trigger Exists:**
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%email%';
```

2. **Check Trigger Function:**
```sql
SELECT * FROM email_triggers WHERE active = true;
```

3. **Test Manually:**
```sql
-- Insert test user
INSERT INTO users (id, name, email)
VALUES (gen_random_uuid(), 'Test User', 'test@example.com');

-- Check if email was queued
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 1;
```

---

## 📝 Next Steps

### Recommended Enhancements

1. **Admin UI** - Build admin dashboard for managing templates
2. **Email Preview** - Add preview functionality before sending
3. **A/B Testing** - Test different subject lines and content
4. **Unsubscribe Page** - Build user-facing preference center
5. **Email Webhooks** - Handle Resend webhooks for delivery tracking
6. **Template Builder** - Visual email template editor
7. **Scheduled Campaigns** - One-time email campaigns

### Additional Email Types

- **Password Reset** - Forgot password emails
- **Account Verification** - Email verification
- **Receipt** - Purchase/redemption receipts
- **Birthday** - Birthday reward emails
- **Weekly Digest** - Weekly activity summary
- **Special Offers** - Promotional campaigns

---

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [Email Template Best Practices](https://www.campaignmonitor.com/resources/guides/email-marketing-best-practices/)
- [Email Deliverability Guide](https://sendgrid.com/blog/email-deliverability-guide/)

---

**Last Updated:** 2025-10-11  
**Version:** 1.0
