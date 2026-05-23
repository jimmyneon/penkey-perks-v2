-- =============================================
-- TEST ALL 22 EMAIL TEMPLATES
-- =============================================
-- This will queue all 22 email types for testing
-- Run this in Supabase SQL Editor
-- =============================================

-- Get a test user (replace with your actual user ID)
DO $$
DECLARE
  v_test_user_id UUID;
  v_test_email TEXT;
  v_test_name TEXT;
  v_reward_id UUID;
  v_user_reward_id UUID;
  v_game_id UUID;
  v_milestone_id UUID;
  v_badge_tier TEXT;
BEGIN
  -- Get first user from database
  SELECT id, email, name INTO v_test_user_id, v_test_email, v_test_name
  FROM public.users
  LIMIT 1;
  
  IF v_test_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in database. Create a user first.';
  END IF;
  
  RAISE NOTICE '🧪 Testing with user: % (%) - %', v_test_name, v_test_user_id, v_test_email;
  
  -- =============================================
  -- 1. WELCOME EMAIL (on signup)
  -- =============================================
  RAISE NOTICE '📧 1. Queueing Welcome Email...';
  PERFORM public.queue_email_from_template(
    'welcome_email',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'referralUrl', 'https://perks.penkey.co.uk/signup?ref=TEST123',
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 2. FIRST STAMP EMAIL
  -- =============================================
  RAISE NOTICE '📧 2. Queueing First Stamp Email...';
  PERFORM public.queue_email_from_template(
    'first_stamp',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 3. HALFWAY THERE EMAIL (5 stamps)
  -- =============================================
  RAISE NOTICE '📧 3. Queueing Halfway There Email...';
  PERFORM public.queue_email_from_template(
    'halfway_there',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 4. REWARD EARNED EMAIL
  -- =============================================
  RAISE NOTICE '📧 4. Queueing Reward Earned Email...';
  SELECT id INTO v_reward_id FROM public.rewards WHERE active = true LIMIT 1;
  PERFORM public.queue_email_from_template(
    'reward_earned',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'rewardName', 'Free Coffee',
      'rewardValue', 'Free Coffee',
      'qrCodeUrl', 'https://perks.penkey.co.uk/api/qr/TEST-QR-CODE',
      'expiryDays', 30,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 5. REWARD EXPIRING EMAIL
  -- =============================================
  RAISE NOTICE '📧 5. Queueing Reward Expiring Email...';
  PERFORM public.queue_email_from_template(
    'reward_expiring',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'rewardName', 'Free Coffee',
      'daysLeft', 3,
      'daysLeftPlural', 's',
      'qrCodeUrl', 'https://perks.penkey.co.uk/api/qr/TEST-QR-CODE',
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 6. REWARD REDEEMED EMAIL
  -- =============================================
  RAISE NOTICE '📧 6. Queueing Reward Redeemed Email...';
  PERFORM public.queue_email_from_template(
    'reward_redeemed',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'rewardName', 'Free Coffee',
      'redeemedAt', TO_CHAR(NOW(), 'FMDay, FMMonth DD, YYYY'),
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 7. REWARD EXPIRED EMAIL
  -- =============================================
  RAISE NOTICE '📧 7. Queueing Reward Expired Email...';
  PERFORM public.queue_email_from_template(
    'reward_expired',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'rewardName', 'Free Coffee',
      'expiredDate', TO_CHAR(NOW(), 'FMMonth DD, YYYY'),
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 8. MILESTONE REACHED EMAIL
  -- =============================================
  RAISE NOTICE '📧 8. Queueing Milestone Reached Email...';
  PERFORM public.queue_email_from_template(
    'milestone_reached',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'milestone', '100 Points',
      'milestoneName', 'Points Collector',
      'milestoneDescription', 'Earned 500 lifetime points',
      'bonusReward', '+100 bonus points',
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 9. BADGE EARNED EMAIL
  -- =============================================
  RAISE NOTICE '📧 9. Queueing Badge Earned Email...';
  PERFORM public.queue_email_from_template(
    'badge_earned',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'badgeName', 'Penkey VIP',
      'badgeTitle', 'Duck Commander',
      'lifetimePoints', 200,
      'perks', 'Priority support, +10 birthday bonus',
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 10. BIG WIN EMAIL
  -- =============================================
  RAISE NOTICE '📧 10. Queueing Big Win Email...';
  PERFORM public.queue_email_from_template(
    'big_win',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'gameName', 'Scratch Card',
      'prizeWon', '5 Bonus Stamps!',
      'totalStamps', 15,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 11. GAME AVAILABLE EMAIL
  -- =============================================
  RAISE NOTICE '📧 11. Queueing Game Available Email...';
  PERFORM public.queue_email_from_template(
    'game_available',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'gamesAvailable', 'Scratch Card, Spin Wheel, Duck Pond',
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 12. STAMP STREAK EMAIL
  -- =============================================
  RAISE NOTICE '📧 12. Queueing Stamp Streak Email...';
  PERFORM public.queue_email_from_template(
    'stamp_streak',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'streakDays', 7,
      'bonusReward', '2 Bonus Stamps',
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 13. REFERRAL CONFIRMED EMAIL
  -- =============================================
  RAISE NOTICE '📧 13. Queueing Referral Confirmed Email...';
  PERFORM public.queue_email_from_template(
    'referral_confirmed',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'refereeName', 'Sarah Johnson',
      'pointsEarned', 15,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 14. REFERRAL MILESTONE EMAIL
  -- =============================================
  RAISE NOTICE '📧 14. Queueing Referral Milestone Email...';
  PERFORM public.queue_email_from_template(
    'referral_milestone',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'totalReferrals', 10,
      'bonusReward', '10 Bonus Stamps',
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 15. ANNIVERSARY EMAIL
  -- =============================================
  RAISE NOTICE '📧 15. Queueing Anniversary Email...';
  PERFORM public.queue_email_from_template(
    'anniversary',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'years', 1,
      'yearsPlural', '',
      'totalStamps', 50,
      'totalRewards', 5,
      'anniversaryGift', '5 Bonus Stamps',
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 16. WEEKLY SUMMARY EMAIL
  -- =============================================
  RAISE NOTICE '📧 16. Queueing Weekly Summary Email...';
  PERFORM public.queue_email_from_template(
    'weekly_summary',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'stampsThisWeek', 5,
      'gamesPlayed', 3,
      'rewardsEarned', 1,
      'referralsConfirmed', 0,
      'totalStamps', 25,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 17. MONTHLY REPORT EMAIL
  -- =============================================
  RAISE NOTICE '📧 17. Queueing Monthly Report Email...';
  PERFORM public.queue_email_from_template(
    'monthly_report',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'monthName', 'October',
      'totalStampsMonth', 20,
      'rewardsEarnedMonth', 2,
      'badgesEarned', 1,
      'rank', 5,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 18. NEW REWARD AVAILABLE EMAIL
  -- =============================================
  RAISE NOTICE '📧 18. Queueing New Reward Available Email...';
  PERFORM public.queue_email_from_template(
    'new_reward_available',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'rewardName', 'Free Pastry',
      'rewardDescription', 'Enjoy a delicious free pastry!',
      'rewardValue', 'Free Pastry',
      'stampsRequired', 15,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 19. WEEKEND SPECIAL EMAIL
  -- =============================================
  RAISE NOTICE '📧 19. Queueing Weekend Special Email...';
  PERFORM public.queue_email_from_template(
    'weekend_special',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'weekendBonus', 'Double Stamps on Saturday!',
      'currentStamps', 7,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 20. INACTIVE USER EMAIL
  -- =============================================
  RAISE NOTICE '📧 20. Queueing Inactive User Email...';
  PERFORM public.queue_email_from_template(
    'inactive_user',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'pointsBalance', 150,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 21. WIN-BACK 30 DAYS EMAIL
  -- =============================================
  RAISE NOTICE '📧 21. Queueing Win-Back (30 days) Email...';
  PERFORM public.queue_email_from_template(
    'win_back_30',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'lastVisit', 'September 11, 2025',
      'specialOffer', '3 Bonus Stamps on Your Return',
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- 22. WIN-BACK 60 DAYS EMAIL
  -- =============================================
  RAISE NOTICE '📧 22. Queueing Win-Back (60 days) Email...';
  PERFORM public.queue_email_from_template(
    'win_back_60',
    v_test_email,
    v_test_user_id,
    jsonb_build_object(
      'name', v_test_name,
      'bonusStamps', '5 Bonus Stamps',
      'specialReward', 'Free Coffee on Your Return',
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  -- =============================================
  -- SUMMARY
  -- =============================================
  RAISE NOTICE '✅ All 22 emails queued successfully!';
  RAISE NOTICE '📧 Check email_queue table to see queued emails';
  RAISE NOTICE '🚀 Run process-queue API to send them';
  
END $$;

-- Check the queue
SELECT 
  '✅ Queued Emails:' as status,
  COUNT(*) as total_queued,
  MIN(created_at) as first_queued,
  MAX(created_at) as last_queued
FROM public.email_queue
WHERE status = 'pending';

-- Show last 22 queued emails
SELECT 
  id,
  recipient_email,
  subject,
  status,
  created_at
FROM public.email_queue
ORDER BY created_at DESC
LIMIT 22;
