# 🚀 Vercel Deployment Guide - Penkey Perks

## Step 1: Fix GitHub Push Issue

Your GitHub token needs **write permissions**. Choose one option:

### Option A: Generate New Token (Recommended)
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "Penkey Perks Deploy"
4. **Select scopes**: ✅ `repo` (full control)
5. Generate and copy the token
6. Run in terminal:
```bash
cd /Users/johnhopwood/penkeygameapp
git remote set-url origin https://YOUR_NEW_TOKEN@github.com/jimmyneon/penkey-perks.git
git push -u origin main
```

### Option B: Use GitHub Desktop (Easiest!)
1. Download: https://desktop.github.com
2. Sign in with your GitHub account
3. File → Add Local Repository → `/Users/johnhopwood/penkeygameapp`
4. Click "Publish repository" or "Push origin"

---

## Step 2: Deploy to Vercel

Once code is pushed to GitHub:

1. **Go to**: https://vercel.com/new
2. **Sign in** with GitHub
3. **Import** repository: `jimmyneon/penkey-perks`
4. **Configure**:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

---

## Step 3: Environment Variables

Add these in Vercel project settings → Environment Variables:

### Required Variables

```bash
# Supabase (Get from: https://supabase.com/dashboard/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Resend Email (Get from: https://resend.com/api-keys)
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=noreply@rewards.penkey.co.uk
RESEND_REPLY_TO_EMAIL=nfdrepairs@gmail.com

# Admin Configuration
ADMIN_EMAILS=john@penkey.co.uk,amanda@penkey.co.uk

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Optional Variables

```bash
# Weather API (Get from: https://openweathermap.org/api)
OPENWEATHER_API_KEY=your_key_here

# Cron Secret (Generate with: openssl rand -base64 32)
CRON_SECRET=your_random_secret_here
```

### Push Notifications (Generate Keys)

Run this locally first:
```bash
node scripts/generate-vapid-keys.js
```

Then add the output to Vercel:
```bash
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
VAPID_SUBJECT=mailto:nfdrepairs@gmail.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_generated_public_key
```

---

## Step 4: Deploy!

1. Click **"Deploy"** in Vercel
2. Wait for build to complete (~2-3 minutes)
3. Get your live URL: `https://penkey-perks.vercel.app`

---

## Step 5: Post-Deployment Setup

### Update Supabase URLs
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

### Test Critical Features
- [ ] User signup/login
- [ ] Check-in system
- [ ] QR code scanning (staff)
- [ ] Points redemption
- [ ] Email notifications
- [ ] Push notifications

---

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Look at build logs in Vercel dashboard
- Ensure all dependencies are in package.json

### Database Issues
- Verify Supabase connection strings
- Check RLS policies are enabled
- Run migrations if needed

### Email Not Sending
- Verify Resend API key
- Check email templates in database
- Look at Vercel function logs

---

## Quick Commands Reference

```bash
# Push code updates
git add .
git commit -m "Your message"
git push

# Vercel will auto-deploy on push to main branch
```

---

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**Ready to deploy? Start with Step 1 above! 🚀**
