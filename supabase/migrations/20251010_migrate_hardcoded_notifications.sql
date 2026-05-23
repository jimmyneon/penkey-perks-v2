-- =============================================
-- Migrate Hardcoded Notifications to Database
-- =============================================

-- Clear existing default notifications (keep custom ones)
DELETE FROM public.notifications WHERE type IN ('reward', 'streak', 'checkin', 'stamp', 'game', 'custom');

-- =============================================
-- PRIORITY 1: REWARD EXPIRY NOTIFICATIONS
-- =============================================

-- 1. CRITICAL: Last 1-3 hours
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 1, '🚨 LAST CHANCE!', 'Only {hoursUntilExpiry} hours left! Your free coffee expires VERY soon! Rush in NOW! 🏃‍♀️💨', '🚨',
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"min": 1, "max": 3}}', 'streak', false);

-- 2. URGENT: Expiring today (4-12 hours)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 2, '⚠️ EXPIRING TODAY!', 'Your free coffee expires in {hoursUntilExpiry} hours! Come redeem it today or lose it! 🏃‍♀️', '⚠️',
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"min": 4, "max": 12}}', 'streak', false);

-- 3. URGENT: Expiring today (13-24 hours)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 3, '⏰ Expires Today!', 'Your free coffee expires tonight! Pop in today before it''s too late! ☕', '⏰',
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"min": 13, "max": 24}}', 'streak', false);

-- 4. WARNING: Expires tomorrow
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 4, '⏰ Expires Tomorrow!', 'Your free coffee expires tomorrow! Don''t forget to redeem it! 💨', '⏰',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": {"equals": 1}}', 'reward', false);

-- 5. WARNING: 2 days left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 5, '⏳ 2 Days Left!', 'Your free coffee expires in 2 days! Make sure to pop in soon! ☕✨', '⏳',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": {"equals": 2}}', 'reward', true);

-- 6. WARNING: 3 days left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 6, '⏳ 3 Days Left', 'Your free coffee expires in 3 days. Don''t miss out! Come visit us! ☕', '⏳',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": {"equals": 3}}', 'reward', true);

-- 7. INFO: Expires this week (4-7 days)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 7, '📅 Expires This Week', 'Your free coffee expires in {daysUntilExpiry} days. Remember to redeem it soon! ☕', '📅',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": {"min": 4, "max": 7}}', 'reward', true);

-- 8. NORMAL: Rewards ready (8+ days)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 8, '🎉 Yaaas! Rewards Ready!', 'You''ve got treats waiting! Pop in and redeem them! 💕', '🎁',
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": {"min": 8}}', 'reward', true);

-- 9. REMINDER: Free Coffee (after dismissal)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 9, '🔔 Reminder: Free Coffee!', 'Don''t forget - your free coffee is waiting! Click to view QR code. ☕', '🔔',
 '{"hasUnredeemedRewards": true}', 'reward', true);

-- =============================================
-- PRIORITY 2: STREAK NOTIFICATIONS
-- =============================================

-- 10. CRITICAL: High streak at risk (7+ days)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('streak', 10, '🔥 Streak at Risk!', 'Don''t lose your {currentStreak} day streak! Pop in today to keep it alive! 💪', '🔥',
 '{"currentStreak": {"min": 7}, "hasCheckedInToday": false}', 'streak', false);

-- 11. WARNING: Medium streak at risk (3-6 days)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('streak', 11, '⚡ Keep Your Streak!', 'You''re on a {currentStreak} day streak! Don''t break it now! 🌟', '⚡',
 '{"currentStreak": {"min": 3, "max": 6}, "hasCheckedInToday": false}', 'streak', true);

-- =============================================
-- PRIORITY 3: COFFEE STAMP NOTIFICATIONS
-- =============================================

-- 12. URGENT: One stamp away!
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 12, '🎊 ONE MORE STAMP!!!', 'Eeeek! Just ONE more for FREE COFFEE! You HAVE to come in today! 💕', '☕',
 '{"stampsUntilReward": {"equals": 1}, "hasCoffeeStampToday": false}', 'reward', false);

-- 13. CLOSE: Two stamps away
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 13, '🔥 SO CLOSE!', 'Only 2 stamps away from free coffee! Come get yours today! ✨', '☕',
 '{"stampsUntilReward": {"equals": 2}, "hasCoffeeStampToday": false}', 'default', true);

-- 14. ALMOST: Three stamps away
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 14, '💫 Almost There!', 'Just 3 more stamps! Your free coffee is waiting! 🎉', '☕',
 '{"stampsUntilReward": {"equals": 3}, "hasCoffeeStampToday": false}', 'default', true);

-- =============================================
-- PRIORITY 4: CHECK-IN NOTIFICATIONS
-- =============================================

-- 15. Morning check-in (6am-12pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('checkin', 15, '☀️ Good Morning!', 'Start your day with us! Pop in for your check-in and earn 5 points! ✨', '☀️',
 '{"hasCheckedInToday": false}', 'default', true),
('checkin', 15, '🌅 Rise & Shine!', 'Morning! Come grab your check-in points and maybe a coffee? 💕', '🌅',
 '{"hasCheckedInToday": false}', 'default', true);

-- 16. Afternoon check-in (12pm-5pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('checkin', 16, '☕ Afternoon Check-in?', 'Pop in for your daily check-in! Earn 5 points! 🎉', '☕',
 '{"hasCheckedInToday": false}', 'default', true),
('checkin', 16, '💫 Don''t Forget!', 'Haven''t checked in yet today! Come earn your points! ✨', '💫',
 '{"hasCheckedInToday": false}', 'default', true);

-- 17. Evening check-in (5pm-10pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('checkin', 17, '🌙 Last Call!', 'Still time to check in today! Don''t miss out on your points! ⏰', '🌙',
 '{"hasCheckedInToday": false}', 'default', true),
('checkin', 17, '⭐ Evening Check-in!', 'Quick! Check in before the day ends! Earn your 5 points! 💕', '⭐',
 '{"hasCheckedInToday": false}', 'default', true);

-- =============================================
-- PRIORITY 5: STAMP COLLECTION (TIME-BASED)
-- =============================================

-- 18. Morning coffee stamp (6am-12pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 18, '☕ Morning Coffee Stamp?', 'Grab your morning brew and collect your stamp! ✨', '☕',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'default', true),
('stamp', 18, '🌅 Start Your Day Right!', 'Coffee + stamp = perfect morning! Come in! 💕', '🌅',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'default', true);

-- 19. Afternoon coffee stamp (12pm-5pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 19, '☕ Afternoon Coffee Run?', 'Time for a coffee break! Don''t forget your stamp! 🎉', '☕',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'default', true),
('stamp', 19, '💫 Treat Yo Self!', 'Grab a coffee and collect your stamp! You deserve it! ✨', '💫',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'default', true);

-- 20. Evening coffee stamp (5pm-10pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 20, '☕ Last Call for Stamps!', 'Get your coffee stamp before we close! ⏰', '☕',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'default', true),
('stamp', 20, '🌙 Evening Coffee?', 'Still time to grab your stamp today! Pop in! 💕', '🌙',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'default', true);

-- =============================================
-- PRIORITY 6: GAME NOTIFICATIONS
-- =============================================

-- 21. Daily game available
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('game', 21, '🎮 Daily Game Ready!', 'Play now for a chance to win points, stamps, or prizes! 🎉', '🎮',
 '{"hasPlayedGameToday": false}', 'default', true),
('game', 21, '🎯 Try Your Luck!', 'Today''s game is ready! Play for free rewards! ✨', '🎯',
 '{"hasPlayedGameToday": false}', 'default', true),
('game', 21, '🎲 Feeling Lucky?', 'Spin, roll, or match! Play today''s game for prizes! 💫', '🎲',
 '{"hasPlayedGameToday": false}', 'default', true);

-- =============================================
-- PRIORITY 7: ALL DONE / SUCCESS
-- =============================================

-- 22. All tasks complete
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('custom', 22, '🌟 You''re Amazing!', 'All done for today! You''re crushing it! See you tomorrow! 💕', '🌟',
 '{"hasCheckedInToday": true, "hasCoffeeStampToday": true, "hasPlayedGameToday": true}', 'success', true),
('custom', 22, '✨ Perfect Day!', 'You did it all! Check-in, stamp, and game! You''re a star! 🌟', '✨',
 '{"hasCheckedInToday": true, "hasCoffeeStampToday": true, "hasPlayedGameToday": true}', 'success', true),
('custom', 22, '🎉 All Complete!', 'Wow! You completed everything today! Amazing work! 💪', '🎉',
 '{"hasCheckedInToday": true, "hasCoffeeStampToday": true, "hasPlayedGameToday": true}', 'success', true);

-- =============================================
-- MILESTONE NOTIFICATIONS
-- =============================================

-- 23. Point milestones
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('custom', 23, '🎊 100 Points!', 'You''ve earned 100 lifetime points! You''re amazing! Keep going! 💪', '🏆',
 '{"lifetimePoints": {"equals": 100}}', 'success', true),
('custom', 23, '🎊 500 Points!', 'WOW! 500 lifetime points! You''re a Penkey legend! 🌟', '🏆',
 '{"lifetimePoints": {"equals": 500}}', 'success', true),
('custom', 23, '🎊 1000 Points!', 'INCREDIBLE! 1000 lifetime points! You''re unstoppable! 💫', '🏆',
 '{"lifetimePoints": {"equals": 1000}}', 'success', true);

-- Add comments
COMMENT ON TABLE public.notifications IS 'Notification system with migrated hardcoded messages';

-- Success message
SELECT 'Successfully migrated ' || COUNT(*) || ' notifications to database!' as message
FROM public.notifications;
