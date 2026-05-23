# 🏷️ QR Code / NFC Setup for Penkey

## 🎯 Goal
- **Static QR code** printed at counter (never changes)
- **NFC tag** on counter (tap with phone)
- Customer scans with **phone camera** (not app)
- Opens web page → auto check-in + stamp
- Fast, no app scanning needed

---

## 📱 How It Works

### **Customer Experience:**
1. Customer arrives at Penkey
2. Taps phone on NFC tag OR scans QR code with camera
3. Opens: `https://penkey.app/scan?location=penkey-main`
4. If logged in → Auto check-in + stamp
5. If not logged in → Prompt to login first
6. Shows success message
7. Done! (2 seconds total)

### **Staff Experience:**
- Nothing! It's automatic
- No buttons to press
- No app to open
- Just point customers to QR/NFC

---

## 🔧 Implementation

### **1. Create Scan Page**
File: `/app/scan/page.tsx`

This page:
- Checks if user is logged in
- Validates GPS location (optional)
- Awards check-in points
- Adds coffee stamp (if purchased)
- Shows success message

### **2. Generate Static QR Code**
URL: `https://penkey.app/scan?location=penkey-main`

Print this QR code and display at counter.

### **3. Setup NFC Tag** (Optional)
- Buy NFC stickers (~£10 for 10)
- Program with same URL
- Stick on counter
- Customers tap phone to scan

---

## 🛡️ Security

### **GPS Validation:**
- Page checks user's GPS location
- Must be within 50m of Penkey
- Prevents remote scanning

### **Rate Limiting:**
- 1 check-in per day
- 1 stamp per hour
- Prevents abuse

### **Business Hours:**
- Only works during open hours
- Blocks after-hours scanning

---

## 🎨 QR Code Design

```
┌─────────────────────────────┐
│                             │
│     [QR CODE HERE]          │
│                             │
│   📱 Scan to Check In       │
│   & Get Your Coffee Stamp   │
│                             │
│   Earn 5 Points + Stamp!    │
│                             │
└─────────────────────────────┘
```

---

## 💡 Advantages

✅ **Fast** - 2 seconds total
✅ **No app needed** - Uses phone camera
✅ **No staff interaction** - Fully automatic
✅ **Static** - QR code never changes
✅ **Cheap** - Print once, use forever
✅ **Works offline** - NFC doesn't need internet to scan
✅ **Secure** - GPS + rate limiting

---

## 🚀 Setup Steps

### **Step 1: Create Scan Page** (I'll do this)
- `/app/scan/page.tsx`
- Handles check-in + stamp
- Shows success message

### **Step 2: Generate QR Code**
Use: https://www.qr-code-generator.com/
URL: `https://penkey.app/scan?location=penkey-main`
Size: A4 or A5 for counter display

### **Step 3: Print & Display**
- Print QR code on cardstock
- Laminate for durability
- Display at counter/till
- Add text: "Scan to Check In & Get Stamp"

### **Step 4: NFC Tag** (Optional)
- Buy: NFC215 stickers on Amazon (~£10)
- Program with: NFC Tools app
- URL: `https://penkey.app/scan?location=penkey-main`
- Stick on counter

---

## 📊 Customer Flow

```
Customer arrives
     ↓
Scans QR/NFC
     ↓
Opens web page
     ↓
Already logged in?
     ├─ Yes → Auto check-in + stamp → Success!
     └─ No → Login prompt → Then check-in + stamp
     ↓
Shows: "✅ Checked in! +5 points, +1 stamp"
     ↓
Done!
```

---

## 🔄 For Coffee Purchases

### **Option A: Same QR Code**
- Customer scans after buying coffee
- Page asks: "Did you buy coffee?" (Yes/No)
- If Yes → Adds stamp
- If No → Just check-in

### **Option B: Two QR Codes**
- **QR Code 1:** "Check In" (just points)
- **QR Code 2:** "Coffee Stamp" (stamp + points)
- Display both at counter

### **Option C: Staff Confirmation** (Recommended)
- Customer scans QR code
- Page shows: "Buying coffee today?"
- Customer shows screen to staff
- Staff confirms → Stamp added
- Prevents fake stamps

---

## 🎯 Recommended: Option C

**Why:**
- Prevents abuse (can't scan from home)
- Staff can verify purchase
- Still fast (5 seconds)
- No complicated buttons

**How:**
1. Customer scans QR
2. Page shows: "Show this to staff"
3. Staff sees screen, confirms purchase
4. Customer taps "Confirm" → Stamp added
5. Done!

---

## 📱 Mobile-Optimized Page

The scan page will be:
- ✅ Large buttons
- ✅ Clear text
- ✅ Fast loading
- ✅ Works on all phones
- ✅ No app download needed

---

## 🛠️ Technical Details

### **URL Parameters:**
- `location=penkey-main` - Which location
- `action=checkin` - Just check-in
- `action=stamp` - Check-in + stamp
- `action=both` - Both (default)

### **Example URLs:**
```
Check-in only:
https://penkey.app/scan?location=penkey-main&action=checkin

Coffee stamp only:
https://penkey.app/scan?location=penkey-main&action=stamp

Both (default):
https://penkey.app/scan?location=penkey-main
```

---

## 💰 Cost

- **QR Code:** Free (just print)
- **Lamination:** £5 at print shop
- **NFC Tags:** £10 for 10 tags (optional)
- **Total:** £5-15 one-time cost

---

## 🎉 Benefits for Penkey

1. **Faster service** - No staff interaction
2. **More stamps** - Easier for customers
3. **Better data** - Track check-ins automatically
4. **Less errors** - No manual entry
5. **Scalable** - Same system for multiple locations

---

## 🚀 Want Me to Build This?

I can create:
1. ✅ `/scan` page with auto check-in + stamp
2. ✅ GPS validation
3. ✅ Success/error messages
4. ✅ Mobile-optimized design
5. ✅ Rate limiting
6. ✅ Business hours check

Then you just need to:
1. Generate QR code with the URL
2. Print and display at counter
3. Done!

---

**Should I build the scan page now?** 🚀
