# 🦆 Penkey Perks

A gamified loyalty and referral web app for Penkey Deli. Customers collect ducks, play mini-games, and earn rewards!

---

## 🚀 Features

### Customer Features
- **Daily Check-ins**: Earn 1 duck per day
- **Mini-Games**: Play Scratch Card, Spin Wheel, or Duck Pond for bonus prizes
- **Rewards Wallet**: Collect and redeem rewards with QR codes
- **Referral System**: Invite friends and earn bonus ducks
- **Mobile-First Design**: Optimized for phones with PWA support

### Admin Features
- **Dashboard**: View stats, top customers, and activity
- **Customer Management**: Search, view profiles, add/remove ducks
- **Reward Management**: Create, edit, and manage rewards
- **Games Management**: Configure mini-games and probabilities
- **Transaction Logs**: Full audit trail of all actions
- **Staff Management**: Add employees with role-based permissions

---

## 📋 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + ShadCN UI
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Email**: Resend
- **Deployment**: Vercel
- **PWA**: Installable web app

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Resend account (for emails)
- Vercel account (for deployment)

### 1. Clone and Install

```bash
cd penkeygameapp
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=perks@penkey.co.uk

# Admin
ADMIN_EMAILS=john@penkey.co.uk,amanda@penkey.co.uk

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📍 GPS Setup (Required)

**Before launch, set Penkey's GPS coordinates:**

1. **Quick Setup** (5 minutes): See `QUICK_GPS_SETUP.md`
2. **Detailed Guide**: See `GPS_SETUP_GUIDE.md`
3. **Test Page**: Go to `/test-gps` to verify

**File to edit:** `lib/location-utils.ts`

---

## 🗄️ Database Schema

See `database_map.md` for complete schema documentation.

### Key Tables
- `users` - Customer profiles
- `ducks` - Loyalty stamps
- `rewards` - Available rewards
- `user_rewards` - Issued rewards
- `mini_games` - Game configurations
- `game_prizes` - Prize definitions
- `staff` - Admin/employee roles

---

## 🎮 How It Works

### Customer Flow
1. **Sign Up**: Create account with email or Google
2. **Check In**: Visit daily to earn 1 duck
3. **Play Games**: After check-in, play a bonus game
4. **Earn Rewards**: Collect 10 ducks to unlock rewards
5. **Redeem**: Show QR code to staff to redeem rewards
6. **Refer Friends**: Share referral link to earn 3 ducks per confirmed referral

### Admin Flow
1. **Login**: Use admin email (configured in env vars)
2. **Manage**: View dashboard, manage customers, rewards, and games
3. **Redeem**: Scan customer QR codes to redeem rewards
4. **Configure**: Adjust game probabilities and reward thresholds

---

## 🎨 Design System

### Colors
- **Duck Yellow**: `#FFD93B` - Primary actions, ducks
- **Pond Blue**: `#3CA9E2` - Secondary actions, water
- **Success Green**: `#4CAF50` - Success states
- **Danger Red**: `#FF5252` - Errors, warnings
- **Ivory**: `#FFFEF7` - Background
- **Text Dark**: `#2C3E50` - Primary text

### Components
All UI components are in `components/ui/` using ShadCN.

---

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Custom Domain

1. Add `perks.penkey.co.uk` in Vercel project settings
2. Update DNS records:
   - Type: `CNAME`
   - Name: `perks`
   - Value: `cname.vercel-dns.com`
3. Update `NEXT_PUBLIC_APP_URL` in environment variables

### PWA Icons

Generate icons at [realfavicongenerator.net](https://realfavicongenerator.net):
- Upload a 512x512 duck logo
- Download and place in `/public/`
- Update `manifest.json` if needed

---

## 📧 Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (`penkey.co.uk`)
3. Create API key
4. Add to `.env.local`

Email templates are in `lib/email/` (to be created).

---

## 🔐 Security

### Row Level Security (RLS)
All Supabase tables have RLS enabled. Policies ensure:
- Users can only view/edit their own data
- Staff use service role key for admin operations
- Public can view active rewards and games

### Admin Access
- Admins are auto-created based on `ADMIN_EMAILS` env var
- First login creates staff record with `owner` role
- Middleware protects `/admin/*` routes

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Sign up with email
- [ ] Sign in with Google
- [ ] Daily check-in (test cooldown)
- [ ] Play all 3 mini-games
- [ ] Earn a reward (add 10 ducks manually)
- [ ] Redeem reward (admin side)
- [ ] Create referral link
- [ ] Admin dashboard access
- [ ] Create/edit rewards
- [ ] Configure game probabilities

---

## 📱 PWA Installation

### iOS (Safari)
1. Open app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

### Android (Chrome)
1. Open app in Chrome
2. Tap menu (3 dots)
3. Tap "Install app" or "Add to Home screen"

---

## 🐛 Troubleshooting

### "Unauthorized" errors
- Check Supabase URL and keys in `.env.local`
- Verify RLS policies are set up correctly

### Games not appearing
- Run `supabase/schema.sql` to seed game data
- Check `mini_games` table has 3 games with `enabled = true`

### Rewards not auto-issuing
- Check database trigger `after_duck_insert` exists
- Verify `check_and_issue_rewards()` function is created

### Admin access denied
- Ensure your email is in `ADMIN_EMAILS` env var
- Check `staff` table for your user record
- Middleware requires staff record to access `/admin/*`

---

## 📚 Documentation

- `tasks.md` - Build progress checklist
- `database_map.md` - Complete schema reference
- `supabase/schema.sql` - Database setup script

---

## 🤝 Contributing

This is a private project for Penkey Deli. For issues or feature requests, contact John or Amanda.

---

## 📄 License

Proprietary - © 2025 Penkey Deli

---

## 🎯 Roadmap

### V1 (Current)
- ✅ Customer dashboard
- ✅ Daily check-ins
- ✅ 3 mini-games
- ✅ Rewards system
- ✅ Referrals
- ✅ Admin panel

### V2 (Future)
- [ ] Push notifications
- [ ] Leaderboard
- [ ] Daily streak bonuses
- [ ] More mini-games
- [ ] Social sharing images
- [ ] Email campaigns

---

**Built with 🦆 by Cascade AI**
# Force redeploy
# Deploy fix
