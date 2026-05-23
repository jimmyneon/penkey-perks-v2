# Promotional Offers - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Apply the Database Migration

Run the migration to create the promotional offers tables:

```bash
# If using Supabase CLI
supabase db push

# Or manually through Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of: supabase/migrations/20251014_promotional_offers_system.sql
# 3. Run the query
```

### Step 2: Access the Staff Interface

1. Log in as a staff member
2. Go to **Staff Dashboard**
3. Click the **"Promo Offers"** card (new amber/orange gradient card)

### Step 3: Create Your First Offer

**Quick Option - Use a Template:**

1. Click on any quick template (e.g., "🎉 Happy Hour - 20% Off")
2. Adjust the details if needed
3. Scroll down and click "Create Promotional Offer"
4. Done! ✅

**Custom Option:**

Fill in these required fields:
- **Title**: e.g., "🎁 Free Coffee Today!"
- **Description**: e.g., "Get a FREE regular coffee on us!"
- **Reward Type**: Select "Free Item"
- **Reward Value**: e.g., "Free Regular Coffee"

Then click "Create Promotional Offer"

### Step 4: Test the Offer

1. Open the app as a regular user (not staff)
2. The offer should appear as a modal popup
3. Click "Redeem Now"
4. Check "My Rewards" to see the voucher

## 📋 Common Use Cases

### Happy Hour Promotion
```
Title: 🎉 Happy Hour - 20% Off
Description: Happy Hour is NOW! Come grab your favorite coffee at 20% off for the next 2 hours!
Reward Type: Discount
Reward Value: 20% off any drink
Voucher Expiry: 2 hours
Total Limit: 50 redemptions
```

### Welcome Offer for New Users
```
Title: 👋 Welcome! Free Coffee on Us
Description: Welcome to Penkey! Enjoy a FREE coffee as our gift to you!
Reward Type: Free Item
Reward Value: Free Regular Coffee
Target Audience: New Users (< 7 days)
Redemption Limit: 1 per user
```

### VIP Exclusive Offer
```
Title: ⭐ VIP Exclusive - BOGO
Description: You're a VIP! Buy one drink, get one FREE!
Reward Type: Free Item
Reward Value: BOGO - Free Second Drink
Target Audience: VIP Users
Min Beans: 100
Redemption Limit: 1 per user
```

### Flash Sale
```
Title: ⚡ Flash Sale - Next Hour Only!
Description: Lightning deal! 30% off all drinks for the next hour!
Reward Type: Discount
Reward Value: 30% off any drink
Voucher Expiry: 1 hour
End Date: [Set to 1 hour from now]
Total Limit: 30 redemptions
```

## 🎯 Key Settings Explained

### Priority (1-100)
- **1-10**: Highest priority (shows first)
- **11-50**: Medium priority
- **51-100**: Low priority

Lower number = shown first if multiple offers are active.

### Redemption Limits
- **Per User Limit**: How many times ONE user can redeem (usually 1)
- **Total Limit**: Total redemptions across ALL users (e.g., 50)

### Voucher Expiry
How long the voucher is valid after redemption:
- **2 hours**: For flash sales, happy hour
- **24 hours**: For daily specials
- **48 hours**: Default, good for most offers
- **168 hours (7 days)**: For longer promotions

### Display Options
- **Show as Modal**: ✅ Always enable for promotional offers
- **Show as Notification**: Optional, also shows in banner
- **Active**: Toggle to enable/disable without deleting

## 🔧 Managing Offers

### View All Offers
Staff Dashboard → Promo Offers → See list of all offers

### Activate/Deactivate
Click the "Activate" or "Deactivate" button on any offer

### Delete Offer
Click the "Delete" button (requires confirmation)

### Check Stats
View redemption counts in the offer list

## ⚠️ Important Notes

1. **Only highest priority unredeemed offer shows as modal**
   - Users see one modal at a time
   - After redeeming, next offer may appear on next app open

2. **Vouchers are created automatically**
   - Users don't need to do anything extra
   - Voucher appears in their "My Rewards" section

3. **QR codes are unique**
   - Each voucher has a unique code
   - Staff can scan to redeem

4. **Offers respect targeting**
   - New users only see new user offers
   - VIP users see VIP offers
   - Bean range is checked automatically

## 🐛 Troubleshooting

**Offer not showing to users?**
- ✅ Check "Active" is enabled
- ✅ Verify date range (start/end dates)
- ✅ Check user meets targeting criteria
- ✅ Ensure user hasn't already redeemed

**Can't create offer?**
- ✅ Make sure you're logged in as staff
- ✅ Fill in all required fields (marked with *)
- ✅ Check reward type and value are set

**Voucher not created?**
- ✅ Verify "Auto-Create Voucher" is enabled
- ✅ Check database logs for errors

## 📱 User Experience

When a user opens the app with an active promotional offer:

1. **Modal appears automatically** with offer details
2. User reads the offer and clicks **"Redeem Now"**
3. **Voucher is created instantly** with unique QR code
4. Success message shows with voucher code
5. User can click **"View My Rewards"** to see voucher
6. User shows voucher QR code at counter
7. Staff scans QR code to redeem

## 🎨 Customization Tips

### Icons
Use emojis for visual appeal:
- 🎁 Gifts/rewards
- ☕ Coffee-related
- 🎉 Celebrations
- ⭐ VIP/special
- ⚡ Flash sales
- 🔥 Hot deals

### Button Text
Make it action-oriented:
- "Redeem Now" (default)
- "Claim Offer"
- "Get My Reward"
- "Grab This Deal"

### Titles
Keep short and exciting:
- Use emojis
- Create urgency when appropriate
- Be specific about the value

## 📊 Best Practices

1. **Start with one offer** - Test the system before creating multiple
2. **Set reasonable limits** - Prevent abuse with per-user limits
3. **Monitor redemptions** - Check stats regularly
4. **Clean up old offers** - Delete or deactivate expired offers
5. **Don't overwhelm users** - Keep active modal offers to 1-2 at a time

## 🎓 Next Steps

Once comfortable with basic offers:

1. **Experiment with targeting** - Create offers for specific user segments
2. **Try scheduling** - Set up offers in advance with start/end dates
3. **Use priority system** - Control which offers show first
4. **Monitor analytics** - Track which offers perform best

---

**Need Help?** Check the full documentation in `PROMOTIONAL_OFFERS_SYSTEM.md`

**Ready to create your first offer?** Go to Staff Dashboard → Promo Offers! 🚀
