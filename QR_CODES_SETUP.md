# 🏷️ QR Code & NFC Setup - Two Separate Systems

## 🎯 Overview

**Two separate QR codes/NFC tags:**
1. **Check-In QR** - Daily visit points (5 points)
2. **Coffee Stamp QR** - Coffee purchase stamp

**Plus QR scanner backup** for phones without NFC.

---

## 📱 System 1: Check-In (Daily Visit)

### **Purpose:**
- Customer checks in when they visit Penkey
- Awards 5 points
- Once per day
- No purchase required

### **QR Code URL:**
```
https://penkey.app/check-in
```

### **NFC Tag URL:**
```
https://penkey.app/check-in
```

### **Display Location:**
- At entrance/door
- Near till/counter
- Sign: "📍 Check In Here - Earn 5 Points!"

### **How It Works:**
1. Customer arrives at Penkey
2. Taps NFC tag or scans QR code
3. Opens check-in page
4. Auto check-in (if logged in)
5. Shows: "✅ Checked in! +5 points"
6. Done!

---

## ☕ System 2: Coffee Stamp (Purchase)

### **Purpose:**
- Customer gets stamp when buying coffee
- Collect 10 stamps = Free coffee
- Once per hour (prevents abuse)
- Requires purchase

### **QR Code URL:**
```
https://penkey.app/add-coffee
```

### **NFC Tag URL:**
```
https://penkey.app/add-coffee
```

### **Display Location:**
- At till/register
- Next to coffee machine
- Sign: "☕ Scan After Coffee Purchase - Collect Stamps!"

### **How It Works:**
1. Customer buys coffee
2. Staff points to QR/NFC
3. Customer scans
4. Opens coffee stamp page
5. Auto adds stamp (if logged in)
6. Shows: "☕ Stamp added! X/10"
7. Done!

---

## 🔒 Security Features

### **Business Hours Check:**
- ✅ Only works during open hours
- ✅ Blocks after-hours scanning
- ✅ Shows opening times if closed

### **Rate Limiting:**
- ✅ Check-in: 1 per day
- ✅ Coffee stamp: 1 per hour
- ✅ Prevents abuse

### **GPS Validation** (Optional):
- Can enable GPS check
- Must be within 50m of Penkey
- Prevents remote scanning

---

## 🎨 QR Code Designs

### **Design 1: Check-In QR Code**
```
┌─────────────────────────────┐
│                             │
│     [QR CODE HERE]          │
│                             │
│   📍 Check In Here          │
│   Earn 5 Points!            │
│                             │
│   Scan with phone camera    │
│   or tap NFC                │
│                             │
└─────────────────────────────┘
```

### **Design 2: Coffee Stamp QR Code**
```
┌─────────────────────────────┐
│                             │
│     [QR CODE HERE]          │
│                             │
│   ☕ Coffee Stamp            │
│   Collect 10 = Free Coffee! │
│                             │
│   Scan after purchase       │
│   or tap NFC                │
│                             │
└─────────────────────────────┘
```

---

## 📲 QR Scanner Backup (For Non-NFC Phones)

### **Purpose:**
Some older phones don't have NFC. Provide in-app QR scanner as backup.

### **How It Works:**
1. Customer opens Penkey app
2. Taps "Scan QR Code" button
3. Camera opens
4. Scans QR code
5. Auto check-in or stamp
6. Done!

### **Implementation:**
- Add "Scan QR" button to dashboard
- Uses phone camera
- Scans same QR codes as NFC
- Fallback for older phones

---

## 🛠️ Setup Steps

### **Step 1: Generate QR Codes**

**Check-In QR:**
- URL: `https://penkey.app/check-in`
- Size: A5 (148mm x 210mm)
- Generate at: https://www.qr-code-generator.com/

**Coffee Stamp QR:**
- URL: `https://penkey.app/add-coffee`
- Size: A5 (148mm x 210mm)
- Generate at: https://www.qr-code-generator.com/

### **Step 2: Print & Laminate**
- Print on cardstock or foam board
- Laminate for durability
- Cost: ~£10 at print shop

### **Step 3: NFC Tags** (Optional)
- Buy: NFC215 stickers on Amazon (~£10 for 10)
- Program with NFC Tools app (free)
- Tag 1: `https://penkey.app/check-in`
- Tag 2: `https://penkey.app/add-coffee`
- Stick next to QR codes

### **Step 4: Display**
- **Check-In:** Near entrance/door
- **Coffee Stamp:** At till/register
- Clear signage explaining what to do

---

## 📊 Customer Flow

### **Check-In Flow:**
```
Customer arrives
     ↓
Scans Check-In QR/NFC
     ↓
Opens /check-in page
     ↓
Logged in?
     ├─ Yes → Auto check-in → +5 points → Success!
     └─ No → Login prompt → Then check-in
     ↓
Shows: "✅ Checked in! +5 points"
```

### **Coffee Stamp Flow:**
```
Customer buys coffee
     ↓
Staff points to Coffee QR/NFC
     ↓
Customer scans
     ↓
Opens /add-coffee page
     ↓
Logged in?
     ├─ Yes → Auto add stamp → Success!
     └─ No → Login prompt → Then add stamp
     ↓
Shows: "☕ Stamp added! 7/10"
```

---

## 🎯 Why Two Separate Systems?

### **Benefits:**
1. **Clear Purpose** - Each QR has one job
2. **Prevents Confusion** - No "Did you buy coffee?" prompts
3. **Faster** - Auto-detects action from URL
4. **Flexible** - Can place QRs in different locations
5. **Better Analytics** - Track check-ins vs purchases separately

### **Alternative (Single QR):**
Could use one QR that asks "Check-in or Coffee stamp?"
- ❌ Slower (extra tap)
- ❌ More confusing
- ❌ Harder for staff to explain

**Recommendation: Use two separate QRs** ✅

---

## 💰 Cost Breakdown

| Item | Cost | Quantity |
|------|------|----------|
| QR Code Generation | Free | 2 |
| Printing (A5 cardstock) | £5 | 2 |
| Lamination | £5 | 2 |
| NFC Tags (optional) | £10 | 10 pack |
| **Total** | **£10-20** | One-time |

---

## 📱 Mobile Experience

### **Check-In Page:**
- Large "Check In" button
- Shows points earned
- Shows current streak
- Fast loading
- Works on all phones

### **Coffee Stamp Page:**
- Large "Add Stamp" button
- Shows stamp progress (X/10)
- Shows stamps until free coffee
- Celebrates at 10 stamps
- Fast loading

---

## 🔄 QR Scanner Feature

### **Dashboard Button:**
```tsx
<Button onClick={openQRScanner}>
  <QrCode className="w-4 h-4 mr-2" />
  Scan QR Code
</Button>
```

### **Scanner Features:**
- Uses phone camera
- Auto-detects QR code
- Processes check-in or stamp
- Shows success message
- Closes automatically

### **Libraries:**
- `react-qr-scanner` or
- `html5-qrcode` or
- `@zxing/library`

---

## 🚀 Next Steps

1. ✅ Business hours check (DONE)
2. ✅ Separate check-in and coffee APIs (DONE)
3. 📋 Generate two QR codes
4. 🖨️ Print and laminate
5. 📍 Display at locations
6. 📱 Add QR scanner to app (optional)
7. 🧪 Test with customers

---

## 📝 Staff Instructions

### **For Check-In:**
"Welcome! Please scan the QR code at the door to check in and earn points!"

### **For Coffee Stamp:**
"Thanks for your purchase! Scan the QR code here to collect your coffee stamp!"

### **For Non-NFC Phones:**
"No NFC? Open the Penkey app and tap 'Scan QR Code' to scan!"

---

## 🎉 Benefits

1. **Fast** - 2-3 seconds per scan
2. **No Staff Time** - Fully automatic
3. **Accurate** - No manual errors
4. **Scalable** - Same system for all locations
5. **Cheap** - One-time £10-20 cost
6. **Flexible** - Works with or without NFC

---

**Ready to implement! Want me to create the QR scanner component?** 📱
