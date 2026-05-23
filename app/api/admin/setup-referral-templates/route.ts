import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Admin endpoint to set up referral notification templates
 * This creates push notification and email templates for referral events
 */
export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()

    // 1. Add push notification templates
    const pushTemplates = [
      {
        name: 'referral_success',
        title: '🎊 {{referredName}} Joined!',
        message: 'Your friend {{referredName}} signed up using your referral link! You earned {{beans}} beans. Keep sharing!',
        category: 'automated',
        trigger_event: 'referral_claimed',
        priority: 70,
        active: true,
        icon: '/icon-192.png',
        url: '/referrals',
        description: 'Sent to referrer when someone signs up using their link',
        variables: ['referredName', 'beans']
      },
      {
        name: 'referred_welcome',
        title: '🎉 Welcome to Penkey!',
        message: 'Thanks for joining through {{referrerName}}\'s link! Visit Penkey to redeem your free coffee and start earning beans.',
        category: 'automated',
        trigger_event: 'user_referred',
        priority: 60,
        active: true,
        icon: '/icon-192.png',
        url: '/dashboard',
        description: 'Sent to new user who was referred by someone',
        variables: ['referrerName', 'beans']
      }
    ]

    const pushResults = []
    for (const template of pushTemplates) {
      const { data, error } = await supabase
        .from('push_notification_templates')
        .upsert(template, { onConflict: 'name' })
        .select()

      if (error) {
        console.error(`Error creating push template ${template.name}:`, error)
        pushResults.push({ name: template.name, success: false, error: error.message })
      } else {
        pushResults.push({ name: template.name, success: true })
      }
    }

    // 2. Add email templates
    const emailTemplates = [
      {
        name: 'referral_success',
        display_name: 'Referral Success',
        subject: '🎊 {{referredName}} Joined Penkey Perks!',
        description: 'Sent to referrer when someone signs up using their link',
        variables: ['referredName', 'beans'],
        html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Friend Joined!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎊</h1>
    <h1 style="color: white; margin: 10px 0;">Your Friend Joined!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Great news! 👥</h2>
    
    <p><strong>{{referredName}}</strong> just signed up using your referral link!</p>
    
    <div style="background: linear-gradient(135deg, #FFA500 0%, #FFD700 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h2 style="margin: 0; color: white; font-size: 48px;">+{{beans}} Beans! ☕</h2>
      <p style="margin: 10px 0 0 0; color: white; font-size: 18px;">Referral Bonus Added!</p>
    </div>
    
    <div style="background: #FFF3CD; border-left: 4px solid #FFA500; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        💡 <strong>Keep sharing!</strong> Earn {{beans}} beans for every friend who signs up through your link.
      </p>
    </div>
    
    <p>Thanks for spreading the word about Penkey Perks! The more friends you refer, the more beans you earn.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/referrals" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Share Your Referral Link 🚀
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Visit Penkey Deli to redeem your beans!
    </p>
  </div>
</body>
</html>`,
        active: true,
        category: 'notification'
      },
      {
        name: 'referred_welcome',
        display_name: 'Referred User Welcome',
        subject: '🎉 Welcome to Penkey Perks!',
        description: 'Sent to new user who was referred by someone',
        variables: ['referrerName', 'beans'],
        html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Penkey Perks!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎉</h1>
    <h1 style="color: white; margin: 10px 0;">Welcome to Penkey Perks!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Hi there! 👋</h2>
    
    <p>Thanks for joining through <strong>{{referrerName}}'s</strong> referral link! You're now part of the Penkey family. 💕</p>
    
    <div style="background: linear-gradient(135deg, #FFA500 0%, #FFD700 100%); padding: 25px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: white;">Your Welcome Bonus</h3>
      <h2 style="margin: 0; color: white; font-size: 36px;">250 Beans + Free Coffee! ☕</h2>
    </div>
    
    <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #2E7D32;">
        🎁 <strong>{{referrerName}}</strong> will get {{beans}} beans as a thank you when you visit Penkey!
      </p>
    </div>
    
    <h3 style="color: #8B5CF6; margin-top: 30px;">What's Next?</h3>
    <ul style="list-style: none; padding: 0;">
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>☕ Visit Penkey:</strong> Pop into the café to redeem your free coffee
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>📱 Check In:</strong> Use the app to check in and earn daily beans
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>🎮 Play Games:</strong> Win bonus rewards and prizes
      </li>
      <li style="padding: 10px 0;">
        <strong>👥 Refer Friends:</strong> Share your link and earn {{beans}} beans per friend!
      </li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Start Earning Beans! 🚀
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Questions? Visit us at Penkey Deli or reply to this email.
    </p>
  </div>
</body>
</html>`,
        active: true,
        category: 'notification'
      }
    ]

    const emailResults = []
    for (const template of emailTemplates) {
      const { data, error } = await supabase
        .from('email_templates')
        .upsert(template, { onConflict: 'name' })
        .select()

      if (error) {
        console.error(`Error creating email template ${template.name}:`, error)
        emailResults.push({ name: template.name, success: false, error: error.message })
      } else {
        emailResults.push({ name: template.name, success: true })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Referral templates setup complete',
      results: {
        pushNotifications: pushResults,
        emails: emailResults
      }
    })

  } catch (error: any) {
    console.error('Setup referral templates error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
