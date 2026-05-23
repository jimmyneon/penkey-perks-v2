# 🛡️ Anti-Cheat Measures for Penkey Perks

## Current Protection
- ✅ GPS validation (must be at Penkey location)
- ✅ Rate limiting (1 stamp per hour, 1 game per day)
- ✅ Daily limits on check-ins and games

---

## 🔒 Additional Anti-Cheat Measures

### **1. QR Code Rotation (RECOMMENDED)**
**What:** Generate unique, time-limited QR codes that expire
**How:**
- QR code changes every 5-15 minutes
- Each code can only be used once
- Code includes encrypted timestamp + location ID
- Server validates code hasn't expired

**Implementation:**
```typescript
// Generate rotating QR code
const qrCode = {
  code: generateHash(locationId + timestamp + secret),
  expires: Date.now() + (5 * 60 * 1000), // 5 minutes
  locationId: 'penkey-main',
  nonce: randomUUID() // One-time use
}
```

**Benefits:**
- ✅ Can't screenshot and reuse QR code
- ✅ Can't share QR code with friends
- ✅ Must physically be at location when scanning

---

### **2. Device Fingerprinting**
**What:** Track unique device characteristics
**How:**
- Browser fingerprint (user agent, screen size, timezone, etc.)
- Limit stamps per device per day
- Flag suspicious patterns (multiple accounts, same device)

**Implementation:**
```typescript
// Track device fingerprint
const fingerprint = await generateFingerprint({
  userAgent: navigator.userAgent,
  screenResolution: `${screen.width}x${screen.height}`,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: navigator.language,
  platform: navigator.platform
})

// Store in database
await supabase.from('device_logs').insert({
  user_id: userId,
  fingerprint: fingerprint,
  action: 'stamp_added'
})
```

**Benefits:**
- ✅ Detect multiple accounts on same device
- ✅ Flag suspicious activity patterns
- ✅ Limit abuse from single device

---

### **3. Staff Verification Code**
**What:** Staff enters a code visible only at register
**How:**
- Display 4-digit code on staff screen
- Customer must enter code to complete stamp
- Code rotates every few minutes

**Implementation:**
```typescript
// Customer scans QR → enters staff code
const staffCode = displayedOnRegister // e.g., "7392"
const userCode = userInput // What customer enters

if (staffCode === userCode) {
  // Award stamp
} else {
  // Reject
}
```

**Benefits:**
- ✅ Requires physical presence at counter
- ✅ Staff can see who's scanning
- ✅ Very hard to cheat

---

### **4. Bluetooth Beacon Detection**
**What:** Detect Penkey's Bluetooth beacon
**How:**
- Place Bluetooth beacon at Penkey location
- App detects beacon proximity
- Only allow stamps when beacon detected

**Implementation:**
```typescript
// Check for Penkey beacon
const beaconDetected = await detectBeacon('PENKEY-BEACON-UUID')

if (!beaconDetected) {
  return { error: 'Must be at Penkey to add stamp' }
}
```

**Benefits:**
- ✅ Very accurate location detection
- ✅ Works indoors (GPS doesn't)
- ✅ Hard to spoof

**Cost:** ~£20-50 for beacon hardware

---

### **5. IP Address Tracking**
**What:** Track IP addresses and flag suspicious patterns
**How:**
- Log IP address with each stamp
- Flag if same IP used by many accounts
- Flag if account uses many different IPs

**Implementation:**
```typescript
// Log IP address
const ip = request.headers.get('x-forwarded-for') || request.ip

await supabase.from('activity_logs').insert({
  user_id: userId,
  ip_address: ip,
  action: 'stamp_added'
})

// Check for suspicious patterns
const recentIPs = await getRecentIPsForUser(userId)
if (recentIPs.length > 5) {
  // Flag for review
}
```

**Benefits:**
- ✅ Detect VPN/proxy abuse
- ✅ Detect account sharing
- ✅ Easy to implement

---

### **6. Photo Verification (Advanced)**
**What:** Customer takes photo of receipt or product
**How:**
- Require photo upload with stamp request
- Staff reviews photos (manual or AI)
- Reject if photo doesn't match

**Benefits:**
- ✅ Proves purchase
- ✅ Very hard to fake
- ✅ Creates audit trail

**Downside:** Adds friction to user experience

---

### **7. Time-Based Patterns**
**What:** Detect suspicious timing patterns
**How:**
- Flag if stamps always at exact same time
- Flag if stamps too frequent (e.g., 10 in 1 day)
- Flag if stamps at unusual hours (when closed)

**Implementation:**
```typescript
// Check business hours
const isOpen = checkBusinessHours(timestamp)
if (!isOpen) {
  return { error: 'Penkey is currently closed' }
}

// Check frequency
const stampsToday = await getStampsToday(userId)
if (stampsToday.length > 3) {
  // Flag for review
}
```

**Benefits:**
- ✅ Catches obvious cheating
- ✅ No user friction
- ✅ Easy to implement

---

### **8. Social Graph Analysis**
**What:** Detect coordinated abuse
**How:**
- Track referral patterns
- Flag if many accounts created from same device/IP
- Flag if accounts always stamp at same time

**Benefits:**
- ✅ Catches organized fraud
- ✅ Protects referral system
- ✅ No user friction

---

### **9. Manual Review Queue**
**What:** Staff reviews suspicious activity
**How:**
- Auto-flag suspicious patterns
- Staff reviews and approves/rejects
- Build trust score per user

**Implementation:**
```typescript
// Flag suspicious activity
if (isSuspicious(activity)) {
  await supabase.from('review_queue').insert({
    user_id: userId,
    reason: 'Multiple stamps in short time',
    data: activity
  })
}
```

**Benefits:**
- ✅ Catches edge cases
- ✅ Human judgment
- ✅ Builds user trust scores

---

### **10. Wallet/Reward Limits**
**What:** Limit how many rewards can be held
**How:**
- Max 3 unredeemed rewards at once
- Rewards expire after 30 days
- Can't earn more until some are redeemed

**Benefits:**
- ✅ Limits damage from cheating
- ✅ Encourages regular visits
- ✅ Easy to implement

---

## 🎯 Recommended Implementation Priority

### **Phase 1 (Now):**
1. ✅ GPS validation (already done)
2. ✅ Rate limiting (already done)
3. ✅ Time-based patterns (business hours check)
4. ✅ IP address logging

### **Phase 2 (Next Week):**
5. 🔄 QR code rotation (5-15 min expiry)
6. 🔄 Device fingerprinting
7. 🔄 Manual review queue

### **Phase 3 (Future):**
8. 📱 Staff verification code (if needed)
9. 📡 Bluetooth beacon (if GPS issues)
10. 📸 Photo verification (if abuse continues)

---

## 💡 Best Combination

**For Maximum Security:**
1. **Rotating QR codes** (can't reuse/share)
2. **GPS validation** (must be at location)
3. **Device fingerprinting** (limit per device)
4. **Rate limiting** (1 stamp per hour)
5. **Business hours check** (can't stamp when closed)
6. **Manual review** (staff checks suspicious activity)

This makes it nearly impossible to cheat without being physically present at Penkey.

---

## 🚀 Quick Wins (Implement Today)

### **1. Business Hours Check**
```typescript
const BUSINESS_HOURS = {
  monday: { open: '07:00', close: '18:00' },
  tuesday: { open: '07:00', close: '18:00' },
  // ... etc
}

function isWithinBusinessHours() {
  const now = new Date()
  const day = now.toLocaleLowerCase('en-GB', { weekday: 'long' })
  const time = now.toTimeString().slice(0, 5)
  
  const hours = BUSINESS_HOURS[day]
  return time >= hours.open && time <= hours.close
}
```

### **2. IP Logging**
```typescript
// In API route
const ip = request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown'

await supabase.from('activity_logs').insert({
  user_id: user.id,
  action: 'stamp_added',
  ip_address: ip,
  user_agent: request.headers.get('user-agent')
})
```

### **3. Daily Limits**
```typescript
// Already have this, but enforce strictly
const stampsToday = await getStampsToday(userId)
if (stampsToday.length >= 3) {
  return { error: 'Maximum 3 stamps per day' }
}
```

---

## 📊 Monitoring Dashboard

Create admin view to monitor:
- Stamps per user per day
- Stamps per IP address
- Stamps outside business hours
- Users with multiple devices
- Flagged suspicious activity

---

## ⚖️ Balance Security vs UX

**Too Strict:**
- ❌ Frustrates legitimate customers
- ❌ Reduces engagement
- ❌ Bad reviews

**Too Loose:**
- ❌ Abuse and fraud
- ❌ Costs money
- ❌ Unfair to honest customers

**Sweet Spot:**
- ✅ Invisible to honest users
- ✅ Catches obvious cheating
- ✅ Manual review for edge cases

---

**Want me to implement any of these?** Let me know which ones! 🛡️
