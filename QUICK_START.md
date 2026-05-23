# ⚡ QUICK START - Penkey Perks

**Get up and running in 15 minutes**

---

## 🎯 THE ESSENTIALS

### **What This App Does:**
- Customers earn **points** for visits (5 points per check-in)
- Collect **coffee stamps** (10 = free coffee)
- Play **daily games** for bonus rewards
- Earn **badges** based on lifetime points
- **Redeem rewards** with QR codes

---

## 🚀 SETUP (3 Steps)

### **1. Database (5 mins)**

Open Supabase SQL Editor and run these 3 files in order:

```
1. supabase/migrations/20251009_FINAL_FIX_ALL.sql
2. supabase/migrations/20251009_three_tier_rewards_system.sql
3. supabase/migrations/20251009_badges_milestones.sql
```

**Verify it worked:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'points_transactions';
```
Should return 1 row.

---

### **2. Environment Variables**

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
ADMIN_EMAILS=your@email.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### **3. Run Locally**

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## ✅ TEST IT WORKS

### **Quick Test (2 mins):**

1. **Sign up:** Create account at http://localhost:3000
2. **Check in:** Go to `/check-in`
3. **See points:** Dashboard should show 5 points
4. **Play game:** Click today's game, win a prize

**If all 4 work → You're ready to deploy!**

---

## 🐛 TROUBLESHOOTING

### **"Function does not exist"**
→ Run database migrations (Step 1 above)

### **"Unauthorized"**
→ Check `.env.local` has correct Supabase keys

### **Points not showing**
→ Run this in Supabase SQL Editor:
```sql
SELECT * FROM points_transactions LIMIT 1;
```
If error → migrations didn't run

---

## 📱 HOW CUSTOMERS USE IT

1. **Sign up** → Get account
2. **Visit shop** → Tap NFC or go to `/check-in`
3. **Earn 5 points** → Automatic
4. **Play game** → Win bonus rewards
5. **Collect 50 points** → Redeem £5 voucher
6. **Show QR code** → Staff scans to redeem

---

## 🎮 HOW THE SYSTEMS WORK

### **Points System:**
- Check in = +5 points
- Referral = +10 points
- Games = +5-20 points
- Redeem at 50/75/90 points

### **Coffee Stamps:**
- Buy coffee → Add stamp (GPS validated)
- 10 stamps = Free coffee reward
- Separate from points

### **Games:**
- 1 random game per day
- Everyone sees same game
- Win points, stamps, or instant rewards
- Stock limits prevent over-giving

### **Badges:**
- 0-49 pts: Fresh Duck
- 50-199 pts: Quacking Customer
- 200-499 pts: Duck Commander
- 500-999 pts: Lord of the Ducks
- 1000-1999 pts: Penkey Privateer
- 2000+ pts: Grand Duck Master

---

## 🚀 DEPLOY TO PRODUCTION

### **Quick Deploy:**

1. **Push to GitHub:**
```bash
git push origin main
```

2. **Deploy on Vercel:**
   - Import repository
   - Add environment variables
   - Deploy

3. **Run migrations on production database**
   - Same 3 SQL files
   - In production Supabase project

4. **Enable GPS validation:**
   - Edit `/app/api/check-in/route.ts`
   - Uncomment GPS validation code
   - Update shop coordinates

---

## 📊 ADMIN PANEL

Access at `/admin` (must be in `ADMIN_EMAILS`)

**What you can do:**
- View customer stats
- Add/remove points manually
- Create rewards
- Configure games
- Manage staff
- View transaction logs

---

## 🎯 COMMON TASKS

### **Add a new reward:**
1. Go to `/admin/rewards`
2. Click "Create Reward"
3. Set points required
4. Set expiry days
5. Save

### **Change game probabilities:**
1. Go to `/admin/games`
2. Select game
3. Edit prize probabilities
4. Must sum to 100%
5. Save

### **Give customer bonus points:**
1. Go to `/admin/customers`
2. Search for customer
3. Click "Add Points"
4. Enter amount and reason
5. Confirm

### **Redeem a reward:**
1. Customer shows QR code
2. Scan with phone camera
3. Opens redemption page
4. Click "Redeem"
5. Reward marked as used

---

## 📞 NEED HELP?

**Read these guides:**
- `DATABASE_SETUP_GUIDE.md` - Detailed database setup
- `COMPLETE_SETUP_GUIDE.md` - Full deployment guide
- `SYSTEM_LOGIC_GUIDE.md` - How everything works

**Check logs:**
- Vercel: Function logs
- Supabase: Database logs
- Browser: Console errors

---

## ✨ YOU'RE DONE!

If you've completed the 3 setup steps and the test works, you're ready to go!

**Next steps:**
1. ✅ Test all features locally
2. ✅ Deploy to Vercel
3. ✅ Run migrations on production
4. ✅ Test in production
5. ✅ Launch! 🎉

---

**Built with ❤️ for Penkey Deli**
