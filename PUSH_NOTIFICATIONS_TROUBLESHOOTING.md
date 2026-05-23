# 🔔 PUSH NOTIFICATIONS - TROUBLESHOOTING GUIDE

**Issue:** Push notification toggle doesn't do anything

---

## 🔍 DEBUGGING STEPS

### Step 1: Check Browser Console
1. Open your app
2. Press `F12` or right-click → Inspect
3. Go to Console tab
4. Click the push notification toggle
5. Look for these logs:

**Expected logs:**
```
Push toggle clicked: true
Enabling push notifications...
Permission result: granted
Registering service worker...
Service worker registered: [object]
VAPID key available: true
Subscribing to push...
Push subscription created: [object]
Saving subscription to server...
Subscription saved successfully!
```

**If you see errors, note them and continue below.**

---

### Step 2: Check VAPID Keys

**Problem:** "VAPID public key not configured"

**Solution:**
```bash
# 1. Check if .env.local exists
ls -la .env.local

# 2. Check if VAPID keys are present
grep "VAPID" .env.local

# Should show:
# VAPID_PUBLIC_KEY=BIkIB27DZwAs...
# VAPID_PRIVATE_KEY=J2TOFNbVtKafhlu0...
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=BIkIB27DZwAs...

# 3. If missing, generate them:
node scripts/generate-vapid-keys.js

# 4. Restart dev server
npm run dev
```

---

### Step 3: Check Service Worker

**Problem:** Service worker not registering

**Solution:**
```bash
# 1. Check if sw.js exists
ls -la public/sw.js

# 2. Check if accessible in browser
# Open: http://localhost:3000/sw.js
# Should show JavaScript code, not 404

# 3. Check service worker registration
# In browser console:
navigator.serviceWorker.getRegistration('/sw.js')
  .then(reg => console.log('SW registered:', !!reg))
```

---

### Step 4: Check Browser Permissions

**Problem:** Browser blocks notifications

**Solution:**

**Chrome:**
1. Click lock icon in address bar
2. Click "Site settings"
3. Find "Notifications"
4. Set to "Allow"

**Firefox:**
1. Click lock icon
2. Click "Connection secure"
3. Click "More information"
4. Go to Permissions tab
5. Find "Receive Notifications"
6. Uncheck "Use Default"
7. Check "Allow"

**Safari:**
1. Safari → Settings
2. Websites → Notifications
3. Find your site
4. Set to "Allow"

---

### Step 5: Check API Endpoint

**Problem:** Subscription not saving to database

**Test:**
```bash
# Test the subscribe endpoint
curl -X POST http://localhost:3000/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "test-endpoint",
    "keys": {
      "p256dh": "test-key",
      "auth": "test-auth"
    },
    "userAgent": "test",
    "deviceName": "test"
  }'

# Should return:
# {"success":true,"subscription":{...}}
```

---

### Step 6: Check Database

**Problem:** Subscription not appearing in database

**Solution:**
```sql
-- Check if table exists
SELECT * FROM push_subscriptions LIMIT 1;

-- If error "table doesn't exist":
-- Run migration: supabase/migrations/20251012_push_notifications.sql

-- Check if user is authenticated
SELECT auth.uid();

-- Should return your user ID, not null
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: Toggle doesn't respond at all

**Symptoms:**
- Click toggle, nothing happens
- No console logs
- No permission popup

**Causes:**
- JavaScript not loading
- Component not rendering
- Browser doesn't support push

**Fix:**
```bash
# 1. Check browser console for errors
# 2. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
# 3. Clear cache and reload
# 4. Try different browser
```

---

### Issue 2: "VAPID key not configured"

**Symptoms:**
- Console shows: "VAPID public key not configured"
- Toast error appears

**Fix:**
```bash
# Generate keys
node scripts/generate-vapid-keys.js

# Add to .env.local (copy from terminal output)
# MUST restart dev server after adding
npm run dev
```

---

### Issue 3: "Permission denied"

**Symptoms:**
- Permission popup doesn't appear
- Or user clicked "Block"

**Fix:**
1. Reset browser permissions (see Step 4 above)
2. Try in incognito/private window
3. Clear site data:
   - Chrome: Settings → Privacy → Site Settings → View permissions
   - Find your site → Clear & reset

---

### Issue 4: Service worker fails to register

**Symptoms:**
- Console: "Failed to register service worker"
- sw.js returns 404

**Fix:**
```bash
# 1. Check file exists
ls -la public/sw.js

# 2. If missing, it should be there from our setup
# Check if you're in the right directory

# 3. Restart dev server
npm run dev

# 4. Clear service worker cache
# In DevTools → Application → Service Workers → Unregister
# Then reload page
```

---

### Issue 5: Subscription saves but push doesn't work

**Symptoms:**
- Toggle works
- Database has subscription
- But no push notifications received

**Fix:**
```bash
# Test sending a push
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "Test",
    "message": "Testing!",
    "url": "/dashboard"
  }'

# Check:
# 1. Are you logged in as admin/staff?
# 2. Is VAPID_PRIVATE_KEY in .env.local?
# 3. Check server logs for errors
```

---

## 🧪 QUICK TEST

Run this in browser console to test everything:

```javascript
// Test 1: Check support
console.log('Notifications supported:', 'Notification' in window);
console.log('Service Worker supported:', 'serviceWorker' in navigator);
console.log('Push supported:', 'PushManager' in window);

// Test 2: Check permission
console.log('Current permission:', Notification.permission);

// Test 3: Check service worker
navigator.serviceWorker.getRegistration()
  .then(reg => console.log('Service worker registered:', !!reg));

// Test 4: Check subscription
navigator.serviceWorker.ready
  .then(reg => reg.pushManager.getSubscription())
  .then(sub => console.log('Push subscription exists:', !!sub));

// Test 5: Check VAPID key
console.log('VAPID key configured:', !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
```

---

## ✅ VERIFICATION CHECKLIST

Before asking for help, verify:

- [ ] `.env.local` exists with all 3 VAPID keys
- [ ] Dev server restarted after adding keys
- [ ] `public/sw.js` exists and accessible
- [ ] Browser supports push notifications
- [ ] Not in private/incognito mode (some browsers block)
- [ ] Browser permissions not blocked
- [ ] User is logged in
- [ ] Database migration run
- [ ] No console errors
- [ ] Tried hard refresh (Ctrl+Shift+R)

---

## 🆘 STILL NOT WORKING?

### Get detailed logs:

1. Open browser console
2. Click toggle
3. Copy ALL console output
4. Check Network tab for failed requests
5. Check Application tab → Service Workers

### Check these files:

```bash
# 1. Component exists
ls -la components/push-notification-toggle.tsx

# 2. Service worker exists
ls -la public/sw.js

# 3. API endpoints exist
ls -la app/api/push/subscribe/route.ts
ls -la app/api/push/unsubscribe/route.ts

# 4. Environment variables
cat .env.local | grep VAPID
```

---

## 📞 NEED HELP?

Provide this information:
1. Browser and version
2. Console logs (full output)
3. Network tab errors
4. Environment check results
5. Database migration status

---

**Most common fix: Restart dev server after adding VAPID keys!** 🔄
