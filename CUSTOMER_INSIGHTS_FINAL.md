# Customer Insights - What They Should Show

## Overview
The Customer Insights section on the Staff Dashboard provides 6 key metrics that help you understand your business performance and customer engagement.

---

## The 6 Metrics Explained

### 1. 👥 **Total Customers**
**What it shows:** The total number of people who have signed up for your app

**Example Values:**
- 0 customers = No one has signed up yet
- 50 customers = 50 people have created accounts
- 500 customers = 500 registered users

**What it means:**
- This is your total customer base
- It only counts users with `role = 'customer'` (not staff/admin)
- This number only goes up (unless customers are deleted)

**Business Use:**
- Track overall growth
- See how many people know about your business
- Measure marketing effectiveness

---

### 2. 📈 **Active Customers (30 days)**
**What it shows:** How many UNIQUE customers checked in at least once in the last 30 days

**Example Values:**
- 0 active = No one checked in recently (concerning!)
- 25 active (out of 50 total) = 50% retention rate (good!)
- 45 active (out of 50 total) = 90% retention rate (excellent!)

**What it means:**
- Shows customer retention and engagement
- A customer who checked in 10 times still counts as 1 active customer
- This is your "real" active user base

**Business Use:**
- Measure customer loyalty
- Identify if you're losing customers
- Track seasonal trends
- **Healthy ratio:** 40-60% of total customers should be active

---

### 3. ✅ **Check-ins Today**
**What it shows:** Total number of check-ins since midnight today

**Example Values:**
- 0 check-ins = Slow day or early morning
- 15 check-ins = 15 customers visited today
- 50 check-ins = Busy day!

**What it means:**
- Daily foot traffic
- Resets at midnight
- Shows how busy your store is today

**Business Use:**
- Track daily performance
- Compare weekdays vs weekends
- Identify peak hours/days
- Staff scheduling

---

### 4. ☕ **Stamps Today**
**What it shows:** Number of coffee stamps given out today

**Example Values:**
- 0 stamps = No coffees sold yet today
- 30 stamps = 30 coffees purchased today
- 100 stamps = Very busy coffee day!

**What it means:**
- Direct measure of coffee sales
- Each stamp = 1 coffee purchased
- Resets at midnight

**Business Use:**
- Track coffee sales
- Inventory planning
- Revenue estimation (stamps × coffee price)
- Compare to check-ins (are people buying coffee when they visit?)

**Key Insight:**
- If check-ins > stamps: People visiting but not buying coffee
- If stamps ≈ check-ins: Good conversion rate!

---

### 5. ✨ **Total Points**
**What it shows:** All-time total points awarded across ALL customers since launch

**Example Values:**
- 0 points = Just started or no activity yet
- 5,000 points = Moderate engagement
- 50,000 points = High engagement over time

**What it means:**
- Cumulative measure of all rewards given
- Includes: check-in points, game points, bonus points, etc.
- This number ONLY goes up (never decreases)

**Business Use:**
- Measure overall engagement
- Track growth over time
- See how much value you've given to customers
- **Rough estimate:** Average 100-200 points per active customer

**How it's calculated:**
```
Sum of all positive amounts in points_transactions table
```

---

### 6. 🎁 **Pending Rewards**
**What it shows:** Number of active rewards waiting to be redeemed

**Example Values:**
- 0 pending = All rewards have been redeemed (or none earned)
- 5 pending = 5 customers have unredeemed rewards
- 20 pending = 20 active rewards waiting

**What it means:**
- Rewards customers earned but haven't used yet
- Includes: free coffees (10 stamps), points rewards, etc.
- Status = 'active' (not redeemed or expired)

**Business Use:**
- See how many rewards you might need to fulfill
- Track customer engagement (earning rewards)
- Identify if rewards are expiring unused
- **Healthy range:** 5-15% of active customers should have pending rewards

---

## Real-World Example

**Scenario:** Small coffee shop, been running the app for 2 months

```
Total Customers: 120
├─ You have 120 registered users

Active Customers (30d): 45
├─ 45 of those 120 checked in recently
├─ Retention Rate: 37.5% (could be better!)

Check-ins Today: 12
├─ 12 customers visited so far today
├─ It's 2pm, expect more by closing

Stamps Today: 8
├─ 8 coffees sold today
├─ Conversion: 67% (8 out of 12 visitors bought coffee - good!)

Total Points: 8,500
├─ You've awarded 8,500 points total
├─ Average per customer: 71 points (120 customers)
├─ Average per active: 189 points (45 active)

Pending Rewards: 6
├─ 6 customers have unredeemed rewards
├─ That's 13% of active customers (healthy!)
```

---

## What Good Numbers Look Like

### Healthy Metrics:
- **Active/Total Ratio:** 40-60% (shows good retention)
- **Stamps/Check-ins Ratio:** 50-80% (shows people are buying)
- **Pending Rewards:** 10-20% of active customers
- **Points per Active Customer:** 150-300 points

### Warning Signs:
- **Active < 20% of Total:** Losing customers, need re-engagement
- **Stamps < 30% of Check-ins:** People visiting but not buying
- **Pending Rewards = 0:** Rewards too hard to earn or not attractive
- **Check-ins Today = 0 (afternoon):** Marketing/awareness issue

---

## How to Use These Insights

### Daily Checks:
1. **Morning:** Check yesterday's check-ins and stamps
2. **Afternoon:** Monitor today's progress
3. **Evening:** Compare to previous days

### Weekly Analysis:
1. **Active Customers Trend:** Growing or shrinking?
2. **Average Daily Check-ins:** Calculate weekly average
3. **Conversion Rate:** Stamps ÷ Check-ins percentage

### Monthly Review:
1. **Total Customers Growth:** How many new signups?
2. **Retention Rate:** Active ÷ Total percentage
3. **Engagement:** Total points growth rate

---

## Troubleshooting

### If all stats show 0:
- Database is empty (no customers yet)
- RLS policies blocking queries
- Tables don't exist yet

### If only Total Points shows 0:
- Run `ADD_TOTAL_POINTS_FUNCTION.sql`
- Or check terminal logs for fallback calculation

### If Active Customers seems wrong:
- Check if `transactions` table has check-in data
- Verify dates are within last 30 days
- Look for terminal logs showing the count

### If Pending Rewards shows 0:
- No rewards have been earned yet
- All rewards have been redeemed
- Check `user_rewards` table has data

---

## Summary

These 6 metrics give you a complete picture of your business:

1. **Total Customers** = Size of your customer base
2. **Active Customers** = Health of your retention
3. **Check-ins Today** = Today's foot traffic
4. **Stamps Today** = Today's coffee sales
5. **Total Points** = Overall engagement (all-time)
6. **Pending Rewards** = Rewards waiting to be redeemed

**Use them together** to make informed decisions about marketing, staffing, inventory, and customer engagement strategies!
