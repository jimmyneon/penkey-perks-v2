-- =============================================
-- DEBUG CHECK-IN STATUS RIGHT NOW
-- =============================================
-- Run this to see exactly what's blocking you

-- 1. What does can_check_in return?
SELECT 
  '1. Can check in function result:' as step,
  can_check_in(auth.uid()) as result;

-- 2. What's in check_ins table for you today?
SELECT 
  '2. Today''s check-ins in check_ins table:' as step,
  *
FROM check_ins
WHERE user_id = auth.uid()
  AND DATE(checked_in_at AT TIME ZONE 'Europe/London') = CURRENT_DATE;

-- 3. What's your last check-in ever?
SELECT 
  '3. Your last check-in (any day):' as step,
  checked_in_at,
  DATE(checked_in_at AT TIME ZONE 'Europe/London') as check_in_date,
  CURRENT_DATE as today,
  DATE(checked_in_at AT TIME ZONE 'Europe/London') < CURRENT_DATE as should_allow
FROM check_ins
WHERE user_id = auth.uid()
ORDER BY checked_in_at DESC
LIMIT 1;

-- 4. Check points_transactions (old system - shouldn't matter but let's check)
SELECT 
  '4. Last visit in points_transactions:' as step,
  created_at,
  description
FROM points_transactions
WHERE user_id = auth.uid()
  AND source = 'visit'
ORDER BY created_at DESC
LIMIT 1;

-- 5. DELETE ALL YOUR CHECK-INS (NUCLEAR OPTION)
DELETE FROM check_ins WHERE user_id = auth.uid();

-- 6. Verify it's gone
SELECT 
  '5. After delete - check_ins count:' as step,
  COUNT(*) as count
FROM check_ins
WHERE user_id = auth.uid();

-- 7. Test can_check_in again
SELECT 
  '6. Can check in after delete:' as step,
  can_check_in(auth.uid()) as should_be_true;

SELECT '✅ All check-ins deleted! Try checking in now.' as message;
