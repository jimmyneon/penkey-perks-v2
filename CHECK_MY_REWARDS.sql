-- Check your active rewards

SELECT 
  ur.qr_code,
  ur.status,
  ur.created_at,
  ur.expires_at,
  r.name as reward_name,
  r.description,
  r.type,
  CASE 
    WHEN ur.status = 'redeemed' THEN '✅ Already Redeemed'
    WHEN ur.status = 'expired' THEN '❌ Expired'
    WHEN ur.expires_at < NOW() THEN '⚠️ Expired (needs update)'
    ELSE '🎁 Ready to Redeem'
  END as redemption_status
FROM user_rewards ur
JOIN rewards r ON ur.reward_id = r.id
WHERE ur.user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'
ORDER BY ur.created_at DESC;

-- Test case-insensitive lookup (what the API does now)
SELECT 
  'Testing case-insensitive lookup:' as test,
  qr_code,
  status
FROM user_rewards
WHERE qr_code ILIKE 'COFFEE-133ed21bb086'  -- Exact case
   OR qr_code ILIKE 'COFFEE-133ED21BB086'  -- Uppercase
   OR qr_code ILIKE 'coffee-133ed21bb086'; -- Lowercase
