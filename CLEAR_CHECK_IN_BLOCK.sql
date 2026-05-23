-- =============================================
-- CLEAR CHECK-IN BLOCK - RUN THIS NOW
-- =============================================
-- This will clear any false check-in records blocking you

-- 1. Check what's blocking you
SELECT 
  'Current check-in status:' as info,
  can_check_in(auth.uid()) as can_check_in_now;

-- 2. See if there's a check-in record today
SELECT 
  'Today''s check-in (if exists):' as info,
  *
FROM check_ins
WHERE user_id = auth.uid()
  AND DATE(checked_in_at AT TIME ZONE 'Europe/London') = CURRENT_DATE;

-- 3. See last check-in from points_transactions (OLD SYSTEM)
SELECT 
  'Last visit in points_transactions:' as info,
  created_at,
  amount,
  description
FROM points_transactions
WHERE user_id = auth.uid()
  AND source = 'visit'
ORDER BY created_at DESC
LIMIT 1;

-- 4. CLEAR TODAY'S CHECK-IN (if it exists)
-- Run this to reset and allow check-in
DELETE FROM check_ins
WHERE user_id = auth.uid()
  AND DATE(checked_in_at AT TIME ZONE 'Europe/London') = CURRENT_DATE;

-- 5. Verify you can now check in
SELECT 
  'After clearing - can check in:' as info,
  can_check_in(auth.uid()) as should_be_true;

-- 6. If still blocked, check points_transactions
-- The old function might still be running
SELECT 
  'Checking old system:' as info,
  MAX(created_at) as last_visit,
  NOW() - MAX(created_at) as time_since,
  (NOW() - MAX(created_at)) >= INTERVAL '24 hours' as old_system_allows
FROM points_transactions
WHERE user_id = auth.uid()
  AND source = 'visit';
