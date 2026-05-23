-- =============================================
-- Update Notifications for Beans System
-- =============================================
-- This migration updates all existing notifications to use:
-- 1. "beans" instead of "points"
-- 2. New bean values (50 beans for check-in, etc.)
-- 3. Coffee stamps terminology
-- 4. Fixed weather notification conditions

-- First, deactivate all old notifications
UPDATE public.notifications 
SET active = false 
WHERE active = true;

-- =============================================
-- PRIORITY 1-7: REWARD NOTIFICATIONS
-- =============================================

-- Priority 1: CRITICAL - Less than 3 hours left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 1, '🚨 LAST CHANCE!', 'Only {{hoursUntilExpiry}} hour(s) left! Your reward expires VERY soon! Rush in NOW! 🏃‍♀️💨', '🎁', 
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"max": 3, "min": 1}}', 'streak', false, true);

-- Priority 2: URGENT - 4-12 hours left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 2, '⚠️ EXPIRING TODAY!', 'Your reward expires in {{hoursUntilExpiry}} hours! Come redeem it today or lose it! 🏃‍♀️', '🎁', 
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"min": 4, "max": 12}}', 'streak', false, true);

-- Priority 3: URGENT - 13-24 hours (expires today)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 3, '⏰ Expires Today!', 'Your reward expires tonight! Pop in today before it''s too late! ☕', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 0, "hoursUntilExpiry": {"min": 13}}', 'streak', false, true);

-- Priority 4: Expires tomorrow
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 4, '⏰ Expires Tomorrow!', 'Your reward expires tomorrow! Don''t forget to redeem it! 💨', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 1}', 'reward', false, true);

-- Priority 5: 2 days left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 5, '⏳ 2 Days Left!', 'Your reward expires in 2 days! Make sure to pop in soon! ☕✨', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 2}', 'reward', true, true);

-- Priority 6: 3 days left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 6, '⏳ 3 Days Left', 'Your reward expires in 3 days. Don''t miss out! Come visit us! ☕', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 3}', 'reward', true, true);

-- Priority 7: General reward ready (no urgency)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 7, '🎁 Yaaas! Rewards Ready!', 'You''ve got treats waiting! Pop in and redeem them! 💕', '🎁', 
 '{"hasUnredeemedRewards": true}', 'reward', true, true);

-- =============================================
-- PRIORITY 8: STREAK AT RISK
-- =============================================

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('streak', 8, '🔥 {{currentStreak}} Day Streak at Risk!', 'Don''t lose your streak! Pop in today to keep it alive! 💪', '🔥', 
 '{"currentStreak": {"min": 7}, "hasCheckedInToday": false}', 'streak', false, true);

-- =============================================
-- PRIORITY 9: ONE COFFEE STAMP AWAY
-- =============================================

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('stamp', 9, '🎊 ONE MORE STAMP!!!', 'Eeeek! Just ONE more coffee stamp for FREE COFFEE! You HAVE to come in today! 💕', '☕',
 '{"stampsUntilReward": 1, "hasCoffeeStampToday": false}', 'reward', false, true);

-- =============================================
-- PRIORITY 10-20: CHECK-IN MESSAGES (BEANS!)
-- =============================================

-- Morning check-in (5-10 AM) - Updated for BEANS
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('checkin', 10, '☀️ Good Morning!', 'Start your day with us! Check in and earn 50 beans! ✨', '☀️',
 '{"hasCheckedInToday": false, "timeOfDay": "morning"}', 'default', true, true);

-- Midday check-in (10-2 PM) - Updated for BEANS
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('checkin', 11, '☕ Midday Break?', 'Perfect time for a coffee break! Check in and earn 50 beans! 🎉', '☕',
 '{"hasCheckedInToday": false, "timeOfDay": "midday"}', 'default', true, true);

-- Afternoon check-in (2-5 PM) - Updated for BEANS
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('checkin', 12, '🌤️ Afternoon Visit?', 'Pop in for your afternoon treat! Check in and earn 50 beans! ☕', '🌤️',
 '{"hasCheckedInToday": false, "timeOfDay": "afternoon"}', 'default', true, true);

-- Evening check-in (5-9 PM) - Updated for BEANS
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('checkin', 13, '🌆 Evening Visit?', 'End your day with us! Check in and earn 50 beans before we close! 🌟', '🌆',
 '{"hasCheckedInToday": false, "timeOfDay": "evening"}', 'default', true, true);

-- =============================================
-- PRIORITY 21-30: COFFEE STAMP REMINDERS
-- =============================================

-- Morning coffee stamp
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('stamp', 21, '☕ Morning Coffee?', 'Grab your morning coffee and don''t forget your stamp! ✨', '☕',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "morning"}', 'default', true, true);

-- Afternoon coffee stamp
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('stamp', 22, '☕ Afternoon Coffee Run?', 'Time for a coffee break! Don''t forget your stamp! 🎉', '☕',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "afternoon"}', 'default', true, true);

-- =============================================
-- PRIORITY 31-40: GAME REMINDERS (BEANS!)
-- =============================================

-- Morning game - Updated for BEANS
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('game', 31, '🎮 Morning Game Time!', 'Start your day with a fun game! Win beans, stamps, or prizes! 🎉', '🎮',
 '{"hasPlayedGameToday": false, "timeOfDay": "morning"}', 'default', true, true);

-- Afternoon game - Updated for BEANS
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('game', 32, '🎮 Daily Game Ready!', 'Play now for a chance to win beans, stamps, or prizes! 🎉', '🎮',
 '{"hasPlayedGameToday": false, "timeOfDay": "afternoon"}', 'default', true, true);

-- =============================================
-- PRIORITY 41-50: MILESTONES (BEANS!)
-- =============================================

-- 30-day streak milestone
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('milestone', 41, '🏆 30-Day Streak Champion!', 'OMG! You''ve hit 30 days in a row! You earned 1,500 beans! You''re AMAZING! 💕', '🏆',
 '{"currentStreak": 30, "hasCheckedInToday": true}', 'success', true, true);

-- 14-day streak milestone
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('milestone', 42, '💪 14-Day Streak!', 'Two weeks in a row! You earned 500 beans! Keep it going! 🌟', '💪',
 '{"currentStreak": 14, "hasCheckedInToday": true}', 'success', true, true);

-- 7-day streak milestone
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('milestone', 43, '⭐ 7-Day Streak!', 'One week strong! You earned 200 beans! You''re on fire! 🔥', '⭐',
 '{"currentStreak": 7, "hasCheckedInToday": true}', 'success', true, true);

-- =============================================
-- PRIORITY 51-60: WEATHER MESSAGES (FIXED!)
-- =============================================

-- Rainy morning - FIXED: weather condition matching
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 51, '☔ Rainy Morning!', 'It''s raining! Come warm up with a hot coffee! Perfect weather for a cozy visit! ☕', '☔',
 '{"weather": "rainy", "timeOfDay": "morning"}', 'default', true, true);

-- Rainy afternoon - FIXED
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 52, '☔ Rainy Afternoon!', 'Rainy day? Perfect for a warm coffee! Pop in and cozy up! ☕💕', '☔',
 '{"weather": "rainy", "timeOfDay": "afternoon"}', 'default', true, true);

-- Sunny morning - FIXED
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 53, '☀️ Beautiful Morning!', 'Gorgeous day! Perfect for an iced coffee! Come enjoy the sunshine! ☕✨', '☀️',
 '{"weather": "sunny", "timeOfDay": "morning"}', 'default', true, true);

-- Cloudy day - FIXED
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 54, '☁️ Cloudy Day Vibes', 'A bit cloudy? Perfect coffee weather! Come warm up with us! ☕', '☁️',
 '{"weather": "cloudy"}', 'default', true, true);

-- Cold weather (temperature based) - FIXED
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 55, '🥶 Brr! It''s Cold!', 'Bundle up! Come warm up with a hot coffee! We''ll keep you cozy! ☕🔥', '🥶',
 '{"temperature": {"max": 10}}', 'default', true, true);

-- =============================================
-- PRIORITY 61-70: ALL COMPLETE MESSAGES
-- =============================================

-- Morning - all done
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 61, '🌟 Morning Superstar!', 'You''ve already done everything today! You''re amazing! See you tomorrow! 💕', '🌟',
 '{"allComplete": true, "timeOfDay": "morning"}', 'success', true, true);

-- Afternoon - all done
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 62, '🎉 All Done for Today!', 'You''ve completed all daily activities! You''re crushing it! See you tomorrow! 💕', '🎉',
 '{"allComplete": true, "timeOfDay": "afternoon"}', 'success', true, true);

-- Evening - all done
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 63, '✨ You''re Amazing!', 'All done for today! You''re a star! Rest up and see you tomorrow! 💕', '✨',
 '{"allComplete": true, "timeOfDay": "evening"}', 'success', true, true);

-- =============================================
-- PRIORITY 71-80: NEW USER WELCOME (BEANS!)
-- =============================================

-- New user - Updated for BEANS (250 beans signup bonus!)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 71, '👋 Welcome to Penkey!', 'So excited to have you here! You got 250 beans + free coffee! Check in, play games, and earn more! 💕', '👋',
 '{"lifetimePoints": {"max": 300}}', 'default', true, true);

-- =============================================
-- PRIORITY 81-90: CLOSED MESSAGES
-- =============================================

-- Night - closed
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 81, '🌙 We''re Closed!', 'We''ve closed for today, but there''s always tomorrow! See you in the morning! 💕', '🌙',
 '{"hasCheckedInToday": false, "timeOfDay": "night"}', 'default', true, true);

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT 'Notifications updated for beans system! 🫘' as message,
       COUNT(*) as total_active_notifications
FROM public.notifications
WHERE active = true;
