# 📱 QR Scanner - Customer App Feature

## 🎯 How It Works

**Customers scan QR codes displayed in store using the app**

1. Customer opens Penkey Perks app
2. Taps QR scanner icon in header
3. Camera opens
4. Points at QR code in store
5. Auto-detects check-in or coffee stamp
6. Redirects to appropriate page
7. Done!

---

## 🏷️ QR Codes Needed in Store

### **QR Code 1: Check-In** 📍
**Content:** `https://penkey.app/check-in`
**Location:** Near entrance/door
**Sign:** "📍 Scan to Check In - Earn 5 Points!"

### **QR Code 2: Coffee Stamp** ☕
**Content:** `https://penkey.app/add-coffee`
**Location:** At till/register
**Sign:** "☕ Scan After Coffee Purchase - Collect Stamps!"

---

## 📱 Customer Experience

### **Step 1: Open App**
- Customer opens Penkey Perks app
- Sees dashboard

### **Step 2: Tap Scanner**
- Taps QR code icon in top right
- Camera permission requested (first time only)

### **Step 3: Scan**
- Points camera at QR code
- App detects QR code automatically
- Shows what was scanned

### **Step 4: Auto-Action**
- If check-in QR → Goes to check-in page
- If coffee QR → Goes to coffee stamp page
- Auto-processes action

### **Step 5: Done!**
- Shows success message
- Returns to dashboard
- Points/stamps updated

---

## 🎨 UI Features

### **Scanner Button**
- Located in header (top right)
- QR code icon
- Orange color (matches brand)
- Always visible

### **Scanner Modal**
- Full-screen overlay
- Live camera feed
- Orange border for scanning area
- Close button (X)
- Instructions text

---

## 🔒 Security

### **Business Hours Check:**
- QR codes only work during open hours
- Shows error if closed
- Displays opening times

### **Rate Limiting:**
- Check-in: 1 per day
- Coffee stamp: 1 per hour
- Prevents abuse

### **GPS Validation** (Optional):
- Can enable GPS check
- Must be within 50m of Penkey
- Prevents remote scanning

---

## 🛠️ Technical Details

### **QR Scanner Component:**
- File: `components/qr-scanner.tsx`
- Uses device camera
- No external libraries needed
- Works on all modern phones

### **Detection Logic:**
```typescript
if (data.includes('check-in')) {
  // Go to check-in page
} else if (data.includes('coffee')) {
  // Go to coffee stamp page
} else {
  // Invalid QR code
}
```

### **Supported QR Formats:**
- URLs containing "check-in"
- URLs containing "coffee" or "add-coffee"
- Plain text: "check-in" or "coffee"

---

## 📋 Setup Steps

### **Step 1: Generate QR Codes**

**Check-In QR:**
```
Content: https://penkey.app/check-in
or
Content: check-in
```

**Coffee Stamp QR:**
```
Content: https://penkey.app/add-coffee
or
Content: coffee
```

Use: https://www.qr-code-generator.com/

### **Step 2: Print & Display**
- Print on A4 or A5 cardstock
- Laminate for durability
- Add clear instructions
- Display at appropriate locations

### **Step 3: Test**
- Open app
- Tap QR scanner icon
- Scan test QR code
- Verify it works

---

## 🎨 QR Code Design Templates

### **Check-In QR Code**
```
┌─────────────────────────────┐
│                             │
│     [QR CODE HERE]          │
│                             │
│   📍 Check In Here          │
│   Earn 5 Points!            │
│                             │
│   Open Penkey app           │
│   Tap QR icon               │
│   Scan this code            │
│                             │
└─────────────────────────────┘
```

### **Coffee Stamp QR Code**
```
┌─────────────────────────────┐
│                             │
│     [QR CODE HERE]          │
│                             │
│   ☕ Coffee Stamp            │
│   Collect 10 = Free Coffee! │
│                             │
│   After purchase:           │
│   Open Penkey app           │
│   Tap QR icon               │
│   Scan this code            │
│                             │
└─────────────────────────────┘
```

---

## 🔄 Alternative: NFC Tags

**For phones with NFC:**
- Buy NFC215 stickers (~£10)
- Program with same URLs
- Stick next to QR codes
- Customers tap phone to scan

**Benefits:**
- Faster than QR scanning
- No camera needed
- Works when phone is locked
- More reliable

---

## 💡 Staff Instructions

### **For Check-In:**
"Welcome! Open the Penkey app, tap the QR icon at the top, and scan the code at the door to check in!"

### **For Coffee Stamp:**
"Thanks for your purchase! Open the Penkey app, tap the QR icon, and scan this code to collect your stamp!"

### **Troubleshooting:**
- **Camera not working?** → Check app permissions
- **QR not scanning?** → Make sure QR code is well-lit
- **Invalid QR?** → Make sure using correct QR code

---

## 📊 Benefits

### **For Customers:**
- ✅ Fast and easy
- ✅ No staff interaction needed
- ✅ Works on all phones
- ✅ Visual feedback

### **For Penkey:**
- ✅ Reduces staff workload
- ✅ Accurate tracking
- ✅ No manual errors
- ✅ Scalable to multiple locations

---

## 🚀 Next Steps

1. ✅ QR scanner added to app (DONE)
2. 📋 Generate two QR codes
3. 🖨️ Print and laminate
4. 📍 Display in store
5. 🧪 Test with customers
6. 📈 Monitor usage

---

## 🎉 Complete!

The QR scanner is now live in the app. Customers can:
- Tap QR icon in header
- Scan QR codes in store
- Auto check-in or add stamps
- No staff interaction needed!

**Just need to generate and display the QR codes in store.** 🏷️
