# ✅ TESTING CHECKLIST - Penkey Perks

**Database migrations completed!** Now let's test everything works.

---

## 🧪 QUICK VERIFICATION (5 mins)

### **Step 1: Start Dev Server**

```bash
npm run dev
```

Should see:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

---

### **Step 2: Open App**

Go to: http://localhost:3000

**Expected:** Landing page loads

---

### **Step 3: Sign Up**

1. Click "Sign Up" or go to `/login`
2. Enter email and password
3. Click "Sign Up"

**Expected:** 
- Redirects to onboarding or dashboard
- No errors in console

---

### **Step 4: Check Dashboard**

Go to: http://localhost:3000/dashboard

**Expected to see:**
- ✅ Your name in header
- ✅ Points balance (should be 0)
- ✅ Coffee stamps (0/10)
- ✅ Today's game
- ✅ Badge (Fresh Duck)

**If you see errors:** Check browser console (F12)

---

### **Step 5: Test Check-In**

Go to: http://localhost:3000/check-in

**Expected:**
- ✅ "Checking you in..." loading state
- ✅ Success message with confetti
- ✅ "+5 Points earned"
- ✅ "Total points: 5"

**If it fails:** 
- Check console for errors
- Verify `add_points` function exists in Supabase
- Check RLS policies

---

### **Step 6: Verify Points on Dashboard**

Go back to: http://localhost:3000/dashboard

**Expected:**
- ✅ Points balance shows **5**
- ✅ Last visit shows today's date
- ✅ Status shows "Checked in today"

---

### **Step 7: Try Check-In Again**

Go to: http://localhost:3000/check-in

**Expected:**
- ✅ Error: "Already checked in today"
- ✅ Cannot check in twice

This confirms the 24-hour cooldown works!

---

## 🎮 FULL TESTING (15 mins)

### **1. Games System**

**Test:**
1. Go to dashboard
2. Scroll to "Daily Game"
3. Click "Play Now"
4. Play the game
5. Win a prize

**Expected:**
- ✅ Game loads
- ✅ Can play once
- ✅ Prize is awarded (points/stamps/reward)
- ✅ Cannot play again today
- ✅ Dashboard updates with prize

**Check in Supabase:**
```sql
SELECT * FROM game_plays 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

---

### **2. Points System**

**Test:**
1. Check current balance on dashboard
2. Go to `/points/history`
3. View transaction history

**Expected:**
- ✅ Shows all point transactions
- ✅ Check-in: +5 points
- ✅ Game prize: +X points (if won)
- ✅ Balance is correct

**Check in Supabase:**
```sql
SELECT * FROM points_transactions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

Should see:
- Visit transaction (+5 points)
- Any game bonuses

---

### **3. Coffee Stamps**

**Test:**
1. Go to `/add-coffee`
2. Click "Add Coffee Stamp"
3. Confirm location (GPS disabled for testing)

**Expected:**
- ✅ Success message
- ✅ Stamp added
- ✅ Dashboard shows 1/10 stamps

**Check in Supabase:**
```sql
SELECT * FROM coffee_stamps 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

---

### **4. Rewards System**

**Test manually adding points to trigger reward:**

In Supabase SQL Editor:
```sql
-- Add 45 more points to reach 50 (for £5 voucher)
SELECT add_points(
  'YOUR_USER_ID'::uuid,
  45,
  'test',
  'Testing reward system'
);

-- Check if reward was issued
SELECT * FROM user_rewards 
WHERE user_id = 'YOUR_USER_ID' 
AND status = 'active';
```

**Then on dashboard:**
- ✅ Should see reward in wallet
- ✅ Can view reward details
- ✅ QR code displays

---

### **5. Referrals**

**Test:**
1. Go to `/referrals`
2. Copy referral link
3. Open in incognito/private window
4. Sign up with referral link

**Expected:**
- ✅ New user created
- ✅ Referral tracked in database
- ✅ Referrer gets bonus points when referee checks in

**Check in Supabase:**
```sql
SELECT * FROM referrals 
WHERE referrer_id = 'YOUR_USER_ID';
```

---

### **6. Admin Panel**

**Test (if you're admin):**
1. Go to `/admin`
2. View dashboard stats
3. Search for a customer
4. Try adding points manually

**Expected:**
- ✅ Can access admin panel
- ✅ Stats load correctly
- ✅ Can search customers
- ✅ Can manage rewards

**If you can't access:**
- Check `ADMIN_EMAILS` in `.env.local`
- Verify email matches exactly
- Check `staff` table in Supabase

---

## 🐛 TROUBLESHOOTING

### **"Function does not exist: get_user_points"**

**Fix:**
```sql
-- Verify function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'get_user_points';
```

If empty, re-run `20251009_FINAL_FIX_ALL.sql`

---

### **"Permission denied for table points_transactions"**

**Fix:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'points_transactions';

-- Check policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'points_transactions';
```

Should have 4 policies. If not, re-run `FINAL_FIX_ALL.sql`

---

### **Points not showing on dashboard**

**Debug:**
1. Open browser console (F12)
2. Check for errors
3. Look at Network tab for failed requests

**Check in Supabase:**
```sql
-- Get your user ID
SELECT id, email FROM users WHERE email = 'your@email.com';

-- Check points
SELECT get_user_points('YOUR_USER_ID'::uuid);

-- Check transactions
SELECT * FROM points_transactions WHERE user_id = 'YOUR_USER_ID';
```

---

### **Games not appearing**

**Fix:**
```sql
-- Check games exist and are enabled
SELECT * FROM mini_games WHERE enabled = true;
```

Should return 3 games. If not:
```sql
INSERT INTO mini_games (name, display_name, description, icon, enabled) VALUES
  ('scratch_card', 'Scratch Card', 'Scratch to reveal your prize!', '🎫', true),
  ('spin_wheel', 'Spin Wheel', 'Spin the wheel of fortune!', '🎡', true),
  ('duck_pond', 'Duck Pond', 'Pick a lucky duck!', '🦆', true);
```

---

## ✅ SUCCESS CRITERIA

Your app is working if:

- ✅ Can sign up and log in
- ✅ Dashboard loads with correct data
- ✅ Check-in awards 5 points
- ✅ Points show on dashboard
- ✅ Can play games once per day
- ✅ Games award prizes
- ✅ Coffee stamps can be added
- ✅ Rewards appear when earned

---

## 📊 VERIFICATION QUERIES

Run these in Supabase to verify everything:

```sql
-- 1. Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check all functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 3. Check your user data
SELECT 
  u.email,
  get_user_points(u.id) as points,
  get_lifetime_points(u.id) as lifetime_points,
  (SELECT COUNT(*) FROM coffee_stamps WHERE user_id = u.id) as stamps,
  (SELECT COUNT(*) FROM game_plays WHERE user_id = u.id) as games_played,
  (SELECT COUNT(*) FROM user_rewards WHERE user_id = u.id AND status = 'active') as active_rewards
FROM users u
WHERE u.email = 'your@email.com';
```

---

## 🎯 NEXT STEPS

Once all tests pass:

1. ✅ **Test on mobile device**
   - Open on phone
   - Test touch interactions
   - Verify responsive design

2. ✅ **Deploy to Vercel**
   - Push to GitHub
   - Import to Vercel
   - Add environment variables

3. ✅ **Test in production**
   - Run migrations on prod DB
   - Test all flows again
   - Enable GPS validation

4. ✅ **Launch!** 🚀

---

**Good luck with testing!** 🦆☕
