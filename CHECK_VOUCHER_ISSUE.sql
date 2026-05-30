-- Check if vouchers exist and their status
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
LIMIT 10;

-- Check if the join works correctly (same as the dashboard query)
SELECT 
  uv.*,
  vt.name as template_name,
  vt.description as template_description,
  vt.category as template_category,
  vt.bean_threshold as template_bean_threshold
FROM public.user_vouchers uv
LEFT JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
WHERE uv.status = 'active'
ORDER BY uv.created_at DESC;

-- Check specific user's vouchers (replace with actual user_id from dashboard logs)
-- SELECT * FROM public.user_vouchers WHERE user_id = 'YOUR_USER_ID_HERE' AND status = 'active';
