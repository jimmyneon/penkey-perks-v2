-- Check all vouchers in the database
SELECT 
  uv.id,
  uv.user_id,
  p.name as user_name,
  p.email,
  uv.voucher_template_id,
  vt.name as voucher_name,
  vt.description,
  vt.category,
  vt.bean_threshold,
  uv.status,
  uv.qr_code,
  uv.expires_at,
  uv.created_at,
  uv.metadata
FROM public.user_vouchers uv
JOIN public.profiles p ON uv.user_id = p.id
JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
ORDER BY uv.created_at DESC;

-- Check vouchers for a specific user (replace with actual user_id)
-- SELECT * FROM public.user_vouchers WHERE user_id = 'YOUR_USER_ID_HERE';

-- Check active vouchers only
SELECT 
  uv.id,
  uv.user_id,
  p.name as user_name,
  p.email,
  vt.name as voucher_name,
  vt.bean_threshold,
  uv.status,
  uv.expires_at,
  uv.created_at
FROM public.user_vouchers uv
JOIN public.profiles p ON uv.user_id = p.id
JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
WHERE uv.status = 'active'
ORDER BY uv.created_at DESC;
