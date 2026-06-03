-- Check if any vouchers exist at all
SELECT COUNT(*) as total_vouchers FROM public.user_vouchers;

-- Check active vouchers only
SELECT COUNT(*) as active_vouchers FROM public.user_vouchers WHERE status = 'active';

-- Show all vouchers with their details
SELECT 
  uv.id,
  uv.user_id,
  uv.voucher_template_id,
  uv.status,
  uv.expires_at,
  uv.created_at,
  vt.name as voucher_name,
  vt.description,
  vt.category,
  vt.bean_threshold
FROM public.user_vouchers uv
LEFT JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
ORDER BY uv.created_at DESC
LIMIT 20;
