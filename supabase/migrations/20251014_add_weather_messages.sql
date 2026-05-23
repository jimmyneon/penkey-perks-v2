-- =============================================
-- ADD WEATHER-BASED MESSAGES
-- Date: 2025-10-14
-- =============================================
-- Adds contextual messages based on weather conditions
-- =============================================

-- Coffee messages for different weather conditions
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES

-- Rainy weather messages
('coffee', 'rainy', 'Rainy day? Perfect for a cozy coffee at Penkey! Pop in love! ☕', '🌧️', 3, true, '{"weather": "rain"}'),
('coffee', 'rainy', 'Wet outside? Warm up with Coffee Mongers magic! Come in! 💕', '☔', 3, true, '{"weather": "rain"}'),
('coffee', 'rainy', 'Rainy days call for hot coffee! We''re ready for you! ✨', '🌧️', 3, true, '{"weather": "rain"}'),
('coffee', 'rainy', 'Don''t let the rain stop you! Cozy coffee waiting! 💫', '☔', 2, true, '{"weather": "rain"}'),

-- Cold weather messages
('coffee', 'cold', 'Brrr! Warm up with our fresh Coffee Mongers brew! ☕', '❄️', 3, true, '{"temperature": {"max": 10}}'),
('coffee', 'cold', 'Cold day calls for hot coffee! Come in and warm up! 💕', '🧊', 3, true, '{"temperature": {"max": 10}}'),
('coffee', 'cold', 'Freezing out there! Let us warm you up with coffee! ✨', '❄️', 3, true, '{"temperature": {"max": 10}}'),
('coffee', 'cold', 'Cold hands? Hot coffee fixes that! Pop in! 🌟', '🧊', 2, true, '{"temperature": {"max": 10}}'),

-- Hot weather messages
('coffee', 'hot', 'Hot day? Try our iced coffee! Refreshing! 🧊', '🌡️', 3, true, '{"temperature": {"min": 25}}'),
('coffee', 'hot', 'Beat the heat with iced coffee! Perfect for today! ☕', '☀️', 3, true, '{"temperature": {"min": 25}}'),
('coffee', 'hot', 'Too hot? Cool down with our iced drinks! 💕', '🌡️', 2, true, '{"temperature": {"min": 25}}'),

-- Sunny weather messages
('coffee', 'sunny', 'Gorgeous day! Grab a coffee and enjoy the sunshine! ☕', '☀️', 3, true, '{"weather": "clear"}'),
('coffee', 'sunny', 'Beautiful weather! Perfect for coffee on New Street! 💫', '🌤️', 3, true, '{"weather": "clear"}'),
('coffee', 'sunny', 'Sunny vibes! Come get your coffee and soak it in! ✨', '☀️', 3, true, '{"weather": "clear"}'),
('coffee', 'sunny', 'What a day! Coffee tastes better in the sunshine! 🌟', '🌤️', 2, true, '{"weather": "clear"}'),

-- Cloudy/overcast messages
('coffee', 'cloudy', 'Grey day? Brighten it with Coffee Mongers! ☕', '☁️', 2, true, '{"weather": "clouds"}'),
('coffee', 'cloudy', 'Cloudy outside? Cozy coffee inside! Come in! 💕', '☁️', 2, true, '{"weather": "clouds"}');

-- Points messages for weather
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES
('points', 'rainy', 'Rainy day points! Pop in and earn while staying dry! 💕', '🌧️', 2, true, '{"weather": "rain"}'),
('points', 'sunny', 'Sunny day points! Beautiful weather for earning! ✨', '☀️', 2, true, '{"weather": "clear"}');

-- Game messages for weather
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES
('games', 'rainy', 'Rainy day game time! Play and win! Perfect indoor activity! 🎮', '☔', 2, true, '{"weather": "rain"}'),
('games', 'cold', 'Cold outside? Warm up with a game! You might win! 🎲', '❄️', 2, true, '{"temperature": {"max": 10}}');

-- Referral messages for weather
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES
('referral', 'rainy', 'Rainy day? Share Penkey warmth with your friends! 💕', '🌧️', 2, true, '{"weather": "rain"}'),
('referral', 'sunny', 'Beautiful day! Share the sunshine and Penkey love! ☀️', '☀️', 2, true, '{"weather": "clear"}');

-- Success message
SELECT 'Weather-based messages added successfully!' as message,
       COUNT(*) as total_messages
FROM public.message_templates
WHERE conditions::text LIKE '%weather%' OR conditions::text LIKE '%temperature%';
