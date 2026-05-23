# 🏗️ Staff Scanner Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAFF SCANNER SYSTEM                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  /app/staff/scan/page.tsx                                        │
│  └─> NewScannerClient Component                                  │
│       │                                                           │
│       ├─> Camera Scanner (Html5Qrcode)                           │
│       │   └─> Auto-detects QR codes                              │
│       │                                                           │
│       ├─> Manual Input                                           │
│       │   └─> Text entry + validation                            │
│       │                                                           │
│       └─> QR Code Router                                         │
│           ├─> PROFILE-xxx → Customer Profile Flow                │
│           └─> REWARD-xxx  → Reward Redemption Flow               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API LAYER                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Customer Profile APIs:                                          │
│  ├─> /api/staff/get-customer-by-qr                               │
│  ├─> /api/check-in                                               │
│  ├─> /api/stamps/add                                             │
│  └─> /api/staff/award-points                                     │
│                                                                   │
│  Reward Redemption APIs:                                         │
│  ├─> /api/admin/rewards/verify-by-qr  (NEW)                      │
│  └─> /api/admin/rewards/redeem                                   │
│                                                                   │
│  Notification APIs:                                              │
│  └─> /api/staff/send-multi-channel-message                       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Tables:                                                          │
│  ├─> users (customer data)                                       │
│  ├─> user_rewards (reward instances)                             │
│  ├─> rewards (reward catalog)                                    │
│  ├─> coffee_stamps (stamp tracking)                              │
│  ├─> check_ins (visit history)                                   │
│  ├─> transactions (audit log)                                    │
│  └─> email_queue (notification queue)                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Customer Profile Scan Flow

```
┌─────────┐
│ STAFF   │
│ SCANS   │
│ QR CODE │
└────┬────┘
     │ PROFILE-abc123
     ▼
┌─────────────────────────────┐
│ processQRCode()             │
│ - Detects PROFILE format    │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ API: get-customer-by-qr     │
│ - Parse QR code             │
│ - Lookup user in DB         │
│ - Get beans, stamps, etc.   │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Display Customer Info       │
│ - Name, email, phone        │
│ - Current beans             │
│ - Stamp count               │
│ - Lifetime points           │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Show Action Buttons         │
│ - Check-in                  │
│ - Add Stamp                 │
│ - Award Points              │
└─────────────────────────────┘
```

---

### 2. Reward Redemption Flow

```
┌─────────┐
│ STAFF   │
│ SCANS   │
│ QR CODE │
└────┬────┘
     │ REWARD-xyz789
     ▼
┌─────────────────────────────────────┐
│ processQRCode()                     │
│ - Detects REWARD/COFFEE format      │
│ - Routes to handleRewardRedemption()│
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ API: verify-by-qr                   │
│ ┌─────────────────────────────────┐ │
│ │ SELECT FROM user_rewards        │ │
│ │ WHERE qr_code = 'REWARD-xyz789' │ │
│ │ JOIN rewards, users             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Checks:                             │
│ ✓ Reward exists                     │
│ ✓ Status = 'active'                 │
│ ✓ Not expired                       │
│ ✓ Customer valid                    │
└────┬────────────────────────────────┘
     │
     ├─ Error? ──> Show Error Toast
     │
     ▼
┌─────────────────────────────────────┐
│ Show Confirmation Dialog            │
│                                     │
│ "Redeem reward for John Doe?"       │
│                                     │
│ Reward: Free Coffee                 │
│ Customer: John Doe (john@email.com) │
│                                     │
│ [Cancel]  [OK]                      │
└────┬────────────────────────────────┘
     │
     ├─ Cancel ──> Show "Cancelled" Toast
     │
     ▼ OK
┌─────────────────────────────────────┐
│ API: redeem                         │
│ ┌─────────────────────────────────┐ │
│ │ UPDATE user_rewards SET         │ │
│ │   status = 'redeemed',          │ │
│ │   redeemed_at = NOW()           │ │
│ │ WHERE id = reward_id            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ INSERT INTO transactions        │ │
│ │   action = 'reward_redeemed'    │ │
│ │   staff_id = current_staff      │ │
│ └─────────────────────────────────┘ │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Send Notifications (Async)          │
│ ┌─────────────────────────────────┐ │
│ │ API: send-multi-channel-message │ │
│ │ - Push notification             │ │
│ │ - Email notification            │ │
│ └─────────────────────────────────┘ │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Show Success Toast                  │
│ "🎉 Reward Redeemed!"               │
│ "Free Coffee redeemed for John Doe" │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Clear Input & Reset                 │
└─────────────────────────────────────┘
```

---

## Component Structure

```
NewScannerClient
├── State Management
│   ├── qrCode: string
│   ├── loading: boolean
│   ├── customer: Customer | null
│   ├── processing: boolean
│   ├── showScanner: boolean
│   └── scannerError: string | null
│
├── Effects
│   └── useEffect (showScanner)
│       └── Initialize Html5Qrcode
│           ├── Get cameras
│           ├── Start scanning
│           └── Cleanup on unmount
│
├── Functions
│   ├── processQRCode(code)
│   │   ├── Detect QR type
│   │   ├── Route to handler
│   │   └── Show results
│   │
│   ├── handleRewardRedemption(qrCode)
│   │   ├── Verify reward
│   │   ├── Show confirmation
│   │   ├── Redeem if confirmed
│   │   └── Send notifications
│   │
│   ├── handleCheckIn()
│   ├── handleAddStamp()
│   ├── handleReset()
│   ├── startScanner()
│   └── stopScanner()
│
└── UI Components
    ├── Header
    ├── Scanner Card
    │   ├── Camera Button
    │   ├── Manual Input
    │   └── QR Type Indicators
    ├── Customer Info Card
    │   ├── Customer Details
    │   └── Stats Grid
    ├── Quick Actions Card
    │   ├── Check-in Button
    │   ├── Add Stamp Button
    │   └── Award Points Link
    └── Camera Modal
        ├── Scanner View
        └── Close Button
```

---

## API Endpoint Details

### `/api/admin/rewards/verify-by-qr`

**Request:**
```json
POST /api/admin/rewards/verify-by-qr
{
  "qrCode": "REWARD-abc123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "reward": {
    "id": "uuid",
    "reward_name": "Free Coffee",
    "reward_description": "One free coffee of any size",
    "points_cost": 500,
    "expires_at": "2025-11-10T12:00:00Z",
    "qr_code": "REWARD-abc123"
  },
  "customer": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+44123456789"
  }
}
```

**Response (Error):**
```json
{
  "error": "This reward has already been redeemed"
}
```

---

### `/api/admin/rewards/redeem`

**Request:**
```json
POST /api/admin/rewards/redeem
{
  "userRewardId": "uuid"
}
```

**Response (Success):**
```json
{
  "success": true,
  "reward": {
    "name": "Free Coffee",
    "description": "One free coffee of any size"
  },
  "customer": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## Database Schema

### `user_rewards` Table

```sql
CREATE TABLE user_rewards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  reward_id UUID REFERENCES rewards(id),
  qr_code TEXT UNIQUE,
  status TEXT, -- 'active', 'redeemed', 'expired'
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  redeemed_at TIMESTAMP
);
```

### `transactions` Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  staff_id UUID REFERENCES users(id),
  action TEXT, -- 'reward_redeemed', 'check_in', etc.
  details JSONB,
  created_at TIMESTAMP
);
```

**Example Transaction:**
```json
{
  "reward_id": "uuid",
  "user_reward_id": "uuid",
  "reward_name": "Free Coffee",
  "redeemed_by_staff": "staff-uuid"
}
```

---

## Security & Permissions

```
┌─────────────────────────────────────┐
│ Request Arrives                     │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Check Authentication                │
│ - Verify session token              │
│ - Get user from Supabase            │
└────┬────────────────────────────────┘
     │
     ├─ Not authenticated ──> 401 Unauthorized
     │
     ▼
┌─────────────────────────────────────┐
│ Check Authorization                 │
│ - Query users table                 │
│ - Verify role = 'staff' or 'admin'  │
└────┬────────────────────────────────┘
     │
     ├─ Not staff/admin ──> 403 Forbidden
     │
     ▼
┌─────────────────────────────────────┐
│ Process Request                     │
│ - Validate input                    │
│ - Execute business logic            │
│ - Log transaction with staff_id     │
└─────────────────────────────────────┘
```

---

## Error Handling Strategy

```
┌─────────────────────────────────────┐
│ Error Occurs                        │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Categorize Error                    │
├─────────────────────────────────────┤
│ - Validation Error (400)            │
│ - Not Found (404)                   │
│ - Unauthorized (401)                │
│ - Forbidden (403)                   │
│ - Server Error (500)                │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Log Error                           │
│ - Console.error()                   │
│ - Include context                   │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Return User-Friendly Message        │
│ - Clear description                 │
│ - Actionable guidance               │
│ - No sensitive data                 │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Show Toast Notification             │
│ - Red for errors                    │
│ - 5 second duration                 │
│ - Dismissible                       │
└─────────────────────────────────────┘
```

---

## Performance Considerations

### Query Optimization
- Single query for reward verification (with JOINs)
- Indexed on `qr_code` column
- Minimal round trips to database

### Async Operations
- Notifications sent asynchronously
- Don't block redemption flow
- Fail silently if notification fails

### Caching
- Customer data cached in component state
- Reduces API calls for repeated actions
- Cleared on reset

---

## Monitoring & Logging

### What Gets Logged:
```javascript
// Verification
console.log('Verifying reward QR code:', qrCode)

// Redemption
console.log('Reward redeemed successfully:', {
  userRewardId,
  customerId,
  rewardName,
  staffId
})

// Errors
console.error('Redeem reward error:', error)
console.error('Failed to send notification:', notifError)
```

### Database Audit Trail:
Every redemption creates a transaction record with:
- Customer ID
- Staff ID
- Reward details
- Timestamp
- Full context in JSONB

---

## 🎯 System Benefits

### For Staff:
- ✅ Single interface for all QR codes
- ✅ Clear visual feedback
- ✅ Prevents mistakes with confirmations
- ✅ Fast and efficient workflow

### For Customers:
- ✅ Instant reward redemption
- ✅ Automatic notifications
- ✅ Seamless experience
- ✅ No manual verification needed

### For Business:
- ✅ Complete audit trail
- ✅ Staff accountability
- ✅ Fraud prevention
- ✅ Real-time analytics ready
- ✅ Scalable architecture
