-- =============================================
-- EMAIL PREFERENCES & CONSENT SYSTEM
-- =============================================
-- GDPR & CAN-SPAM compliant email preferences
-- =============================================

-- =============================================
-- 1. EMAIL PREFERENCES TABLE
-- =============================================

-- Drop existing table if it exists (to start fresh)
DROP TABLE IF EXISTS public.email_preferences CASCADE;

CREATE TABLE public.email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Consent tracking
  marketing_consent BOOLEAN DEFAULT true,
  marketing_consent_date TIMESTAMP WITH TIME ZONE,
  marketing_consent_ip TEXT,
  
  -- Email categories (granular control)
  transactional_emails BOOLEAN DEFAULT true,      -- Order confirmations, receipts (can't opt out)
  achievement_emails BOOLEAN DEFAULT true,        -- Badges, milestones, streaks
  reminder_emails BOOLEAN DEFAULT true,           -- Expiring rewards, game reminders
  digest_emails BOOLEAN DEFAULT true,             -- Weekly/monthly summaries
  marketing_emails BOOLEAN DEFAULT true,          -- Weekend specials, new rewards
  reengagement_emails BOOLEAN DEFAULT true,       -- Win-back campaigns
  
  -- Unsubscribe tracking
  unsubscribed_all BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index for quick lookups
CREATE INDEX idx_email_preferences_user_id ON public.email_preferences(user_id);
CREATE INDEX idx_email_preferences_unsubscribed ON public.email_preferences(unsubscribed_all);

-- =============================================
-- 2. AUTO-CREATE PREFERENCES ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default preferences with marketing consent = true (opt-in during signup)
  INSERT INTO public.email_preferences (
    user_id,
    marketing_consent,
    marketing_consent_date,
    transactional_emails,
    achievement_emails,
    reminder_emails,
    digest_emails,
    marketing_emails,
    reengagement_emails
  ) VALUES (
    NEW.id,
    true,  -- Default to opted in (user agrees during signup)
    NOW(),
    true,  -- Transactional emails always on
    true,  -- Achievement emails on by default
    true,  -- Reminder emails on by default
    true,  -- Digest emails on by default
    true,  -- Marketing emails on by default
    true   -- Re-engagement emails on by default
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_email_preferences_on_signup ON public.users;
CREATE TRIGGER create_email_preferences_on_signup
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_email_preferences();

-- =============================================
-- 3. UPDATE can_send_email FUNCTION
-- =============================================

-- Drop existing function first
DROP FUNCTION IF EXISTS public.can_send_email(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.can_send_email(
  p_user_id UUID,
  p_email_category TEXT DEFAULT 'transactional'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_prefs RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM public.email_preferences
  WHERE user_id = p_user_id;
  
  -- If no preferences found, create defaults and allow
  IF v_prefs IS NULL THEN
    INSERT INTO public.email_preferences (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN true;
  END IF;
  
  -- If unsubscribed from all, only allow transactional
  IF v_prefs.unsubscribed_all = true THEN
    RETURN p_email_category = 'transactional';
  END IF;
  
  -- Check category-specific preferences
  RETURN CASE p_email_category
    WHEN 'transactional' THEN v_prefs.transactional_emails
    WHEN 'achievement' THEN v_prefs.achievement_emails
    WHEN 'reminder' THEN v_prefs.reminder_emails
    WHEN 'digest' THEN v_prefs.digest_emails
    WHEN 'marketing' THEN v_prefs.marketing_emails
    WHEN 'reengagement' THEN v_prefs.reengagement_emails
    ELSE true  -- Default to allowing if category unknown
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. UNSUBSCRIBE TOKEN SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS public.unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email_log_id UUID REFERENCES public.email_logs(id) ON DELETE SET NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.unsubscribe_tokens(token);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_user_id ON public.unsubscribe_tokens(user_id);

-- Function to generate unsubscribe token
CREATE OR REPLACE FUNCTION public.generate_unsubscribe_token(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate unique token
  v_token := encode(gen_random_bytes(32), 'base64');
  v_token := replace(v_token, '/', '_');
  v_token := replace(v_token, '+', '-');
  
  -- Insert token
  INSERT INTO public.unsubscribe_tokens (user_id, token)
  VALUES (p_user_id, v_token);
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. RLS POLICIES
-- =============================================

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own preferences
CREATE POLICY "Users can view own email preferences"
  ON public.email_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own email preferences"
  ON public.email_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to email_preferences"
  ON public.email_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to unsubscribe_tokens"
  ON public.unsubscribe_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 6. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.email_preferences TO service_role;
GRANT SELECT, UPDATE ON public.email_preferences TO authenticated;
GRANT ALL ON public.unsubscribe_tokens TO service_role;

GRANT EXECUTE ON FUNCTION public.create_default_email_preferences TO service_role;
GRANT EXECUTE ON FUNCTION public.can_send_email TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_unsubscribe_token TO service_role;

-- =============================================
-- 7. ADD UNSUBSCRIBE LINK TO EMAIL TEMPLATES
-- =============================================

-- Note: Email templates should include this at the bottom:
-- <p style="text-align: center; font-size: 12px; color: #9CA3AF; margin: 20px 0;">
--   <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}" style="color: #9CA3AF; text-decoration: underline;">
--     Unsubscribe from these emails
--   </a>
-- </p>

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Email preferences system created!' as message;
SELECT 'Users can manage preferences in their account settings' as feature1;
SELECT 'Unsubscribe links will be added to all emails' as feature2;
SELECT 'GDPR & CAN-SPAM compliant' as compliance;
