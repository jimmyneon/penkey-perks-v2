-- Add image_url column to voucher_templates
ALTER TABLE public.voucher_templates ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing voucher templates with image URLs (using 500px icon versions)
UPDATE public.voucher_templates 
SET image_url = '/vouchers/syrup-icon.png'
WHERE name = 'Free Syrup';

UPDATE public.voucher_templates 
SET image_url = '/vouchers/buscuit-icon.png'
WHERE name = 'Free Biscuit';

UPDATE public.voucher_templates 
SET image_url = '/vouchers/coffeetea-icon.png'
WHERE name = 'Free Coffee or Tea';

UPDATE public.voucher_templates 
SET image_url = '/vouchers/milkshake-icon.png'
WHERE name = 'Milkshake Voucher';

UPDATE public.voucher_templates 
SET image_url = '/vouchers/hotbap-icon.png'
WHERE name = 'Premium Hot Bun';
