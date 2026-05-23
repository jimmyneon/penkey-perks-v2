# 📍 GPS Setup Guide - Finding Penkey's Location

## 🎯 Overview

You need to set Penkey's exact GPS coordinates for location-based features to work. This guide shows you how to find and configure them.

---

## 🔍 Method 1: Google Maps (Recommended)

### **Steps:**

1. **Open Google Maps**
   - Go to https://www.google.com/maps

2. **Find Penkey**
   - Search for "Penkey" or your full address
   - Or navigate to your location on the map

3. **Get Coordinates**
   - **Right-click** on your exact location (the building/entrance)
   - Click the **coordinates** at the top of the menu
   - They'll be copied to clipboard automatically

4. **Format:**
   ```
   51.5074, -0.1278
   (Latitude, Longitude)
   ```

### **Visual Guide:**
```
Right-click on location → Click coordinates
Example: 51.507400, -0.127800
         ↑           ↑
      Latitude   Longitude
```

---

## 🔍 Method 2: Google Maps Mobile App

### **Steps:**

1. **Open Google Maps app** on your phone

2. **Find Penkey** location

3. **Long-press** on the exact spot (entrance/door)

4. **Coordinates appear** at the bottom

5. **Tap coordinates** to copy them

6. **Send to yourself** via email/message

---

## 🔍 Method 3: iPhone/iPad

### **Steps:**

1. **Open Maps app**

2. **Find Penkey** location

3. **Drop a pin** on the exact spot

4. **Swipe up** on the location card

5. **Tap coordinates** (shown in small text)

6. **Copy** the coordinates

---

## 🔍 Method 4: What3Words (Alternative)

### **Steps:**

1. **Go to** https://what3words.com

2. **Find Penkey** location

3. **Click** on the exact spot

4. **Get 3-word address** (e.g., ///filled.count.soap)

5. **Convert to coordinates** (shown on the page)

---

## ⚙️ Setting Up Coordinates

### **File to Update:**
`lib/location-utils.ts`

### **Current Code:**
```typescript
const PENKEY_LOCATION = {
  latitude: 51.5074,  // TODO: Replace with actual
  longitude: -0.1278, // TODO: Replace with actual
}
```

### **Update With Your Coordinates:**
```typescript
const PENKEY_LOCATION = {
  latitude: 51.507400,  // Your actual latitude
  longitude: -0.127800, // Your actual longitude
}
```

---

## 🧪 Testing Your Coordinates

### **Method 1: Test GPS Page**

1. **Go to** `/test-gps` in your app

2. **Click** "Test GPS Location"

3. **Check distance** shown

4. **Verify:**
   - If at Penkey: Should show < 100m
   - If not at Penkey: Should show actual distance

### **Method 2: Google Maps Verification**

1. **Copy your coordinates**

2. **Paste into Google Maps search**
   ```
   51.507400, -0.127800
   ```

3. **Verify** it points to Penkey

4. **Check** it's the right building/entrance

---

## 📏 Understanding the Range

### **Current Setting:**
```typescript
const NEARBY_RADIUS = 100 // meters
```

### **What This Means:**
- Customers must be within **100 meters** (328 feet)
- About **1 city block**
- Covers the building and immediate area
- Prevents scanning from across the street

### **Adjusting Range:**
```typescript
// More strict (only inside building)
const NEARBY_RADIUS = 50 // 50 meters

// More lenient (nearby area)
const NEARBY_RADIUS = 200 // 200 meters

// Very lenient (whole block)
const NEARBY_RADIUS = 500 // 500 meters
```

---

## 🎯 Precision Tips

### **Where to Place Pin:**
- ✅ **Main entrance/door** (best)
- ✅ **Center of building** (good)
- ❌ **Street address** (too vague)
- ❌ **Parking lot** (too far)

### **Why Precision Matters:**
- Prevents fraud (scanning from home)
- Ensures customers are actually there
- Better for QR code scanning
- More accurate analytics

---

## 🔧 Complete Setup Checklist

### **1. Find Coordinates:**
- [ ] Use Google Maps
- [ ] Right-click on exact location
- [ ] Copy coordinates
- [ ] Verify they're correct

### **2. Update Code:**
- [ ] Open `lib/location-utils.ts`
- [ ] Replace latitude value
- [ ] Replace longitude value
- [ ] Save file

### **3. Test:**
- [ ] Go to `/test-gps`
- [ ] Test from Penkey location
- [ ] Verify distance shows < 100m
- [ ] Test from away (should show > 100m)

### **4. Adjust Range (Optional):**
- [ ] Decide on radius (50-500m)
- [ ] Update `NEARBY_RADIUS` value
- [ ] Test again
- [ ] Confirm it works as expected

---

## 📱 Real-World Testing

### **At Penkey:**
```
Expected Result:
✅ GPS Working!
Distance to Penkey: 15m
Within Range: ✅ Yes (within 100m)
🎉 You're at Penkey! QR scanner will be visible.
```

### **Away from Penkey:**
```
Expected Result:
✅ GPS Working!
Distance to Penkey: 450m
Within Range: ❌ No (too far)
📍 You're 450m away. Get within 100m to use location features.
```

---

## 🛠️ Troubleshooting

### **Problem: Distance Always Shows 0m**
**Solution:** Coordinates not set correctly
```typescript
// Check you have actual numbers, not 0
latitude: 51.507400,  // Not 0
longitude: -0.127800, // Not 0
```

### **Problem: Distance Shows Wrong Value**
**Solution:** Latitude/Longitude swapped
```typescript
// Correct order:
latitude: 51.507400,  // First number (usually 50-52 for UK)
longitude: -0.127800, // Second number (usually -1 to 1 for UK)
```

### **Problem: GPS Not Working**
**Solutions:**
1. Enable location in browser settings
2. Use HTTPS (required for GPS)
3. Allow location permission when prompted
4. Try different browser

### **Problem: Always Says "Too Far"**
**Solutions:**
1. Verify coordinates are correct
2. Increase `NEARBY_RADIUS`
3. Test at actual Penkey location
4. Check GPS accuracy on device

---

## 🌍 Coordinate Formats

### **Decimal Degrees (Use This):**
```
51.507400, -0.127800
✅ Correct format for code
```

### **Degrees Minutes Seconds (Convert First):**
```
51°30'26.6"N 0°07'40.1"W
❌ Need to convert to decimal
```

### **Conversion:**
Use Google or: https://www.latlong.net/lat-long-dms.html

---

## 📊 Example Locations (UK)

### **London:**
```typescript
latitude: 51.5074,
longitude: -0.1278,
```

### **Manchester:**
```typescript
latitude: 53.4808,
longitude: -2.2426,
```

### **Birmingham:**
```typescript
latitude: 52.4862,
longitude: -1.8904,
```

### **Edinburgh:**
```typescript
latitude: 55.9533,
longitude: -3.1883,
```

---

## 🔐 Security Considerations

### **Why GPS Validation:**
- Prevents remote check-ins
- Stops QR code sharing
- Ensures physical presence
- Reduces fraud

### **Privacy:**
- Only checks distance, not exact location
- Doesn't store GPS coordinates
- User must consent
- Can be disabled by user

### **Accuracy:**
- GPS: ±5-10 meters (good)
- WiFi: ±20-50 meters (okay)
- Cell tower: ±100-1000 meters (poor)

---

## 📝 Quick Reference

### **File to Edit:**
```
lib/location-utils.ts
```

### **Lines to Change:**
```typescript
// Line 6-9
const PENKEY_LOCATION = {
  latitude: YOUR_LATITUDE_HERE,
  longitude: YOUR_LONGITUDE_HERE,
}
```

### **Test Page:**
```
https://your-app.com/test-gps
```

### **Recommended Radius:**
```
100 meters (default)
```

---

## 🎯 Final Steps

1. **Find coordinates** using Google Maps
2. **Update** `lib/location-utils.ts`
3. **Test** at `/test-gps`
4. **Verify** distance is correct
5. **Adjust** radius if needed
6. **Deploy** changes
7. **Test** at actual location

---

## 💡 Pro Tips

### **Multiple Locations:**
If you have multiple Penkey locations, you can:

```typescript
const PENKEY_LOCATIONS = [
  {
    id: 'main',
    name: 'Penkey Main',
    latitude: 51.507400,
    longitude: -0.127800,
  },
  {
    id: 'branch',
    name: 'Penkey Branch',
    latitude: 51.510000,
    longitude: -0.130000,
  },
]

// Check if near ANY location
export async function isNearAnyPenkey(): Promise<boolean> {
  const location = await getUserLocation()
  if (!location) return false
  
  for (const penkey of PENKEY_LOCATIONS) {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      penkey.latitude,
      penkey.longitude
    )
    if (distance <= NEARBY_RADIUS) return true
  }
  
  return false
}
```

---

## 📞 Need Help?

### **Can't Find Coordinates:**
1. Search "Penkey" on Google Maps
2. Right-click the location
3. Click the coordinates at top
4. They're copied automatically!

### **Coordinates Don't Work:**
1. Verify format: `51.507400, -0.127800`
2. Check order: latitude first, longitude second
3. Use decimal format (not degrees/minutes)
4. Test on Google Maps first

### **GPS Not Accurate:**
1. Increase radius to 200m
2. Test outdoors (not indoors)
3. Wait for GPS to stabilize
4. Try different device

---

**Once coordinates are set, all location features will work! 📍✨**
