# 🫘 Bean Icon Options - Visual Guide

## Current Implementation

The `BeanIcon` component now has a **beautiful, realistic coffee bean** with:
- ✅ 3D gradient effect (light to dark brown)
- ✅ Center crease line (authentic coffee bean feature)
- ✅ Highlight and shadow for depth
- ✅ Slightly rotated for natural look

---

## Available Icon Variants

### 1. **`<BeanIcon />`** - Main Icon (Recommended) ⭐

**Features:**
- Realistic coffee bean shape
- 3D gradient (sienna → saddle brown → dark brown)
- Center crease line
- Highlight on top-left
- Shadow on bottom-right
- Rotated -15° for natural appearance

**Best for:** Main displays, large sizes, hero sections

**Colors used:**
- Light: `#A0522D` (Sienna)
- Mid: `#8B4513` (Saddle Brown)
- Dark: `#654321` (Dark Brown)
- Highlight: `#D2691E` (Chocolate)

---

### 2. **`<BeanIconSimple />`** - Cute & Rounded

**Features:**
- Simplified rounded bean
- Smooth gradient
- Center line detail
- White shine effect
- More cartoonish/friendly

**Best for:** Small sizes, mobile, casual contexts

**Colors used:**
- Gradient: `#D2691E` → `#8B4513`
- Line: `#654321`
- Shine: White (30% opacity)

---

### 3. **`<BeanIconCoffee />`** - Coffee Cup

**Features:**
- Coffee cup outline
- Steam lines
- Lucide-react style
- Minimalist

**Best for:** Alternative branding, coffee-focused contexts

---

## Usage Examples

```tsx
// Default - realistic bean
<BeanIcon size="md" className="text-[#8B4513]" />

// Cute version
<BeanIconSimple size="lg" />

// Coffee cup
<BeanIconCoffee size="sm" className="text-brown-600" />
```

---

## Size Comparison

| Size | Dimensions | Best For |
|------|------------|----------|
| `sm` | 16x16px (w-4 h-4) | Inline text, small badges |
| `md` | 20x20px (w-5 h-5) | Default, most uses |
| `lg` | 24x24px (w-6 h-6) | Headers, emphasis |
| `xl` | 32x32px (w-8 h-8) | Hero sections, large displays |

---

## Where It's Used

### ✅ Already Implemented:

1. **Points Card** (`components/dashboard/points-card.tsx`)
   - Header title
   - Available beans counter
   - Pending beans counter
   - Check-in CTA
   - Total beans display
   - Progress indicator

2. **Rewards Page** (`app/rewards/unified-rewards-client.tsx`)
   - Top header beans display
   - Journey card
   - Milestone progress
   - Reward costs
   - Redeem dialog

---

## Visual Comparison

**Emoji (if supported):**
```
🫘
```

**SVG Fallback (realistic):**
```
[Oval brown bean with gradient, center line, 3D effect]
```

**Simple variant:**
```
[Rounded brown bean with shine]
```

**Coffee variant:**
```
☕ [Cup outline with steam]
```

---

## Technical Details

### Gradient IDs
- `beanGradient` - Main bean body
- `beanHighlight` - Top-left shine
- `simpleBean` - Simple variant gradient

### SVG Structure
```xml
<svg viewBox="0 0 32 32">
  <defs>
    <linearGradient id="beanGradient">...</linearGradient>
    <radialGradient id="beanHighlight">...</radialGradient>
  </defs>
  <ellipse /> <!-- Main body -->
  <path />    <!-- Center crease -->
  <ellipse /> <!-- Highlight -->
  <ellipse /> <!-- Shadow -->
</svg>
```

---

## Customization

### Change Colors
```tsx
// The icon respects currentColor for some elements
<BeanIcon className="text-green-600" />

// Or use custom brown shades
<BeanIcon className="text-amber-800" />
```

### Change Size
```tsx
<BeanIcon size="sm" />  // Small
<BeanIcon size="md" />  // Default
<BeanIcon size="lg" />  // Large
<BeanIcon size="xl" />  // Extra large
```

---

## Browser Support

✅ **All modern browsers** - SVG is universally supported  
✅ **IE11+** - Gradients work  
✅ **Mobile** - Perfect on iOS and Android  
✅ **Email** - SVG works in most email clients  

---

## Performance

- **Lightweight** - ~1KB per icon
- **No external images** - Inline SVG
- **Cached** - Component reused everywhere
- **Fast** - No HTTP requests

---

## Future Enhancements

**Possible additions:**
1. Animated bean (pulse/bounce)
2. Bean with steam rising
3. Cracked bean (half open)
4. Bean pile (multiple beans)
5. Roasted vs raw bean variants

---

## Testing

**To see the SVG fallback:**
```javascript
// In browser console
document.body.style.fontFamily = 'monospace'
```

**Or test on:**
- Older Android devices
- Windows 7/8
- Older browsers

---

**The new bean icon looks professional and works everywhere! 🎉**
