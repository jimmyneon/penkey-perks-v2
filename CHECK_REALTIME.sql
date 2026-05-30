-- Check if real-time is enabled for bean_balances table
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Check if the RLS policy for real-time exists
SELECT * FROM pg_policies WHERE tablename = 'bean_balances';

-- Check bean_balances table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bean_balances' ORDER BY ordinal_position;
