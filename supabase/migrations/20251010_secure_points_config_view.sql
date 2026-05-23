-- =============================================
-- SECURE ACCESS TO POINTS CONFIG WITH USAGE
-- =============================================
-- This adds a security layer to the points_config_with_usage view
-- Only admins can access usage statistics
-- =============================================

-- Create a secure function to access the view
CREATE OR REPLACE FUNCTION public.get_points_config_with_usage()
RETURNS TABLE (
  id UUID,
  action_type TEXT,
  points_amount INTEGER,
  description TEXT,
  active BOOLEAN,
  min_interval_hours INTEGER,
  max_per_day INTEGER,
  requires_verification BOOLEAN,
  metadata JSONB,
  unique_users BIGINT,
  total_uses BIGINT,
  total_points_awarded BIGINT,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if user is admin or owner
  IF NOT EXISTS (
    SELECT 1 FROM public.staff
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view usage statistics';
  END IF;
  
  -- Return view data
  RETURN QUERY 
  SELECT 
    pcwu.id,
    pcwu.action_type,
    pcwu.points_amount,
    pcwu.description,
    pcwu.active,
    pcwu.min_interval_hours,
    pcwu.max_per_day,
    pcwu.requires_verification,
    pcwu.metadata,
    pcwu.unique_users,
    pcwu.total_uses,
    pcwu.total_points_awarded,
    pcwu.last_used,
    pcwu.created_at,
    pcwu.updated_at
  FROM public.points_config_with_usage pcwu;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_points_config_with_usage IS 'Securely access points config with usage stats (admin only)';

-- Grant execute to authenticated users (function will check role)
GRANT EXECUTE ON FUNCTION public.get_points_config_with_usage() TO authenticated;

-- Test the function
DO $$
BEGIN
  RAISE NOTICE '✅ Secure function created: get_points_config_with_usage()';
  RAISE NOTICE '   Only admins can call this function';
  RAISE NOTICE '   Update admin page to use: .rpc(''get_points_config_with_usage'')';
END $$;
