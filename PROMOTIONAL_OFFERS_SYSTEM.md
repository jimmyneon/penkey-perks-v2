# Promotional Offers System

## Overview
A complete promotional offers messaging system that allows staff to create special offers that appear as modal popups when users open the app. Users can redeem offers to receive vouchers automatically.

## Features

### 1. **Modal Popup Offers**
- Offers appear as beautiful modal popups when users open the app
- Priority-based system (lower number = higher priority)
- Only shows highest priority unredeemed offer at a time
- Automatic tracking of views and redemptions

### 2. **Voucher Auto-Creation**
- Automatically creates vouchers when users redeem offers
- Configurable expiry time (default 48 hours)
- Unique QR codes for each voucher
- Links to existing rewards catalog or creates custom rewards

### 3. **Staff Interface**
- Easy-to-use form with quick templates
- Pre-built templates for common offers:
  - Happy Hour (20% off)
  - Free Coffee Voucher
  - Bonus Beans Boost
  - Buy One Get One Free
- Full customization options
- Real-time offer management (activate/deactivate/delete)

### 4. **Targeting & Scheduling**
- Target specific audiences:
  - All users
  - New users (< 7 days)
  - Returning users
  - VIP users (high beans)
- Bean range targeting (min/max beans)
- Date range scheduling (start/end dates)
- Redemption limits (per user and total)

### 5. **Display Options**
- Show as modal popup
- Show as notification banner
- Both options can be enabled simultaneously
- Customizable icons, buttons, and messaging

## Database Schema

### Tables Created

#### `promotional_offers`
Main table storing all promotional offers.

**Key Fields:**
- `title`, `description`, `terms` - Offer content
- `reward_type`, `reward_value` - What users get
- `icon`, `image_url`, `button_text` - Visual elements
- `redemption_limit` - Max redemptions per user
- `total_redemption_limit` - Total redemptions across all users
- `voucher_expiry_hours` - Voucher validity period
- `active` - Enable/disable offer
- `start_date`, `end_date` - Scheduling
- `target_audience`, `min_beans`, `max_beans` - Targeting
- `priority` - Display priority (1 = highest)
- `show_as_modal`, `show_as_notification` - Display settings

#### `user_promotional_offers`
Tracks user interactions with offers.

**Key Fields:**
- `user_id`, `offer_id` - Links
- `viewed_at` - When user saw the offer
- `redeemed_at` - When user redeemed
- `voucher_id` - Link to created voucher

#### `promotional_offer_rewards`
Links offers to rewards catalog.

**Key Fields:**
- `offer_id` - Link to offer
- `reward_id` - Link to existing reward (optional)
- `custom_*` fields - For custom rewards not in catalog

### Functions Created

#### `get_user_promotional_offers(p_user_id UUID)`
Returns active promotional offers for a specific user based on:
- Active status
- Date range
- Redemption limits
- User targeting criteria
- Bean range

#### `redeem_promotional_offer(p_user_id UUID, p_offer_id UUID)`
Redeems an offer for a user:
- Validates offer is active and available
- Checks redemption limits
- Creates voucher automatically
- Updates redemption count
- Returns voucher details

#### `mark_promotional_offer_viewed(p_user_id UUID, p_offer_id UUID)`
Tracks when a user views an offer (for analytics).

## API Endpoints

### User Endpoints

#### `GET /api/promotional-offers/get`
Get all active promotional offers for the current user.

**Response:**
```json
{
  "offers": [
    {
      "id": "uuid",
      "title": "🎉 Happy Hour - 20% Off",
      "description": "...",
      "reward_type": "discount",
      "reward_value": "20% off any drink",
      "icon": "🎉",
      "has_redeemed": false,
      "redemptions_remaining": 1
    }
  ]
}
```

#### `POST /api/promotional-offers/redeem`
Redeem a promotional offer.

**Request:**
```json
{
  "offerId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Offer redeemed successfully!",
  "voucher": {
    "id": "uuid",
    "code": "PROMO-ABC12345"
  }
}
```

#### `POST /api/promotional-offers/mark-viewed`
Mark an offer as viewed.

**Request:**
```json
{
  "offerId": "uuid"
}
```

### Staff Endpoints

#### `POST /api/staff/promotional-offers/create`
Create a new promotional offer (staff only).

**Request:**
```json
{
  "title": "🎉 Happy Hour - 20% Off",
  "description": "Happy Hour is NOW! Come grab your favorite coffee at 20% off!",
  "terms": "Valid for 2 hours only",
  "rewardType": "discount",
  "rewardValue": "20% off any drink",
  "icon": "🎉",
  "buttonText": "Redeem Now",
  "redemptionLimit": 1,
  "totalRedemptionLimit": 100,
  "voucherExpiryHours": 48,
  "autoCreateVoucher": true,
  "active": true,
  "targetAudience": "all",
  "priority": 10,
  "showAsModal": true,
  "showAsNotification": true
}
```

#### `GET /api/staff/promotional-offers/list`
Get all promotional offers (staff only).

#### `PUT /api/staff/promotional-offers/update`
Update a promotional offer (staff only).

#### `DELETE /api/staff/promotional-offers/delete?id=uuid`
Delete a promotional offer (staff only).

## Components

### `PromotionalOfferModal`
Beautiful modal component that displays offers to users.

**Features:**
- Gradient background with offer icon
- Reward details display
- Terms and conditions
- Redemption button
- Success state with voucher code
- Link to view rewards after redemption

**Props:**
```typescript
{
  offer: PromotionalOffer
  isOpen: boolean
  onClose: () => void
  onRedeemed?: () => void
}
```

### `PromotionalOfferForm`
Staff form for creating promotional offers.

**Features:**
- Quick templates for common offers
- Full customization options
- Validation
- Real-time preview
- Success feedback

### `PromotionalOffersProvider`
Provider component that automatically shows modal offers when users open the app.

**Usage:**
Wrap your app layout with this provider to enable automatic offer popups.

## Hooks

### `usePromotionalOffers()`
React hook for managing promotional offers.

**Returns:**
```typescript
{
  offers: PromotionalOffer[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getModalOffers: () => PromotionalOffer[]
  getNotificationOffers: () => PromotionalOffer[]
  getTopPriorityModalOffer: () => PromotionalOffer | null
}
```

## Usage Guide

### For Staff: Creating a Promotional Offer

1. **Navigate to Promotional Offers**
   - Go to Staff Dashboard
   - Click "Promo Offers" card

2. **Choose a Template or Create Custom**
   - Click a quick template to pre-fill common offers
   - Or fill in custom details

3. **Configure Offer Details**
   - **Title**: Eye-catching title with emoji
   - **Description**: Clear explanation of the offer
   - **Terms**: Optional terms and conditions
   - **Icon**: Emoji to display
   - **Button Text**: Call-to-action text

4. **Set Reward Details**
   - **Reward Type**: Free item, discount, bonus beans, or custom
   - **Reward Value**: What the user gets (e.g., "Free Coffee")
   - **Reward Description**: Additional details

5. **Configure Redemption**
   - **Per User Limit**: How many times each user can redeem
   - **Total Limit**: Total redemptions across all users
   - **Voucher Expiry**: How long voucher is valid (hours)
   - **Auto-Create Voucher**: Enable to automatically create vouchers

6. **Set Schedule (Optional)**
   - **Start Date**: When offer becomes active
   - **End Date**: When offer expires

7. **Target Audience (Optional)**
   - **Target Audience**: All, new, returning, or VIP users
   - **Min/Max Beans**: Target users by bean count

8. **Display Settings**
   - **Priority**: Lower number = higher priority (1-100)
   - **Show as Modal**: Display as popup when app opens
   - **Show as Notification**: Also show in notification banner
   - **Active**: Enable/disable offer

9. **Create Offer**
   - Click "Create Promotional Offer"
   - Offer is now live!

### For Users: Redeeming an Offer

1. **Open the App**
   - Promotional offer modal appears automatically
   - Shows highest priority unredeemed offer

2. **Review Offer**
   - Read offer details
   - Check reward value
   - Review terms if any

3. **Redeem Offer**
   - Click "Redeem Now" button
   - Voucher is created automatically
   - Voucher code is displayed

4. **Use Voucher**
   - Go to "My Rewards" section
   - Show voucher QR code at counter
   - Staff scans to redeem

## Migration

To apply the promotional offers system to your database:

```bash
# Run the migration
psql -d your_database < supabase/migrations/20251014_promotional_offers_system.sql
```

Or through Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `20251014_promotional_offers_system.sql`
3. Run query

## Security

### Row Level Security (RLS)
All tables have RLS enabled:

- **promotional_offers**: Staff can manage, users can view active offers
- **user_promotional_offers**: Users can only see/manage their own interactions
- **promotional_offer_rewards**: Staff can manage, users can view

### Function Security
All functions use `SECURITY DEFINER` to ensure proper access control while maintaining performance.

## Best Practices

### Creating Effective Offers

1. **Keep titles short and exciting**
   - Use emojis for visual appeal
   - Create urgency when appropriate

2. **Be clear about the value**
   - Specify exactly what users get
   - Avoid vague language

3. **Set appropriate limits**
   - Use per-user limits to prevent abuse
   - Set total limits for limited-time offers

4. **Choose the right expiry time**
   - 24-48 hours for time-sensitive offers
   - Longer for special promotions

5. **Target appropriately**
   - New users: Welcome offers
   - Returning users: Win-back offers
   - VIP users: Exclusive rewards

### Managing Offers

1. **Monitor redemptions**
   - Check stats regularly
   - Deactivate if limits reached

2. **Don't overwhelm users**
   - Limit active modal offers to 1-2 at a time
   - Use priority system effectively

3. **Test before going live**
   - Create test offers with high priority
   - Verify modal appearance and redemption flow

4. **Clean up expired offers**
   - Delete or deactivate old offers
   - Keep the list manageable

## Troubleshooting

### Offer not appearing
- Check if offer is active
- Verify date range is current
- Check user meets targeting criteria
- Ensure user hasn't already redeemed (if limit is 1)

### Redemption failing
- Check total redemption limit
- Verify user hasn't exceeded per-user limit
- Ensure offer is still active
- Check date range

### Voucher not created
- Verify `auto_create_voucher` is true
- Check reward configuration
- Review database logs for errors

## Future Enhancements

Potential additions to the system:

1. **Analytics Dashboard**
   - Redemption rates
   - User engagement metrics
   - A/B testing support

2. **Conditional Offers**
   - Based on purchase history
   - Weather-based triggers
   - Time-of-day targeting

3. **Multi-Reward Offers**
   - Bundle multiple rewards
   - Tiered rewards based on user level

4. **Push Notification Integration**
   - Send push when new offer is available
   - Reminder notifications

5. **Email Integration**
   - Send offer emails
   - Follow-up reminders

## Support

For issues or questions:
1. Check this documentation
2. Review database logs
3. Test with a simple offer first
4. Verify all migrations are applied

---

**System Status**: ✅ Ready for Production

**Last Updated**: October 14, 2025
