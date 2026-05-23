-- =============================================
-- FIX: Add prize_label column to game_plays
-- =============================================

-- Add the missing column
ALTER TABLE public.game_plays 
ADD COLUMN IF NOT EXISTS prize_label TEXT;

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_plays' 
  AND column_name = 'prize_label';

-- Success message
SELECT '✅ Added prize_label column to game_plays' as message;
