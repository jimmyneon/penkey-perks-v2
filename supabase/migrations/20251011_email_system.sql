-- =============================================
-- EMAIL SYSTEM - Database-Driven Email Templates & Queue
-- =============================================
-- This migration creates a complete email system with:
-- 1. Email templates (stored in DB, not code)
-- 2. Email triggers (automated email sending)
-- 3. Email queue (reliable delivery with retry)
-- 4. Email logs (audit trail)
-- 5. Email preferences (user opt-out)
-- =============================================

-- =============================================
-- 1. EMAIL TEMPLATES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  name TEXT NOT NULL UNIQUE, -- e.g., 'welcome_email', 'reward_earned'
  display_name TEXT NOT NULL, -- e.g., 'Welcome Email'
  description TEXT,
  
  -- Email content
  subject TEXT NOT NULL, -- Supports {{variables}}
  html_body TEXT NOT NULL, -- HTML email body with {{variables}}
  text_body TEXT, -- Plain text fallback
  
  -- Template metadata
  variables JSONB DEFAULT '[]', -- Required variables: ["name", "email", "qrCode"]
  category TEXT NOT NULL DEFAULT 'transactional', -- 'transactional', 'marketing', 'notification'
  
  -- Status and versioning
  active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_email_templates_name ON public.email_templates(name);
CREATE INDEX idx_email_templates_active ON public.email_templates(active) WHERE active = true;
CREATE INDEX idx_email_templates_category ON public.email_templates(category);

-- Constraints
ALTER TABLE public.email_templates 
  ADD CONSTRAINT check_email_category 
  CHECK (category IN ('transactional', 'marketing', 'notification'));

COMMENT ON TABLE public.email_templates IS 'Email templates with dynamic variables';

-- =============================================
-- 2. EMAIL TRIGGERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.email_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Trigger identification
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  
  -- Trigger conditions
  event_type TEXT NOT NULL, -- 'insert', 'update', 'delete', 'scheduled'
  table_name TEXT, -- Table to watch (null for scheduled)
  conditions JSONB DEFAULT '{}', -- Conditions to check: {"status": "active", "amount": {"gt": 0}}
  
  -- Timing
  delay_minutes INTEGER DEFAULT 0, -- Delay before sending (0 = immediate)
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_triggers_table ON public.email_triggers(table_name);
CREATE INDEX idx_email_triggers_active ON public.email_triggers(active) WHERE active = true;

-- Constraints
ALTER TABLE public.email_triggers 
  ADD CONSTRAINT check_event_type 
  CHECK (event_type IN ('insert', 'update', 'delete', 'scheduled'));

COMMENT ON TABLE public.email_triggers IS 'Automated email triggers based on database events';

-- =============================================
-- 3. EMAIL QUEUE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template and trigger
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES public.email_triggers(id) ON DELETE SET NULL,
  
  -- Recipient
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Rendered content
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB DEFAULT '{}', -- Variables used for rendering
  
  -- Queue status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON public.email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_queue_recipient ON public.email_queue(recipient_user_id);

-- Constraints
ALTER TABLE public.email_queue 
  ADD CONSTRAINT check_queue_status 
  CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'));

COMMENT ON TABLE public.email_queue IS 'Email queue for reliable delivery with retry logic';

-- =============================================
-- 4. EMAIL LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  queue_id UUID REFERENCES public.email_queue(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  
  -- Recipient
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Email details
  subject TEXT NOT NULL,
  
  -- Delivery status
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  
  -- External tracking
  resend_id TEXT, -- Resend API email ID
  metadata JSONB DEFAULT '{}', -- Additional tracking data
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_user_id);
CREATE INDEX idx_email_logs_template ON public.email_logs(template_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at);

-- Constraints
ALTER TABLE public.email_logs 
  ADD CONSTRAINT check_log_status 
  CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'));

COMMENT ON TABLE public.email_logs IS 'Audit log of all sent emails';

-- =============================================
-- 5. EMAIL PREFERENCES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Preference
  category TEXT NOT NULL, -- 'marketing', 'notification'
  enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, category)
);

-- Indexes
CREATE INDEX idx_email_preferences_user ON public.email_preferences(user_id);

-- Constraints
ALTER TABLE public.email_preferences 
  ADD CONSTRAINT check_preference_category 
  CHECK (category IN ('marketing', 'notification'));

COMMENT ON TABLE public.email_preferences IS 'User email notification preferences (transactional emails always sent)';

-- =============================================
-- 6. ENABLE RLS
-- =============================================

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Email Templates: Staff can manage, everyone can view active
CREATE POLICY "Staff can manage email templates"
  ON public.email_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active email templates"
  ON public.email_templates FOR SELECT
  USING (active = true);

-- Email Triggers: Staff only
CREATE POLICY "Staff can manage email triggers"
  ON public.email_triggers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
    )
  );

-- Email Queue: Users can view their own, staff can view all
CREATE POLICY "Users can view own queued emails"
  ON public.email_queue FOR SELECT
  USING (recipient_user_id = auth.uid());

CREATE POLICY "Staff can view all queued emails"
  ON public.email_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
    )
  );

-- Email Logs: Users can view their own, staff can view all
CREATE POLICY "Users can view own email logs"
  ON public.email_logs FOR SELECT
  USING (recipient_user_id = auth.uid());

CREATE POLICY "Staff can view all email logs"
  ON public.email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
    )
  );

-- Email Preferences: Users manage their own
CREATE POLICY "Users manage own email preferences"
  ON public.email_preferences FOR ALL
  USING (user_id = auth.uid());

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Function to render template variables
CREATE OR REPLACE FUNCTION public.render_template(
  p_template TEXT,
  p_variables JSONB
)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
  v_key TEXT;
  v_value TEXT;
BEGIN
  v_result := p_template;
  
  -- Replace each variable
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_result := REPLACE(v_result, '{{' || v_key || '}}', COALESCE(v_value, ''));
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.render_template IS 'Renders a template by replacing {{variables}} with values';

-- =============================================
-- 8. FUNCTION: Queue Email from Template
-- =============================================

CREATE OR REPLACE FUNCTION public.queue_email_from_template(
  p_template_name TEXT,
  p_recipient_email TEXT,
  p_recipient_user_id UUID,
  p_variables JSONB,
  p_delay_minutes INTEGER DEFAULT 0,
  p_trigger_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_template RECORD;
  v_queue_id UUID;
  v_subject TEXT;
  v_html_body TEXT;
  v_text_body TEXT;
  v_scheduled_for TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM public.email_templates
  WHERE name = p_template_name
    AND active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template % not found or inactive', p_template_name;
  END IF;
  
  -- Render template
  v_subject := public.render_template(v_template.subject, p_variables);
  v_html_body := public.render_template(v_template.html_body, p_variables);
  v_text_body := public.render_template(COALESCE(v_template.text_body, ''), p_variables);
  
  -- Calculate scheduled time
  v_scheduled_for := NOW() + (p_delay_minutes || ' minutes')::INTERVAL;
  
  -- Queue email
  INSERT INTO public.email_queue (
    template_id,
    trigger_id,
    recipient_email,
    recipient_user_id,
    subject,
    html_body,
    text_body,
    variables,
    scheduled_for
  ) VALUES (
    v_template.id,
    p_trigger_id,
    p_recipient_email,
    p_recipient_user_id,
    v_subject,
    v_html_body,
    v_text_body,
    p_variables,
    v_scheduled_for
  )
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.queue_email_from_template IS 'Queues an email from a template with variables';

-- =============================================
-- 9. FUNCTION: Check User Email Preferences
-- =============================================

CREATE OR REPLACE FUNCTION public.can_send_email(
  p_user_id UUID,
  p_category TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  -- Transactional emails always sent
  IF p_category = 'transactional' THEN
    RETURN TRUE;
  END IF;
  
  -- Check user preferences
  SELECT enabled INTO v_enabled
  FROM public.email_preferences
  WHERE user_id = p_user_id
    AND category = p_category;
  
  -- Default to enabled if no preference set
  RETURN COALESCE(v_enabled, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_send_email IS 'Checks if user has opted in to receive emails of a given category';

-- =============================================
-- 10. FUNCTION: Mark Email as Sent
-- =============================================

CREATE OR REPLACE FUNCTION public.mark_email_sent(
  p_queue_id UUID,
  p_resend_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_queue RECORD;
BEGIN
  -- Get queue record
  SELECT * INTO v_queue
  FROM public.email_queue
  WHERE id = p_queue_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue record % not found', p_queue_id;
  END IF;
  
  IF p_success THEN
    -- Mark as sent
    UPDATE public.email_queue
    SET status = 'sent',
        sent_at = NOW()
    WHERE id = p_queue_id;
    
    -- Log success
    INSERT INTO public.email_logs (
      queue_id,
      template_id,
      recipient_email,
      recipient_user_id,
      subject,
      status,
      resend_id,
      sent_at
    ) VALUES (
      p_queue_id,
      v_queue.template_id,
      v_queue.recipient_email,
      v_queue.recipient_user_id,
      v_queue.subject,
      'sent',
      p_resend_id,
      NOW()
    );
  ELSE
    -- Mark as failed or retry
    IF v_queue.retry_count >= v_queue.max_retries THEN
      UPDATE public.email_queue
      SET status = 'failed',
          error_message = p_error_message
      WHERE id = p_queue_id;
      
      -- Log failure
      INSERT INTO public.email_logs (
        queue_id,
        template_id,
        recipient_email,
        recipient_user_id,
        subject,
        status,
        sent_at
      ) VALUES (
        p_queue_id,
        v_queue.template_id,
        v_queue.recipient_email,
        v_queue.recipient_user_id,
        v_queue.subject,
        'failed',
        NOW()
      );
    ELSE
      -- Retry later
      UPDATE public.email_queue
      SET retry_count = retry_count + 1,
          scheduled_for = NOW() + INTERVAL '5 minutes',
          error_message = p_error_message
      WHERE id = p_queue_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.mark_email_sent IS 'Marks an email as sent or failed, with retry logic';

-- =============================================
-- 11. GRANT PERMISSIONS
-- =============================================

GRANT SELECT ON public.email_templates TO authenticated;
GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_preferences TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
GRANT ALL ON public.email_triggers TO service_role;
GRANT ALL ON public.email_queue TO service_role;
GRANT ALL ON public.email_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.render_template TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_email_from_template TO service_role;
GRANT EXECUTE ON FUNCTION public.can_send_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_email_sent TO service_role;

-- =============================================
-- 12. UPDATE TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_templates_updated_at();

CREATE TRIGGER update_email_triggers_updated_at
  BEFORE UPDATE ON public.email_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_templates_updated_at();

CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_templates_updated_at();

-- =============================================
-- SUCCESS
-- =============================================

SELECT 'Email system tables and functions created successfully!' as message;
