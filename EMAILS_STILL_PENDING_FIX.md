# Emails Still Pending After Cron Jobs Running

## Situation
- ✅ pg_net is enabled
- ✅ Cron jobs are scheduled
- ✅ Cron jobs show "successful"
- ❌ Emails remain in "pending" status

---

## Step 1: Check What the API is Returning

Run `CHECK_CRON_RESPONSES.sql` in Supabase SQL Editor.

This will show you:
1. HTTP responses from cron jobs
2. What status codes are being returned
3. Any error messages

### Look for:

**Good signs:**
- `status_code = 200` ✅
- `error_msg = null` ✅

**Bad signs:**
- `status_code = 401` → CRON_SECRET mismatch
- `status_code = 500` → Server error
- `error_msg` not null → Network error

---

## Step 2: Test Manually

Run `TEST_EMAIL_API_NOW.sql` to trigger email processing manually and see the response immediately.

---

## Common Issues & Fixes

### Issue 1: CRON_SECRET Mismatch (401 Error)

**Symptom:** `status_code = 401` or "Unauthorized"

**Fix:** Make sure the secret in database matches environment variables

```sql
-- Check database value
SELECT value FROM app_settings WHERE key = 'cron_secret';
```

Compare with your `.env.local`:
```env
CRON_SECRET=3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=
```

**They must match exactly!**

If they don't match:
```sql
-- Update database to match .env.local
UPDATE app_settings 
SET value = '3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=' 
WHERE key = 'cron_secret';
```

**Also check Vercel:**
- Go to Vercel → Settings → Environment Variables
- Make sure `CRON_SECRET` is set there too
- Must match the value in database and .env.local
- **Redeploy after adding/changing**

---

### Issue 2: Wrong App URL

**Symptom:** `error_msg` shows connection error or timeout

**Fix:** Check app_url is correct

```sql
SELECT value FROM app_settings WHERE key = 'app_url';
```

Should be your production URL:
- ✅ `https://perks.penkey.co.uk`
- ❌ `http://localhost:3000` (won't work from Supabase)
- ❌ `https://perks.penkey.co.uk/` (remove trailing slash)

If wrong:
```sql
UPDATE app_settings 
SET value = 'https://perks.penkey.co.uk' 
WHERE key = 'app_url';
```

---

### Issue 3: Resend API Key Not Set

**Symptom:** `status_code = 200` but emails still pending, `error_message` in email_queue shows "API key invalid"

**Fix:** Check environment variables

In `.env.local`:
```env
RESEND_API_KEY=re_your_actual_api_key
RESEND_FROM_EMAIL=perks@penkey.co.uk
```

**In Vercel:**
1. Go to Vercel → Settings → Environment Variables
2. Make sure these are set:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
3. **Redeploy after adding**

---

### Issue 4: App Not Deployed

**Symptom:** Connection errors or 404

**Fix:** Make sure your app is deployed and accessible

Test in browser:
```
https://perks.penkey.co.uk/api/emails/process-queue
```

Should return:
- 401 Unauthorized (if no auth header) ✅
- NOT 404 Not Found ❌

If 404, your app isn't deployed or route doesn't exist.

---

### Issue 5: Route Requires Authentication but Cron Can't Authenticate

**Symptom:** 401 even though CRON_SECRET is correct

**Fix:** Check the API route accepts the Authorization header

In `/app/api/emails/process-queue/route.ts`:

```typescript
export async function POST(request: Request) {
  // Get the auth header
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Verify it matches
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // ... rest of code
}
```

Make sure this check is working correctly.

---

### Issue 6: Emails Scheduled for Future

**Symptom:** Emails in queue but `scheduled_for` is in the future

**Check:**
```sql
SELECT 
  id,
  recipient_email,
  status,
  scheduled_for,
  NOW() as current_time,
  (scheduled_for > NOW()) as is_future
FROM email_queue
WHERE status = 'pending'
ORDER BY scheduled_for;
```

If `is_future = true`, emails are scheduled for later and won't send yet.

---

## Step 3: Check Vercel Logs

If `status_code = 200` but emails still pending:

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Logs**
4. Filter for: `/api/emails/process-queue`
5. Look for errors

Common errors:
- "API key invalid" → RESEND_API_KEY not set
- "Failed to fetch" → Network issue
- "Unauthorized" → CRON_SECRET mismatch

---

## Step 4: Check Email Queue Errors

```sql
SELECT 
  recipient_email,
  subject,
  status,
  attempts,
  error_message,
  created_at
FROM email_queue
WHERE status = 'failed' OR error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

The `error_message` column will tell you exactly what went wrong.

---

## Quick Diagnostic Checklist

Run through this in order:

### 1. Check HTTP Responses
```sql
SELECT status_code, content::text, error_msg
FROM net._http_response 
ORDER BY created DESC 
LIMIT 1;
```

- [ ] status_code = 200
- [ ] error_msg is null
- [ ] content shows success

### 2. Check Environment Variables

**In .env.local:**
- [ ] CRON_SECRET is set
- [ ] RESEND_API_KEY is set
- [ ] RESEND_FROM_EMAIL is set

**In Vercel:**
- [ ] CRON_SECRET is set
- [ ] RESEND_API_KEY is set
- [ ] RESEND_FROM_EMAIL is set
- [ ] App has been redeployed after adding variables

### 3. Check Database Settings
```sql
SELECT * FROM app_settings;
```

- [ ] app_url is correct production URL
- [ ] cron_secret matches environment variable

### 4. Check Email Queue
```sql
SELECT status, COUNT(*) FROM email_queue GROUP BY status;
```

- [ ] Some emails have status = 'sent'
- [ ] Check error_message for failed emails

---

## Manual Test Command

Run this to test RIGHT NOW:

```sql
-- In Supabase SQL Editor
SELECT net.http_post(
  url := 'https://perks.penkey.co.uk/api/emails/process-queue',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer 3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc='
  ),
  body := '{}'::jsonb
);

-- Then check response
SELECT status_code, content::text 
FROM net._http_response 
ORDER BY created DESC 
LIMIT 1;
```

Replace the URL and Bearer token with your actual values.

---

## Expected Success

When everything is working:

1. **HTTP Response:**
   - status_code = 200
   - content shows: `{"success":true,"sent":X}`

2. **Email Queue:**
   - Emails change from `pending` to `sent`
   - `sent_at` timestamp is populated
   - `error_message` is null

3. **Cron Jobs:**
   - Run every 5 minutes
   - status = 'succeeded'
   - return_message shows success

---

## Still Not Working?

If you've checked everything above and emails still aren't sending:

1. **Check Resend Dashboard:**
   - Go to https://resend.com/emails
   - See if emails are being received by Resend
   - Check for any API errors

2. **Check Resend API Key:**
   - Make sure it's a valid key
   - Check it has permission to send emails
   - Verify the domain is verified in Resend

3. **Test Resend Directly:**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_your_api_key" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "perks@penkey.co.uk",
       "to": "test@example.com",
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

---

## Summary

**Most likely issues:**
1. ❌ CRON_SECRET not set in Vercel (need to redeploy)
2. ❌ RESEND_API_KEY not set in Vercel (need to redeploy)
3. ❌ CRON_SECRET in database doesn't match environment variable
4. ❌ app_url is wrong in database

**Quick fix:**
1. Make sure all environment variables are in Vercel
2. Redeploy the app
3. Run `TEST_EMAIL_API_NOW.sql` to test
4. Check the response for errors
