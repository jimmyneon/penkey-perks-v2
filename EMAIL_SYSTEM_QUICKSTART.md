# 📧 Email System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Run Migrations (Required)

Run these SQL migrations in your Supabase dashboard:

```bash
# In Supabase SQL Editor, run in order:
1. supabase/migrations/20251011_email_system.sql
2. supabase/migrations/20251011_seed_email_templates.sql
3. supabase/migrations/20251011_seed_email_triggers.sql
```

### 2. Add Environment Variable

Add to `.env.local`:

```bash
CRON_SECRET=your-random-secret-here
```

Generate secret:
```bash
openssl rand -base64 32
```

### 3. Set Up Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/emails/process-queue",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/emails/send-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 4. Test It!

```bash
# Process email queue manually
curl -X POST http://localhost:3000/api/emails/process-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Send reminder emails manually
curl -X POST http://localhost:3000/api/emails/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📨 What Emails Are Sent?

### Automatic Emails (Triggered by Database Events)

| Email | Trigger | When |
|-------|---------|------|
| **Welcome** | User signup | Immediately |
| **Reward Earned** | Reward issued | Immediately |
| **Reward Redeemed** | Reward used | Immediately |
| **Referral Confirmed** | Referral complete | Immediately |

### Scheduled Emails (Sent by Cron Job)

| Email | Schedule | Condition |
|-------|----------|-----------|
| **Reward Expiring** | Daily 9 AM | Reward expires in 3 days |
| **Inactive User** | Daily 9 AM | No check-in for 7 days |

---

## 🎨 Email Templates

All templates stored in `email_templates` table with variables like `{{name}}`, `{{rewardName}}`, etc.

### Edit a Template

```sql
UPDATE email_templates
SET subject = 'New Subject',
    html_body = '<html>New body with {{name}}</html>'
WHERE name = 'welcome_email';
```

### View All Templates

```sql
SELECT name, display_name, category, active 
FROM email_templates 
ORDER BY category, name;
```

---

## 📊 Monitor Emails

### Check Queue Status

```sql
SELECT status, COUNT(*) 
FROM email_queue 
GROUP BY status;
```

### View Recent Emails

```sql
SELECT 
  el.*,
  et.name as template_name,
  u.name as recipient_name
FROM email_logs el
JOIN email_templates et ON el.template_id = et.id
LEFT JOIN users u ON el.recipient_user_id = u.id
ORDER BY el.sent_at DESC
LIMIT 20;
```

### Check Failed Emails

```sql
SELECT * FROM email_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

---

## 🛠️ Common Tasks

### Manually Send an Email

```sql
SELECT queue_email_from_template(
  'welcome_email',
  'user@example.com',
  'user-uuid',
  '{"name": "John", "referralUrl": "https://..."}'::jsonb
);
```

### Retry Failed Emails

```sql
UPDATE email_queue
SET status = 'pending',
    retry_count = 0,
    scheduled_for = NOW()
WHERE status = 'failed';
```

### Disable a Template

```sql
UPDATE email_templates
SET active = false
WHERE name = 'inactive_user';
```

---

## 🔧 API Endpoints

### Process Email Queue
```
POST /api/emails/process-queue
Authorization: Bearer YOUR_CRON_SECRET
```

### Send Reminders
```
POST /api/emails/send-reminders
Authorization: Bearer YOUR_CRON_SECRET
```

### Admin: View Templates
```
GET /api/admin/email-templates
```

### Admin: View Logs
```
GET /api/admin/email-logs?limit=50&status=sent
```

---

## 📚 Full Documentation

See `EMAIL_SYSTEM_SETUP.md` for complete documentation including:
- Database schema details
- Template variable reference
- Troubleshooting guide
- Advanced features

---

## ✅ Checklist

- [ ] Run all 3 migrations
- [ ] Add `CRON_SECRET` to `.env.local`
- [ ] Set up cron jobs in `vercel.json`
- [ ] Test email queue processing
- [ ] Test reminder emails
- [ ] Verify emails are being sent
- [ ] Check email logs for delivery status

---

**Need Help?** Check `EMAIL_SYSTEM_SETUP.md` or `EMAIL_SYSTEM_PLAN.md`
