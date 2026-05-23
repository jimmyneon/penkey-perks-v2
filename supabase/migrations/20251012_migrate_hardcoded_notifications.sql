-- =============================================
-- MIGRATE HARDCODED NOTIFICATIONS TO DATABASE
-- =============================================
-- This migration moves all hardcoded notification logic
-- from notification-banner.tsx into the database
-- =============================================

-- Clean up existing default notifications (we'll recreate them properly)
DELETE FROM public.notifications WHERE priority >= 1 AND priority <= 25;

-- =============================================
-- PRIORITY 1-7: REWARD EXPIRY NOTIFICATIONS
-- =============================================

-- Priority 1: CRITICAL - Less than 3 hours left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 1, '🚨 LAST CHANCE!', 'Only {{hoursUntilExpiry}} hour(s) left! Your free coffee expires VERY soon! Rush in NOW! 🏃‍♀️💨', '🎁', 
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"max": 3, "min": 1}}', 'streak', false, true);

-- Priority 2: URGENT - 4-12 hours left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 2, '⚠️ EXPIRING TODAY!', 'Your free coffee expires in {{hoursUntilExpiry}} hours! Come redeem it today or lose it! 🏃‍♀️', '🎁', 
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"min": 4, "max": 12}}', 'streak', false, true);

-- Priority 3: URGENT - 13-24 hours (expires today)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 3, '⏰ Expires Today!', 'Your free coffee expires tonight! Pop in today before it''s too late! ☕', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 0, "hoursUntilExpiry": {"min": 13}}', 'streak', false, true);

-- Priority 4: Expires tomorrow
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 4, '⏰ Expires Tomorrow!', 'Your free coffee expires tomorrow! Don''t forget to redeem it! 💨', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 1}', 'reward', false, true);

-- Priority 5: 2 days left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 5, '⏳ 2 Days Left!', 'Your free coffee expires in 2 days! Make sure to pop in soon! ☕✨', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 2}', 'reward', true, true);

-- Priority 6: 3 days left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('reward', 6, '⏳ 3 Days Left', 'Your free coffee expires in 3 days. Don''t miss out! Come visit us! ☕', '🎁', 
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
-- PRIORITY 9-11: COFFEE STAMP URGENCY
-- =============================================

-- Priority 9: ONE MORE STAMP!!!
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('stamp', 9, '🎊 ONE MORE STAMP!!!', 'Eeeek! Just ONE more for FREE COFFEE! You HAVE to come in today! 💕', '☕', 
 '{"stampsUntilReward": 1, "hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'reward', false, true);

-- Priority 10: 2 stamps away
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('stamp', 10, '🔥 SO CLOSE!', 'Only 2 stamps away from free coffee! Come get yours today! ✨', '☕', 
 '{"stampsUntilReward": 2, "hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'default', true, true);

-- Priority 11: 3 stamps away
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('stamp', 11, '💫 Almost There!', 'Just 3 more stamps! Your free coffee is waiting! 🎉', '☕', 
 '{"stampsUntilReward": 3, "hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'default', true, true);

-- =============================================
-- PRIORITY 12-15: CHECK-IN REMINDERS (Time-based)
-- =============================================

-- Morning (5am-10am)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('checkin', 12, '☀️ Good Morning!', 'Start your day with us! Pop in for your check-in and earn 5 beans! ✨', '☀️', 
 '{"hasCheckedInToday": false, "timeOfDay": "morning"}', 'default', true, true);

-- Midday (10am-2pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('checkin', 13, '☕ Lunchtime Visit?', 'Perfect time for a coffee break! Check in and earn beans! 🎉', '☕', 
 '{"hasCheckedInToday": false, "timeOfDay": "midday"}', 'default', true, true);

-- Afternoon (2pm-5pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('checkin', 14, '🌤️ Afternoon Pick-Me-Up?', 'Beat the afternoon slump! Check in and grab a coffee! ✨', '☕', 
 '{"hasCheckedInToday": false, "timeOfDay": "afternoon"}', 'default', true, true);

-- Evening (5pm-9pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('checkin', 15, '🌙 Evening Visit?', 'Quick! Check in before we close! Don''t miss out on beans! ⏰', '🌙', 
 '{"hasCheckedInToday": false, "timeOfDay": "evening"}', 'default', true, true);

-- =============================================
-- PRIORITY 16-18: COFFEE STAMP REMINDERS (Time-based)
-- =============================================

-- Morning coffee
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('stamp', 16, '☕ Morning Coffee Stamp?', 'Grab your morning brew and collect your stamp! ✨', '☕', 
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "morning"}', 'default', true, true);

-- Afternoon coffee
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('stamp', 17, '☕ Afternoon Coffee Run?', 'Time for a coffee break! Don''t forget your stamp! 🎉', '☕', 
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "afternoon"}', 'default', true, true);

-- Evening coffee
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('stamp', 18, '☕ Last Call for Stamps!', 'Get your coffee stamp before we close! ⏰', '☕', 
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "evening"}', 'default', true, true);

-- =============================================
-- PRIORITY 19-20: GAME REMINDERS
-- =============================================

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('game', 19, '🎮 Daily Game Ready!', 'Play now for a chance to win beans, stamps, or prizes! 🎉', '🎮', 
 '{"hasPlayedGameToday": false}', 'default', true, true);

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('game', 20, '🎲 Feeling Lucky?', 'Try today''s game! You might win something amazing! ✨', '🎲', 
 '{"hasPlayedGameToday": false}', 'default', true, true);

-- =============================================
-- PRIORITY 21-23: ALL DONE (Success messages)
-- =============================================

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 21, '🌟 You''re Amazing!', 'All done for today! You''re crushing it! See you tomorrow! 💕', '🌟', 
 '{"allComplete": true}', 'success', true, true);

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 22, '✅ All Caught Up!', 'You''ve done everything! Take a break, you earned it! ✨', '✅', 
 '{"allComplete": true}', 'success', true, true);

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('custom', 23, '🎉 Daily Goals Complete!', 'Yaaas! Come back tomorrow for more fun! 💫', '🎉', 
 '{"allComplete": true}', 'success', true, true);

-- =============================================
-- ADDITIONAL CONTEXTUAL NOTIFICATIONS
-- =============================================

-- Milestone: First check-in
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('milestone', 24, '🎉 Welcome!', 'Thanks for your first check-in! You earned 5 beans! Keep coming back for more! ✨', '🎉', 
 '{"lifetimePoints": {"max": 10}}', 'success', true, true);

-- High achiever
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible, active) VALUES
('milestone', 25, '🏆 High Achiever!', 'Wow! {{lifetimePoints}} lifetime beans! You''re a Penkey legend! 💪', '🏆', 
 '{"lifetimePoints": {"min": 500}}', 'success', true, true);

-- =============================================
-- VERIFICATION
-- =============================================

-- Count notifications created
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.notifications WHERE priority BETWEEN 1 AND 25;
  RAISE NOTICE '✅ Created % notifications successfully!', v_count;
  
  IF v_count < 25 THEN
    RAISE EXCEPTION 'Expected 25 notifications but only created %', v_count;
  END IF;
END $$;

-- Show summary
SELECT 
  type,
  COUNT(*) as count,
  MIN(priority) as min_priority,
  MAX(priority) as max_priority
FROM public.notifications
WHERE priority BETWEEN 1 AND 25
GROUP BY type
ORDER BY MIN(priority);

-- Success message
SELECT '🎉 Hardcoded notifications successfully migrated to database!' as message;
