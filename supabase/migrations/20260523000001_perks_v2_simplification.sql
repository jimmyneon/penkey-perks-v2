-- Penkey Perks V2 Database Migration
-- Simplify schema: Remove games, rename ducks to coffee_stamps
-- Date: May 23, 2026

-- ============================================================================
-- STEP 1: Rename ducks table to coffee_stamps
-- ============================================================================

ALTER TABLE ducks RENAME TO coffee_stamps;

-- Add new columns to coffee_stamps
ALTER TABLE coffee_stamps 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'purchase',
ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- Update existing records to have source = 'purchase' (default for old data)
UPDATE coffee_stamps SET source = 'purchase' WHERE source IS NULL;

-- Add check constraint for source column
ALTER TABLE coffee_stamps 
ADD CONSTRAINT coffee_stamps_source_check 
CHECK (source IN ('purchase', 'bonus', 'manual'));

-- Add index on source for faster queries
CREATE INDEX IF NOT EXISTS idx_coffee_stamps_source ON coffee_stamps(source);

-- ============================================================================
-- STEP 2: Update rewards table (rename duck_threshold to stamp_threshold)
-- ============================================================================

ALTER TABLE rewards RENAME COLUMN duck_threshold TO stamp_threshold;

-- Remove 'bonus_ducks' from type constraint
ALTER TABLE rewards 
DROP CONSTRAINT IF EXISTS rewards_type_check;

-- Add new constraint (only free_item and discount)
ALTER TABLE rewards 
ADD CONSTRAINT rewards_type_check 
CHECK (type IN ('free_item', 'discount'));

-- Update any existing rewards with type 'bonus_ducks' to 'free_item'
UPDATE rewards SET type = 'free_item' WHERE type = 'bonus_ducks';

-- ============================================================================
-- STEP 3: Update functions
-- ============================================================================

-- Rename get_user_duck_count to get_user_stamp_count
CREATE OR REPLACE FUNCTION get_user_stamp_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM coffee_stamps 
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Drop old function
DROP FUNCTION IF EXISTS get_user_duck_count(UUID);

-- Update check_and_issue_rewards to use stamp_threshold
CREATE OR REPLACE FUNCTION check_and_issue_rewards(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_stamp_count INTEGER;
  v_reward RECORD;
BEGIN
  -- Get user's stamp count
  SELECT COUNT(*) INTO v_stamp_count
  FROM coffee_stamps
  WHERE user_id = p_user_id;
  
  -- Find eligible rewards
  FOR v_reward IN 
    SELECT id, name, stamp_threshold, expiry_days, stock
    FROM rewards
    WHERE active = TRUE
    AND stamp_threshold <= v_stamp_count
    AND (stock IS NULL OR stock > 0)
  LOOP
    -- Check if user already has this reward active
    IF NOT EXISTS (
      SELECT 1 
      FROM user_rewards 
      WHERE user_id = p_user_id 
      AND reward_id = v_reward.id 
      AND status = 'active'
    ) THEN
      -- Issue reward
      INSERT INTO user_rewards (user_id, reward_id, status, qr_code, expires_at)
      VALUES (
        p_user_id,
        v_reward.id,
        'active',
        encode(gen_random_bytes(16), 'hex'),
        CASE 
          WHEN v_reward.expiry_days IS NOT NULL 
          THEN NOW() + (v_reward.expiry_days || ' days')::INTERVAL
          ELSE NULL
        END
      );
      
      -- Decrement stock if applicable
      IF v_reward.stock IS NOT NULL THEN
        UPDATE rewards 
        SET stock = stock - 1 
        WHERE id = v_reward.id;
      END IF;
      
      -- Log transaction
      INSERT INTO transactions (user_id, action, details)
      VALUES (
        p_user_id,
        'reward_earned',
        jsonb_build_object(
          'reward_id', v_reward.id,
          'reward_name', v_reward.name,
          'stamp_count', v_stamp_count
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Update triggers
-- ============================================================================

-- Drop old trigger
DROP TRIGGER IF EXISTS after_duck_insert ON coffee_stamps;

-- Create new trigger
CREATE TRIGGER after_stamp_insert
AFTER INSERT ON coffee_stamps
FOR EACH ROW
EXECUTE FUNCTION check_and_issue_rewards();

-- ============================================================================
-- STEP 5: Remove game-related functions
-- ============================================================================

DROP FUNCTION IF EXISTS can_check_in(UUID);
DROP FUNCTION IF EXISTS can_play_game(UUID, UUID);

-- ============================================================================
-- STEP 6: Remove game-related tables (CAREFUL - this deletes data)
-- ============================================================================

-- Uncomment these lines to actually drop the tables
-- DROP TABLE IF EXISTS game_plays CASCADE;
-- DROP TABLE IF EXISTS game_prizes CASCADE;
-- DROP TABLE IF EXISTS mini_games CASCADE;

-- ============================================================================
-- STEP 7: Update transactions action types
-- ============================================================================

-- Remove game-related action types from constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_action_check;

-- Add new constraint (simplified actions)
ALTER TABLE transactions 
ADD CONSTRAINT transactions_action_check 
CHECK (action IN (
  'reward_earned',
  'reward_redeemed',
  'manual_stamp_add',
  'manual_stamp_remove',
  'referral_confirmed'
));

-- Update existing game-related transactions to 'manual_stamp_add'
UPDATE transactions 
SET action = 'manual_stamp_add' 
WHERE action IN ('check_in', 'game_play');

-- ============================================================================
-- STEP 8: Update indexes
-- ============================================================================

-- Rename indexes
DROP INDEX IF EXISTS idx_ducks_user_id;
CREATE INDEX idx_coffee_stamps_user_id ON coffee_stamps(user_id);

DROP INDEX IF EXISTS idx_ducks_created_at;
CREATE INDEX idx_coffee_stamps_created_at ON coffee_stamps(created_at);

-- ============================================================================
-- STEP 9: Update RLS policies (if needed)
-- ============================================================================

-- Drop old policies on ducks
DROP POLICY IF EXISTS "Users can view their own ducks" ON coffee_stamps;
DROP POLICY IF EXISTS "Users can insert their own ducks" ON coffee_stamps;

-- Create new policies on coffee_stamps
CREATE POLICY "Users can view their own stamps"
ON coffee_stamps FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stamps"
ON coffee_stamps FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check coffee_stamps table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'coffee_stamps' 
-- ORDER BY ordinal_position;

-- Check rewards table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'rewards' 
-- ORDER BY ordinal_position;

-- Test get_user_stamp_count function
-- SELECT get_user_stamp_count('test-user-id');

-- Check if game tables still exist (should return empty if dropped)
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name IN ('mini_games', 'game_prizes', 'game_plays');

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback, run these commands in reverse order:
-- 1. Restore old indexes
-- 2. Restore old RLS policies
-- 3. Restore old transactions action types
-- 4. Restore game tables (from backup)
-- 5. Restore game functions
-- 6. Restore old trigger
-- 7. Restore old functions
-- 8. Restore rewards column name
-- 9. Remove new columns from coffee_stamps
-- 10. Rename coffee_stamps back to ducks

-- ============================================================================
-- NOTES
-- ============================================================================

-- This migration:
-- 1. Renames ducks → coffee_stamps with new columns (source, reference_id)
-- 2. Updates rewards.duck_threshold → stamp_threshold
-- 3. Removes 'bonus_ducks' reward type
-- 4. Updates functions to use new table/column names
-- 5. Removes game-related functions
-- 6. Game tables are NOT dropped by default (uncomment to drop)
-- 7. Updates transactions to remove game-related actions
-- 8. Updates indexes and RLS policies

-- IMPORTANT: Test this migration on a backup database first!
-- Game tables are commented out to prevent accidental data loss
