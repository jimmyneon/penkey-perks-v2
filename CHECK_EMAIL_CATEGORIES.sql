-- Check what categories are allowed for email_templates
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'email_templates'
  AND con.conname = 'check_email_category';

-- Also check existing email templates to see what categories are used
SELECT DISTINCT category 
FROM email_templates 
ORDER BY category;
