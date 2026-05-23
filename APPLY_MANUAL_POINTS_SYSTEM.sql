-- =============================================
-- COMPLETE MANUAL POINTS AWARD SYSTEM SETUP
-- =============================================
-- Run this in Supabase SQL Editor to set up the award system

-- =============================================
-- 1. CREATE TABLES
-- =============================================

-- Create award_type_limits table
CREATE TABLE IF NOT EXISTS public.award_type_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_type TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  points INTEGER NOT NULL CHECK (points >= 0),
  limit_type TEXT CHECK (limit_type IN ('per_day', 'per_week', 'per_month', 'per_year', 'unlimited')),
  limit_count INTEGER,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create manual_points_awards table
CREATE TABLE IF NOT EXISTS public.manual_points_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who & What
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL CHECK (points > 0 AND points <= 500),
  
  -- Reason
  award_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_activity_log table
CREATE TABLE IF NOT EXISTS public.staff_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_manual_awards_user ON public.manual_points_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_awards_staff ON public.manual_points_awards(staff_id);
CREATE INDEX IF NOT EXISTS idx_manual_awards_status ON public.manual_points_awards(status);
CREATE INDEX IF NOT EXISTS idx_manual_awards_date ON public.manual_points_awards(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_awards_type ON public.manual_points_awards(award_type);

CREATE INDEX IF NOT EXISTS idx_staff_activity_staff ON public.staff_activity_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_date ON public.staff_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_staff_activity_type ON public.staff_activity_log(action_type);

-- =============================================
-- 3. ENABLE RLS
-- =============================================

ALTER TABLE public.award_type_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_points_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_activity_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CREATE RLS POLICIES
-- =============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Staff can view award types" ON public.award_type_limits;
DROP POLICY IF EXISTS "Admins can manage award types" ON public.award_type_limits;
DROP POLICY IF EXISTS "Staff can create awards" ON public.manual_points_awards;
DROP POLICY IF EXISTS "Staff can view awards" ON public.manual_points_awards;
DROP POLICY IF EXISTS "Admins can update awards" ON public.manual_points_awards;
DROP POLICY IF EXISTS "Staff can log own activity" ON public.staff_activity_log;
DROP POLICY IF EXISTS "Staff can view own activity" ON public.staff_activity_log;
DROP POLICY IF EXISTS "Admins can view all activity" ON public.staff_activity_log;

-- Award Type Limits Policies
CREATE POLICY "Staff can view award types"
  ON public.award_type_limits
  FOR SELECT
  TO authenticated
  USING (
    active = true 
    AND public.is_staff_or_admin()
  );

CREATE POLICY "Admins can manage award types"
  ON public.award_type_limits
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin());

-- Manual Points Awards Policies
CREATE POLICY "Staff can create awards"
  ON public.manual_points_awards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff_or_admin()
    AND staff_id = auth.uid()
  );

CREATE POLICY "Staff can view awards"
  ON public.manual_points_awards
  FOR SELECT
  TO authenticated
  USING (
    staff_id = auth.uid()
    OR public.is_staff_or_admin()
  );

CREATE POLICY "Admins can update awards"
  ON public.manual_points_awards
  FOR UPDATE
  TO authenticated
  USING (public.is_staff_or_admin());

-- Staff Activity Log Policies
CREATE POLICY "Staff can log own activity"
  ON public.staff_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id = auth.uid()
    AND public.is_staff_or_admin()
  );

CREATE POLICY "Staff can view own activity"
  ON public.staff_activity_log
  FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Admins can view all activity"
  ON public.staff_activity_log
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

-- =============================================
-- 5. SEED AWARD TYPES
-- =============================================

INSERT INTO public.award_type_limits (award_type, name, icon, points, limit_type, limit_count, description) VALUES
('social_media_share', 'Social Media Share', 'sparkles', 10, 'per_day', 1, 'Customer showed Instagram/Facebook post'),
('referral_bonus', 'Referral Bonus', 'user', 25, 'unlimited', null, 'Brought a friend who signed up'),
('birthday_bonus', 'Birthday Bonus', 'gift', 50, 'per_year', 1, 'Happy birthday reward'),
('event_participation', 'Event Participation', 'award', 15, 'unlimited', null, 'Attended special event'),
('survey_completion', 'Survey Completion', 'check-circle', 5, 'per_month', 1, 'Completed feedback survey'),
('complaint_resolution', 'Complaint Resolution', 'coffee', 20, 'unlimited', null, 'Apology for service issue'),
('custom_amount', 'Custom Amount', 'trending-up', 0, 'unlimited', null, 'Custom points award - enter any amount')
ON CONFLICT (award_type) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  points = EXCLUDED.points,
  limit_type = EXCLUDED.limit_type,
  limit_count = EXCLUDED.limit_count,
  description = EXCLUDED.description;

-- =============================================
-- 6. GRANT PERMISSIONS
-- =============================================

GRANT SELECT, INSERT ON public.manual_points_awards TO authenticated;
GRANT UPDATE ON public.manual_points_awards TO authenticated;
GRANT SELECT ON public.award_type_limits TO authenticated;
GRANT INSERT, SELECT ON public.staff_activity_log TO authenticated;

-- =============================================
-- SUCCESS
-- =============================================

SELECT 
  'Manual points system created successfully!' as message,
  COUNT(*) as award_types_created
FROM public.award_type_limits
WHERE active = true;
