-- Update the "We're Closed" notification to show after 5 PM (17:00)
-- Currently it shows after 9 PM (21:00)

UPDATE notifications
SET conditions = jsonb_set(
  conditions,
  '{timeOfDay}',
  '"night"'::jsonb
)
WHERE title LIKE '%Closed%'
  OR title LIKE '%closed%';

-- Verify the update
SELECT 
  id,
  title,
  conditions,
  priority,
  active
FROM notifications
WHERE title LIKE '%Closed%'
  OR title LIKE '%closed%';

-- Note: The timeOfDay calculation in the API needs to be updated too
-- Currently:
-- - morning: 5 AM - 12 PM
-- - afternoon: 12 PM - 5 PM
-- - evening: 5 PM - 9 PM
-- - night: 9 PM - 5 AM (CLOSED)
--
-- Should be:
-- - morning: 5 AM - 12 PM
-- - afternoon: 12 PM - 5 PM
-- - night: 5 PM - 5 AM (CLOSED)
