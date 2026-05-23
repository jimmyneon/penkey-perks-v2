-- Check rewards table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rewards'
ORDER BY ordinal_position;

-- Show sample rewards
SELECT * FROM rewards LIMIT 3;
