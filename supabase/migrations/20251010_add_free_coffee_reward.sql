-- =============================================
-- Add Free Coffee Reward for 10 Stamp Milestone
-- =============================================

-- Insert Free Coffee reward if it doesn't exist
INSERT INTO public.rewards (name, description, type, value, points_cost, expiry_days, active)
VALUES (
  'Free Coffee',
  'Congratulations! You earned a free coffee with 10 stamps!',
  'free_item',
  'Free Coffee',
  0,  -- No points cost (earned through stamps)
  30,  -- Expires in 30 days
  TRUE
)
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  value = EXCLUDED.value,
  expiry_days = EXCLUDED.expiry_days,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Verify
SELECT 
  id,
  name,
  description,
  type,
  active
FROM public.rewards
WHERE name = 'Free Coffee';

SELECT '✅ Free Coffee reward added/updated!' as message;
