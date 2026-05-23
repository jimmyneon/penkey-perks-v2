# Email System - Quick Reference Card

## ✅ What's Working
- **Resend API**: Verified working, test email sent successfully
- **Email sending function**: Working (`lib/email/send.ts`)
- **API endpoint**: `/api/emails/process-queue` exists

## 🔍 Quick Diagnostics

### 1. Test Resend API (30 seconds)
```bash
node scripts/test-resend-api.js
```
✅ **Result**: Email sent successfully to `nfdrepairs@gmail.com`

### 2. Check Email Queue (2 minutes)
```bash
./scripts/check-email-queue.sh
```
Then paste SQL queries into Supabase SQL Editor.

**Look for**:
- Pending emails count
- Cron job status
- Failed emails

### 3. Manual Email Processing (1 minute)
```bash
# Start dev server if not running
npm run dev

# In another terminal:
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/emails/process-queue
```

## 🚨 Common Problems

### Problem: Emails stuck in queue
**Solution**: Run manual processing (see #3 above)

### Problem: Cron job not found
**Solution**: Run `SUPABASE_CRON_SIMPLE.sql` in Supabase

### Problem: "Unauthorized" error
**Solution**: Check CRON_SECRET in `.env.local` matches database

### Problem: No emails in queue
**Solution**: Check if email triggers are working

## 📁 Important Files

| File | Purpose |
|------|---------|
| `scripts/test-resend-api.js` | Test Resend API directly |
| `scripts/check-email-queue.sh` | Get SQL queries for diagnostics |
| `CHECK_EMAIL_SYSTEM.sql` | Full SQL diagnostics |
| `SUPABASE_CRON_SIMPLE.sql` | Setup cron jobs |
| `EMAIL_TROUBLESHOOTING_GUIDE.md` | Complete troubleshooting |
| `EMAIL_SYSTEM_STATUS_OCT13.md` | Current status report |

## 🎯 Next Steps

1. Run `./scripts/check-email-queue.sh` and check database
2. If cron job missing, run `SUPABASE_CRON_SIMPLE.sql`
3. Test manual processing
4. Monitor Resend dashboard: https://resend.com/emails

## 📞 Environment Variables

Required in `.env.local`:
```bash
RESEND_API_KEY=re_xxxxx          # ✅ Working
RESEND_FROM_EMAIL=noreply@...    # ✅ Set
RESEND_REPLY_TO_EMAIL=nfd...     # ✅ Set
CRON_SECRET=your-secret          # ⚠️ Verify matches DB
```

## 🔗 Quick Links

- Resend Dashboard: https://resend.com/emails
- Resend API Keys: https://resend.com/api-keys
- Resend Domains: https://resend.com/domains

---

**TL;DR**: Resend API works. Check database for queue/cron status with `./scripts/check-email-queue.sh`
