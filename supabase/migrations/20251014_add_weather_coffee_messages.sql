-- =============================================
-- ADD WEATHER-SPECIFIC COFFEE CARD MESSAGES
-- Date: 2025-10-14
-- =============================================
-- Special messages for coffee card based on weather
-- =============================================

-- Hot weather coffee messages
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES
('coffee', 'hot_weather', 'Beat the heat! Try our iced coffee - perfect for today! 🧊', '☕', 5, true, '{"temperature": {"min": 25}}'),
('coffee', 'hot_weather', 'Too hot? Cool down with our cold brew! Refreshing! 💫', '🧊', 5, true, '{"temperature": {"min": 25}}'),
('coffee', 'hot_weather', 'Heatwave special! Iced drinks get bonus points today! ✨', '🌡️', 4, true, '{"temperature": {"min": 28}}'),
('coffee', 'hot_weather', 'Stay cool! Our iced coffee is calling your name! 🌟', '🧊', 4, true, '{"temperature": {"min": 25}}');

-- Cold weather coffee messages  
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES
('coffee', 'cold_weather', 'Freezing out! Warm up with our extra hot coffee! ☕', '❄️', 5, true, '{"temperature": {"max": 5}}'),
('coffee', 'cold_weather', 'Cold hands? Hot coffee fixes that! Come in! 💕', '🧊', 5, true, '{"temperature": {"max": 5}}'),
('coffee', 'cold_weather', 'Brrr! Perfect weather for our hot chocolate! ✨', '🥶', 4, true, '{"temperature": {"max": 3}}'),
('coffee', 'cold_weather', 'Warm up special! Hot drinks + bonus points! 🌟', '☕', 4, true, '{"temperature": {"max": 5}}');

-- Rainy weather coffee messages (more specific)
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES
('coffee', 'rainy_bonus', 'Rainy day hero! +5 bonus points for coming in! 🌧️', '☕', 5, true, '{"weather": "rain"}'),
('coffee', 'rainy_bonus', 'You braved the rain! Enjoy bonus points! ☔', '💕', 5, true, '{"weather": "rain"}'),
('coffee', 'rainy_bonus', 'Rainy day warrior! Extra points for you! 🌟', '🌧️', 4, true, '{"weather": "rain"}');

-- Snowy weather coffee messages
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES
('coffee', 'snowy', 'Snow day! +10 bonus points for braving the snow! ❄️', '☕', 5, true, '{"weather": "snow"}'),
('coffee', 'snowy', 'You''re a snow hero! Bonus points + hot drinks! ⛄', '💕', 5, true, '{"weather": "snow"}'),
('coffee', 'snowy', 'Snowy day special! Triple the warmth, triple the points! 🌟', '❄️', 4, true, '{"weather": "snow"}');

-- Perfect weather coffee messages
INSERT INTO public.message_templates (category, context, message, emoji, weight, active, conditions) VALUES
('coffee', 'perfect_weather', 'Perfect day! Enjoy our outdoor seating! ☀️', '☕', 4, true, '{"weather": "clear", "temperature": {"min": 15, "max": 22}}'),
('coffee', 'perfect_weather', 'Beautiful weather! Coffee tastes better outside! 💫', '🌤️', 4, true, '{"weather": "clear", "temperature": {"min": 15, "max": 22}}'),
('coffee', 'perfect_weather', 'Gorgeous day! Grab a coffee and soak it in! ✨', '☀️', 3, true, '{"weather": "clear", "temperature": {"min": 15, "max": 22}}');

-- Success message
SELECT 'Weather-specific coffee messages added successfully!' as message,
       COUNT(*) as total_messages
FROM public.message_templates
WHERE context LIKE '%weather%' OR context LIKE '%hot%' OR context LIKE '%cold%' OR context LIKE '%rainy%' OR context LIKE '%snowy%';
