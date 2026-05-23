-- =============================================
-- CHECK REWARDS DATA
-- =============================================
-- Run this to verify rewards data exists and is properly structured

-- 1. Check user_rewards table
SELECT 
  ur.id,
  ur.user_id,
  ur.reward_id,
  ur.status,
  ur.qr_code,
  ur.expires_at,
  ur.created_at,
  u.name as user_name
FROM user_rewards ur
JOIN users u ON ur.user_id = u.id
WHERE ur.status = 'active'
ORDER BY ur.created_at DESC;

-- 2. Check rewards table
SELECT 
  id,
  name,
  description,
  type,
  value,
  points_cost,
  active
FROM rewards
WHERE active = true
ORDER BY points_cost;

-- 3. Check joined data (what the app should see)
SELECT 
  ur.id as user_reward_id,
  ur.user_id,
  ur.status,
  ur.qr_code,
  ur.expires_at,
  r.id as reward_id,
  r.name as reward_name,
  r.description,
  r.type,
  r.value,
  u.name as user_name
FROM user_rewards ur
LEFT JOIN rewards r ON ur.reward_id = r.id
LEFT JOIN users u ON ur.user_id = u.id
WHERE ur.status = 'active'
ORDER BY ur.created_at DESC;

-- 4. Check for missing reward data (NULL joins)
SELECT 
  ur.id,
  ur.reward_id,
  ur.status,
  CASE 
    WHEN r.id IS NULL THEN 'MISSING REWARD'
    ELSE 'OK'
  END as status_check
FROM user_rewards ur
LEFT JOIN rewards r ON ur.reward_id = r.id
WHERE ur.status = 'active'
  AND r.id IS NULL;

-- 5. Check coffee stamps
SELECT 
  user_id,
  COUNT(*) as stamp_count,
  u.name as user_name
FROM coffee_stamps cs
JOIN users u ON cs.user_id = u.id
GROUP BY user_id, u.name
HAVING COUNT(*) >= 10
ORDER BY stamp_count DESC;
