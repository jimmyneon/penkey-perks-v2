-- =============================================
-- Manual Points Award System
-- =============================================

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
  
  -- Proof
  proof_image_url TEXT,
  proof_metadata JSONB DEFAULT '{}',
  
  -- Approval
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create award_type_limits table
CREATE TABLE IF NOT EXISTS public.award_type_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_type TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  points INTEGER NOT NULL CHECK (points >= 0),
  requires_approval BOOLEAN DEFAULT false,
  requires_proof BOOLEAN DEFAULT false,
  limit_type TEXT CHECK (limit_type IN ('per_day', 'per_week', 'per_month', 'per_year', 'unlimited')),
  limit_count INTEGER,
  description TEXT,
  active BOOLEAN DEFAULT true,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_awards_user ON public.manual_points_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_awards_staff ON public.manual_points_awards(staff_id);
CREATE INDEX IF NOT EXISTS idx_manual_awards_status ON public.manual_points_awards(status);
CREATE INDEX IF NOT EXISTS idx_manual_awards_date ON public.manual_points_awards(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_awards_type ON public.manual_points_awards(award_type);

CREATE INDEX IF NOT EXISTS idx_staff_activity_staff ON public.staff_activity_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_date ON public.staff_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_staff_activity_type ON public.staff_activity_log(action_type);

-- Enable RLS
ALTER TABLE public.manual_points_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_type_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_points_awards

-- Staff can insert their own awards
CREATE POLICY "Staff can create awards"
  ON public.manual_points_awards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
    AND staff_id = auth.uid()
  );

-- Staff can view their own awards
CREATE POLICY "Staff can view own awards"
  ON public.manual_points_awards
  FOR SELECT
  USING (
    staff_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can view all awards
CREATE POLICY "Admins can view all awards"
  ON public.manual_points_awards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update awards (for approval)
CREATE POLICY "Admins can update awards"
  ON public.manual_points_awards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for award_type_limits

-- Everyone can read active award types
CREATE POLICY "Anyone can view active award types"
  ON public.award_type_limits
  FOR SELECT
  USING (active = true);

-- Admins can manage award types
CREATE POLICY "Admins can manage award types"
  ON public.award_type_limits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for staff_activity_log

-- Staff can insert their own activity
CREATE POLICY "Staff can log own activity"
  ON public.staff_activity_log
  FOR INSERT
  WITH CHECK (
    staff_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

-- Staff can view their own activity
CREATE POLICY "Staff can view own activity"
  ON public.staff_activity_log
  FOR SELECT
  USING (staff_id = auth.uid());

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
  ON public.staff_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Seed award types
INSERT INTO public.award_type_limits (award_type, name, icon, points, requires_approval, requires_proof, limit_type, limit_count, description) VALUES
('social_media_share', '📱 Social Media Share', '📱', 10, false, true, 'per_day', 1, 'Customer showed Instagram/Facebook post'),
('referral_bonus', '👥 Referral Bonus', '👥', 25, false, false, 'unlimited', null, 'Brought a friend who signed up'),
('birthday_bonus', '🎂 Birthday Bonus', '🎂', 50, false, false, 'per_year', 1, 'Happy birthday reward'),
('event_participation', '🎉 Event Participation', '🎉', 15, false, false, 'unlimited', null, 'Attended special event'),
('survey_completion', '📝 Survey Completion', '📝', 5, false, false, 'per_month', 1, 'Completed feedback survey'),
('complaint_resolution', '💬 Complaint Resolution', '💬', 20, true, false, 'unlimited', null, 'Apology for service issue'),
('custom_amount', '✏️ Custom Amount', '✏️', 0, true, true, 'unlimited', null, 'Custom points award (requires approval)');

-- Grant permissions
GRANT SELECT, INSERT ON public.manual_points_awards TO authenticated;
GRANT UPDATE ON public.manual_points_awards TO authenticated;
GRANT SELECT ON public.award_type_limits TO authenticated;
GRANT INSERT ON public.staff_activity_log TO authenticated;
GRANT SELECT ON public.staff_activity_log TO authenticated;

-- Add comments
COMMENT ON TABLE public.manual_points_awards IS 'Track manual points awarded by staff to customers';
COMMENT ON TABLE public.award_type_limits IS 'Define award types, limits, and approval requirements';
COMMENT ON TABLE public.staff_activity_log IS 'Log all staff actions for audit trail';

-- Success message
SELECT 'Manual points system created successfully!' as message;
