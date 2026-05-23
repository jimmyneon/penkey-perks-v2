-- =============================================
-- CHECK PROMOTIONAL OFFERS SYSTEM
-- Run this in Supabase SQL Editor to debug
-- =============================================

-- 1. Check if tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('promotional_offers', 'user_promotional_offers', 'promotional_offer_rewards')
ORDER BY table_name;

-- 2. Check if functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%promotional%'
ORDER BY routine_name;

-- 3. Check all promotional offers
SELECT 
  id,
  title,
  active,
  start_date,
  end_date,
  show_as_modal,
  target_audience,
  min_beans,
  max_beans,
  redemptions_count,
  total_redemption_limit,
  created_at
FROM promotional_offers
ORDER BY priority ASC, created_at DESC;

-- 4. Check if any offers are active and should show
SELECT 
  id,
  title,
  active,
  show_as_modal,
  CASE 
    WHEN NOT active THEN '❌ Not active'
    WHEN start_date IS NOT NULL AND start_date > NOW() THEN '❌ Not started yet'
    WHEN end_date IS NOT NULL AND end_date < NOW() THEN '❌ Expired'
    WHEN NOT show_as_modal THEN '❌ Not set to show as modal'
    ELSE '✅ Should show'
  END as status,
  start_date,
  end_date
FROM promotional_offers
ORDER BY priority ASC;

-- 5. Test the function with a user ID (replace with your user ID)
-- SELECT * FROM get_user_promotional_offers('YOUR-USER-ID-HERE');

-- 6. Check user interactions (if any)
SELECT 
  upo.id,
  u.email,
  po.title,
  upo.viewed_at,
  upo.redeemed_at,
  upo.created_at
FROM user_promotional_offers upo
JOIN users u ON u.id = upo.user_id
JOIN promotional_offers po ON po.id = upo.offer_id
ORDER BY upo.created_at DESC
LIMIT 10;

-- 7. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename LIKE '%promotional%'
ORDER BY tablename, policyname;
