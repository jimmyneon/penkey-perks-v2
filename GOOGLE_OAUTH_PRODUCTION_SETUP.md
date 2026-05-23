# 🔐 Google OAuth Production Setup Guide

Complete checklist for setting up Google OAuth for production deployment.

---

## ✅ What's Already Done

- ✅ Google OAuth login button implemented
- ✅ Auth callback route configured
- ✅ Account selection prompt added (`prompt: 'select_account'`)
- ✅ Database trigger handles user creation automatically
- ✅ Admin role assignment working

---

## 🚀 Production Setup Required

### 1. **Google Cloud Console Setup**

#### Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing:
   - **Project Name**: "Penkey Perks" (or similar)
   - Click "Create"

3. Enable Google+ API (or Google Identity Services):
   - Go to **APIs & Services** > **Library**
   - Search for "Google+ API" or "Google Identity"
   - Click "Enable"

4. Create OAuth Consent Screen:
   - Go to **APIs & Services** > **OAuth consent screen**
   - Select **External** (for public users)
   - Fill in:
     - **App name**: Penkey Perks
     - **User support email**: nfdrepairs@gmail.com
     - **App logo**: Upload your logo (optional)
     - **Application home page**: https://perks.penkey.co.uk
     - **Authorized domains**: penkey.co.uk
     - **Developer contact**: nfdrepairs@gmail.com
   - Click "Save and Continue"
   - **Scopes**: Add these scopes:
     - `userinfo.email`
     - `userinfo.profile`
   - Click "Save and Continue"
   - **Test users** (optional for testing): Add your email
   - Click "Save and Continue"

5. Create OAuth Client ID:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Application type: **Web application**
   - Name: "Penkey Perks Web Client"
   - **Authorized JavaScript origins**:
     - `https://perks.penkey.co.uk`
     - `http://localhost:3000` (for local testing)
   - **Authorized redirect URIs**:
     - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
     - `http://localhost:54321/auth/v1/callback` (for local testing)
   - Click "Create"

6. **Copy the credentials**:
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `xxxxx`
   - Save these securely!

---

### 2. **Supabase Configuration**

#### Enable Google Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list
4. Toggle it to **Enabled**
5. Paste your Google OAuth credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
6. Click **Save**

#### Configure Redirect URLs

1. Go to **Authentication** > **URL Configuration**
2. Set the following:
   - **Site URL**: `https://perks.penkey.co.uk`
   - **Redirect URLs**: Add these (one per line):
     ```
     https://perks.penkey.co.uk/auth/callback
     https://perks.penkey.co.uk/**
     http://localhost:3000/auth/callback
     http://localhost:3000/**
     ```
3. Click **Save**

---

### 3. **Environment Variables**

No additional environment variables needed! The OAuth configuration is stored in Supabase.

Your existing `.env.local` should already have:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=john@penkey.co.uk,amanda@penkey.co.uk
NEXT_PUBLIC_APP_URL=https://perks.penkey.co.uk
```

---

### 4. **Vercel Deployment**

When deploying to Vercel, ensure these environment variables are set:

1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add all variables from `.env.local` (except local testing URLs)
3. Make sure `NEXT_PUBLIC_APP_URL` is set to production URL

---

## 🧪 Testing Checklist

### Local Testing (Development)

- [ ] Google OAuth button appears on login page
- [ ] Clicking button redirects to Google account selection
- [ ] Can select account and authorize
- [ ] Redirects back to `/auth/callback`
- [ ] User profile created in database
- [ ] User redirected to dashboard
- [ ] 250 beans awarded automatically
- [ ] Free coffee reward awarded
- [ ] Can sign in again with same Google account
- [ ] Account selection prompt appears every time

### Production Testing

- [ ] Deploy to Vercel
- [ ] Visit production URL
- [ ] Test Google OAuth flow
- [ ] Verify user creation
- [ ] Check database for user record
- [ ] Verify beans awarded
- [ ] Test admin email assignment (if applicable)
- [ ] Test on mobile device
- [ ] Test on different browsers

---

## 🔍 Verification Queries

After a user signs up with Google OAuth, run these in Supabase SQL Editor:

### Check User Created
```sql
SELECT id, email, name, avatar_url, created_at
FROM users
WHERE email = 'test@gmail.com';
```

### Check Beans Awarded
```sql
SELECT * FROM points_transactions
WHERE user_id = (SELECT id FROM users WHERE email = 'test@gmail.com')
AND type = 'signup';
```

### Check Free Coffee Reward
```sql
SELECT ur.*, r.name
FROM user_rewards ur
JOIN rewards r ON ur.reward_id = r.id
WHERE ur.user_id = (SELECT id FROM users WHERE email = 'test@gmail.com')
AND r.name = 'Free Coffee';
```

---

## 🐛 Troubleshooting

### "OAuth Error: redirect_uri_mismatch"
**Problem**: Redirect URI not authorized in Google Cloud Console

**Solution**:
1. Check the error message for the exact redirect URI
2. Add it to **Authorized redirect URIs** in Google Cloud Console
3. Format should be: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

---

### "User not created in database"
**Problem**: Database trigger not firing

**Solution**:
1. Check if `handle_new_user` function exists:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'handle_new_user';
   ```
2. Check if trigger exists:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
3. If missing, run the migration:
   ```bash
   psql -f supabase/migrations/20251013_add_free_coffee_on_signup.sql
   ```

---

### "Account selection not appearing"
**Problem**: Google remembers last account

**Solution**:
- This is now fixed! The code includes `prompt: 'select_account'`
- If still not working, clear browser cookies for Google
- Or test in incognito/private mode

---

### "Admin role not assigned"
**Problem**: Email not in ADMIN_EMAILS list

**Solution**:
1. Check `.env.local` (local) or Vercel env vars (production)
2. Ensure email matches exactly (case-sensitive)
3. Format: `ADMIN_EMAILS=john@penkey.co.uk,amanda@penkey.co.uk`
4. Restart dev server after changing env vars

---

## 🔒 Security Best Practices

### Production Checklist

- [ ] OAuth consent screen published (not in testing mode)
- [ ] Client Secret stored securely in Supabase (never in code)
- [ ] Redirect URIs restricted to your domain only
- [ ] Remove localhost URLs from production Google OAuth settings
- [ ] Enable 2FA on Google Cloud Console account
- [ ] Regularly review OAuth access logs
- [ ] Set up Supabase auth rate limiting

### Google Cloud Console Security

1. **Restrict API Key** (if using):
   - Go to **Credentials**
   - Edit API key
   - Set **Application restrictions** to "HTTP referrers"
   - Add: `perks.penkey.co.uk/*`

2. **Monitor Usage**:
   - Check **APIs & Services** > **Dashboard**
   - Review OAuth consent screen users
   - Monitor for suspicious activity

---

## 📊 What Happens on Google Sign-In

### Flow Diagram

```
User clicks "Sign in with Google"
         ↓
Redirects to Google account selection
         ↓
User selects account & authorizes
         ↓
Google redirects to Supabase callback
         ↓
Supabase exchanges code for session
         ↓
Redirects to /auth/callback
         ↓
Database trigger fires (handle_new_user)
         ↓
User profile created in 'users' table
         ↓
250 beans awarded
         ↓
Free coffee reward added
         ↓
Check if admin email → add to staff table
         ↓
Redirect to dashboard (or staff dashboard)
```

---

## 🎯 Quick Start Commands

### Test Locally
```bash
# 1. Ensure env vars are set
cat .env.local | grep SUPABASE

# 2. Start dev server
npm run dev

# 3. Visit login page
open http://localhost:3000/login

# 4. Click "Sign in with Google"
```

### Deploy to Production
```bash
# 1. Commit changes
git add .
git commit -m "Add Google OAuth production config"
git push

# 2. Vercel will auto-deploy
# 3. Check deployment logs
vercel logs

# 4. Test on production
open https://perks.penkey.co.uk/login
```

---

## ✅ Production Readiness Checklist

Before going live:

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth Client ID created with correct redirect URIs
- [ ] Google provider enabled in Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Environment variables set in Vercel
- [ ] Tested OAuth flow locally
- [ ] Tested OAuth flow on production
- [ ] Verified user creation in database
- [ ] Verified beans awarded
- [ ] Verified admin assignment works
- [ ] Tested on mobile device
- [ ] Tested account selection prompt
- [ ] Documented for team/staff

---

## 📞 Support

If you encounter issues:

1. Check Supabase Auth logs: **Authentication** > **Logs**
2. Check Vercel function logs: `vercel logs`
3. Check browser console for errors
4. Review Google Cloud Console logs

---

## 🎉 You're Ready!

Once all checkboxes are complete, Google OAuth is production-ready!

Users can now sign in with:
- ✅ Email & Password
- ✅ Google OAuth (with account selection)

Both methods will:
- Create user profile automatically
- Award 250 beans signup bonus
- Award free coffee reward
- Assign admin role if email matches
