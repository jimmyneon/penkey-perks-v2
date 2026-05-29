# Pinky POS App Integration Guide

## Overview

The Pinky POS app integrates with the Perks loyalty system via REST APIs. This guide explains the QR code scanning flow and API endpoints.

## QR Code Types

There are two types of QR codes that customers can show:

### 1. Profile QR Code
- **Format**: `PROFILE-{hex}`
- **Purpose**: Identify customer and retrieve their loyalty data
- **Generated**: From the QR button in the Perks app navigation
- **Used for**: Awarding beans, viewing customer info, selecting vouchers

### 2. Voucher QR Code
- **Format**: `VOUCHER-{random}-{customer_id}-{timestamp}`
- **Purpose**: Redeem a specific voucher
- **Generated**: When customer converts beans to a voucher
- **Used for**: Quick redemption of a specific voucher

## API Endpoints

### Base URL
```
https://your-perks-domain.com/api/pos
```

### Authentication
All endpoints require:
- **Header**: `Authorization: Bearer {PERKS_API_KEY}`
- Get the API key from the Perks environment variables

### 1. Scan QR Code (Unified Endpoint)

**Endpoint**: `POST /api/pos/scan`

**Description**: Scans either a profile QR or voucher QR and returns customer info + voucher data

**Request Body**:
```json
{
  "qr_data": "PROFILE-abc123..."  // or "VOUCHER-xyz-uuid-1234567890"
}
```

**Response (Profile QR)**:
```json
{
  "type": "profile",
  "customer": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+44 7123 456789",
    "avatar_url": "https://..."
  },
  "bean_balance": {
    "current_beans": 12,
    "lifetime_beans": 150,
    "visit_count": 25
  },
  "vouchers": [
    {
      "id": "uuid",
      "qr_code": "VOUCHER-...",
      "status": "active",
      "expires_at": "2026-06-28T12:00:00Z",
      "voucher_templates": {
        "id": "uuid",
        "name": "Free Coffee",
        "description": "Get any coffee for free",
        "category": "coffee",
        "bean_threshold": 10
      }
    }
  ],
  "can_award_bean": true
}
```

**Response (Voucher QR)**:
```json
{
  "type": "voucher",
  "customer": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+44 7123 456789",
    "avatar_url": "https://..."
  },
  "bean_balance": {
    "current_beans": 2,
    "lifetime_beans": 150,
    "visit_count": 25
  },
  "voucher": {
    "id": "uuid",
    "qr_code": "VOUCHER-...",
    "name": "Free Coffee",
    "description": "Get any coffee for free",
    "category": "coffee",
    "bean_threshold": 10,
    "expires_at": "2026-06-28T12:00:00Z"
  }
}
```

### 2. Record Visit / Award Beans

**Endpoint**: `POST /api/pos/record-visit`

**Description**: Records a customer visit and awards beans based on rules

**Request Body**:
```json
{
  "userId": "uuid",
  "beanRules": {
    "foodDrinkCombo": true,
    "reusableCup": false,
    "penkeyCup": true,
    "before9am": false,
    "after230pm": true,
    "monthlySpecial": false,
    "broughtFriend": false
  },
  "menuItems": [
    {
      "name": "Latte",
      "price": 3.50,
      "category": "coffee"
    }
  ],
  "staffId": "uuid",
  "locationId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "beansAwarded": 3,
  "baseBeans": 1,
  "bonusBeans": 2
}
```

**Bean Rules**:
- `foodDrinkCombo`: +1 bean (food + drink)
- `reusableCup`: +1 bean
- `penkeyCup`: +1 bean
- `before9am`: +1 bean
- `after230pm`: +1 bean
- `monthlySpecial`: +2 beans
- `broughtFriend`: +2 beans

### 3. Redeem Voucher

**Endpoint**: `POST /api/pos/redeem-voucher`

**Description**: Redeems a voucher (can use voucher_id or qr_code)

**Request Body**:
```json
{
  "voucher_id": "uuid",  // optional
  "qr_code": "VOUCHER-...",  // optional (alternative to voucher_id)
  "staff_id": "uuid"  // optional
}
```

**Response**:
```json
{
  "success": true,
  "voucher": {
    "id": "uuid",
    "name": "Free Coffee",
    "description": "Get any coffee for free",
    "category": "coffee"
  }
}
```

## Recommended POS App Flow

### Flow 1: Customer Shows Profile QR

1. **Customer shows profile QR** (from Perks app)
2. **Staff scans QR** → Call `POST /api/pos/scan`
3. **POS displays**:
   - Customer name, email, phone
   - Current bean balance
   - List of active vouchers
   - "Award Bean" button (if `can_award_bean: true`)
4. **Staff takes order** → Customer purchases items
5. **Staff applies bean rules** → Select applicable bonuses
6. **Staff awards beans** → Call `POST /api/pos/record-visit`
7. **If customer wants to use voucher**:
   - Staff selects voucher from list
   - Call `POST /api/pos/redeem-voucher` with `voucher_id`
   - Apply discount/free item to order

### Flow 2: Customer Shows Voucher QR

1. **Customer shows voucher QR** (from Perks app)
2. **Staff scans QR** → Call `POST /api/pos/scan`
3. **POS displays**:
   - Customer name, email, phone
   - Current bean balance
   - **The specific voucher** (pre-selected)
4. **Staff confirms redemption** → Call `POST /api/pos/redeem-voucher` with `qr_code`
5. **Apply discount/free item** to order
6. **Staff can still award beans** → Call `POST /api/pos/record-visit` if needed

## Error Handling

All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid input)
- `401`: Unauthorized (invalid API key)
- `404`: Not found (customer/voucher not found)
- `429`: Too many requests (rate limited)
- `500`: Internal server error

Error response format:
```json
{
  "error": "Error message",
  "details": {...}  // optional
}
```

## Security Notes

- Always use HTTPS in production
- Keep the API key secure (environment variable)
- Implement rate limiting on your side
- Validate all user inputs

## Testing

You can test the endpoints using curl:

```bash
# Scan QR
curl -X POST https://your-perks-domain.com/api/pos/scan \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"qr_data": "PROFILE-abc123..."}'

# Record visit
curl -X POST https://your-perks-domain.com/api/pos/record-visit \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId": "uuid", "beanRules": {"reusableCup": true}}'

# Redeem voucher
curl -X POST https://your-perks-domain.com/api/pos/redeem-voucher \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"qr_code": "VOUCHER-...", "staff_id": "uuid"}'
```

## Database Migrations Required

Before using these endpoints, ensure these migrations have been applied:

1. `20260529000007_add_profile_qr_code.sql` - Adds profile QR code field
2. `20260529000008_update_voucher_qr_format.sql` - Updates voucher QR format to include customer_id

## Support

For issues or questions, contact the Perks development team.
