-- =============================================
-- Update rewards table from ducks to points
-- =============================================

-- Rename duck_threshold to points_cost if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'duck_threshold'
  ) THEN
    ALTER TABLE public.rewards RENAME COLUMN duck_threshold TO points_cost;
  END IF;
END $$;

-- Ensure points_cost column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'points_cost'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN points_cost INTEGER NOT NULL DEFAULT 100;
  END IF;
END $$;

-- Update any existing rewards to have sensible point costs
-- (Only if they're still at default or very low values)
UPDATE public.rewards 
SET points_cost = CASE 
  WHEN points_cost < 50 THEN points_cost * 10  -- Convert old duck values to points
  ELSE points_cost  -- Keep existing point values
END
WHERE points_cost < 1000;

-- Add comment
COMMENT ON COLUMN public.rewards.points_cost IS 'Points required to redeem this reward';

-- Update any functions that reference duck_threshold
-- (This is a safety check - adjust if you have specific functions)

-- Success message
SELECT 'Rewards table updated to use points_cost instead of duck_threshold!' as message;
