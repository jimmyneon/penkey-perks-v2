-- =============================================
-- TEST ALL EMAIL TEMPLATES
-- =============================================
-- This queues all 7 email templates to jimmyneon@hotmail.com for testing
-- =============================================

-- 1. WELCOME EMAIL
SELECT queue_email_from_template(
  'welcome_email',
  'jimmyneon@hotmail.com',
  NULL,
  jsonb_build_object(
    'name', 'Jimmy',
    'referralUrl', 'https://perks.penkey.co.uk/signup?ref=JIMMY123',
    'appUrl', 'https://perks.penkey.co.uk'
  )
) as welcome_email_queued;

-- 2. REWARD EARNED EMAIL
SELECT queue_email_from_template(
  'reward_earned',
  'jimmyneon@hotmail.com',
  NULL,
  jsonb_build_object(
    'name', 'Jimmy',
    'rewardName', 'Free Coffee',
    'rewardValue', '£3.50',
    'qrCodeUrl', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TEST-QR-CODE-123',
    'expiryDays', '30',
    'appUrl', 'https://perks.penkey.co.uk'
  )
) as reward_earned_queued;

-- 3. REWARD EXPIRING EMAIL
SELECT queue_email_from_template(
  'reward_expiring',
  'jimmyneon@hotmail.com',
  NULL,
  jsonb_build_object(
    'name', 'Jimmy',
    'rewardName', 'Free Coffee',
    'daysLeft', '3',
    'daysLeftPlural', 's',
    'qrCodeUrl', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TEST-QR-CODE-456',
    'appUrl', 'https://perks.penkey.co.uk'
  )
) as reward_expiring_queued;

-- 4. REFERRAL CONFIRMED EMAIL
SELECT queue_email_from_template(
  'referral_confirmed',
  'jimmyneon@hotmail.com',
  NULL,
  jsonb_build_object(
    'name', 'Jimmy',
    'refereeName', 'Sarah',
    'pointsEarned', '15',
    'appUrl', 'https://perks.penkey.co.uk'
  )
) as referral_confirmed_queued;

-- 5. REWARD REDEEMED EMAIL
SELECT queue_email_from_template(
  'reward_redeemed',
  'jimmyneon@hotmail.com',
  NULL,
  jsonb_build_object(
    'name', 'Jimmy',
    'rewardName', 'Free Coffee',
    'redeemedAt', 'Saturday, October 11, 2025',
    'appUrl', 'https://perks.penkey.co.uk'
  )
) as reward_redeemed_queued;

-- 6. INACTIVE USER EMAIL
SELECT queue_email_from_template(
  'inactive_user',
  'jimmyneon@hotmail.com',
  NULL,
  jsonb_build_object(
    'name', 'Jimmy',
    'pointsBalance', '45',
    'appUrl', 'https://perks.penkey.co.uk'
  )
) as inactive_user_queued;

-- 7. MILESTONE REACHED EMAIL
SELECT queue_email_from_template(
  'milestone_reached',
  'jimmyneon@hotmail.com',
  NULL,
  jsonb_build_object(
    'name', 'Jimmy',
    'milestone', '100',
    'appUrl', 'https://perks.penkey.co.uk'
  )
) as milestone_reached_queued;

-- Check queued emails
SELECT 
  id,
  subject,
  status,
  scheduled_for,
  created_at
FROM email_queue
WHERE recipient_email = 'jimmyneon@hotmail.com'
ORDER BY created_at DESC;

-- Success message
SELECT '✅ All 7 email templates queued for jimmyneon@hotmail.com!' as message;
SELECT 'Run the process-queue API to send them now.' as next_step;
