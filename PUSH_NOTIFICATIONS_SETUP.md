# 🔔 PUSH NOTIFICATIONS - SETUP GUIDE

**Status:** Code Complete - Ready for Configuration  
**Estimated Setup Time:** 15 minutes

---

## ✅ WHAT'S BEEN BUILT

### Files Created:
1. ✅ `supabase/migrations/20251012_push_notifications.sql` - Database tables & functions
2. ✅ `public/sw.js` - Service worker for handling push events
3. ✅ `lib/push/send.ts` - Push sending service
4. ✅ `app/api/push/subscribe/route.ts` - Subscribe endpoint
5. ✅ `app/api/push/unsubscribe/route.ts` - Unsubscribe endpoint
6. ✅ `app/api/push/send/route.ts` - Send push endpoint
7. ✅ `components/push-notification-prompt.tsx` - UI component

### Features:
✅ Web Push API integration  
✅ Service worker for background notifications  
✅ Subscription management (subscribe/unsubscribe)  
✅ Multi-device support  
✅ Push sending to users  
✅ Delivery tracking & logging  
✅ Expired subscription handling  
✅ Beautiful UI prompt  

---

## 🚀 SETUP STEPS

### Step 1: Install Dependencies (2 mins)

```bash
cd /Users/johnhopwood/penkeygameapp
npm install web-push
```

### Step 2: Generate VAPID Keys (1 min)

VAPID keys are required for Web Push. Generate them once:

```bash
npx web-push generate-vapid-keys
```

You'll get output like:
```
Public Key: BKxT...
Private Key: 5J2...
```

### Step 3: Add Environment Variables (2 mins)

Add to `.env.local`:

```env
# VAPID Keys for Push Notifications
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:nfdrepairs@gmail.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
```

**Important:** 
- Use the SAME public key for both `VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Keep private key SECRET (never commit to git)

### Step 4: Run Database Migration (2 mins)

```bash
# Copy and run in Supabase SQL Editor
supabase/migrations/20251012_push_notifications.sql
```

Expected output:
```
✅ Push notification tables created successfully!
🎉 Push notification infrastructure ready!
```

### Step 5: Add Component to Dashboard (3 mins)

Edit `app/dashboard/page.tsx` or your main dashboard component:

```typescript
import { PushNotificationPrompt } from '@/components/push-notification-prompt'

// Add inside your dashboard component
<PushNotificationPrompt />
```

### Step 6: Test (5 mins)

1. **Open your app** in the browser
2. **See the push notification prompt**
3. **Click "Enable Notifications"**
4. **Allow notifications** in browser popup
5. **Check Supabase** → `push_subscriptions` table → Should see 1 row

---

## 📱 HOW TO USE

### For Users:

**Enable Notifications:**
1. User sees prompt on dashboard
2. Clicks "Enable Notifications"
3. Browser asks for permission
4. User clicks "Allow"
5. Subscription saved to database

**Receive Notifications:**
- Notifications work even when app is closed
- Click notification to open app
- Works on desktop & mobile

### For Admins/Staff:

**Send Push Notification:**

```typescript
// Via API
const response = await fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '🎁 New Reward!',
    message: 'You earned a free coffee!',
    url: '/rewards',
    userIds: ['user-id-1', 'user-id-2'] // Optional, omit for broadcast
  })
})
```

**Or programmatically:**

```typescript
import { sendPushToUser } from '@/lib/push/send'

await sendPushToUser('user-id', {
  title: '🎁 Reward Expiring!',
  message: 'Your free coffee expires in 2 hours!',
  url: '/rewards'
})
```

---

## 🎨 CUSTOMIZATION

### Notification Appearance:

Edit `public/sw.js` to customize:

```javascript
const options = {
  body: data.message,
  icon: '/icon-192.png',        // Your app icon
  badge: '/icon-192.png',        // Small badge icon
  image: data.image,             // Large image (optional)
  vibrate: [200, 100, 200],      // Vibration pattern
  tag: 'penkey-notification',    // Group similar notifications
  requireInteraction: false,     // Auto-dismiss or stay
  actions: [                     // Action buttons
    { action: 'open', title: 'Open App' },
    { action: 'close', title: 'Dismiss' }
  ]
}
```

### Prompt Appearance:

Edit `components/push-notification-prompt.tsx`:
- Change colors
- Modify text
- Adjust timing (when to show)
- Add custom logic

---

## 🔧 INTEGRATION WITH NOTIFICATIONS

### Automatic Push for Notifications:

Edit `app/api/notifications/get-for-user/route.ts` to send push:

```typescript
import { sendPushToUser } from '@/lib/push/send'

// After finding matching notification
if (matchingNotifications.length > 0) {
  const notification = matchingNotifications[0]
  
  // Send push notification
  await sendPushToUser(userId, {
    title: notification.title,
    message: notification.message,
    url: '/dashboard',
    icon: notification.icon
  }, notification.id)
}
```

---

## 📊 MONITORING

### Check Subscriptions:

```sql
-- View all active subscriptions
SELECT 
  u.name,
  u.email,
  ps.device_name,
  ps.created_at,
  ps.last_used_at
FROM push_subscriptions ps
JOIN users u ON u.id = ps.user_id
WHERE ps.active = true
ORDER BY ps.created_at DESC;
```

### Check Push Log:

```sql
-- View recent push notifications
SELECT 
  u.name,
  pnl.title,
  pnl.message,
  pnl.status,
  pnl.sent_at,
  pnl.error_message
FROM push_notifications_log pnl
JOIN users u ON u.id = pnl.user_id
ORDER BY pnl.created_at DESC
LIMIT 50;
```

### Analytics:

```sql
-- Push notification stats
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM push_notifications_log
GROUP BY status;
```

---

## 🐛 TROUBLESHOOTING

### Issue: "VAPID public key not configured"
**Solution:** Make sure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is in `.env.local` and restart dev server

### Issue: "Service worker not found"
**Solution:** Make sure `public/sw.js` exists and is accessible at `/sw.js`

### Issue: "Permission denied"
**Solution:** User must manually re-enable in browser settings (chrome://settings/content/notifications)

### Issue: "Subscription expired (410 error)"
**Solution:** This is normal - subscription automatically deactivated in database

### Issue: Notifications not showing
**Solution:** 
1. Check browser console for errors
2. Verify service worker registered: `navigator.serviceWorker.getRegistration()`
3. Check notification permission: `Notification.permission`
4. Test with simple notification: `new Notification('Test')`

---

## 🌐 BROWSER SUPPORT

✅ **Supported:**
- Chrome/Edge (Desktop & Android)
- Firefox (Desktop & Android)
- Safari (macOS 16.4+, iOS 16.4+)
- Opera (Desktop & Android)

❌ **Not Supported:**
- iOS Safari < 16.4
- Internet Explorer

---

## 🔒 SECURITY

### Best Practices:
✅ VAPID private key stored in environment variables  
✅ Never expose private key to client  
✅ RLS policies protect user subscriptions  
✅ Admin/staff only can send push  
✅ Subscriptions tied to authenticated users  

### Privacy:
- Users can unsubscribe anytime
- Subscriptions deleted when user deletes account
- Push content not stored permanently
- Respects browser notification settings

---

## 📈 NEXT STEPS

### Immediate:
1. Run setup steps above
2. Test on your device
3. Send test notification

### Soon:
1. Integrate with notification system
2. Send push for reward expiry
3. Send push for streak reminders
4. Add to staff messaging UI

### Future:
1. Rich notifications with images
2. Notification categories
3. Scheduled push notifications
4. A/B testing push content

---

## ✅ CHECKLIST

- [ ] Install `web-push` package
- [ ] Generate VAPID keys
- [ ] Add environment variables
- [ ] Run database migration
- [ ] Add component to dashboard
- [ ] Test subscription flow
- [ ] Send test notification
- [ ] Verify notification received
- [ ] Check database logs
- [ ] Deploy to production

---

**Push notifications are ready to use! 🎉**

**Setup time: ~15 minutes**  
**Impact: High user engagement**  
**Difficulty: Easy (just follow steps)**
