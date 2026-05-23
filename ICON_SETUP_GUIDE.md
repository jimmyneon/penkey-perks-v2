# Icon & Logo Setup Guide

## Where to Put Your Icons

### 1. Favicon (Browser Tab Icon)
**Location:** `/app/favicon.ico`

**Format:** ICO file (32x32 or 48x48)

**How to create:**
- Use an online converter: https://favicon.io/
- Upload your logo
- Download the ICO file
- Place in `/app/favicon.ico`

Next.js will automatically use this as the favicon.

---

### 2. PWA Icons (Home Screen)
**Location:** `/public/`

**Required files:**
```
/public/
  ├── icon-192.png         # 192x192 PNG (Android)
  ├── icon-512.png         # 512x512 PNG (Android)
  └── apple-touch-icon.png # 180x180 PNG (iOS)
```

**How to create:**
- Use an image editor or online tool
- Resize your logo to exact dimensions
- Save as PNG with transparency
- Place in `/public/` directory

**Current status:** ✅ `icon-192.png` and `icon-512.png` exist (but may need replacing with your actual logo)

---

### 3. App Logo (UI Display)
**Location:** `/public/logo.png` or `/public/logo.svg`

**Recommended:** SVG for best quality at any size

**Usage in code:**
```tsx
import Image from 'next/image'

<Image 
  src="/logo.png" 
  alt="Penkey Perks" 
  width={200} 
  height={50} 
/>

// Or for SVG:
<img src="/logo.svg" alt="Penkey Perks" className="h-12" />
```

---

## Quick Setup Steps

### Step 1: Prepare Your Logo
You need ONE high-quality logo file (preferably PNG or SVG with transparency).

**Recommended size:** At least 1024x1024 pixels

### Step 2: Generate All Icons

**Using Online Tools (Easiest):**

1. **Favicon Generator:** https://favicon.io/
   - Upload your logo
   - Download favicon.ico
   - Place in `/app/favicon.ico`

2. **PWA Icon Generator:** https://www.pwabuilder.com/imageGenerator
   - Upload your logo
   - Download all sizes
   - Place in `/public/`

**Using ImageMagick (Command Line):**
```bash
# Install ImageMagick first: brew install imagemagick

# From your source logo (logo-source.png):
convert logo-source.png -resize 192x192 public/icon-192.png
convert logo-source.png -resize 512x512 public/icon-512.png
convert logo-source.png -resize 180x180 public/apple-touch-icon.png
convert logo-source.png -resize 32x32 app/favicon.ico
```

### Step 3: Update Manifest (Already Done)
The `/public/manifest.json` is already configured to use these icons.

### Step 4: Add Apple Touch Icon Meta Tag
Add to `/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: 'Penkey Perks - Loyalty Rewards',
  description: '...',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Penkey Perks',
  },
}
```

---

## File Structure Summary

```
penkeygameapp/
├── app/
│   ├── favicon.ico              ← Browser tab icon
│   └── layout.tsx
│
└── public/
    ├── logo.png                 ← Your main logo (for UI)
    ├── logo.svg                 ← (Optional) SVG version
    ├── icon-192.png             ← PWA icon (Android)
    ├── icon-512.png             ← PWA icon (Android)
    ├── apple-touch-icon.png     ← iOS home screen icon
    └── manifest.json            ← PWA manifest (already configured)
```

---

## Testing Your Icons

### Browser Favicon
1. Place `favicon.ico` in `/app/`
2. Restart dev server
3. Open `http://localhost:3000`
4. Check browser tab for icon

### PWA Icons
1. Place icons in `/public/`
2. Deploy to production or use ngrok for testing
3. Open on mobile device
4. Add to home screen
5. Check home screen icon

### iOS Specific
1. Place `apple-touch-icon.png` in `/public/`
2. Open on iPhone/iPad
3. Tap Share → Add to Home Screen
4. Check icon on home screen

---

## Current Icon Status

✅ **Already configured:**
- `/public/icon-192.png` - Exists (may need replacing)
- `/public/icon-512.png` - Exists (may need replacing)
- `/public/manifest.json` - Configured correctly

❌ **Need to add:**
- `/app/favicon.ico` - Browser tab icon
- `/public/apple-touch-icon.png` - iOS home screen
- `/public/logo.png` or `/public/logo.svg` - Main logo for UI

---

## Recommended Icon Specifications

### Favicon
- **Size:** 32x32 or 48x48
- **Format:** ICO (supports multiple sizes in one file)
- **Background:** Transparent or solid color

### PWA Icons (Android)
- **Sizes:** 192x192, 512x512
- **Format:** PNG
- **Background:** Transparent or solid color
- **Safe area:** Keep important content in center 80%

### Apple Touch Icon (iOS)
- **Size:** 180x180
- **Format:** PNG
- **Background:** Solid color (iOS adds rounded corners automatically)
- **No transparency:** iOS doesn't support transparent icons

### App Logo
- **Format:** SVG (preferred) or PNG
- **Size:** Any (SVG scales perfectly)
- **Background:** Transparent

---

## Quick Checklist

- [ ] Create/obtain high-quality logo file (1024x1024+)
- [ ] Generate favicon.ico → place in `/app/`
- [ ] Generate icon-192.png → place in `/public/`
- [ ] Generate icon-512.png → place in `/public/`
- [ ] Generate apple-touch-icon.png → place in `/public/`
- [ ] Add logo.png or logo.svg → place in `/public/`
- [ ] Update metadata in `/app/layout.tsx` (optional)
- [ ] Test favicon in browser
- [ ] Test PWA icons on mobile
- [ ] Test iOS home screen icon

---

## Need Help?

If you have a logo file, I can help you:
1. Generate all the required icon sizes
2. Update the necessary files
3. Configure the metadata

Just provide your logo file or let me know if you need a placeholder!
