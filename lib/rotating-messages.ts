/**
 * Rotating motivational messages for dashboard cards
 * Messages rotate based on day of week to keep content fresh
 */

// Personal messages from John & Amanda - warm, friendly, authentic! 😄
export const coffeeMessages = [
  "☕ Amanda here - fresh Coffee Mongers brew waiting for you! Pop in love! 💕",
  "☕ John's brewing your favorite today - come say hello! ✨",
  "☕ We've just ground fresh coffee - smells amazing! Come get your stamp! 🎉",
  "☕ Morning love! Fancy a proper coffee? We're ready for you! 💫",
  "☕ Coffee time at Penkey! Come grab your stamp - John & Amanda x ☕",
  "☕ Fresh sausage rolls just out the oven! Perfect with coffee 🥐 - Amanda",
  "☕ Best coffee in Lymington (Coffee Mongers magic!) - come try it! ☕",
]

export const coffeeMessagesNearby = [
  "☕ You're so close to Penkey! Pop in and say hello! - John & Amanda 👋",
  "☕ We can see you from here! Come grab a coffee love! 💕",
  "☕ You're on New Street! Just a few steps to fresh coffee! 🎉",
  "☕ Hello neighbor! Come in for your stamp - we're ready! ✨",
]

export const coffeeMessagesAtPenkey = [
  "☕ Welcome to Penkey! Show us your QR code for your stamp! 🎉",
  "☕ Lovely to see you! Don't forget to get your stamp scanned! 💕",
  "☕ Hello! Grab your coffee and we'll scan your stamp! ✨",
  "☕ You're here! Let's get you that stamp - John & Amanda 🌟",
]

export const pointsMessages = [
  "🌟 Yaaas! Keep collecting those points! You're doing amazing! 💫",
  "🎯 Omg your points are looking goooood! Keep it up! ✨",
  "💎 You're a Penkey superstar! More points = more fun! 🎉",
  "⭐ Eeeek! So many points! Rewards incoming! 💕",
  "🎁 Points points points! You're on fire! 🔥",
  "✨ Look at you go! Those points are stacking up! 🌟",
  "🏆 Absolute legend! Your points game is strong! 💪",
]

export const gameMessages = [
  "🎮 Ooh play today's game! You might win something cool! ✨",
  "🎲 Feeling lucky?? Let's play and see what you get! 🎉",
  "🎰 Game time!! Spin it and win it! 💫",
  "🎯 Come onnnn play! You could win big! 🌟",
  "✨ Daily game = daily fun! Let's goooo! 🎊",
  "🎪 Games are live! What will you win today?! 💕",
  "🎁 Ooooh play the game! Prizes waiting! 🎉",
]

export const rewardsMessages = [
  "🎁 OMG YOU HAVE REWARDS!! Come redeem them! 💕",
  "🏆 Yaaas queen/king! Your rewards are ready! ✨",
  "💝 Treats waiting for you! Pop in and claim them! 🎉",
  "🎉 Rewards alert!! Come get your goodies! 🌟",
  "⭐ You've got rewards! Don't forget to use them! 💫",
  "🌟 Hellooo! Rewards are calling your name! 📣",
  "✨ Reward time! You earned it, now enjoy it! 🎊",
]

export const referralMessages = [
  "👥 Share Penkey with your friends - you both get rewards! 💕",
  "🤝 Bring your friends to Penkey! Everyone gets beans! 🎉",
  "💫 Tell your mates about our handmade treats! Sharing is caring! ✨",
  "🎊 Your friends need proper Coffee Mongers coffee! Share away! 🌟",
  "🌟 Spread the word about Penkey! More friends = more fun! 💫",
  "💝 Invite your friends to our cozy café! Everyone wins! 🎉",
  "🎁 Share the love - bring your crew to New Street! 🎊",
]

export const welcomeBackMessages = [
  "💕 OMG HI!! So good to see you back! Welcome! 🎉",
  "✨ Yaaay you're here!! Missed you! 💫",
  "🎉 Welcome back superstar! Let's do this! 🌟",
  "💫 Heyyyy! Great to have you back! ☕",
  "🌟 You're back!! Happy dance time! 💃",
]

export const welcomeTodayMessages = [
  "💕 Nice to see you again today! You're the best! ✨",
  "🎉 Omg you came back! Love having you here! 💫",
  "✨ Yaaas! Another visit today! You're amazing! 🌟",
  "💫 Hiii again! So happy you're here! ☕",
  "🌟 Back for more? We love it! 💕",
]

export const missYouMessages = [
  "💕 We miss you!! Come visit us soon! ✨",
  "😢 Haven't seen you in a while! Pop in and say hi! 💫",
  "🥺 Where have you been?! We miss your face! Come back! 🌟",
  "💔 It's been too long! Come get your coffee fix! ☕",
  "👋 Hellooo! Remember us? Come visit! We have treats! 🎉",
]

export const nearbyMessages = [
  "👀 Psst! You're super close! Pop in and say hi! 💕",
  "📍 OMG you're nearby!! Come visit! We have coffee! ☕",
  "🎉 You're literally around the corner! Come in! ✨",
  "💫 So close! Just a few steps away! See you soon! 🌟",
]

export const milestoneMessages = [
  "🎯 You're so close to your next milestone!",
  "🏃 Keep going - big rewards ahead!",
  "💪 Almost there! Don't stop now!",
  "🔥 You're on fire! Keep up the momentum!",
  "⭐ Just a few more to reach your goal!",
  "🚀 Blast off to your next reward level!",
  "🎊 Your next achievement is within reach!",
]

/**
 * Get a rotating message based on day of week
 * This ensures customers see different messages throughout the week
 */
export function getRotatingMessage(messages: string[]): string {
  const dayOfWeek = new Date().getDay() // 0-6 (Sunday-Saturday)
  return messages[dayOfWeek % messages.length]
}

/**
 * Get a contextual coffee message based on stamps and location
 */
export function getCoffeeMessage(stampsCount: number, isNearby: boolean = false, isAtPenkey: boolean = false): string {
  const remaining = 10 - (stampsCount % 10)
  
  // Check if card is full first (highest priority)
  if (stampsCount >= 10) {
    return "🎉 Your free coffee is ready! Click the card to show your QR code to staff! 💕"
  }
  
  // At Penkey - super excited!
  if (isAtPenkey) {
    return getRotatingMessage(coffeeMessagesAtPenkey)
  }
  
  // Nearby - encourage them to come in!
  if (isNearby) {
    return getRotatingMessage(coffeeMessagesNearby)
  }
  
  // Specific messages based on stamp count
  
  if (remaining === 1) {
    return "☕ Eeeek! Just 1 more stamp for your free coffee! Pop in today! 🎊"
  }
  
  if (remaining === 2) {
    return "☕ OMG only 2 more stamps!! You're SO close to free coffee! 💫"
  }
  
  if (remaining === 3) {
    return "☕ Yaaas! Only 3 more stamps until FREE COFFEE!! Keep going! 🌟"
  }
  
  if (stampsCount === 0) {
    return "☕ Start your coffee stamp journey! First one's the hardest! 💕"
  }
  
  if (stampsCount === 1) {
    return "☕ Omg you got your first stamp! 9 more to go! You can do it! ✨"
  }
  
  if (remaining === 5) {
    return "☕ Halfway there!! 5 more stamps for your free coffee! 🎉"
  }
  
  // Regular messages for other counts
  return getRotatingMessage(coffeeMessages)
}

/**
 * Get a contextual points message based on progress
 */
export function getPointsMessage(currentPoints: number, nextMilestone?: number): string {
  if (nextMilestone) {
    const remaining = nextMilestone - currentPoints
    if (remaining <= 10) {
      return `🎯 Just ${remaining} more points to unlock your next reward!`
    }
  }
  
  return getRotatingMessage(pointsMessages)
}

/**
 * Get a contextual game message based on play status
 */
export function getGameMessage(hasPlayed: boolean): string {
  if (hasPlayed) {
    return "✅ You've played today! Come back tomorrow for more chances to win!"
  }
  
  return getRotatingMessage(gameMessages)
}

/**
 * Get a contextual rewards message
 */
export function getRewardsMessage(rewardCount: number): string {
  if (rewardCount === 0) {
    return "🎁 Keep earning to unlock exclusive rewards!"
  }
  
  if (rewardCount === 1) {
    return "🎉 You have 1 reward ready! Visit Penkey to redeem it!"
  }
  
  return `🎊 You have ${rewardCount} rewards ready! Visit Penkey to redeem them!`
}

/**
 * Get welcome message based on last visit time
 */
export function getWelcomeMessage(lastVisit: string | null, hasCheckedInToday: boolean): string {
  if (!lastVisit) {
    // First time visitor
    return getRotatingMessage(welcomeBackMessages)
  }

  const lastVisitDate = new Date(lastVisit)
  const now = new Date()
  const hoursSinceVisit = (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60)

  // Checked in today and it's been less than 6 hours
  if (hasCheckedInToday && hoursSinceVisit < 6) {
    return getRotatingMessage(welcomeTodayMessages)
  }

  // Haven't visited in over 3 days
  if (hoursSinceVisit > 72) {
    return getRotatingMessage(missYouMessages)
  }

  // Regular welcome back
  return getRotatingMessage(welcomeBackMessages)
}
