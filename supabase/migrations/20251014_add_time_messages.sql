-- =============================================
-- ADD TIME-BASED MESSAGES
-- Date: 2025-10-14
-- =============================================
-- Adds contextual messages based on time of day
-- =============================================

-- Morning messages (5am-12pm)
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES

-- Coffee morning messages
('coffee', 'morning', 'Good morning! Start your day with Coffee Mongers! 💕', '☀️', 3, true, '{"timeOfDay": "morning"}'),
('coffee', 'morning', 'Morning love! Fresh coffee brewing just for you! ✨', '🌅', 3, true, '{"timeOfDay": "morning"}'),
('coffee', 'morning', 'Rise and shine! Your morning coffee awaits! ☕', '☀️', 3, true, '{"timeOfDay": "morning"}'),
('coffee', 'morning', 'Breakfast time! Coffee + fresh pastries = perfect! 🥐', '🥐', 3, true, '{"timeOfDay": "morning"}'),
('coffee', 'morning', 'Good morning sunshine! Let''s start the day right! 💫', '🌅', 2, true, '{"timeOfDay": "morning"}'),
('coffee', 'morning', 'Morning coffee calling your name! Pop in! 🌟', '☀️', 2, true, '{"timeOfDay": "morning"}'),

-- Points morning messages
('points', 'morning', 'Morning points! Start your day earning! ✨', '🌅', 2, true, '{"timeOfDay": "morning"}'),
('points', 'morning', 'Good morning! Check in and earn your points! 💕', '☀️', 2, true, '{"timeOfDay": "morning"}'),

-- Game morning messages
('games', 'morning', 'Morning game time! Start your day with a win! 🎮', '🌅', 2, true, '{"timeOfDay": "morning"}');

-- Afternoon messages (12pm-5pm)
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES

-- Coffee afternoon messages
('coffee', 'afternoon', 'Afternoon pick-me-up? We got you! Come in! 💫', '☕', 3, true, '{"timeOfDay": "afternoon"}'),
('coffee', 'afternoon', 'Lunch break coffee? Perfect timing! See you soon! ✨', '🌤️', 3, true, '{"timeOfDay": "afternoon"}'),
('coffee', 'afternoon', '3pm slump? Coffee to the rescue! Pop in! 🎉', '⏰', 3, true, '{"timeOfDay": "afternoon"}'),
('coffee', 'afternoon', 'Afternoon coffee break! You deserve it! 💕', '☕', 3, true, '{"timeOfDay": "afternoon"}'),
('coffee', 'afternoon', 'Midday energy boost! Coffee waiting for you! 🌟', '⏰', 2, true, '{"timeOfDay": "afternoon"}'),
('coffee', 'afternoon', 'Afternoon treat time! Coffee and something sweet! 🍰', '🌤️', 2, true, '{"timeOfDay": "afternoon"}'),

-- Points afternoon messages
('points', 'afternoon', 'Afternoon points! Keep that momentum going! 💫', '⏰', 2, true, '{"timeOfDay": "afternoon"}'),
('points', 'afternoon', 'Lunch break points! Quick visit, big rewards! ✨', '🌤️', 2, true, '{"timeOfDay": "afternoon"}'),

-- Game afternoon messages
('games', 'afternoon', 'Afternoon game break! You might win big! 🎲', '⏰', 2, true, '{"timeOfDay": "afternoon"}');

-- Evening messages (5pm-9pm) - if open late
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES

-- Coffee evening messages
('coffee', 'evening', 'Evening coffee? We''re still here! Come say hi! 💕', '🌆', 2, true, '{"timeOfDay": "evening"}'),
('coffee', 'evening', 'End your day with us! Coffee and good vibes! 🌟', '✨', 2, true, '{"timeOfDay": "evening"}'),
('coffee', 'evening', 'Evening treat! Pop in before we close! ☕', '🌆', 2, true, '{"timeOfDay": "evening"}'),

-- Points evening messages
('points', 'evening', 'Last chance for today''s points! Pop in! 💫', '🌆', 2, true, '{"timeOfDay": "evening"}');

-- Night/closed messages
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES

-- Coffee night/closed messages
('coffee', 'closed', 'We''re closed now but see you tomorrow! Sleep well! 💕', '😴', 3, true, '{"timeOfDay": "night"}'),
('coffee', 'closed', 'Closed for today! Open tomorrow at 7am! See you then! ✨', '🌙', 3, true, '{"timeOfDay": "night"}'),
('coffee', 'closed', 'Sweet dreams! We''ll have fresh coffee ready tomorrow! 🌟', '😴', 2, true, '{"timeOfDay": "night"}'),
('coffee', 'closed', 'Goodnight! Can''t wait to see you tomorrow! 💕', '🌙', 2, true, '{"timeOfDay": "night"}'),

-- Points night messages
('points', 'closed', 'Rest up! More points to earn tomorrow! 💫', '🌙', 2, true, '{"timeOfDay": "night"}');

-- Referral messages by time
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES
('referral', 'morning', 'Morning! Share Penkey with your friends today! 💕', '🌅', 2, true, '{"timeOfDay": "morning"}'),
('referral', 'afternoon', 'Lunch break? Tell your friends about Penkey! ✨', '⏰', 2, true, '{"timeOfDay": "afternoon"}');

-- Success message
SELECT 'Time-based messages added successfully!' as message,
       COUNT(*) as total_messages
FROM public.message_templates
WHERE conditions::text LIKE '%timeOfDay%';
