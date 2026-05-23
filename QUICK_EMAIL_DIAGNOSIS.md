# Quick Email Diagnosis

## Your Current Settings

```
app_url:     https://rewards.penkey.co.uk
cron_secret: 3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=
```

## ⚠️ Potential Issue: Wrong URL?

Is your app deployed at `https://rewards.penkey.co.uk` or `https://perks.penkey.co.uk`?

### If it's the wrong URL:

```sql
-- Update to correct URL
UPDATE app_settings 
SET value = 'https://perks.penkey.co.uk' 
WHERE key = 'app_url';
```

## Next Steps

### 1. Run the full diagnostic
Run `CHECK_CRON_RESPONSES.sql` and look at the first query results.

**Look for:**
- `status_code` - What HTTP status is being returned?
- `error_msg` - Any network errors?
- `response_body` - What is the API saying?

### 2. Common Status Codes

**200** = Success! ✅
- API is working
- Check response_body for details
- If emails still pending, check error_message in email_queue

**401** = Unauthorized ❌
- CRON_SECRET mismatch
- Check Vercel environment variables
- Make sure CRON_SECRET is set and matches database

**404** = Not Found ❌
- URL is wrong OR
- Route doesn't exist OR
- App not deployed

**null with error_msg** = Network Error ❌
- URL is completely wrong
- DNS not configured
- App not accessible

### 3. Test the URL manually

Run `TEST_CURRENT_URL.sql` to test if the current URL works.

### 4. Check what URL your app is actually at

In your browser, try:
- https://rewards.penkey.co.uk
- https://perks.penkey.co.uk

Which one loads your app?

### 5. Check Vercel deployment

Go to Vercel Dashboard and check:
- What domain is your app deployed to?
- Is it `rewards.penkey.co.uk` or `perks.penkey.co.uk`?

## Quick Fix Checklist

- [ ] Confirm correct app URL (rewards vs perks)
- [ ] Update app_settings if wrong
- [ ] Check CRON_SECRET is in Vercel environment variables
- [ ] Check RESEND_API_KEY is in Vercel environment variables
- [ ] Redeploy if you added environment variables
- [ ] Run TEST_CURRENT_URL.sql to test
- [ ] Check HTTP response status_code

## Most Likely Issues

1. **Wrong URL in database** (rewards vs perks)
2. **CRON_SECRET not in Vercel** (need to add and redeploy)
3. **RESEND_API_KEY not in Vercel** (need to add and redeploy)

## After Fixing

Once you update the URL or add environment variables:
1. Wait 5 minutes for next cron run OR
2. Run `TEST_CURRENT_URL.sql` to test immediately
3. Check if emails change from 'pending' to 'sent'
