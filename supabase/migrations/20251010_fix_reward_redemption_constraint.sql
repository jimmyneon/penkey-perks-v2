-- =============================================
-- Fix points_transactions source constraint
-- =============================================
-- Add 'reward_redemption' to allowed sources

-- Step 1: Show what sources currently exist
SELECT DISTINCT source, COUNT(*) as count
FROM public.points_transactions
GROUP BY source
ORDER BY count DESC;

-- Step 2: Drop existing constraint
ALTER TABLE public.points_transactions 
DROP CONSTRAINT IF EXISTS points_transactions_source_check;

-- Step 3: Fix any invalid source values (normalize them)
UPDATE public.points_transactions
SET source = CASE
  WHEN source LIKE '%check%in%' THEN 'check_in'
  WHEN source LIKE '%referral%' THEN 'referral_bonus'
  WHEN source LIKE '%game%' THEN 'game_prize'
  WHEN source LIKE '%admin%' THEN 'admin_adjustment'
  WHEN source LIKE '%reward%' THEN 'reward_redemption'
  WHEN source LIKE '%birthday%' THEN 'birthday_bonus'
  WHEN source LIKE '%milestone%' THEN 'milestone_bonus'
  WHEN source = 'points' THEN 'admin_adjustment'
  WHEN source = 'manual' THEN 'admin_adjustment'
  WHEN source = 'bonus' THEN 'milestone_bonus'
  ELSE 'admin_adjustment'  -- Default fallback
END
WHERE source NOT IN (
  'check_in',
  'referral_bonus',
  'game_prize',
  'admin_adjustment',
  'reward_redemption',
  'birthday_bonus',
  'milestone_bonus'
);

-- Step 4: Recreate constraint with all valid sources
ALTER TABLE public.points_transactions
ADD CONSTRAINT points_transactions_source_check 
CHECK (source IN (
  'check_in',
  'referral_bonus',
  'game_prize',
  'admin_adjustment',
  'reward_redemption',
  'birthday_bonus',
  'milestone_bonus'
));

-- Step 5: Verify
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'points_transactions_source_check';

-- Show final source distribution
SELECT DISTINCT source, COUNT(*) as count
FROM public.points_transactions
GROUP BY source
ORDER BY count DESC;

SELECT '✅ Constraint fixed! All invalid sources normalized and constraint recreated!' as message;
