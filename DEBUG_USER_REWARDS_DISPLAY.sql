-- =============================================
-- DEBUG: Check user_rewards data structure
-- =============================================

-- 1. Check raw user_rewards data
SELECT 
  ur.id,
  ur.user_id,
  ur.reward_id,
  ur.status,
  ur.qr_code,
  ur.expires_at,
  ur.created_at
FROM user_rewards ur
WHERE ur.user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'  -- Replace with your user_id
ORDER BY ur.created_at DESC;

-- 2. Check with JOIN to rewards table
SELECT 
  ur.id,
  ur.user_id,
  ur.reward_id,
  ur.status,
  ur.qr_code,
  ur.expires_at,
  ur.created_at,
  r.id as reward_table_id,
  r.name as reward_name,
  r.description as reward_description,
  r.type as reward_type,
  r.value as reward_value,
  r.points_cost
FROM user_rewards ur
LEFT JOIN rewards r ON ur.reward_id = r.id
WHERE ur.user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'  -- Replace with your user_id
ORDER BY ur.created_at DESC;

-- 3. Check if rewards table has the referenced reward_ids
SELECT 
  ur.reward_id,
  COUNT(*) as count,
  MAX(r.id) as reward_exists
FROM user_rewards ur
LEFT JOIN rewards r ON ur.reward_id = r.id
WHERE ur.user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'  -- Replace with your user_id
GROUP BY ur.reward_id;

-- 4. Check all rewards in the rewards table
SELECT 
  id,
  name,
  description,
  type,
  value,
  points_cost,
  active
FROM rewards
ORDER BY points_cost;

-- 5. Test the exact query from the page.tsx
SELECT 
  ur.*,
  jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'description', r.description,
    'type', r.type,
    'value', r.value,
    'points_cost', r.points_cost
  ) as rewards
FROM user_rewards ur
LEFT JOIN rewards r ON ur.reward_id = r.id
WHERE ur.user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'  -- Replace with your user_id
  AND ur.status IN ('active', 'redeemed')
ORDER BY ur.created_at DESC;
