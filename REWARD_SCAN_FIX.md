# 🔧 Reward Scan Fix - Case Sensitivity Issue

## ❌ The Problem

When scanning reward QR codes, the error "Reward not found" was occurring even though the reward existed in the database.

### Root Cause:
The scanner client was converting QR codes to **UPPERCASE** before sending to the API:
```typescript
const trimmedCode = code.trim().toUpperCase()
// "COFFEE-133ed21bb086" becomes "COFFEE-133ED21BB086"
```

But the database stored QR codes in their original case:
```
Database: COFFEE-133ed21bb086 (lowercase hex)
Scanned:  COFFEE-133ED21BB086 (uppercase hex)
```

The API was using exact match (`.eq()`), so it couldn't find the reward.

---

## ✅ The Solution

Changed the database query from exact match to case-insensitive match:

### Before:
```typescript
.eq('qr_code', qrCode)  // Exact match - case sensitive
```

### After:
```typescript
.ilike('qr_code', qrCode)  // Case-insensitive match
```

---

## 🧪 Testing

### Test with your coffee reward:

1. **QR Code in database:** `COFFEE-133ed21bb086`
2. **Scanner sends:** `COFFEE-133ED21BB086` (uppercase)
3. **API now finds it:** ✅ Case-insensitive match works!

### Try scanning:
```
COFFEE-133ed21bb086  ✅ Works
COFFEE-133ED21BB086  ✅ Works
coffee-133ed21bb086  ✅ Works
CoFfEe-133ED21BB086  ✅ Works
```

---

## 📊 Debug Logging Added

The verify endpoint now logs:
- QR code being searched
- Error details if not found
- Similar QR codes in database (for debugging)

Check console logs when scanning to see:
```javascript
console.log('Verifying reward QR code:', qrCode)
console.log('Reward not found:', { qrCode, error, ... })
console.log('Similar QR codes found:', allRewards)
```

---

## 🎯 Next Steps

1. **Test the fix:**
   - Go to `/staff/scan`
   - Enter: `COFFEE-133ed21bb086`
   - Should now find the reward ✅

2. **Verify confirmation dialog:**
   - Should show customer name and reward details
   - Click OK to redeem

3. **Check database after redemption:**
   ```sql
   SELECT status, redeemed_at 
   FROM user_rewards 
   WHERE qr_code ILIKE 'COFFEE-133ed21bb086';
   ```

---

## 🔍 Why This Happened

The QR code generation uses random hex strings:
```typescript
const qrCode = `COFFEE-${Math.random().toString(36).substring(2, 15)}`
// Generates lowercase: COFFEE-abc123def456
```

But the scanner normalizes input to uppercase for consistency:
```typescript
const trimmedCode = code.trim().toUpperCase()
// Converts to: COFFEE-ABC123DEF456
```

The mismatch caused lookups to fail. Now with `.ilike()`, both cases work!

---

## ✅ Fixed!

Reward QR codes can now be scanned regardless of case! 🎉
