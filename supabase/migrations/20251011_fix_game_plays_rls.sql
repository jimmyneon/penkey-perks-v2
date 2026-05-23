-- =============================================
-- FIX: Game Plays RLS Policies
-- =============================================
-- Allow service role and authenticated users to insert
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own game plays" ON public.game_plays;
DROP POLICY IF EXISTS "Service can manage game plays" ON public.game_plays;
DROP POLICY IF EXISTS "Users can insert own game plays" ON public.game_plays;

-- Create comprehensive policies
CREATE POLICY "Users can view own game plays"
  ON public.game_plays FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game plays"
  ON public.game_plays FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can manage all game plays"
  ON public.game_plays FOR ALL
  USING (auth.role() = 'service_role');

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'game_plays'
ORDER BY policyname;

-- Success message
SELECT '✅ Fixed game_plays RLS policies' as message;
