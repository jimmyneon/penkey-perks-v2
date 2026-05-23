-- Add function to get total points awarded across all users
CREATE OR REPLACE FUNCTION public.get_total_points_awarded()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM public.points_transactions
  WHERE amount > 0;
$$;

GRANT EXECUTE ON FUNCTION public.get_total_points_awarded() TO authenticated;
