-- Update voucher templates to new reward structure
-- This replaces all existing templates with the new standard ones

-- Delete all existing voucher templates
DELETE FROM public.voucher_templates;

-- Insert new standard voucher templates
INSERT INTO public.voucher_templates (name, description, category, bean_threshold, expiry_days) VALUES
('Free Syrup', 'Add any vanilla or flavoured syrup to your coffee or tea for free', 'enhancer', 2, 30),
('Free Biscuit', 'Get a free biscuit with any drink', 'enhancer', 5, 30),
('Free Coffee or Tea', 'Any standard coffee or tea: latte, cappuccino, flat white, americano, tea', 'coffee', 8, 30),
('Milkshake Voucher', 'Free milkshake of your choice', 'major', 15, 30),
('Premium Hot Bun', 'Free premium hot bun: sausage roll, pasty, or hot sandwich', 'major', 25, 30);
