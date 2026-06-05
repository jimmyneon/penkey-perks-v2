  -- =============================================
  -- RAINY DAY EMAIL TEMPLATE
  -- Email template for rainy day voucher notifications
  -- =============================================

  -- Check if email_templates table exists, if not create it
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'email_templates'
    ) THEN
      CREATE TABLE public.email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        html_body TEXT NOT NULL,
        text_body TEXT,
        category TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
      
      RAISE NOTICE 'Created email_templates table';
    END IF;
  END $$;

  -- Check if push_notification_templates table exists, if not create it
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'push_notification_templates'
    ) THEN
      CREATE TABLE public.push_notification_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        icon TEXT,
        url TEXT,
        trigger_event TEXT,
        priority INTEGER DEFAULT 10,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE public.push_notification_templates ENABLE ROW LEVEL SECURITY;
      
      RAISE NOTICE 'Created push_notification_templates table';
    END IF;
  END $$;

  -- Insert rainy day email template
  INSERT INTO email_templates (
    name,
    display_name,
    subject,
    html_body,
    text_body,
    category,
    active
  ) VALUES (
    'rainy_day_voucher',
    'Rainy Day Voucher',
    '🌧️ Rainy Day Rescue - 20% Off Today!',
    '<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rainy Day Rescue</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f1ea;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #2B3E52 0%, #24364A 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌧️ Rainy Day Rescue!</h1>
        <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">It''s miserable out there - warm up with us!</p>
      </div>

      <!-- Content -->
      <div style="padding: 30px 20px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hi there,
        </p>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          It''s raining in Lymington! ☔ We know it''s tough to brave the weather, so we want to make your visit worth it.
        </p>

        <!-- Offer Card -->
        <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border: 2px solid #2196f3;">
          <div style="font-size: 48px; margin-bottom: 10px;">🌧️</div>
          <h2 style="color: #1565c0; margin: 0 0 10px 0; font-size: 24px;">20% OFF Any Hot Drink</h2>
          <p style="color: #424242; margin: 0 0 15px 0; font-size: 16px;">
            Warm up with coffee, tea, or hot chocolate at 20% off today!
          </p>
          <div style="background-color: #1565c0; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px;">
            Claim Your Voucher
          </div>
        </div>

        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Simply open the Penkey Perks app and claim your rainy day voucher on the dashboard. It''s valid for 24 hours only!
        </p>

        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Stay dry and cozy! ☕
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rewards.penkey.co.uk/dashboard" style="background-color: #E07A3A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Open App to Claim
          </a>
        </div>

        <!-- Terms -->
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 25px;">
          <p style="color: #666; margin: 0; font-size: 12px; line-height: 1.5;">
            <strong>Terms:</strong> Valid for 24 hours from issue. One voucher per rainy day. Cannot be combined with other offers. 
            Valid on hot drinks only (coffee, tea, hot chocolate). Show voucher QR code at counter to redeem.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #2B3E52; padding: 20px; text-align: center;">
        <p style="color: #e0e0e0; margin: 0; font-size: 14px;">
          The Penkey Team
        </p>
        <p style="color: #a0a0a0; margin: 10px 0 0 0; font-size: 12px;">
          <a href="https://rewards.penkey.co.uk" style="color: #a0a0a0; text-decoration: none;">rewards.penkey.co.uk</a>
        </p>
      </div>
    </div>
  </body>
  </html>',
    'Rainy Day Rescue - 20% Off Today!

  It''s raining in Lymington! We know it''s tough to brave the weather, so we want to make your visit worth it.

  Get 20% off any hot drink (coffee, tea, or hot chocolate) today!

  Open the Penkey Perks app to claim your voucher on the dashboard. Valid for 24 hours only.

  Stay dry and cozy! ☕

  Terms: Valid for 24 hours from issue. One voucher per rainy day. Cannot be combined with other offers. Valid on hot drinks only.

  - The Penkey Team',
    'promotional',
    true
  ) ON CONFLICT (name) DO UPDATE SET
    subject = EXCLUDED.subject,
    html_body = EXCLUDED.html_body,
    text_body = EXCLUDED.text_body,
    active = true;

  -- Also add to push notification templates
  INSERT INTO push_notification_templates (
    name,
    title,
    message,
    icon,
    url,
    trigger_event,
    priority,
    active
  ) VALUES (
    'rainy_day_voucher',
    '🌧️ Rainy Day Rescue!',
    'It''s raining! Get 20% off any hot drink today. Check your dashboard to claim your voucher!',
    '🌧️',
    '/dashboard',
    'weather_rain',
    5,
    true
  ) ON CONFLICT (name) DO UPDATE SET
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    active = true;

  SELECT 'Rainy day email and push templates created successfully!' as message;
