-- =============================================
-- UPDATE EMAIL CATEGORIES CONSTRAINT
-- =============================================
-- Adds new email categories to support all template types
-- =============================================

-- Drop old constraint
ALTER TABLE public.email_templates 
  DROP CONSTRAINT IF EXISTS check_email_category;

-- Add new constraint with all categories
ALTER TABLE public.email_templates 
  ADD CONSTRAINT check_email_category 
  CHECK (category IN (
    'transactional',    -- Required emails (receipts, confirmations)
    'marketing',        -- Promotional emails (specials, new rewards)
    'notification',     -- System notifications
    'achievement',      -- Badges, milestones, wins
    'onboarding',       -- Welcome, first stamp
    'engagement',       -- Halfway, game reminders
    'digest',           -- Weekly/monthly summaries
    'reminder',         -- Expiring rewards, games
    'reengagement',     -- Win-back campaigns
    'special',          -- Anniversaries, birthdays
    'announcement'      -- New features, rewards
  ));

-- Success message
SELECT '✅ Email categories updated!' as message;
SELECT 'Now supports 11 email categories' as detail;
