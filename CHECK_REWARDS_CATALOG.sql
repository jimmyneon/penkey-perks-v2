-- =============================================
-- CHECK REWARDS CATALOG
-- =============================================
-- Shows all rewards and their bean costs
-- =============================================

SELECT 
  name,
  description,
  points_required as beans_cost,
  reward_type,
  discount_value,
  expiry_days,
  stock,
  active,
  CASE 
    WHEN points_required >= 1000 THEN '✅ Updated to beans'
    WHEN points_required < 1000 THEN '❌ Still old points'
    ELSE '⚠️ Check'
  END as status
FROM public.points_rewards
WHERE active = TRUE
ORDER BY points_required DESC;

-- Summary
DO $$
DECLARE
  v_total_rewards INTEGER;
  v_updated_rewards INTEGER;
  v_old_rewards INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_rewards
  FROM public.points_rewards
  WHERE active = TRUE;
  
  SELECT COUNT(*) INTO v_updated_rewards
  FROM public.points_rewards
  WHERE active = TRUE AND points_required >= 1000;
  
  SELECT COUNT(*) INTO v_old_rewards
  FROM public.points_rewards
  WHERE active = TRUE AND points_required < 1000;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎁 REWARDS CATALOG STATUS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Total active rewards: %', v_total_rewards;
  RAISE NOTICE 'Updated to beans (≥1000): %', v_updated_rewards;
  RAISE NOTICE 'Still old values (<1000): %', v_old_rewards;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF v_old_rewards = 0 THEN
    RAISE NOTICE '✅ All rewards updated to beans!';
  ELSE
    RAISE NOTICE '❌ Some rewards still need updating';
    RAISE NOTICE '   Run: 20251011_upgrade_to_beans_system.sql';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Expected bean costs:';
  RAISE NOTICE '  Free Pastry: 1,500 beans';
  RAISE NOTICE '  £5 Voucher: 4,000 beans';
  RAISE NOTICE '  £10 Voucher: 8,000 beans';
  RAISE NOTICE '  Reusable Cup: 12,000 beans (new)';
  RAISE NOTICE '  Hoodie: 25,000 beans (new)';
  RAISE NOTICE '  Legend Status: 50,000 beans (new)';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
