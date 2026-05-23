-- =============================================
-- ULTIMATE NOTIFICATION SYSTEM
-- =============================================
-- Comprehensive notifications for all scenarios
-- Multiple variations, time-based, condition-based
-- =============================================

-- First, clear existing notifications
DELETE FROM public.notifications;

-- =============================================
-- PRIORITY 1: CRITICAL REWARDS (Expiring Soon)
-- =============================================

-- Expiring in < 3 hours (CRITICAL)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, show_badge, badge_text, badge_color) VALUES
('reward', 1, '🚨 LAST CHANCE!', 'Only a few hours left! Your free coffee expires VERY soon! Rush in NOW! 🏃‍♀️💨', '🚨', 
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"max": 3}}', 'streak', false, true, 'URGENT', 'bg-red-500'),

-- Expiring today (4-12 hours)
('reward', 2, '⚠️ EXPIRING TODAY!', 'Your free coffee expires in a few hours! Come redeem it today or lose it! 🏃‍♀️', '⚠️',
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"min": 4, "max": 12}}', 'streak', false, true, 'TODAY', 'bg-orange-500'),

-- Expiring today (evening)
('reward', 3, '⏰ Expires Tonight!', 'Your free coffee expires tonight! Pop in before we close! ☕✨', '⏰',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 0, "timeOfDay": "evening"}', 'reward', false, false, null, null),

-- Expiring tomorrow (morning)
('reward', 4, '🌅 Good Morning! Reward Expires Tomorrow!', 'Rise & shine! Your free coffee expires tomorrow - come get it today! 💕', '🌅',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 1, "timeOfDay": "morning"}', 'reward', false, false, null, null),

-- Expiring tomorrow (afternoon)
('reward', 5, '☕ Afternoon Reminder!', 'Your free coffee expires tomorrow! Pop in this afternoon or tomorrow! 🎉', '☕',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 1, "timeOfDay": "afternoon"}', 'reward', false, false, null, null),

-- Expiring tomorrow (evening)
('reward', 6, '🌆 Evening Reminder!', 'Your free coffee expires tomorrow! Don''t forget to redeem it! ✨', '🌆',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 1, "timeOfDay": "evening"}', 'reward', false, false, null, null),

-- Expiring in 2 days
('reward', 7, '⏳ 2 Days Left!', 'Your free coffee expires in 2 days! Make sure to pop in soon! ☕✨', '⏳',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 2}', 'reward', true, false, null, null),

-- Expiring in 3 days
('reward', 8, '⏳ 3 Days Left', 'Your free coffee expires in 3 days. Don''t miss out! Come visit us! ☕', '⏳',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 3}', 'reward', true, false, null, null),

-- Rewards ready (general)
('reward', 9, '🎁 Yaaas! Rewards Ready!', 'You''ve got treats waiting! Pop in and redeem them! 💕', '🎁',
 '{"hasUnredeemedRewards": true}', 'reward', true, false, null, null);

-- =============================================
-- PRIORITY 10-20: STREAK AT RISK
-- =============================================

-- High streak at risk (30+ days) - Morning
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('streak', 10, '🏆 30-Day Streak at Risk!', 'Good morning, champion! Don''t break your AMAZING 30+ day streak! Pop in today! 🌟', '🏆',
 '{"currentStreak": {"min": 30}, "hasCheckedInToday": false, "timeOfDay": "morning"}', 'streak', false),

-- High streak at risk (30+ days) - Evening
('streak', 11, '🏆 30-Day Streak at Risk!', 'Quick! Visit before we close to save your incredible 30+ day streak! ⏰', '🏆',
 '{"currentStreak": {"min": 30}, "hasCheckedInToday": false, "timeOfDay": "evening"}', 'streak', false),

-- Good streak at risk (14-29 days) - Morning
('streak', 12, '💪 Fortnight Streak at Risk!', 'Good morning! Keep your 2-week streak alive! Pop in today! 🌟', '💪',
 '{"currentStreak": {"min": 14, "max": 29}, "hasCheckedInToday": false, "timeOfDay": "morning"}', 'streak', false),

-- Good streak at risk (14-29 days) - Evening
('streak', 13, '💪 Fortnight Streak at Risk!', 'Quick! Visit this evening to save your 2-week streak! ⏰', '💪',
 '{"currentStreak": {"min": 14, "max": 29}, "hasCheckedInToday": false, "timeOfDay": "evening"}', 'streak', false),

-- Week streak at risk (7-13 days) - Morning
('streak', 14, '⭐ Weekly Streak at Risk!', 'Good morning! Pop in today to keep your amazing week-long streak alive! 🌟', '⭐',
 '{"currentStreak": {"min": 7, "max": 13}, "hasCheckedInToday": false, "timeOfDay": "morning"}', 'streak', false),

-- Week streak at risk (7-13 days) - Afternoon
('streak', 15, '⭐ Weekly Streak at Risk!', 'Don''t forget to visit today! Your week-long streak is counting on you! 💪', '⭐',
 '{"currentStreak": {"min": 7, "max": 13}, "hasCheckedInToday": false, "timeOfDay": "afternoon"}', 'streak', false),

-- Week streak at risk (7-13 days) - Evening
('streak', 16, '⭐ Weekly Streak at Risk!', 'Quick! Visit this evening to save your week-long streak! ⏰', '⭐',
 '{"currentStreak": {"min": 7, "max": 13}, "hasCheckedInToday": false, "timeOfDay": "evening"}', 'streak', false);

-- =============================================
-- PRIORITY 20-30: ONE STAMP AWAY
-- =============================================

-- One stamp away - Morning
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 20, '🎊 ONE MORE STAMP!!!', 'Good morning! Just ONE more stamp for FREE COFFEE! You HAVE to come in today! 💕', '☕',
 '{"stampsUntilReward": 1, "hasCoffeeStampToday": false, "timeOfDay": "morning"}', 'reward', false),

-- One stamp away - Afternoon
('stamp', 21, '🎊 ONE MORE STAMP!!!', 'Eeeek! Just ONE more for FREE COFFEE! Perfect time for an afternoon visit! 💕', '☕',
 '{"stampsUntilReward": 1, "hasCoffeeStampToday": false, "timeOfDay": "afternoon"}', 'reward', false),

-- One stamp away - Evening
('stamp', 22, '🎊 ONE MORE STAMP!!!', 'OMG! Just ONE more stamp for FREE COFFEE! Come in this evening! 💕', '☕',
 '{"stampsUntilReward": 1, "hasCoffeeStampToday": false, "timeOfDay": "evening"}', 'reward', false),

-- Two stamps away
('stamp', 23, '☕ Almost There!', 'Only 2 stamps away from FREE COFFEE! Come visit us! 🎉', '☕',
 '{"stampsUntilReward": 2, "hasCoffeeStampToday": false}', 'default', true),

-- Three stamps away
('stamp', 24, '☕ Getting Close!', 'Just 3 stamps away from FREE COFFEE! Keep it up! ✨', '☕',
 '{"stampsUntilReward": 3, "hasCoffeeStampToday": false}', 'default', true);

-- =============================================
-- PRIORITY 30-50: CHECK-IN REMINDERS (Time-Based)
-- =============================================

-- Early morning (5-7 AM)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('checkin', 30, '🌅 Rise & Shine!', 'Good morning, early bird! Start your day with us! Check in and earn 5 points! ✨', '🌅',
 '{"hasCheckedInToday": false, "timeOfDay": "morning"}', 'default', true),

-- Morning (7-10 AM) - Variation 1
('checkin', 31, '☀️ Good Morning!', 'Morning coffee calling! Pop in for your check-in and earn 5 points! 💕', '☀️',
 '{"hasCheckedInToday": false, "timeOfDay": "morning"}', 'default', true),

-- Late morning (10 AM - 12 PM)
('checkin', 32, '🌞 Morning Visit?', 'Still time for your morning check-in! Grab a coffee and earn points! ☕', '🌞',
 '{"hasCheckedInToday": false, "timeOfDay": "morning"}', 'default', true),

-- Lunchtime (12-2 PM)
('checkin', 33, '☕ Lunchtime Visit?', 'Perfect time for a coffee break! Check in and earn 5 points! 🎉', '☕',
 '{"hasCheckedInToday": false, "timeOfDay": "afternoon"}', 'default', true),

-- Afternoon (2-5 PM)
('checkin', 34, '🌤️ Afternoon Pick-Me-Up?', 'Beat the afternoon slump! Check in and grab a coffee! ✨', '🌤️',
 '{"hasCheckedInToday": false, "timeOfDay": "afternoon"}', 'default', true),

-- Evening (5-8 PM)
('checkin', 35, '🌆 Evening Visit?', 'Still time to check in today! Come say hi before we close! 💕', '🌆',
 '{"hasCheckedInToday": false, "timeOfDay": "evening"}', 'default', true),

-- Late evening (8-9 PM)
('checkin', 36, '⏰ Last Call!', 'Quick! Still time to check in before we close! Don''t miss out on your points! 🏃‍♀️', '⏰',
 '{"hasCheckedInToday": false, "timeOfDay": "evening"}', 'default', true);

-- =============================================
-- PRIORITY 50-60: COFFEE STAMP REMINDERS
-- =============================================

-- Morning - no stamp yet
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 50, '☕ Morning Coffee?', 'Grab your morning coffee and don''t forget your stamp! ✨', '☕',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "morning"}', 'default', true),

-- Afternoon - no stamp yet
('stamp', 51, '☕ Afternoon Coffee Run?', 'Time for a coffee break! Don''t forget your stamp! 🎉', '☕',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "afternoon"}', 'default', true),

-- Evening - no stamp yet
('stamp', 52, '☕ Evening Coffee?', 'Grab an evening coffee and get your stamp! ✨', '☕',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "evening"}', 'default', true);

-- =============================================
-- PRIORITY 60-70: GAME REMINDERS
-- =============================================

-- Morning - haven't played
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('game', 60, '🎮 Morning Game Time!', 'Start your day with a fun game! Win points, stamps, or prizes! 🎉', '🎮',
 '{"hasPlayedGameToday": false, "timeOfDay": "morning"}', 'default', true),

-- Afternoon - haven't played
('game', 61, '🎮 Afternoon Game Break!', 'Take a break! Play our daily game for a chance to win! 🎉', '🎮',
 '{"hasPlayedGameToday": false, "timeOfDay": "afternoon"}', 'default', true),

-- Evening - haven't played
('game', 62, '🎮 Evening Game Time!', 'Don''t miss today''s game! Play now for a chance to win! 🎉', '🎮',
 '{"hasPlayedGameToday": false, "timeOfDay": "evening"}', 'default', true),

-- Late - haven't played (urgent)
('game', 63, '🎮 Last Chance to Play!', 'Quick! Play today''s game before midnight! Win points, stamps, or prizes! 🏃‍♀️', '🎮',
 '{"hasPlayedGameToday": false, "timeOfDay": "night"}', 'default', true);

-- =============================================
-- PRIORITY 70-80: MILESTONE CELEBRATIONS
-- =============================================

-- 30-day streak milestone
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('milestone', 70, '🏆 30-Day Streak Champion!', 'OMG! You''ve hit 30 days in a row! You''re AMAZING! Keep it going! 💕', '🏆',
 '{"currentStreak": 30, "hasCheckedInToday": true}', 'success', true),

-- 14-day streak milestone
('milestone', 71, '💪 Fortnight Champion!', 'Yaaas! 14 days in a row! You''re crushing it! 🌟', '💪',
 '{"currentStreak": 14, "hasCheckedInToday": true}', 'success', true),

-- 7-day streak milestone
('milestone', 72, '⭐ Weekly Hero!', 'Amazing! 7 days in a row! You''re on fire! 🔥', '⭐',
 '{"currentStreak": 7, "hasCheckedInToday": true}', 'success', true),

-- High points (500+)
('milestone', 73, '💎 VIP Status!', 'Wow! You''ve earned 500+ points! You''re a true VIP! ✨', '💎',
 '{"lifetimePoints": {"min": 500}}', 'success', true),

-- High points (1000+)
('milestone', 74, '👑 Legend Status!', 'INCREDIBLE! 1000+ points! You''re a LEGEND! 🎉', '👑',
 '{"lifetimePoints": {"min": 1000}}', 'success', true);

-- =============================================
-- PRIORITY 80-90: ALL DONE CELEBRATIONS
-- =============================================

-- All tasks complete - Morning
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('custom', 80, '🌟 Morning Superstar!', 'You''ve already done everything today! You''re amazing! See you tomorrow! 💕', '🌟',
 '{"allComplete": true, "timeOfDay": "morning"}', 'success', true),

-- All tasks complete - Afternoon
('custom', 81, '🌟 Afternoon Champion!', 'All done for today! You''re crushing it! Enjoy the rest of your day! 💕', '🌟',
 '{"allComplete": true, "timeOfDay": "afternoon"}', 'success', true),

-- All tasks complete - Evening
('custom', 82, '🌟 Evening Star!', 'All done for today! You''re incredible! See you tomorrow! 💕', '🌟',
 '{"allComplete": true, "timeOfDay": "evening"}', 'success', true);

-- =============================================
-- PRIORITY 90-100: WELCOME & ENCOURAGEMENT
-- =============================================

-- New user (first day)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('custom', 90, '👋 Welcome to Penkey!', 'So excited to have you here! Check in, play games, and earn rewards! 💕', '👋',
 '{"lifetimePoints": {"max": 20}}', 'default', true),

-- Low activity (no check-in for 3+ days)
('custom', 91, '💕 We Miss You!', 'We haven''t seen you in a while! Come visit us soon! ✨', '💕',
 '{"currentStreak": 0, "hasCheckedInToday": false}', 'default', true);

-- =============================================
-- PRIORITY 95-100: WEATHER-BASED (Lymington)
-- =============================================

-- Rainy day - morning
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('custom', 95, '☔ Rainy Morning!', 'It''s raining! Come warm up with a hot coffee! Perfect weather for a cozy visit! ☕', '☔',
 '{"weather": "rainy", "hasCoffeeStampToday": false, "timeOfDay": "morning"}', 'default', true),

-- Rainy day - afternoon
('custom', 96, '☔ Rainy Afternoon!', 'Rainy day blues? Come get a warm drink and brighten your day! ☕✨', '☔',
 '{"weather": "rainy", "hasCoffeeStampToday": false, "timeOfDay": "afternoon"}', 'default', true),

-- Cold day (< 10°C)
('custom', 97, '🥶 Brrr! Warm Up!', 'It''s freezing outside! Come warm up with a hot drink! ☕🔥', '🥶',
 '{"temperature": {"max": 10}, "hasCoffeeStampToday": false}', 'default', true),

-- Beautiful sunny day (> 18°C)
('custom', 98, '☀️ Beautiful Day!', 'Gorgeous weather in Lymington! Perfect for an iced coffee! ☕✨', '☀️',
 '{"weather": "sunny", "temperature": {"min": 18}, "hasCoffeeStampToday": false}', 'default', true),

-- Snowy day (rare in Lymington!)
('custom', 99, '❄️ Snow Day!', 'It''s snowing in Lymington! Come warm up with a hot chocolate! ☕❄️', '❄️',
 '{"weather": "snowy", "hasCoffeeStampToday": false}', 'default', true);

-- =============================================
-- PRIORITY 100-110: CLOSED (After 5 PM)
-- =============================================

-- Closed - haven't checked in (Night)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('custom', 100, '🌙 We''re Closed!', 'We''ve closed for today, but there''s always tomorrow! See you in the morning! 💕', '🌙',
 '{"hasCheckedInToday": false, "timeOfDay": "night"}', 'default', true),

-- Closed - have rewards (Night)
('reward', 101, '🌙 Closed - But Rewards Waiting!', 'We''re closed now, but your rewards will be here tomorrow! Don''t forget to redeem them! ✨', '🌙',
 '{"hasUnredeemedRewards": true, "timeOfDay": "night"}', 'reward', true),

-- Closed - streak at risk (Night)
('streak', 102, '🌙 Closed - Tomorrow Counts!', 'We''re closed now, but come in tomorrow to keep your streak alive! See you in the morning! 🔥', '🌙',
 '{"currentStreak": {"min": 7}, "hasCheckedInToday": false, "timeOfDay": "night"}', 'default', true),

-- Closed - one stamp away (Night)
('stamp', 103, '🌙 Closed - One More Tomorrow!', 'We''re closed now, but you''re SO close! Just one more stamp tomorrow for FREE COFFEE! ☕', '🌙',
 '{"stampsUntilReward": 1, "hasCoffeeStampToday": false, "timeOfDay": "night"}', 'default', true),

-- Closed - all done (Night)
('custom', 104, '🌟 All Done - Sleep Well!', 'You crushed it today! We''re closed now. Rest up and see you tomorrow! 💕', '🌟',
 '{"allComplete": true, "timeOfDay": "night"}', 'success', true);

-- Success message
SELECT '✅ Ultimate notification system created! ' || COUNT(*) || ' notifications added!' as message
FROM notifications;

-- Show summary by type
SELECT 
  type,
  COUNT(*) as count,
  MIN(priority) as min_priority,
  MAX(priority) as max_priority
FROM notifications
GROUP BY type
ORDER BY MIN(priority);
