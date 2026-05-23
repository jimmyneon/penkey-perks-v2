# 📍 Quick GPS Setup - 5 Minutes

## 🎯 Step 1: Find Coordinates (2 minutes)

### **Using Google Maps:**
1. Go to https://www.google.com/maps
2. Search for "Penkey" or your address
3. **Right-click** on your building/entrance
4. **Click the coordinates** at the top (they copy automatically)

**Example result:**
```
51.507400, -0.127800
```

---

## ⚙️ Step 2: Update Code (1 minute)

### **Open File:**
```
lib/location-utils.ts
```

### **Find This (lines 16-19):**
```typescript
const PENKEY_LOCATION = {
  latitude: 51.5074,   // Example: 51.507400
  longitude: -0.1278,  // Example: -0.127800
}
```

### **Update Complete! ✅**
```typescript
const PENKEY_LOCATION = {
  latitude: 50.7586,   // ✅ Isle of Wight
  longitude: -1.5423,  // ✅ Isle of Wight
}
```

---

## 🧪 Step 3: Test (2 minutes)

### **Go to:**
```
https://your-app.com/test-gps
```

### **Click:**
```
"Test GPS Location"
```

### **Expected at Penkey:**
```
✅ GPS Working!
Distance to Penkey: 15m
Within Range: ✅ Yes
```

### **Expected away from Penkey:**
```
✅ GPS Working!
Distance to Penkey: 450m
Within Range: ❌ No
```

---

## ✅ Done!

If the distance looks correct, you're all set! 🎉

If not, see `GPS_SETUP_GUIDE.md` for troubleshooting.

---

## 🎯 Quick Tips

### **Adjust Range:**
```typescript
const NEARBY_RADIUS = 100 // Change this number
```
- `50` = Very strict (inside only)
- `100` = Default (building + immediate area)
- `200` = Lenient (nearby block)

### **Test Page:**
Always available at `/test-gps`

### **Verify Coordinates:**
Paste them into Google Maps search to verify location

---

**That's it! 📍✨**
