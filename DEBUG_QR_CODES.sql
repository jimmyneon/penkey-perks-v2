-- Debug QR codes for user a409b642-e4e9-4159-a47c-c8a14b9bc903

-- 1. Show all your rewards with QR codes
SELECT 
  ur.id,
  ur.qr_code,
  ur.status,
  r.name as reward_name,
  LENGTH(ur.qr_code) as qr_length,
  ur.qr_code LIKE 'COFFEE-%' as is_coffee,
  ur.qr_code LIKE 'REWARD-%' as is_reward,
  CASE 
    WHEN ur.qr_code ~ '^[A-Z]+-[a-z0-9]+$' THEN 'Mixed case (prefix uppercase, suffix lowercase)'
    WHEN ur.qr_code ~ '^[A-Z]+-[A-Z0-9]+$' THEN 'All uppercase'
    WHEN ur.qr_code ~ '^[a-z]+-[a-z0-9]+$' THEN 'All lowercase'
    ELSE 'Other format'
  END as case_format
FROM user_rewards ur
JOIN rewards r ON ur.reward_id = r.id
WHERE ur.user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'
  AND ur.status = 'active'
ORDER BY ur.created_at DESC;

-- 2. Test exact QR code from logs
SELECT 
  'Testing exact QR from logs' as test,
  qr_code,
  status,
  qr_code = 'COFFEE-133ed21bb086' as exact_match,
  qr_code ILIKE 'COFFEE-133ed21bb086' as ilike_match,
  qr_code ILIKE 'COFFEE-133ED21BB086' as ilike_upper_match
FROM user_rewards
WHERE user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'
  AND qr_code LIKE 'COFFEE-%'
LIMIT 1;

-- 3. Show what the scanner would send (uppercase)
SELECT 
  'What scanner sends vs what DB has' as comparison,
  qr_code as db_has,
  UPPER(qr_code) as scanner_sends,
  qr_code = UPPER(qr_code) as exact_match_would_work,
  qr_code ILIKE UPPER(qr_code) as ilike_would_work
FROM user_rewards
WHERE user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'
  AND status = 'active';
