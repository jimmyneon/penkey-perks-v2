-- Populate icon_url with the 500px simplified voucher icons
UPDATE public.voucher_templates 
SET icon_url = '/vouchers/syrup-icon.png'
WHERE name = 'Free Syrup';

UPDATE public.voucher_templates 
SET icon_url = '/vouchers/buscuit-icon.png'
WHERE name = 'Free Biscuit';

UPDATE public.voucher_templates 
SET icon_url = '/vouchers/coffeetea-icon.png'
WHERE name = 'Free Coffee or Tea';

UPDATE public.voucher_templates 
SET icon_url = '/vouchers/milkshake-icon.png'
WHERE name = 'Milkshake Voucher';

UPDATE public.voucher_templates 
SET icon_url = '/vouchers/hotbap-icon.png'
WHERE name = 'Premium Hot Bun';
