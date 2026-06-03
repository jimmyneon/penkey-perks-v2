-- Add image_url column to voucher_templates
ALTER TABLE public.voucher_templates ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing voucher templates with image URLs
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
