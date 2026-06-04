-- Run this directly on your database to update voucher image URLs
-- This will populate image_url with the 500px simplified icons

UPDATE public.voucher_templates 
SET image_url = '/vouchers/syrup.png'
WHERE name = 'Free Syrup';

UPDATE public.voucher_templates 
SET image_url = '/vouchers/buscuit.png'
WHERE name = 'Free Biscuit';

UPDATE public.voucher_templates 
SET image_url = '/vouchers/coffeetea.png'
WHERE name = 'Free Coffee or Tea';

UPDATE public.voucher_templates 
SET image_url = '/vouchers/milkshake.png'
WHERE name = 'Milkshake Voucher';

UPDATE public.voucher_templates 
SET image_url = '/vouchers/hotbap.png'
WHERE name = 'Premium Hot Bun';

-- Also populate icon_url with the same values for now
UPDATE public.voucher_templates 
SET icon_url = '/vouchers/syrup.png'
WHERE name = 'Free Syrup';

UPDATE public.voucher_templates 
SET icon_url = '/vouchers/buscuit.png'
WHERE name = 'Free Biscuit';

UPDATE public.voucher_templates 
SET icon_url = '/vouchers/coffeetea.png'
WHERE name = 'Free Coffee or Tea';

UPDATE public.voucher_templates 
SET icon_url = '/vouchers/milkshake.png'
WHERE name = 'Milkshake Voucher';

UPDATE public.voucher_templates 
SET icon_url = '/vouchers/hotbap.png'
WHERE name = 'Premium Hot Bun';
