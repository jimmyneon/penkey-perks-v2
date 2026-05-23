# 🚀 Deployment Guide

Complete guide to deploying Penkey Perks to production.

---

## Prerequisites

- ✅ Supabase project set up (see `SUPABASE_SETUP.md`)
- ✅ GitHub repository created
- ✅ Vercel account
- ✅ Domain access (`penkey.co.uk`)
- ✅ Resend account for emails

---

## 1. Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Penkey Perks v1"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/penkey-perks.git

# Push
git push -u origin main
```

---

## 2. Deploy to Vercel

### Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Add Environment Variables

Click "Environment Variables" and add:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend Email
RESEND_API_KEY=re_gCRZG5u7_LFyC36xo8YiMPR21FKH1Anu6
RESEND_FROM_EMAIL=noreply@rewards.penkey.co.uk
RESEND_REPLY_TO_EMAIL=nfdrepairs@gmail.com

# Admin
ADMIN_EMAILS=john@penkey.co.uk,amanda@penkey.co.uk

# App URL (update after deployment)
NEXT_PUBLIC_APP_URL=https://perks.penkey.co.uk

# Cron Job Secret (for email system)
# Generate with: openssl rand -base64 32
CRON_SECRET=3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=
```

**Important**: Add these to all environments (Production, Preview, Development)

5. Click "Deploy"
6. Wait for deployment (~2-3 minutes)
7. You'll get a URL like `penkey-perks.vercel.app`

---

## 3. Configure Custom Domain

### Add Domain in Vercel

1. Go to your project in Vercel
2. Click "Settings" > "Domains"
3. Add domain: `perks.penkey.co.uk`
4. Vercel will show DNS configuration needed

### Update DNS Records

In your domain registrar (e.g., Cloudflare, GoDaddy):

1. Add CNAME record:
   - **Type**: CNAME
   - **Name**: `perks`
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: Auto or 3600

2. Wait for DNS propagation (5-60 minutes)
3. Vercel will auto-verify and issue SSL certificate

### Update Environment Variables

1. Go back to Vercel > Settings > Environment Variables
2. Update `NEXT_PUBLIC_APP_URL`:
   ```
   NEXT_PUBLIC_APP_URL=https://perks.penkey.co.uk
   ```
3. Redeploy for changes to take effect

---

## 4. Configure Supabase for Production

### Update Redirect URLs

1. Go to Supabase project
2. Navigate to **Authentication** > **URL Configuration**
3. Add to **Redirect URLs**:
   ```
   https://perks.penkey.co.uk/auth/callback
   https://perks.penkey.co.uk
   ```
4. Update **Site URL**: `https://perks.penkey.co.uk`

### Update Google OAuth (if enabled)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add to **Authorized redirect URIs**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. Add to **Authorized JavaScript origins**:
   ```
   https://perks.penkey.co.uk
   ```

---

## 5. Set Up Resend Email

### Verify Domain

1. Go to [resend.com](https://resend.com)
2. Navigate to **Domains**
3. Click "Add Domain"
4. Enter: `penkey.co.uk`
5. Add DNS records shown:
   - **TXT** record for verification
   - **MX** records for email delivery
   - **CNAME** records for DKIM
6. Wait for verification (~10 minutes)

### Create API Key

1. Go to **API Keys**
2. Click "Create API Key"
3. Name: "Penkey Perks Production"
4. Copy key and add to Vercel environment variables

### Test Email

Send a test email via Resend dashboard to verify setup.

---

## 6. Create PWA Icons

### Generate Icons

1. Create a 512x512 PNG logo (duck theme)
2. Use [realfavicongenerator.net](https://realfavicongenerator.net)
3. Upload your logo
4. Download package
5. Extract files to `/public/`:
   - `icon-192.png`
   - `icon-512.png`
   - `favicon.ico`
   - `apple-touch-icon.png`

### Update Manifest

Already configured in `/public/manifest.json` - no changes needed.

---

## 7. Final Checks

### Test Customer Flow

- [ ] Sign up with email
- [ ] Sign in with Google (if enabled)
- [ ] Daily check-in
- [ ] Play all 3 games
- [ ] View rewards
- [ ] Create referral link
- [ ] Test PWA installation (iOS & Android)

### Test Admin Flow

- [ ] Admin login
- [ ] View dashboard stats
- [ ] Search customers
- [ ] Add/remove ducks manually
- [ ] Create new reward
- [ ] Configure game probabilities
- [ ] View transaction logs

### Performance

- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Test on slow 3G connection
- [ ] Verify images are optimized
- [ ] Check bundle size

---

## 8. Monitoring & Analytics

### Vercel Analytics (Optional)

1. Go to Vercel project
2. Click "Analytics" tab
3. Enable Vercel Analytics
4. Add to `app/layout.tsx`:
   ```tsx
   import { Analytics } from '@vercel/analytics/react'
   
   // In return statement
   <Analytics />
   ```

### Supabase Monitoring

1. Go to Supabase project
2. Check **Logs** regularly
3. Monitor **Usage** for limits
4. Set up alerts for errors

### Error Tracking (Optional)

Consider adding [Sentry](https://sentry.io) for error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## 9. Post-Deployment Tasks

### Create Admin Accounts

1. Sign up with admin emails (from `ADMIN_EMAILS`)
2. Verify admin access to `/admin/dashboard`

### Add Initial Rewards

1. Login as admin
2. Go to **Rewards** section
3. Create rewards:
   - Free Coffee (10 ducks)
   - Free Sandwich (20 ducks)
   - 10% Off (5 ducks)

### Configure Games

1. Go to **Games** section
2. Verify all 3 games are enabled
3. Adjust probabilities if needed

### Test QR Code Redemption

1. Create test customer account
2. Manually add 10 ducks (admin panel)
3. Customer should receive reward
4. Test QR code scanning and redemption

---

## 10. Email System Setup

### Run Email Migrations

**IMPORTANT**: Run these migrations in Supabase SQL Editor:

1. `supabase/migrations/20251011_email_system.sql`
2. `supabase/migrations/20251011_seed_email_templates.sql`
3. `supabase/migrations/20251011_seed_email_triggers.sql`

### Verify Cron Jobs

The `vercel.json` file already includes cron jobs:

```json
"crons": [
  {
    "path": "/api/emails/process-queue",
    "schedule": "*/5 * * * *"
  },
  {
    "path": "/api/emails/send-reminders",
    "schedule": "0 9 * * *"
  }
]
```

**Note**: Vercel Cron requires a **Pro plan** ($20/month). If on Hobby plan, use an external cron service like [cron-job.org](https://cron-job.org) to hit these endpoints:
- `https://perks.penkey.co.uk/api/emails/process-queue`
- `https://perks.penkey.co.uk/api/emails/send-reminders`

### Test Email System

```bash
# Test queue processing
curl -X POST https://perks.penkey.co.uk/api/emails/process-queue \
  -H "Authorization: Bearer 3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc="

# Test reminders
curl -X POST https://perks.penkey.co.uk/api/emails/send-reminders \
  -H "Authorization: Bearer 3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc="
```

### Verify Emails

- [ ] Welcome email sent on signup
- [ ] Reward earned email with QR code
- [ ] Referral confirmed email
- [ ] Check email logs in Supabase

---

## 11. Launch Checklist

- [ ] All environment variables set (including CRON_SECRET)
- [ ] Custom domain working with SSL
- [ ] Supabase database seeded
- [ ] Email migrations run
- [ ] Cron jobs configured (Vercel Pro or external)
- [ ] Admin accounts created
- [ ] Rewards configured
- [ ] Games tested
- [ ] Email system tested
- [ ] PWA installable
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] Error handling tested

---

## 🔄 Updating Production

### Deploy Updates

```bash
# Make changes
git add .
git commit -m "Description of changes"
git push

# Vercel auto-deploys on push to main
```

### Database Migrations

For schema changes:

1. Test changes locally first
2. Backup production database (Supabase dashboard)
3. Run migration in Supabase SQL Editor
4. Test thoroughly
5. Deploy app changes

---

## 🆘 Rollback

If something goes wrong:

1. Go to Vercel project
2. Click "Deployments"
3. Find last working deployment
4. Click "..." > "Promote to Production"

---

## 📊 Performance Targets

- **Lighthouse Score**: 90+ (all categories)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Largest Contentful Paint**: < 2.5s

---

## 🔐 Security Checklist

- [ ] Environment variables not in code
- [ ] Service role key kept secret
- [ ] RLS policies enabled on all tables
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Rate limiting considered

---

## 📱 Browser Support

Tested and working on:
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- iOS Safari 14+
- Chrome Android 90+

---

## 🎉 Launch!

Once all checks pass:

1. Announce to Penkey Deli staff
2. Train staff on admin panel
3. Create promotional materials
4. Share with customers
5. Monitor for issues

---

**Deployment complete! 🚀**

Your app is live at `https://perks.penkey.co.uk`
