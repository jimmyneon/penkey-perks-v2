-- =============================================
-- ADD "WE'RE CLOSED" MESSAGES FOR AFTER 5 PM
-- =============================================
-- Replace evening messages with closed messages
-- Evening = 5-9 PM (17:00-21:00) = CLOSED

-- Delete old evening messages that say "come in now"
DELETE FROM notifications 
WHERE conditions::text LIKE '%"timeOfDay": "evening"%'
  AND (message LIKE '%come in%' OR message LIKE '%pop in%' OR message LIKE '%visit%');

-- =============================================
-- PRIORITY 35-45: CLOSED MESSAGES (After 5 PM)
-- =============================================

-- Closed - Missed you today (haven't checked in)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('custom', 35, '💕 Missed You Today!', 'We''re closed now, but we missed you today! Come see us tomorrow! ✨', '💕',
 '{"hasCheckedInToday": false, "timeOfDay": "evening"}', 'default', true),

-- Closed - Thanks for coming! (checked in today)
('custom', 36, '🌙 Thanks for Today!', 'We''re closed now. Thanks for visiting today! See you tomorrow! 💕', '🌙',
 '{"hasCheckedInToday": true, "timeOfDay": "evening"}', 'success', true),

-- Closed - Rewards waiting (have unredeemed rewards)
('custom', 37, '🎁 Rewards Tomorrow!', 'We''re closed now, but your rewards will be here tomorrow! Don''t forget! ✨', '🎁',
 '{"hasUnredeemedRewards": true, "timeOfDay": "evening"}', 'reward', true),

-- Closed - Streak at risk (7+ day streak, not checked in)
('custom', 38, '🔥 Tomorrow Counts!', 'We''re closed now, but come in tomorrow to keep your streak alive! See you in the morning! 💪', '🔥',
 '{"currentStreak": {"min": 7}, "hasCheckedInToday": false, "timeOfDay": "evening"}', 'default', true),

-- Closed - One stamp away
('custom', 39, '☕ One More Tomorrow!', 'We''re closed now, but you''re SO close! Just one more stamp tomorrow for FREE COFFEE! 🎉', '☕',
 '{"stampsUntilReward": 1, "hasCoffeeStampToday": false, "timeOfDay": "evening"}', 'default', true),

-- Closed - Haven't played game
('custom', 40, '🎮 Game Tomorrow!', 'We''re closed now, but play tomorrow''s game for a chance to win! See you then! 🎉', '🎮',
 '{"hasPlayedGameToday": false, "timeOfDay": "evening"}', 'default', true),

-- Closed - All done today
('custom', 41, '🌟 Sleep Well!', 'You crushed it today! We''re closed now. Rest up and see you tomorrow! 💕', '🌟',
 '{"allComplete": true, "timeOfDay": "evening"}', 'success', true),

-- Closed - General (night time, 9 PM+)
('custom', 42, '🌙 See You Tomorrow!', 'We''re closed for the night. Sweet dreams! See you tomorrow! 💕', '🌙',
 '{"timeOfDay": "night"}', 'default', true);

-- =============================================
-- UPDATE EXISTING AFTERNOON MESSAGES
-- =============================================
-- Make sure afternoon messages (12-5 PM) are action-oriented

-- Update check-in messages to be more specific about time
UPDATE notifications 
SET message = 'Perfect time for a lunchtime visit! Check in and earn 5 points! 🎉'
WHERE conditions::text LIKE '%"timeOfDay": "afternoon"%'
  AND type = 'checkin'
  AND priority BETWEEN 30 AND 35;

-- Success message
SELECT '✅ Closed messages added! Evening (5-9 PM) now shows "we''re closed" messages.' as message;

-- Show what we have now
SELECT 
  priority,
  title,
  CASE 
    WHEN conditions::text LIKE '%"timeOfDay": "morning"%' THEN 'Morning (5-12 PM)'
    WHEN conditions::text LIKE '%"timeOfDay": "afternoon"%' THEN 'Afternoon (12-5 PM)'
    WHEN conditions::text LIKE '%"timeOfDay": "evening"%' THEN 'Evening (5-9 PM) - CLOSED'
    WHEN conditions::text LIKE '%"timeOfDay": "night"%' THEN 'Night (9 PM+) - CLOSED'
    ELSE 'Any time'
  END as time_slot,
  LEFT(message, 50) as message_preview
FROM notifications
WHERE conditions::text LIKE '%timeOfDay%'
ORDER BY 
  CASE 
    WHEN conditions::text LIKE '%"morning"%' THEN 1
    WHEN conditions::text LIKE '%"afternoon"%' THEN 2
    WHEN conditions::text LIKE '%"evening"%' THEN 3
    WHEN conditions::text LIKE '%"night"%' THEN 4
  END,
  priority;
