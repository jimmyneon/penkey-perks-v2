# Referral System Explained

## How It Works

### 1. **User Shares Referral Link**
- Each user has a unique referral code (base64 encoded user ID)
- Referral URL: `https://rewards.penkey.co.uk/ref/[CODE]`
- Can share via QR code, link, WhatsApp, Twitter, Facebook

### 2. **New User Signs Up**
When someone clicks a referral link:
- **If not logged in**: Redirects to `/login?ref=[CODE]`
  - After signup, referral is claimed automatically
- **If already logged in**: Processes referral immediately
  - Shows toast notification with result

### 3. **Referral Created**
When a new user signs up with a referral code:
```sql
INSERT INTO referrals (
  referrer_id,  -- Person who sent the invite
  referred_id,  -- Person who signed up
  confirmed     -- FALSE initially
)
```

**Rewards at signup:**
- Referrer gets: **50 beans** immediately
- New user gets: **250 beans** signup bonus + **Free Coffee**

### 4. **Referral Confirmed**
When the referred user completes their **first check-in** at Penkey:
```sql
UPDATE referrals 
SET confirmed = TRUE, 
    confirmed_at = NOW()
WHERE referred_id = [user_id]
```

**Additional rewards on confirmation:**
- Referrer gets: **+50 beans** (100 beans total)
- This ensures referrers only get full reward if friend actually visits

## Referral Stats Explained

### **Total Referrals**
- Count of ALL people who signed up with your link
- Query: `SELECT COUNT(*) FROM referrals WHERE referrer_id = [your_id]`

### **Confirmed Referrals**
- Count of referred users who checked in at least once
- Query: `SELECT COUNT(*) FROM referrals WHERE referrer_id = [your_id] AND confirmed = TRUE`

### **Pending Referrals**
- Count of referred users who haven't checked in yet
- Calculation: `Total - Confirmed`
- These people signed up but haven't visited Penkey yet

## Database Schema

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  referrer_id UUID NOT NULL,      -- Who sent the invite
  referred_id UUID NOT NULL,      -- Who signed up (UNIQUE)
  confirmed BOOLEAN DEFAULT false, -- TRUE after first check-in
  created_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  
  CONSTRAINT unique_referral UNIQUE (referred_id),
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_id)
);
```

## Error Messages

| Error | Meaning |
|-------|---------|
| "Cannot use your own referral code" | Trying to refer yourself |
| "Already referred by someone else" | User already has a referrer |
| "Invalid referral code" | Code is malformed or user doesn't exist |
| "Referral Applied! 🎉" | Success! |

## Notifications

### **When Someone Signs Up (Immediate)**
- Referrer sees: "🎉 Referral Applied! Thanks for using [name]'s referral link!"
- Referrer gets: 50 beans

### **When They Check In (Later)**
- Trigger: `on_checkin_confirm_referral`
- Referrer gets: +50 beans (100 total)
- Notification: (To be implemented - push notification or in-app alert)

## Testing Referrals

1. **Get your referral link**: Go to Referrals page
2. **Share with friend**: Send link or show QR code
3. **Friend signs up**: They get 250 beans + free coffee
4. **You get 50 beans**: Immediately
5. **Friend checks in**: You get +50 beans (100 total)
6. **Check stats**: See Total, Confirmed, Pending counts

## Important Notes

- ✅ Each user can only be referred ONCE (unique constraint)
- ✅ Cannot refer yourself (check constraint)
- ✅ Referral bonus split: 50 beans on signup + 50 on first check-in
- ✅ New user gets: 250 beans + free coffee (regardless of referral)
- ✅ Works for both logged-in and logged-out users
- ⚠️ Must run migration `20251015_fix_referrals_and_onboarding.sql` in Supabase!

## Migration Required

**CRITICAL**: The referrals table doesn't exist yet!

Run this in Supabase SQL Editor:
```bash
# Copy contents of:
supabase/migrations/20251015_fix_referrals_and_onboarding.sql

# Paste and run in Supabase Dashboard → SQL Editor
```

This creates:
- `referrals` table
- RLS policies
- Confirmation trigger on check-ins
- Improved OAuth name extraction
