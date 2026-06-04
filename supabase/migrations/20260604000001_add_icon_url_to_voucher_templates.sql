-- Add icon_url column to voucher_templates for simplified small-display icons
ALTER TABLE public.voucher_templates ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Add comment explaining the difference between image_url and icon_url
COMMENT ON COLUMN public.voucher_templates.image_url IS 'Full detailed artwork for large previews and detail screens';
COMMENT ON COLUMN public.voucher_templates.icon_url IS 'Simplified icon (512x512) for small circular displays (64-96px) - bold shapes, minimal text, thick outlines';
