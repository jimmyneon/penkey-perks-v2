# POS Team Implementation Guide - QR Code Scanning

## What You Need to Build

Add a QR scan button to the POS app interface. Place it next to the ticket/staff area where staff can easily access it.

## Settings Configuration

Add a setting in the POS app for:
- **Perks App Domain**: The URL of the Perks app (e.g., `https://perks.penkey.co.uk`)
- **API Key**: The PERKS_API_KEY for authentication

These should be stored locally in the POS app settings (not sent to Perks). Get the API key from the Perks team and configure it in your POS app settings screen.

**Note**: You do NOT need to call any Perks API to configure these settings. Just store them in your POS app's local settings/storage.

## UI Requirements

1. **Add Scan Button**
   - Location: Next to tickets or in the staff area
   - Icon: QR code scanner icon
   - Action: Opens camera/scanner when tapped

2. **Scanner Screen**
   - Camera view for scanning QR codes
   - "Cancel" button to close scanner
   - Show "Scanning..." indicator while camera is active

3. **Slide-Up Panel (After Scan)**
   When a QR code is successfully scanned, show a slide-up panel from the bottom with:
   - Customer name and info
   - Current bean balance
   - List of active vouchers (if any)
   - "Award Bean" button (if customer hasn't visited today)
   - "Apply Voucher" buttons for each available voucher
   - "Close" button to dismiss the panel

## What Happens When They Scan

### Step 1: Scan QR Code
When a customer shows their QR code (from the Perks app), staff scans it.

### Step 2: Call Perks API
Make this HTTP request:

```
POST https://your-perks-domain.com/api/pos/scan
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json
Body:
  {
    "qr_data": "the_scanned_qr_string"
  }
```

**Supported QR Data Formats:**

1. **Perks Profile QR**: `PROFILE-{hex}` - Customer's profile QR from Perks app
2. **Perks Voucher QR**: `VOUCHER-{random}-{customer_id}-{timestamp}` - Voucher QR from Perks app
3. **POS JSON Format**: `{"type":"customer","id":"uuid","email":"...","timestamp":...}` - Your current format

All three formats are now supported by the API.

### Step 3: Display Customer Info
The API returns customer data. Show this in a popup/modal:

**Customer Info:**
- Name
- Email
- Phone
- Bean balance (current beans)
- Active vouchers (list)

**If it's a voucher QR:**
- Show the specific voucher details
- Show "Redeem" button

**If it's a profile QR:**
- Show list of all active vouchers
- Show "Award Bean" button (if customer hasn't visited today)
- Let staff select which voucher to use

### Step 4: Award Beans (Optional)
After taking the order, staff can award beans:

```
POST https://your-perks-domain.com/api/pos/record-visit
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json
Body:
  {
    "userId": "customer_uuid_from_scan",
    "beanRules": {
      "reusableCup": true,
      "foodDrinkCombo": false,
      "penkeyCup": false,
      "before9am": false,
      "after230pm": true,
      "monthlySpecial": false,
      "broughtFriend": false
    },
    "menuItems": [
      {
        "name": "Latte",
        "price": 3.50
      }
    ],
    "staffId": "staff_uuid",
    "locationId": "location_string"
  }
```

**Bean Rules (checkboxes in UI):**
- Reusable cup: +1 bean
- Food + drink combo: +1 bean
- Penkey cup: +1 bean
- Before 9am: +1 bean
- After 2:30pm: +1 bean
- Monthly special: +2 beans
- Brought friend: +2 beans

### Step 5: Redeem Voucher
When staff confirms voucher use:

```
POST https://your-perks-domain.com/api/pos/redeem-voucher
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json
Body:
  {
    "voucher_id": "voucher_uuid",  // OR
    "qr_code": "the_scanned_voucher_qr",
    "staff_id": "staff_uuid"
  }
```

Then apply the discount/free item to the order.

**Note**: When a voucher is successfully redeemed, the Perks app will show a success animation to the customer (if they have the app open).

## API Key

You'll need the `PERKS_API_KEY` from the Perks app environment. Ask the Perks team for this.

## Error Handling

If the API returns an error:
- 401: Check API key is correct
- 404: Customer/voucher not found
- 400: Invalid QR format or already redeemed
- 429: Too many requests (wait a bit)
- 500: Server error (try again)

Show a friendly error message to staff.

## Testing

1. Get a test customer QR code from the Perks app
2. Scan it with your POS app
3. Verify customer info displays correctly
4. Try awarding beans
5. Try redeeming a voucher

## Summary

1. Add scan button to UI
2. Implement camera/scanner
3. Call `/api/pos/scan` when QR is scanned
4. Display customer info and vouchers
5. Call `/api/pos/record-visit` to award beans
6. Call `/api/pos/redeem-voucher` to redeem vouchers

That's it. The Perks app handles all the backend logic.
