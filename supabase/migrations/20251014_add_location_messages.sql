-- =============================================
-- ADD LOCATION-BASED MESSAGES
-- Date: 2025-10-14
-- =============================================
-- Adds contextual messages based on user location
-- =============================================

-- Very close messages (< 50m from Penkey)
INSERT INTO public.message_templates (category, context, message, emoji, weight, active) VALUES

('coffee', 'very_close', 'We can see you! Come in and say hi! 💕', '👀', 5, true),
('coffee', 'very_close', 'You''re RIGHT HERE! Pop in for your stamp! ✨', '🎉', 5, true),
('coffee', 'very_close', 'So close! Just a few steps away! Come in! 🌟', '📍', 5, true),
('coffee', 'very_close', 'You''re literally outside! Come grab your coffee! ☕', '👋', 4, true),
('coffee', 'very_close', 'Hello neighbor! We''re right here waiting! 💫', '👀', 4, true),

('points', 'very_close', 'You''re SO close! Pop in for your points! 🎉', '📍', 3, true),
('games', 'very_close', 'Right outside? Come play and win! 🎮', '👀', 3, true);

-- Nearby messages (50-200m from Penkey)
INSERT INTO public.message_templates (category, context, message, emoji, weight, active) VALUES

('coffee', 'nearby', 'Just around the corner! 2 minute walk! ☕', '📍', 4, true),
('coffee', 'nearby', 'So close! Come grab your coffee! 💫', '🚶', 4, true),
('coffee', 'nearby', 'You''re on New Street! Just a few steps! ✨', '📍', 4, true),
('coffee', 'nearby', 'Almost here! Pop in and say hello! 💕', '🚶', 3, true),
('coffee', 'nearby', 'Quick walk away! Fresh coffee waiting! 🌟', '📍', 3, true),

('points', 'nearby', 'So close to Penkey! Quick visit = points! 💫', '🚶', 3, true),
('referral', 'nearby', 'You''re near Penkey! Bring a friend! 💕', '📍', 2, true);

-- In area messages (200-500m from Penkey)
INSERT INTO public.message_templates (category, context, message, emoji, weight, active) VALUES

('coffee', 'in_area', 'You''re in Lymington! Pop by New Street! ☕', '🗺️', 3, true),
('coffee', 'in_area', 'In the area? Come visit us! 5 min walk! 💫', '📍', 3, true),
('coffee', 'in_area', 'Nearby! Perfect time for a coffee break! ✨', '🗺️', 2, true),

('points', 'in_area', 'In Lymington? Quick visit for points! 🌟', '🗺️', 2, true);

-- At Penkey messages (user is at the location)
INSERT INTO public.message_templates (category, context, message, emoji, weight, active) VALUES

('coffee', 'at_penkey', 'YOU''RE HERE! Show us your QR code! 💕', '🎊', 5, true),
('coffee', 'at_penkey', 'Welcome! Let''s get you that stamp! 🌟', '✨', 5, true),
('coffee', 'at_penkey', 'Lovely to see you! Don''t forget your stamp! 💫', '☕', 5, true),
('coffee', 'at_penkey', 'Hello! Grab your coffee and we''ll scan! ✨', '👋', 4, true),
('coffee', 'at_penkey', 'You made it! Let''s get you sorted! 🎉', '🎊', 4, true),

('points', 'at_penkey', 'You''re here! Time to earn those points! 🌟', '🎊', 4, true),
('games', 'at_penkey', 'Perfect timing! Play the game while you''re here! 🎮', '✨', 3, true),
('referral', 'at_penkey', 'Here with friends? They should join too! 💕', '👥', 2, true);

-- Away messages (user is far from Penkey)
INSERT INTO public.message_templates (category, context, message, emoji, weight, active) VALUES

('coffee', 'away', 'Missing Penkey? Come visit us soon! 💕', '☕', 2, true),
('coffee', 'away', 'We miss you! Pop by when you''re in town! ✨', '💫', 2, true),
('points', 'away', 'Points waiting for you at Penkey! 🌟', '⭐', 2, true);

-- Success message
SELECT 'Location-based messages added successfully!' as message,
       COUNT(*) as total_messages
FROM public.message_templates
WHERE context IN ('very_close', 'nearby', 'in_area', 'at_penkey', 'away');
