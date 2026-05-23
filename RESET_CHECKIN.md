# 🔄 RESET CHECK-IN FOR TESTING

**Run this in Supabase SQL Editor to reset your check-in:**

---

## OPTION 1: Delete Your Last Check-In

```sql
-- Replace YOUR_USER_ID with your actual user ID
DELETE FROM ducks 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 1;
```

---

## OPTION 2: Delete All Your Check-Ins

```sql
-- Replace YOUR_USER_ID with your actual user ID
DELETE FROM ducks WHERE user_id = 'YOUR_USER_ID';
```

---

## OPTION 3: Temporarily Disable Check-In Cooldown

I can modify the `can_check_in` function to always return true for testing.

---

## GET YOUR USER ID

```sql
SELECT id, email FROM users WHERE email = 'your@email.com';
```

---

**Which option do you want me to implement?**

Or I can modify the API to skip the cooldown check for testing.
