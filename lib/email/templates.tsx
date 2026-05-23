interface EmailTemplateProps {
  name: string
  [key: string]: any
}

export function WelcomeEmail({ name, referralUrl }: EmailTemplateProps & { referralUrl: string }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Penkey Perks!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3CA9E2 0%, #FFD93B 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🦆</h1>
    <h1 style="color: white; margin: 10px 0;">Welcome to Penkey Perks!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Hi ${name}! 👋</h2>
    
    <p>Welcome to the flock! We're excited to have you join Penkey Perks.</p>
    
    <h3 style="color: #3CA9E2;">Here's how it works:</h3>
    <ul style="list-style: none; padding: 0;">
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>🦆 Collect Ducks:</strong> Check in daily to earn 1 duck
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>🎮 Play Games:</strong> After check-in, play bonus games for extra prizes
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>🎁 Earn Rewards:</strong> Collect 10 ducks to unlock rewards
      </li>
      <li style="padding: 10px 0;">
        <strong>👥 Refer Friends:</strong> Share your link and earn 3 ducks per referral
      </li>
    </ul>
    
    <div style="background: #FFFEF7; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0;"><strong>Your Referral Link:</strong></p>
      <a href="${referralUrl}" style="color: #3CA9E2; word-break: break-all;">${referralUrl}</a>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #FFD93B; color: #2C3E50; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Get Started 🦆
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Questions? Visit us at Penkey Deli or reply to this email.
    </p>
  </div>
</body>
</html>
  `
}

export function RewardEarnedEmail({ name, rewardName, rewardValue, expiryDays }: EmailTemplateProps & { rewardName: string, rewardValue: string, expiryDays?: number }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You Earned a Reward!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4CAF50 0%, #FFD93B 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎁</h1>
    <h1 style="color: white; margin: 10px 0;">Congratulations!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Great news, ${name}! 🎉</h2>
    
    <p>You've earned a new reward!</p>
    
    <div style="background: linear-gradient(135deg, #FFD93B 0%, #3CA9E2 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center; color: white;">
      <h2 style="margin: 0 0 10px 0; font-size: 32px;">${rewardName}</h2>
      <p style="margin: 0; font-size: 24px; font-weight: bold;">${rewardValue}</p>
    </div>
    
    ${expiryDays ? `
    <div style="background: #FFF3CD; border-left: 4px solid #FFD93B; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        ⏰ <strong>Expires in ${expiryDays} days</strong> - Don't forget to use it!
      </p>
    </div>
    ` : ''}
    
    <p>Visit your rewards wallet to view the QR code and redeem it at Penkey Deli.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/rewards" style="display: inline-block; background: #FFD93B; color: #2C3E50; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        View My Rewards 🎁
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Keep collecting ducks to earn more rewards!
    </p>
  </div>
</body>
</html>
  `
}

export function RewardExpiringEmail({ name, rewardName, daysLeft }: EmailTemplateProps & { rewardName: string, daysLeft: number }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reward Expiring Soon!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF5252 0%, #FFD93B 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">⏰</h1>
    <h1 style="color: white; margin: 10px 0;">Reward Expiring Soon!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Hi ${name}! 👋</h2>
    
    <p>Just a friendly reminder that one of your rewards is expiring soon!</p>
    
    <div style="background: #FFF3CD; border: 2px solid #FF5252; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: #856404;">${rewardName}</h3>
      <p style="margin: 0; font-size: 18px; color: #856404;">
        <strong>Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}!</strong>
      </p>
    </div>
    
    <p>Don't let it go to waste! Visit Penkey Deli and redeem your reward before it expires.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/rewards" style="display: inline-block; background: #FF5252; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Redeem Now 🎁
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      See you soon at Penkey Deli!
    </p>
  </div>
</body>
</html>
  `
}

export function ReferralConfirmedEmail({ name, refereeName, ducksEarned }: EmailTemplateProps & { refereeName: string, ducksEarned: number }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referral Confirmed!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3CA9E2 0%, #4CAF50 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎉</h1>
    <h1 style="color: white; margin: 10px 0;">Referral Confirmed!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Awesome, ${name}! 🦆</h2>
    
    <p>Your friend <strong>${refereeName}</strong> just completed their first check-in!</p>
    
    <div style="background: linear-gradient(135deg, #FFD93B 0%, #4CAF50 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h2 style="margin: 0; color: white; font-size: 48px;">+${ducksEarned} 🦆</h2>
      <p style="margin: 10px 0 0 0; color: white; font-size: 18px;">Bonus Ducks Added!</p>
    </div>
    
    <p>Keep sharing your referral link to earn even more ducks!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/referrals" style="display: inline-block; background: #3CA9E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Share Your Link 👥
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Thanks for spreading the word about Penkey Perks!
    </p>
  </div>
</body>
</html>
  `
}

export function ReferralSuccessEmail({ name, referredName, beans }: EmailTemplateProps & { referredName: string, beans: number }) {
  return `
<!DOCTYPE html>
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
    <h2 style="color: #2C3E50;">Great news, ${name}! 👥</h2>
    
    <p><strong>${referredName}</strong> just signed up using your referral link!</p>
    
    <div style="background: linear-gradient(135deg, #FFA500 0%, #FFD700 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h2 style="margin: 0; color: white; font-size: 48px;">+${beans} Beans! ☕</h2>
      <p style="margin: 10px 0 0 0; color: white; font-size: 18px;">Referral Bonus Added!</p>
    </div>
    
    <div style="background: #FFF3CD; border-left: 4px solid #FFA500; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        💡 <strong>Keep sharing!</strong> Earn ${beans} beans for every friend who signs up through your link.
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
</html>
  `
}

export function ReferredWelcomeEmail({ name, referrerName, beans }: EmailTemplateProps & { referrerName: string, beans: number }) {
  return `
<!DOCTYPE html>
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
    <h2 style="color: #2C3E50;">Hi ${name}! 👋</h2>
    
    <p>Thanks for joining through <strong>${referrerName}'s</strong> referral link! You're now part of the Penkey family. 💕</p>
    
    <div style="background: linear-gradient(135deg, #FFA500 0%, #FFD700 100%); padding: 25px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: white;">Your Welcome Bonus</h3>
      <h2 style="margin: 0; color: white; font-size: 36px;">250 Beans + Free Coffee! ☕</h2>
    </div>
    
    <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #2E7D32;">
        🎁 <strong>${referrerName}</strong> will get ${beans} beans as a thank you when you visit Penkey!
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
        <strong>👥 Refer Friends:</strong> Share your link and earn ${beans} beans per friend!
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
</html>
  `
}
