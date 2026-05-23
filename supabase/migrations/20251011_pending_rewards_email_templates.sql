-- =============================================
-- PENDING REWARDS EMAIL TEMPLATES
-- =============================================
-- Email templates for pending rewards system
-- =============================================

-- =============================================
-- 1. SECOND CHANCE OFFER EMAIL
-- =============================================

INSERT INTO public.email_templates (
  name,
  description,
  subject,
  html_body,
  variables,
  category,
  active
) VALUES (
  'second_chance_offer',
  'Sent when rewards expire - offers second chance',
  '😢 Your {{expiredReward}} Expired... But Here''s Another Chance!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: ''Helvetica Neue'', Arial, sans-serif; background: linear-gradient(135deg, #F5F1E8 0%, #FFE8D6 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2C3E50; font-size: 32px; margin: 0 0 10px 0;">
        😢 Oh No!
      </h1>
      <p style="color: #6B7280; font-size: 16px; margin: 0;">
        Your rewards expired...
      </p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 30px;">
      
      <!-- Expired Reward -->
      <div style="background: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <p style="color: #991B1B; font-size: 16px; margin: 0;">
          <strong>Expired:</strong> {{expiredReward}}
        </p>
        <p style="color: #991B1B; font-size: 14px; margin: 10px 0 0 0;">
          {{expiredAmount}} {{#if (eq expiredAmount 1)}}reward{{else}}rewards{{/if}} expired yesterday
        </p>
      </div>

      <!-- Good News -->
      <div style="text-align: center; margin: 30px 0;">
        <div style="font-size: 60px; margin-bottom: 20px;">🎁</div>
        <h2 style="color: #2C3E50; font-size: 28px; margin: 0 0 15px 0;">
          But Here''s the Good News!
        </h2>
        <p style="color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0;">
          We''re giving you a <strong>second chance</strong> to claim your rewards!
        </p>
      </div>

      <!-- Second Chance Offer -->
      <div style="background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0;">
        <h3 style="color: white; font-size: 24px; margin: 0 0 20px 0; font-weight: bold;">
          Your Second Chance Offer
        </h3>
        
        <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <div style="color: white; font-size: 18px; line-height: 1.8; text-align: left;">
            ✅ <strong>{{secondChanceAmount}}</strong> {{expiredReward}}<br>
            ✅ <strong>+{{bonusStamps}} Bonus Stamps</strong> (for coming back!)<br>
            ✅ <strong>1 Free Game Play</strong> (win even more!)
          </div>
        </div>
        
        <p style="color: white; font-size: 16px; margin: 0; opacity: 0.95;">
          That''s even better than before! 🎉
        </p>
      </div>

      <!-- Urgency -->
      <div style="background: #FEF3C7; border: 2px dashed #F59E0B; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
        <p style="color: #92400E; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
          ⏰ This Offer Expires in {{expiresIn}}!
        </p>
        <p style="color: #92400E; font-size: 14px; margin: 0;">
          Don''t miss out again - check in at Penkey to claim!
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); color: white; text-decoration: none; padding: 18px 50px; border-radius: 30px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255, 140, 66, 0.3);">
          Claim My Second Chance! 🎯
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #6B7280; font-size: 14px; line-height: 1.6;">
      <p style="margin: 0 0 10px 0;">
        We miss you at Penkey! Come visit us soon 💛
      </p>
      <p style="margin: 0;">
        <a href="{{appUrl}}" style="color: #FF8C42; text-decoration: none;">Visit Penkey Perks</a>
      </p>
    </div>
  </div>
</body>
</html>',
  ARRAY['name', 'expiredReward', 'expiredAmount', 'secondChanceAmount', 'bonusStamps', 'expiresIn', 'appUrl'],
  'reengagement',
  true
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- 2. PENDING REWARDS REMINDER EMAIL
-- =============================================

INSERT INTO public.email_templates (
  name,
  description,
  subject,
  html_body,
  variables,
  category,
  active
) VALUES (
  'pending_rewards_reminder',
  'Reminder about unclaimed pending rewards',
  '🎁 You Have {{pendingCount}} Rewards Waiting at Penkey!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: ''Helvetica Neue'', Arial, sans-serif; background: linear-gradient(135deg, #F5F1E8 0%, #FFE8D6 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 80px; margin-bottom: 10px;">🎁</div>
      <h1 style="color: #2C3E50; font-size: 36px; margin: 0 0 10px 0;">
        You Have Rewards Waiting!
      </h1>
      <p style="color: #FF8C42; font-size: 24px; font-weight: bold; margin: 0;">
        {{pendingCount}} Unclaimed {{#if (eq pendingCount 1)}}Reward{{else}}Rewards{{/if}}
      </p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 30px;">
      
      <p style="color: #2C3E50; font-size: 18px; line-height: 1.6; margin: 0 0 30px 0;">
        Hi {{name}},
      </p>
      
      <p style="color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Great news! You have <strong>{{pendingCount}} rewards</strong> waiting for you at Penkey Deli. 
        All you need to do is check in at the store to claim them!
      </p>

      <!-- Pending Rewards List -->
      <div style="background: #F5F1E8; border-radius: 15px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #2C3E50; font-size: 20px; margin: 0 0 20px 0; text-align: center;">
          Your Pending Rewards:
        </h3>
        
        <div style="space-y: 15px;">
          <!-- Rewards will be dynamically inserted here -->
          <div style="background: white; border-left: 4px solid #FF8C42; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="color: #2C3E50; font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">
              ✨ Check in to see all your rewards!
            </p>
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              Points, stamps, vouchers, and more waiting for you
            </p>
          </div>
        </div>
      </div>

      <!-- Urgency Banner -->
      <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 2px solid #F59E0B; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
        <p style="color: #92400E; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
          {{#if (eq urgency ''urgent'')}}
            🚨 URGENT: Expires in {{daysLeft}} day{{#if (gt daysLeft 1)}}s{{/if}}!
          {{else if (eq urgency ''high'')}}
            ⚠️ Expiring Soon: {{daysLeft}} days left
          {{else}}
            ⏰ Don''t forget: {{daysLeft}} days to claim
          {{/if}}
        </p>
        <p style="color: #92400E; font-size: 14px; margin: 0;">
          Check in at Penkey before they expire!
        </p>
      </div>

      <!-- How to Claim -->
      <div style="background: #EFF6FF; border-radius: 10px; padding: 20px; margin: 30px 0;">
        <h4 style="color: #1E40AF; font-size: 16px; margin: 0 0 15px 0;">
          How to Claim Your Rewards:
        </h4>
        <ol style="color: #1E40AF; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Visit Penkey Deli</li>
          <li>Open the Penkey Perks app</li>
          <li>Tap "Check In"</li>
          <li>All your rewards will be claimed automatically! 🎉</li>
        </ol>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); color: white; text-decoration: none; padding: 18px 50px; border-radius: 30px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255, 140, 66, 0.3);">
          Claim My Rewards Now! 🎁
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #6B7280; font-size: 14px; line-height: 1.6;">
      <p style="margin: 0 0 10px 0;">
        See you soon at Penkey! ☕
      </p>
      <p style="margin: 0;">
        <a href="{{appUrl}}" style="color: #FF8C42; text-decoration: none;">Open Penkey Perks</a>
      </p>
    </div>
  </div>
</body>
</html>',
  ARRAY['name', 'pendingCount', 'pendingRewards', 'daysLeft', 'urgency', 'appUrl'],
  'reminder',
  true
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- 3. REWARDS CLAIMED CELEBRATION EMAIL
-- =============================================

INSERT INTO public.email_templates (
  name,
  description,
  subject,
  html_body,
  variables,
  category,
  active
) VALUES (
  'rewards_claimed',
  'Sent after user claims pending rewards',
  '🎉 You Claimed {{claimedCount}} Rewards!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: ''Helvetica Neue'', Arial, sans-serif; background: linear-gradient(135deg, #F5F1E8 0%, #FFE8D6 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 80px; margin-bottom: 10px;">🎉</div>
      <h1 style="color: #2C3E50; font-size: 36px; margin: 0 0 10px 0;">
        Congratulations!
      </h1>
      <p style="color: #FF8C42; font-size: 24px; font-weight: bold; margin: 0;">
        You Claimed {{claimedCount}} {{#if (eq claimedCount 1)}}Reward{{else}}Rewards{{/if}}!
      </p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 30px;">
      
      <p style="color: #2C3E50; font-size: 18px; line-height: 1.6; margin: 0 0 30px 0;">
        Hi {{name}},
      </p>
      
      <p style="color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Thanks for checking in at Penkey! Here''s what you just claimed:
      </p>

      <!-- Claimed Rewards Summary -->
      <div style="background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0;">
        <h3 style="color: white; font-size: 24px; margin: 0 0 25px 0;">
          Your Rewards:
        </h3>
        
        <div style="display: grid; gap: 15px;">
          {{#if (gt totalPoints 0)}}
          <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 15px;">
            <div style="color: white; font-size: 32px; font-weight: bold;">{{totalPoints}}</div>
            <div style="color: white; font-size: 16px; opacity: 0.9;">Penkey Points</div>
          </div>
          {{/if}}
          
          {{#if (gt totalStamps 0)}}
          <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 15px;">
            <div style="color: white; font-size: 32px; font-weight: bold;">{{totalStamps}}</div>
            <div style="color: white; font-size: 16px; opacity: 0.9;">Coffee Stamps</div>
          </div>
          {{/if}}
          
          {{#if (gt totalGamePlays 0)}}
          <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 15px;">
            <div style="color: white; font-size: 32px; font-weight: bold;">{{totalGamePlays}}</div>
            <div style="color: white; font-size: 16px; opacity: 0.9;">Free Game Plays</div>
          </div>
          {{/if}}
        </div>
      </div>

      <!-- Next Steps -->
      <div style="background: #EFF6FF; border-radius: 10px; padding: 20px; margin: 30px 0;">
        <h4 style="color: #1E40AF; font-size: 16px; margin: 0 0 15px 0;">
          What''s Next?
        </h4>
        <ul style="color: #1E40AF; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Your rewards are now active in your account</li>
          <li>Use your points to redeem amazing rewards</li>
          <li>Collect stamps for free coffee</li>
          <li>Play your free games to win more prizes!</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); color: white; text-decoration: none; padding: 18px 50px; border-radius: 30px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255, 140, 66, 0.3);">
          View My Rewards
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #6B7280; font-size: 14px; line-height: 1.6;">
      <p style="margin: 0 0 10px 0;">
        Thanks for being part of Penkey Perks! 💛
      </p>
      <p style="margin: 0;">
        <a href="{{appUrl}}" style="color: #FF8C42; text-decoration: none;">Visit Penkey Perks</a>
      </p>
    </div>
  </div>
</body>
</html>',
  ARRAY['name', 'claimedCount', 'totalPoints', 'totalStamps', 'totalGamePlays', 'vouchers', 'appUrl'],
  'achievement',
  true
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Pending rewards email templates created!' as message;
SELECT '3 new templates added' as count;
