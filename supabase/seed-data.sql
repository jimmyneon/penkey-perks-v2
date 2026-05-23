-- Seed data for Penkey Perks V2
-- This creates sample data to demonstrate the app

-- Insert sample voucher templates
INSERT INTO voucher_templates (name, description, category, bean_threshold, expiry_days) VALUES
('Free Syrup', 'Add any syrup to your drink for free', 'enhancer', 5, 30),
('Mini Brownie', 'Get a free mini brownie with any drink', 'enhancer', 5, 30),
('Bonus Beans', 'Get 2 bonus beans on your next visit', 'enhancer', 5, 30),
('Free Standard Coffee', 'Any standard coffee: latte, cappuccino, flat white, americano, tea', 'coffee', 8, 30),
('Free Iced Coffee', 'Any iced coffee: iced latte, iced americano', 'coffee', 8, 30),
('Golden Duck Reward', 'Sandwich, toastie, or lunch combo', 'lunch', 20, 30),
('Mystery Reward', 'Surprise reward from the chef', 'special', 20, 30);

-- Insert sample badges
INSERT INTO badges (name, description, tier, requirement_type, requirement_value, icon_url) VALUES
('Founding Duck', 'One of our first 100 members', 'legendary', 'specific_action', 1, null),
('Coffee Lover', 'Earned 100 lifetime beans', 'bronze', 'lifetime_beans', 100, null),
('Regular', 'Visited 10 times', 'bronze', 'visit_count', 10, null),
('Local Legend', 'Earned 500 lifetime beans', 'silver', 'lifetime_beans', 500, null),
('Lunch Club', 'Visited 5 times between 12-2pm', 'silver', 'visit_count', 5, null),
('Brownie Addict', 'Redeemed 5 brownie vouchers', 'gold', 'specific_action', 5, null),
('Rainy Day Regular', 'Visited on 10 rainy days', 'gold', 'visit_count', 10, null),
('100 Bean Club', 'Earned 1000 lifetime beans', 'platinum', 'lifetime_beans', 1000, null);

-- Insert sample campaigns
INSERT INTO campaigns (name, description, type, bean_multiplier, start_at, end_at, location_required, status) VALUES
('Rainy Day Double Beans', 'Rain outside? Double beans on all hot drinks!', 'special', 2, NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', false, 'active'),
('Lucky Duck Wheel', 'Spin the wheel for exclusive rewards! In-store only.', 'wheel', 1, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', true, 'active'),
('Brownie Friday', 'Get bonus beans on brownie purchases every Friday', 'seasonal', 1.5, NOW() - INTERVAL '3 days', NOW() + INTERVAL '30 days', false, 'active'),
('Quiet Afternoon Bonus', 'Visit between 2-4pm for bonus beans', 'promotion', 1.5, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', false, 'active');

-- Insert sample wheel prizes
INSERT INTO wheel_prizes (name, description, type, rarity, weight) VALUES
('Free Syrup', 'Add any syrup to your drink', 'enhancer', 'common', 30),
('Bonus Beans', 'Get 2 bonus beans', 'beans', 'common', 25),
('Mini Brownie', 'Free mini brownie', 'food', 'common', 20),
('Double Beans', 'Double beans on next visit', 'beans', 'rare', 10),
('£1 Lunch Reward', '£1 off any lunch item', 'discount', 'rare', 8),
('Secret Menu Unlock', 'Access to secret menu items', 'special', 'epic', 5),
('Free Drink Voucher', 'Free any standard drink', 'voucher', 'epic', 2),
('Golden Duck', 'Exclusive golden duck collectible', 'collectible', 'legendary', 0.5);

-- Note: User profiles, bean balances, and user vouchers will be created
-- when users sign up through the app authentication system
