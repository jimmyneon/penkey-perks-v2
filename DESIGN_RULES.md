# 🎨 PENKEY APP DESIGN RULES

**Date:** October 10, 2025  
**Status:** Official Design Guidelines

---

## 🎯 ICON USAGE RULES

### **✅ USE LUCIDE ICONS**

**Where:** Everywhere in the app EXCEPT messages/notifications

**Examples:**
- Headers: `<Coffee className="w-6 h-6" />`
- Buttons: `<ArrowLeft className="w-4 h-4" />`
- Cards: `<QrCode className="w-12 h-12" />`
- Stats: `<BarChart3 className="w-5 h-5" />`
- Actions: `<Gift className="w-8 h-8" />`

**Why:** Consistent, professional, scalable, customizable colors

---

### **✅ USE EMOJIS**

**Where:** ONLY in messages, notifications, and user-facing content

**Examples:**
- Message templates: `icon: '🎉'`
- Notification titles: `"🎁 New Reward!"`
- Customer messages: `"Happy Hour is NOW! 🎉"`
- Motivational messages: `"You're crushing it! 🌟"`

**Why:** Friendly, expressive, engaging for customers

---

## 📋 SPECIFIC RULES

### **Staff Pages:**
```jsx
// ❌ DON'T USE EMOJIS IN HEADERS
<h1>📷 QR Scanner</h1>

// ✅ USE LUCIDE ICONS
<div className="flex items-center gap-2">
  <QrCode className="w-6 h-6 text-amber-700" />
  <h1>QR Scanner</h1>
</div>
```

### **Customer Messages:**
```jsx
// ✅ EMOJIS ARE PERFECT HERE
const template = {
  icon: '🎉',
  title: 'Happy Hour Alert',
  message: 'Happy Hour is NOW! 🎉 Come grab your favorite coffee!'
}
```

### **Notifications:**
```jsx
// ✅ EMOJIS FOR USER-FACING CONTENT
{
  title: '🎁 Rewards Ready!',
  message: 'You\'ve got treats waiting! ✨',
  icon: '🎁'
}
```

---

## 🎨 COLOR RULES

### **Penkey Brand Colors:**
```css
/* Primary */
--penkey-orange: #F97316;
--penkey-amber: #F59E0B;

/* Text */
--penkey-dark: #78350F;    /* amber-950 */
--penkey-brown: #92400E;   /* amber-900 */
--penkey-text: #B45309;    /* amber-800 */

/* Backgrounds */
--penkey-cream: #FFFEF7;
--penkey-light: #FEF3C7;   /* amber-50 */

/* Accents */
--amber-100 to amber-700
--orange-100 to orange-700
```

### **Gradient Patterns:**
```jsx
// Backgrounds
from-amber-50 via-white to-orange-50

// Cards - Light
from-amber-50 to-amber-100
from-orange-50 to-orange-100

// Cards - Medium
from-amber-100 to-orange-100
from-yellow-50 to-amber-100

// Cards - Warm
from-orange-100 to-yellow-100
from-amber-100 to-orange-100
```

---

## 📏 SIZING RULES

### **Icons:**
```jsx
// Headers
<Coffee className="w-8 h-8" />

// Section titles
<BarChart3 className="w-5 h-5" />

// Buttons
<ArrowLeft className="w-4 h-4" />

// Cards (large)
<QrCode className="w-12 h-12" />

// Cards (small)
<Clock className="w-8 h-8" />
```

### **Emojis:**
```jsx
// Message templates
<div className="text-3xl">{icon}</div>

// Inline in text
"Happy Hour! 🎉"  // Just use in string
```

---

## 🎯 WHEN TO USE WHAT

### **Use Lucide Icons:**
- ✅ Navigation
- ✅ Headers
- ✅ Section titles
- ✅ Buttons
- ✅ Action cards
- ✅ Stats displays
- ✅ Admin/Staff interfaces
- ✅ Technical features

### **Use Emojis:**
- ✅ Message content
- ✅ Notification titles
- ✅ Customer-facing messages
- ✅ Motivational content
- ✅ Template previews
- ✅ Fun/casual content
- ✅ User engagement

---

## 🚫 DON'T MIX

### **❌ Bad Examples:**
```jsx
// Don't mix in same context
<h1>📷 QR Scanner <QrCode /></h1>

// Don't use emojis for UI
<Button>📊 View Stats</Button>

// Don't use icons in messages
message: '<Gift /> You have a reward!'
```

### **✅ Good Examples:**
```jsx
// Clean icon usage
<div className="flex items-center gap-2">
  <QrCode className="w-6 h-6" />
  <h1>QR Scanner</h1>
</div>

// Emojis in content
message: '🎉 Happy Hour is NOW!'

// Separate contexts
<Button>
  <BarChart3 className="w-4 h-4 mr-2" />
  View Stats
</Button>
```

---

## 📱 RESPONSIVE RULES

### **Icon Sizes:**
```jsx
// Mobile → Desktop
w-4 md:w-5    // Small icons
w-5 md:w-6    // Medium icons
w-8 md:w-10   // Large icons
w-12 md:w-16  // Hero icons
```

### **Emoji Sizes:**
```jsx
// Always use text size classes
text-2xl md:text-3xl  // Template icons
text-xl               // Inline emojis
```

---

## 🎨 CONSISTENCY CHECKLIST

### **Before Shipping:**
- [ ] All staff pages use Lucide icons
- [ ] All customer messages use emojis
- [ ] No emoji/icon mixing
- [ ] Consistent icon sizes
- [ ] Penkey colors throughout
- [ ] Proper gradients
- [ ] Responsive sizing

---

## 📚 QUICK REFERENCE

### **Common Icons:**
```jsx
import {
  Coffee,        // Penkey brand
  QrCode,        // Scanner
  Gift,          // Rewards
  Users,         // Customers
  BarChart3,     // Stats
  MessageSquare, // Messages
  TrendingUp,    // Activity
  Clock,         // Time
  Sparkles,      // Special
  Heart,         // Favorite
  Zap,           // Fast
  Star,          // Achievement
  Rocket,        // Quick actions
  ArrowLeft,     // Navigation
  CheckCircle,   // Success
  XCircle        // Error
} from 'lucide-react'
```

### **Common Emojis:**
```
☕ Coffee
🎉 Celebration
🎁 Gift/Reward
✨ Sparkle
🌟 Star
⭐ Star (filled)
🚀 Rocket
💫 Dizzy
❤️ Heart
🏆 Trophy
📱 Phone
👥 People
🎮 Game
📊 Chart
💬 Message
⚠️ Warning
✅ Success
❌ Error
```

---

## 🎯 SUMMARY

**Simple Rule:**
- **Icons** = UI/Interface (Lucide)
- **Emojis** = Content/Messages (Unicode)

**Keep them separate, keep it clean!**

---

**Status:** ✅ Official Design Guidelines

Follow these rules for consistent, professional, and engaging design across the Penkey app!
