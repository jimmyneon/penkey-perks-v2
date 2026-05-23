# 🔧 FIX: Next.js ChunkLoadError

## 🐛 ERROR

```
ChunkLoadError: Loading chunk app/layout failed
SyntaxError: Invalid or unexpected token (at layout.js:354:29)
```

## ✅ SOLUTION

This is a Next.js cache/build issue. Clear the cache and rebuild:

### **Option 1: Quick Fix** (30 seconds)

```bash
# Stop the dev server (Ctrl+C)

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

### **Option 2: Deep Clean** (1 minute)

```bash
# Stop the dev server (Ctrl+C)

# Clear everything
rm -rf .next
rm -rf node_modules/.cache

# Restart
npm run dev
```

### **Option 3: Full Reset** (2 minutes)

```bash
# Stop the dev server (Ctrl+C)

# Clear all caches
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules

# Reinstall
npm install

# Restart
npm run dev
```

---

## 🎯 RECOMMENDED: Option 1

**Just run:**

```bash
rm -rf .next && npm run dev
```

This clears the Next.js build cache and restarts fresh.

---

## 📝 WHY THIS HAPPENS

- Next.js caches compiled chunks
- When files change, cache can become stale
- Deleting `.next` forces a fresh build

---

## ✅ AFTER FIXING

Once the server restarts without errors:

1. Go to http://localhost:3000/dashboard
2. Check if it loads properly
3. Continue with verification tests

---

## 🚀 QUICK COMMAND

```bash
rm -rf .next && npm run dev
```

**Run this now!** ✅
