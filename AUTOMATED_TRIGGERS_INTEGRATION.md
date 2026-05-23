# 🔌 AUTOMATED TRIGGERS - INTEGRATION GUIDE

**Where and how to add automated notifications throughout your app**

---

## 📋 QUICK REFERENCE

### Import Statement:
```typescript
import { sendNotification } from '@/lib/messaging/send-notification'
```

### Basic Usage:
```typescript
await sendNotification({
  userId: user.id,
  templateName: 'game_won', // Template from database
  variables: { beans: 50 }, // Replace {{beans}} in template
  channels: { push: true, email: false, inApp: true }
})
```

---

## 🎮 1. GAME WON

**Location:** `app/api/games/[gameId]/complete/route.ts`

**When:** After user completes a game and earns beans

**Add After:** Beans are awarded to user

```typescript
// After awarding beans
const beansEarned = gameResult.beansEarned

// Send notification
await sendNotification({
  userId: user.id,
  templateName: 'game_won',
  variables: {
    name: user.name,
    beans: beansEarned
  },
  channels: {
    push: true,   // Instant push notification
    email: false, // Don't spam email for games
    inApp: true   // Show in dashboard
  },
  expiresInHours: 24
})
```

---

## 🎁 2. REWARD EARNED

**Location:** Wherever rewards are created (check-in, stamp card, etc.)

**When:** User unlocks a new reward

**Add After:** Reward is created in `user_rewards` table

```typescript
// After creating reward
const reward = await createReward(userId, rewardId)

// Send notification
await sendNotification({
  userId: user.id,
  templateName: 'reward_earned',
  variables: {
    rewardName: reward.name
  },
  channels: {
    push: true,  // Instant notification
    email: true, // Also send email (important!)
    inApp: true  // Show in dashboard
  },
  priority: 80, // High priority
  expiresInHours: 48 // Show for 2 days
})
```

---

## ☕ 3. COFFEE STAMP EARNED

**Location:** `app/api/add-coffee/route.ts` (or wherever stamps are added)

**When:** User gets a coffee stamp

**Add After:** Stamp is added to database

```typescript
// After adding stamp
const stampsRemaining = 10 - currentStamps

// Only send if they haven't completed the card yet
if (stampsRemaining > 0) {
  await sendNotification({
    userId: user.id,
    templateName: 'coffee_stamp_earned',
    variables: {
      stampsRemaining: stampsRemaining
    },
    channels: {
      push: true,
      email: false,
      inApp: true
    },
    expiresInHours: 12
  })
}

// If they just completed the card (got free coffee)
if (stampsRemaining === 0) {
  await sendNotification({
    userId: user.id,
    templateName: 'free_coffee_ready',
    variables: {},
    channels: {
      push: true,
      email: true, // Important - send email too!
      inApp: true
    },
    priority: 95, // Very high priority
    expiresInHours: 72 // Show for 3 days
  })
}
```

---

## ⏰ 4. REWARD EXPIRING SOON

**Location:** Create a new cron job: `app/api/cron/check-expiring-rewards/route.ts`

**When:** Run daily to check for rewards expiring soon

**Create New File:**

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/messaging/send-notification'

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()
    
    // Find rewards expiring in 24 hours
    const tomorrow = new Date()
    tomorrow.setHours(tomorrow.getHours() + 24)
    
    const dayAfter = new Date()
    dayAfter.setHours(dayAfter.getHours() + 25)

    const { data: expiringRewards } = await supabase
      .from('user_rewards')
      .select('*, users(name), rewards(name)')
      .eq('status', 'active')
      .gte('expires_at', tomorrow.toISOString())
      .lt('expires_at', dayAfter.toISOString())

    // Send notifications
    for (const reward of expiringRewards || []) {
      await sendNotification({
        userId: reward.user_id,
        templateName: 'reward_expiring_soon',
        variables: {
          rewardName: reward.rewards.name,
          expiryTime: '24 hours'
        },
        channels: {
          push: true,
          email: true,
          inApp: true
        },
        priority: 85,
        expiresInHours: 24
      })
    }

    // Find rewards expiring in 2 hours (URGENT)
    const twoHours = new Date()
    twoHours.setHours(twoHours.getHours() + 2)
    
    const threeHours = new Date()
    threeHours.setHours(threeHours.getHours() + 3)

    const { data: urgentRewards } = await supabase
      .from('user_rewards')
      .select('*, users(name), rewards(name)')
      .eq('status', 'active')
      .gte('expires_at', twoHours.toISOString())
      .lt('expires_at', threeHours.toISOString())

    for (const reward of urgentRewards || []) {
      await sendNotification({
        userId: reward.user_id,
        templateName: 'reward_expiring_urgent',
        variables: {
          rewardName: reward.rewards.name,
          expiryTime: '2 hours'
        },
        channels: {
          push: true,
          email: false, // Already sent 24hr warning
          inApp: true
        },
        priority: 100, // URGENT
        expiresInHours: 2
      })
    }

    return NextResponse.json({
      success: true,
      expiringSoon: expiringRewards?.length || 0,
      expiringUrgent: urgentRewards?.length || 0
    })

  } catch (error: any) {
    console.error('Check expiring rewards error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Add to `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiring-rewards",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 🔥 5. STREAK AT RISK

**Location:** Create cron job: `app/api/cron/check-streaks/route.ts`

**When:** Run at 8 PM daily to remind users who haven't checked in

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/messaging/send-notification'

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()
    
    // Find users with active streaks who haven't checked in today
    const today = new Date().toISOString().split('T')[0]
    
    const { data: usersAtRisk } = await supabase
      .from('users')
      .select('id, name, current_streak')
      .gt('current_streak', 0)
      .not('last_check_in', 'gte', today)

    // Send notifications
    for (const user of usersAtRisk || []) {
      await sendNotification({
        userId: user.id,
        templateName: 'streak_at_risk',
        variables: {
          currentStreak: user.current_streak
        },
        channels: {
          push: true,
          email: false,
          inApp: true
        },
        priority: 75,
        expiresInHours: 4 // Only show until midnight
      })
    }

    return NextResponse.json({
      success: true,
      usersNotified: usersAtRisk?.length || 0
    })

  } catch (error: any) {
    console.error('Check streaks error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Add to `vercel.json`:**
```json
{
  "path": "/api/cron/check-streaks",
  "schedule": "0 20 * * *"
}
```

---

## 🎂 6. BIRTHDAY

**Location:** Create cron job: `app/api/cron/check-birthdays/route.ts`

**When:** Run daily at 9 AM to check for birthdays

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/messaging/send-notification'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()
    
    // Get today's month and day
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()
    
    // Find users with birthday today
    const { data: birthdayUsers } = await supabase
      .from('users')
      .select('id, name, date_of_birth')
      .not('date_of_birth', 'is', null)

    const todaysBirthdays = birthdayUsers?.filter(user => {
      const dob = new Date(user.date_of_birth)
      return dob.getMonth() + 1 === month && dob.getDate() === day
    })

    // Send birthday notifications
    for (const user of todaysBirthdays || []) {
      await sendNotification({
        userId: user.id,
        templateName: 'birthday',
        variables: {
          name: user.name
        },
        channels: {
          push: true,
          email: true, // Important - send email!
          inApp: true
        },
        priority: 90,
        expiresInHours: 24
      })
    }

    return NextResponse.json({
      success: true,
      birthdaysToday: todaysBirthdays?.length || 0
    })

  } catch (error: any) {
    console.error('Check birthdays error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Add to `vercel.json`:**
```json
{
  "path": "/api/cron/check-birthdays",
  "schedule": "0 9 * * *"
}
```

---

## 🎉 7. MILESTONE REACHED

**Location:** Wherever beans are awarded

**When:** User reaches bean milestones (100, 500, 1000, etc.)

```typescript
// After awarding beans
const newTotal = user.total_beans + beansEarned

// Check milestones
const milestones = [100, 500, 1000, 2500, 5000, 10000]
const milestone = milestones.find(m => 
  user.total_beans < m && newTotal >= m
)

if (milestone) {
  await sendNotification({
    userId: user.id,
    templateName: 'milestone_reached',
    variables: {
      totalBeans: milestone
    },
    channels: {
      push: true,
      email: false,
      inApp: true
    },
    priority: 70,
    expiresInHours: 48
  })
}
```

---

## 💤 8. WIN-BACK (INACTIVE USERS)

**Location:** Create cron job: `app/api/cron/win-back/route.ts`

**When:** Run weekly to find inactive users

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/messaging/send-notification'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()
    
    // Find users inactive for 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: inactiveUsers } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'customer')
      .lt('last_check_in', thirtyDaysAgo.toISOString())

    for (const user of inactiveUsers || []) {
      await sendNotification({
        userId: user.id,
        templateName: 'win_back',
        variables: {
          name: user.name
        },
        channels: {
          push: true,
          email: true, // Important!
          inApp: true
        },
        priority: 60,
        expiresInHours: 168 // 7 days
      })
    }

    return NextResponse.json({
      success: true,
      usersContacted: inactiveUsers?.length || 0
    })

  } catch (error: any) {
    console.error('Win-back error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Add to `vercel.json`:**
```json
{
  "path": "/api/cron/win-back",
  "schedule": "0 10 * * 1"
}
```

---

## 📋 COMPLETE VERCEL.JSON

```json
{
  "crons": [
    {
      "path": "/api/emails/process-queue",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/check-expiring-rewards",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/check-streaks",
      "schedule": "0 20 * * *"
    },
    {
      "path": "/api/cron/check-birthdays",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/win-back",
      "schedule": "0 10 * * 1"
    }
  ]
}
```

---

## ✅ INTEGRATION CHECKLIST

- [ ] Game won - Add to game completion
- [ ] Reward earned - Add to reward creation
- [ ] Coffee stamp - Add to stamp addition
- [ ] Reward expiring - Create cron job
- [ ] Streak at risk - Create cron job
- [ ] Birthday - Create cron job
- [ ] Milestone - Add to bean awarding
- [ ] Win-back - Create cron job
- [ ] Update vercel.json with all crons
- [ ] Test each trigger
- [ ] Deploy to production

---

**🎉 Once integrated, all notifications will work automatically throughout your app!**
