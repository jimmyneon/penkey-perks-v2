# Promotional Offers + Notifications Integration

## Overview
Promotional offers now **automatically create temporary notifications** when the "Show as Notification" option is enabled. This creates a seamless experience where your flash sales and special offers appear both as modal popups AND in the rotating messageboard banner.

## How It Works

### 1. **Create Promotional Offer**
Staff creates a promotional offer in the Staff Dashboard with:
- Title, description, reward details
- "Show as Notification" toggle enabled ✅
- Optional start/end dates

### 2. **Auto-Create Temporary Notification**
When the offer is created, the system automatically:
- Creates a temporary notification with the same title/description
- Links it to the promotional offer
- Sets expiry based on the offer's end date
- Marks it as temporary (auto-expires)

### 3. **Notification Appears in Banner**
The notification shows in the rotating messageboard:
- Swipeable/draggable
- Auto-rotates with other messages
- Dismissible by users
- Expires when offer ends

### 4. **Sync Changes**
If you update the promotional offer:
- Title, description, icon → synced to notification
- Active status → synced
- Changes appear immediately in banner

## Database Schema

### New Fields in `promotional_offers`
```sql
notification_id UUID  -- Links to the auto-created notification
```

### Notification Created With
```sql
is_temporary: true
auto_expire_hours: calculated from end_date
variant: 'reward'
type: 'custom'
priority: same as promo offer
```

## Use Cases

### ✅ **Flash Sale (2 hours)**
```
Title: ⚡ FLASH SALE!
Description: Triple points for the next 2 hours!
End Date: 2 hours from now
Show as Notification: ✅
Show as Modal: ✅
```
**Result**: 
- Modal popup when users open app
- Banner notification in rotating messageboard
- Auto-expires in 2 hours

### ✅ **Happy Hour (Daily)**
```
Title: 🎉 Happy Hour - 20% Off
Description: Happy Hour is NOW! 20% off all drinks!
End Date: Today at 5pm
Show as Notification: ✅
Show as Modal: ✅
```
**Result**:
- Shows in both modal and banner
- Expires at 5pm automatically
- Create new one tomorrow for next happy hour

### ✅ **Weekend Special**
```
Title: 🌟 Weekend Bonus Beans
Description: Get 50 bonus beans with any purchase this weekend!
End Date: Sunday 11:59pm
Show as Notification: ✅
Show as Modal: ✅
```
**Result**:
- Shows all weekend
- Auto-expires Sunday night
- No manual cleanup needed

## Staff Dashboard Workflow

### Creating a Promo Offer with Notification

1. **Go to Staff Dashboard** → Promotional Offers
2. **Fill in offer details**:
   - Title (will be notification title)
   - Description (will be notification message)
   - Icon (will be notification icon)
   - Reward type and value
3. **Set scheduling**:
   - Start Date (optional)
   - End Date (determines notification expiry)
4. **Display Settings**:
   - ✅ Show as Modal (popup)
   - ✅ Show as Notification (banner)
   - Priority (1-100, lower = higher priority)
5. **Click "Create Promotional Offer"**

**What Happens**:
- Promo offer created in database
- Temporary notification auto-created
- Linked together via `notification_id`
- Appears in both modal and banner
- Auto-expires when offer ends

### Templates with Notifications

The form includes quick templates:
- **Happy Hour** - 2 hour flash sale
- **Free Coffee** - Limited vouchers
- **Bonus Beans** - Instant reward
- **BOGO** - Buy one get one

All templates automatically create notifications when "Show as Notification" is enabled.

## Notification Behavior

### **Expiry Calculation**
```javascript
if (end_date exists) {
  expiry_hours = hours_until_end_date
} else {
  expiry_hours = 24 // default
}
```

### **First View Tracking**
- Notification marked as "shown" when first displayed to ANY user
- Countdown starts from first view
- After expiry, notification deactivated forever

### **Dismissal**
- Users can dismiss notification (24 hour timeout)
- Dismissal is per-user, not global
- Notification still shows to other users

### **Rotation**
- Appears in rotating messageboard
- Swipeable on mobile
- Auto-rotates every 4.5 seconds
- Pauses on hover

## Examples

### Example 1: Morning Flash Sale
```
Staff creates at 9am:
- Title: "☕ Morning Special!"
- Description: "Free pastry with any coffee until noon!"
- End Date: Today at 12pm
- Show as Notification: ✅

Result:
- Notification created with 3 hour expiry
- Shows in banner from 9am-12pm
- Auto-expires at noon
- No manual cleanup needed
```

### Example 2: Weekend Event
```
Staff creates Friday 5pm:
- Title: "🎵 Live Music Weekend!"
- Description: "Join us Saturday & Sunday for live performances!"
- End Date: Sunday 11:59pm
- Show as Notification: ✅

Result:
- Notification created with ~55 hour expiry
- Shows all weekend in banner
- Auto-expires Sunday night
- Promotes the event effectively
```

### Example 3: Limited Vouchers
```
Staff creates:
- Title: "🎁 First 50 Customers!"
- Description: "Free coffee voucher - limited to first 50!"
- Total Redemption Limit: 50
- End Date: None (or far future)
- Show as Notification: ✅

Result:
- Notification shows in banner
- Modal popup for redemption
- When 50 redeemed, offer closes
- Notification expires 24 hours after first shown
```

## Benefits

### ✅ **For Staff**
- One action creates both modal and notification
- No manual notification management
- Auto-cleanup when offer ends
- Consistent messaging across channels

### ✅ **For Customers**
- See offers in multiple places
- Can dismiss if not interested
- Rotating banner keeps it fresh
- Clear, time-sensitive messaging

### ✅ **For System**
- Automatic expiry handling
- Synced updates
- No orphaned notifications
- Clean database

## Monitoring

### Check Active Promo Notifications
```sql
SELECT 
  po.title,
  po.active,
  po.end_date,
  n.is_temporary,
  n.first_shown_at,
  n.active as notification_active
FROM promotional_offers po
LEFT JOIN notifications n ON n.id = po.notification_id
WHERE po.show_as_notification = true
ORDER BY po.created_at DESC;
```

### Check Expired Promo Notifications
```sql
SELECT 
  po.title,
  po.end_date,
  n.first_shown_at,
  n.first_shown_at + (n.auto_expire_hours || ' hours')::INTERVAL as expired_at
FROM promotional_offers po
JOIN notifications n ON n.id = po.notification_id
WHERE n.is_temporary = true
  AND n.active = false
ORDER BY n.first_shown_at DESC;
```

## Tips & Best Practices

1. **Always set end dates for time-sensitive offers**
   - Ensures notification expires automatically
   - Prevents stale messages

2. **Use high priority (1-5) for urgent offers**
   - Flash sales should be priority 1-2
   - Regular offers can be 5-10

3. **Clear, urgent messaging**
   - "Limited time!", "Today only!", "First 50!"
   - Include specific timeframes

4. **Test with both toggles**
   - Modal only: For targeted offers
   - Notification only: For awareness
   - Both: For maximum visibility

5. **Monitor redemptions**
   - Check if notification is driving redemptions
   - Adjust messaging/timing as needed

## Migration Required

Run these migrations:
1. `20251017_add_temporary_notifications.sql` - Adds temporary notification feature
2. `20251017_link_promo_offers_to_notifications.sql` - Links promo offers to notifications

Both will run automatically on next deployment.

## Summary

✅ **Promotional offers auto-create temporary notifications**  
✅ **One form creates both modal and banner message**  
✅ **Notifications auto-expire when offer ends**  
✅ **Changes sync automatically**  
✅ **No manual cleanup needed**  
✅ **Perfect for flash sales and limited offers**  

Use this integration to maximize visibility of your promotional offers! 🎉
