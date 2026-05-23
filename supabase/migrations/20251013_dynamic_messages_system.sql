-- =============================================
-- DYNAMIC MESSAGES SYSTEM
-- Date: 2025-10-13
-- =============================================
-- Replaces hardcoded rotating messages with database-driven system
-- Messages refresh every 2 minutes, bypassing cache
-- =============================================

-- 1. Create message templates table
-- =============================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Categorization
  category TEXT NOT NULL, -- 'coffee', 'points', 'games', 'referrals', 'rewards'
  context TEXT NOT NULL, -- 'default', 'nearby', 'at_penkey', 'full_card', etc.
  
  -- Content
  message TEXT NOT NULL,
  emoji TEXT, -- Optional emoji/icon
  
  -- Conditions (optional - for smart matching)
  conditions JSONB DEFAULT '{}',
  
  -- Settings
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5, -- Lower = higher priority
  weight INTEGER DEFAULT 1, -- For weighted random selection
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_message_templates_category ON message_templates(category);
CREATE INDEX idx_message_templates_active ON message_templates(active) WHERE active = true;
CREATE INDEX idx_message_templates_context ON message_templates(category, context);

-- RLS Policies
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read active messages
CREATE POLICY "Anyone can view active messages"
  ON message_templates FOR SELECT
  USING (active = true);

-- Staff can manage messages
CREATE POLICY "Staff can manage messages"
  ON message_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- 2. Seed with your personal messages
-- =============================================

-- Coffee Messages (Default)
INSERT INTO message_templates (category, context, message, emoji, weight) VALUES
('coffee', 'default', 'Amanda here - fresh Coffee Mongers brew waiting for you! Pop in love! 💕', '☕', 2),
('coffee', 'default', 'John''s brewing your favorite today - come say hello! ✨', '☕', 2),
('coffee', 'default', 'We''ve just ground fresh coffee - smells amazing! Come get your stamp! 🎉', '☕', 2),
('coffee', 'default', 'Morning love! Fancy a proper coffee? We''re ready for you! 💫', '☕', 2),
('coffee', 'default', 'Coffee time at Penkey! Come grab your stamp - John & Amanda x ☕', '☕', 2),
('coffee', 'default', 'Fresh sausage rolls just out the oven! Perfect with coffee 🥐 - Amanda', '☕', 3),
('coffee', 'default', 'Best coffee in Lymington (Coffee Mongers magic!) - come try it! ☕', '☕', 2);

-- Coffee Messages (Nearby)
INSERT INTO message_templates (category, context, message, emoji, weight) VALUES
('coffee', 'nearby', 'You''re so close to Penkey! Pop in and say hello! - John & Amanda 👋', '☕', 2),
('coffee', 'nearby', 'We can see you from here! Come grab a coffee love! 💕', '☕', 2),
('coffee', 'nearby', 'You''re on New Street! Just a few steps to fresh coffee! 🎉', '☕', 2),
('coffee', 'nearby', 'Hello neighbor! Come in for your stamp - we''re ready! ✨', '☕', 2);

-- Coffee Messages (At Penkey)
INSERT INTO message_templates (category, context, message, emoji, weight) VALUES
('coffee', 'at_penkey', 'Welcome to Penkey! Show us your QR code for your stamp! 🎉', '☕', 2),
('coffee', 'at_penkey', 'Lovely to see you! Don''t forget to get your stamp scanned! 💕', '☕', 2),
('coffee', 'at_penkey', 'Hello! Grab your coffee and we''ll scan your stamp! ✨', '☕', 2),
('coffee', 'at_penkey', 'You''re here! Let''s get you that stamp - John & Amanda 🌟', '☕', 2);

-- Referral Messages
INSERT INTO message_templates (category, context, message, emoji, weight) VALUES
('referral', 'default', 'Share Penkey with your friends - you both get rewards! 💕', '👥', 2),
('referral', 'default', 'Bring your friends to Penkey! Everyone gets beans! 🎉', '🤝', 2),
('referral', 'default', 'Tell your mates about our handmade treats! Sharing is caring! ✨', '💫', 2),
('referral', 'default', 'Your friends need proper Coffee Mongers coffee! Share away! 🌟', '🎊', 2),
('referral', 'default', 'Spread the word about Penkey! More friends = more fun! 💫', '🌟', 2),
('referral', 'default', 'Invite your friends to our cozy café! Everyone wins! 🎉', '💝', 2),
('referral', 'default', 'Share the love - bring your crew to New Street! 🎊', '🎁', 2);

-- Points Messages
INSERT INTO message_templates (category, context, message, emoji, weight) VALUES
('points', 'default', 'Keep collecting those points! You''re doing amazing! 💫', '🌟', 2),
('points', 'default', 'Your points are looking good! Keep it up! ✨', '🎯', 2),
('points', 'default', 'You''re a Penkey superstar! More points = more fun! 🎉', '💎', 2),
('points', 'default', 'So many points! Rewards incoming! 💕', '⭐', 2),
('points', 'default', 'Points points points! You''re on fire! 🔥', '🎁', 2);

-- Game Messages
INSERT INTO message_templates (category, context, message, emoji, weight) VALUES
('games', 'default', 'Play today''s game! You might win something cool! ✨', '🎮', 2),
('games', 'default', 'Feeling lucky?? Let''s play and see what you get! 🎉', '🎲', 2),
('games', 'default', 'Game time!! Spin it and win it! 💫', '🎰', 2),
('games', 'default', 'Come on play! You could win big! 🌟', '🎯', 2),
('games', 'default', 'Daily game = daily fun! Let''s go! 🎊', '✨', 2);

-- Rewards Messages
INSERT INTO message_templates (category, context, message, emoji, weight) VALUES
('rewards', 'default', 'YOU HAVE REWARDS!! Come redeem them! 💕', '🎁', 2),
('rewards', 'default', 'Your rewards are ready! ✨', '🏆', 2),
('rewards', 'default', 'Treats waiting for you! Pop in and claim them! 🎉', '💝', 2),
('rewards', 'default', 'Rewards alert!! Come get your goodies! 🌟', '🎉', 2);

-- 3. Function to get random message (weighted)
-- =============================================
CREATE OR REPLACE FUNCTION get_random_message(
  p_category TEXT,
  p_context TEXT DEFAULT 'default',
  p_conditions JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  id UUID,
  message TEXT,
  emoji TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH weighted_messages AS (
    SELECT 
      mt.id,
      mt.message,
      mt.emoji,
      mt.weight,
      -- Generate random number weighted by weight
      random() * mt.weight as weighted_random
    FROM message_templates mt
    WHERE mt.category = p_category
      AND mt.context = p_context
      AND mt.active = true
    ORDER BY weighted_random DESC
    LIMIT 1
  )
  SELECT 
    wm.id,
    wm.message,
    wm.emoji
  FROM weighted_messages wm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_random_message(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_random_message(TEXT, TEXT, JSONB) TO anon;

-- 4. Function to get multiple random messages (for rotation)
-- =============================================
CREATE OR REPLACE FUNCTION get_rotating_messages(
  p_category TEXT,
  p_context TEXT DEFAULT 'default',
  p_count INTEGER DEFAULT 3
)
RETURNS TABLE(
  id UUID,
  message TEXT,
  emoji TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id,
    mt.message,
    mt.emoji
  FROM message_templates mt
  WHERE mt.category = p_category
    AND mt.context = p_context
    AND mt.active = true
  ORDER BY random() * mt.weight DESC
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_rotating_messages(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rotating_messages(TEXT, TEXT, INTEGER) TO anon;

-- 5. Message analytics table (track which messages perform best)
-- =============================================
CREATE TABLE IF NOT EXISTS message_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES message_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  context TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_views_message ON message_views(message_id);
CREATE INDEX idx_message_views_user ON message_views(user_id);
CREATE INDEX idx_message_views_date ON message_views(viewed_at);

-- RLS
ALTER TABLE message_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own views"
  ON message_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all analytics"
  ON message_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- 6. Analytics view
-- =============================================
CREATE OR REPLACE VIEW message_performance AS
SELECT 
  mt.id,
  mt.category,
  mt.context,
  mt.message,
  COUNT(mv.id) as view_count,
  COUNT(DISTINCT mv.user_id) as unique_viewers,
  MAX(mv.viewed_at) as last_viewed
FROM message_templates mt
LEFT JOIN message_views mv ON mt.id = mv.message_id
WHERE mt.active = true
GROUP BY mt.id, mt.category, mt.context, mt.message
ORDER BY view_count DESC;

GRANT SELECT ON message_performance TO authenticated;

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- Get a random coffee message:
-- SELECT * FROM get_random_message('coffee', 'default');

-- Get 3 rotating coffee messages:
-- SELECT * FROM get_rotating_messages('coffee', 'default', 3);

-- Get a random referral message:
-- SELECT * FROM get_random_message('referral', 'default');

-- View message performance:
-- SELECT * FROM message_performance WHERE category = 'coffee';

-- Add a new message (as staff):
-- INSERT INTO message_templates (category, context, message, emoji, weight)
-- VALUES ('coffee', 'default', 'New message here!', '☕', 2);

-- Update message weight (boost popular messages):
-- UPDATE message_templates SET weight = 3 WHERE id = 'message-uuid';

-- Deactivate a message:
-- UPDATE message_templates SET active = false WHERE id = 'message-uuid';
