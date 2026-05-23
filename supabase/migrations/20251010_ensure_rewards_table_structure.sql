-- =============================================
-- ENSURE REWARDS TABLE HAS CORRECT STRUCTURE
-- =============================================
-- This migration ensures the rewards table has all necessary columns
-- for the rewards system to work properly

-- 1. Ensure 'value' column exists (for display purposes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'value'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN value TEXT;
  END IF;
END $$;

-- 2. Ensure 'type' column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN type TEXT DEFAULT 'free_item';
  END IF;
END $$;

-- 3. Update existing rewards to have proper values if they're NULL
UPDATE public.rewards
SET value = name
WHERE value IS NULL OR value = '';

UPDATE public.rewards
SET type = CASE
  WHEN name ILIKE '%coffee%' THEN 'drink'
  WHEN name ILIKE '%sandwich%' OR name ILIKE '%food%' THEN 'food'
  WHEN name ILIKE '%discount%' OR name ILIKE '%off%' THEN 'discount'
  ELSE 'free_item'
END
WHERE type IS NULL OR type = '';

-- 4. Add constraint for type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rewards_type_check'
  ) THEN
    ALTER TABLE public.rewards 
    ADD CONSTRAINT rewards_type_check 
    CHECK (type IN ('free_item', 'discount', 'bonus_ducks', 'food', 'drink'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. Verify the structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rewards'
ORDER BY ordinal_position;

-- 6. Show current rewards
SELECT 
  id,
  name,
  description,
  type,
  value,
  points_cost,
  active
FROM public.rewards
ORDER BY points_cost;
