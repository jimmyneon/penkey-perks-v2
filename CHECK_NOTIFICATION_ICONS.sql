-- Check notification icons for duplicates
SELECT 
  id,
  title,
  icon,
  LENGTH(icon) as icon_length,
  priority,
  type
FROM notifications
WHERE active = true
ORDER BY priority DESC
LIMIT 20;

-- Find notifications with duplicate emoji icons
SELECT 
  icon,
  LENGTH(icon) as length,
  COUNT(*) as count
FROM notifications
WHERE active = true
GROUP BY icon
HAVING LENGTH(icon) > 2
ORDER BY length DESC;

-- Fix duplicate icons (run this if you find duplicates)
-- UPDATE notifications
-- SET icon = SUBSTRING(icon, 1, 2)
-- WHERE LENGTH(icon) > 2;
