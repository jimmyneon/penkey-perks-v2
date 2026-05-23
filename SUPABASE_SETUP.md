# 🗄️ Supabase Setup Guide

Step-by-step instructions to set up your Supabase database for Penkey Perks.

---

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Name**: Penkey Perks
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users (e.g., London)
5. Click "Create new project"
6. Wait for project to initialize (~2 minutes)

---

## 2. Run Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Wait for completion (should see "Success" message)

This creates:
- ✅ All tables (users, ducks, rewards, etc.)
- ✅ Row Level Security policies
- ✅ Database functions (can_check_in, etc.)
- ✅ Triggers for auto-reward issuance
- ✅ Seed data for mini-games

---

## 3. Configure Authentication

### Enable Email Auth
1. Go to **Authentication** > **Providers**
2. **Email** should be enabled by default
3. Configure email templates (optional):
   - Go to **Authentication** > **Email Templates**
   - Customize "Confirm signup" and "Magic Link" templates

### Enable Google OAuth (Optional)
1. Go to **Authentication** > **Providers**
2. Enable **Google**
3. Create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** > **Create Credentials** > **OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
4. Copy **Client ID** and **Client Secret**
5. Paste into Supabase Google provider settings
6. Save

---

## 4. Get API Keys

1. Go to **Settings** > **API** (left sidebar)
2. Copy these values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: Your public API key
   - **service_role**: Your service role key (keep secret!)

3. Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 5. Verify Setup

### Check Tables
1. Go to **Table Editor**
2. You should see all tables:
   - users
   - ducks
   - rewards
   - user_rewards
   - referrals
   - staff
   - mini_games
   - game_prizes
   - game_plays
   - transactions

### Check Functions
1. Go to **Database** > **Functions**
2. You should see:
   - can_check_in
   - get_user_duck_count
   - check_and_issue_rewards
   - can_play_game

### Check Triggers
1. Go to **Database** > **Triggers**
2. You should see:
   - after_duck_insert
   - update_users_updated_at
   - update_rewards_updated_at
   - update_staff_updated_at
   - update_mini_games_updated_at

### Check Seed Data
1. Go to **Table Editor** > **mini_games**
2. You should see 3 games:
   - scratch_card
   - spin_wheel
   - duck_pond
3. Go to **game_prizes**
4. You should see prizes for each game

---

## 6. Test Database

### Test Check-In Function
```sql
-- Replace with a real user ID after signup
SELECT can_check_in('user-uuid-here');
-- Should return: true
```

### Test Duck Count
```sql
SELECT get_user_duck_count('user-uuid-here');
-- Should return: 0 (for new user)
```

### Add Test Duck
```sql
INSERT INTO ducks (user_id) VALUES ('user-uuid-here');
-- Should succeed and trigger reward check
```

---

## 7. Row Level Security (RLS)

All tables have RLS enabled. Verify policies:

1. Go to **Authentication** > **Policies**
2. Each table should have policies like:
   - "Users can view own profile"
   - "Users can view own ducks"
   - "Anyone can view active rewards"

If policies are missing, re-run the schema.sql file.

---

## 8. Create First Admin

### Option A: Via Environment Variable (Recommended)
1. Add your email to `.env.local`:
   ```env
   ADMIN_EMAILS=john@penkey.co.uk,amanda@penkey.co.uk
   ```
2. Sign up with that email in the app
3. Admin record will be auto-created

### Option B: Manual SQL Insert
1. Sign up normally in the app
2. Get your user ID from **Authentication** > **Users**
3. Run in SQL Editor:
   ```sql
   INSERT INTO staff (user_id, role)
   VALUES ('your-user-id', 'owner');
   ```

---

## 9. Optional: Sample Rewards

Add some test rewards via SQL Editor:

```sql
INSERT INTO rewards (name, description, type, value, duck_threshold, expiry_days, active)
VALUES
  ('Free Coffee', 'Enjoy any coffee on the house!', 'free_item', 'Free Coffee', 10, 30, true),
  ('Free Sandwich', 'Get any sandwich for free!', 'free_item', 'Free Sandwich', 20, 30, true),
  ('10% Off', 'Get 10% off your entire order', 'discount', '10%', 5, 14, true),
  ('5 Bonus Ducks', 'Instant 5 bonus ducks!', 'bonus_ducks', '5', 15, NULL, true);
```

---

## 10. Monitoring & Logs

### View Logs
1. Go to **Logs** (left sidebar)
2. Select log type:
   - **Postgres Logs**: Database queries
   - **API Logs**: API requests
   - **Auth Logs**: Authentication events

### Database Usage
1. Go to **Settings** > **Usage**
2. Monitor:
   - Database size
   - API requests
   - Bandwidth

---

## 🔧 Troubleshooting

### "relation does not exist" error
- Schema wasn't run properly
- Re-run `supabase/schema.sql`

### "permission denied" error
- RLS policies not set up
- Check policies in **Authentication** > **Policies**

### Functions not working
- Check **Database** > **Functions**
- Ensure they're marked as `SECURITY DEFINER`

### Triggers not firing
- Check **Database** > **Triggers**
- Verify trigger function exists

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

---

**Setup complete! 🎉**

Your database is ready. Run `npm run dev` and start testing!
