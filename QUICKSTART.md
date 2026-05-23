# ⚡ Quick Start Guide

Get Penkey Perks running in 10 minutes!

---

## 1. Install Dependencies (1 min)

```bash
npm install
```

---

## 2. Set Up Supabase (3 min)

1. Go to [supabase.com](https://supabase.com) and create a project
2. In SQL Editor, paste and run `supabase/schema.sql`
3. Go to Settings > API and copy:
   - Project URL
   - anon public key
   - service_role key

---

## 3. Configure Environment (2 min)

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=perks@penkey.co.uk

ADMIN_EMAILS=your-email@example.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. Run Development Server (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 5. Test the App (3 min)

### Create Account
1. Click "Get Started"
2. Sign up with your admin email
3. You'll be redirected to dashboard

### Test Customer Features
- ✅ Click "Check In Now" to earn a duck
- ✅ Play a mini-game
- ✅ View rewards (manually add 10 ducks in database to test)
- ✅ Check referrals page

### Test Admin Features
1. Go to `/admin/dashboard`
2. You should have access (your email is in ADMIN_EMAILS)
3. View stats, customers, rewards, games

---

## 🎉 Done!

Your app is running locally. Next steps:

- **Add Rewards**: Go to `/admin/rewards` and create some rewards
- **Test Games**: Check in, then play all 3 games
- **Deploy**: Follow `DEPLOYMENT.md` when ready

---

## 🆘 Troubleshooting

### "Unauthorized" error
- Check your Supabase keys in `.env.local`
- Make sure schema.sql was run successfully

### Admin access denied
- Verify your email is in `ADMIN_EMAILS`
- Check `staff` table in Supabase has your user_id

### Games not showing
- Run `supabase/schema.sql` to seed game data
- Check `mini_games` table has 3 games

---

## 📚 Full Documentation

- `README.md` - Complete guide
- `SUPABASE_SETUP.md` - Detailed database setup
- `DEPLOYMENT.md` - Production deployment
- `database_map.md` - Schema reference
- `PROJECT_SUMMARY.md` - Overview

---

**Happy coding! 🦆**
