-- Check transactions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any triggers on transactions table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'transactions';

-- Try a simple insert to see what happens
-- INSERT INTO transactions (user_id, action, details)
-- VALUES ('a409b642-e4e9-4159-a47c-c8a14b9bc903', 'test', '{}');
