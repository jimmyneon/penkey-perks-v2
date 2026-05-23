/**
 * Pre-built notification templates for quick setup
 * Amanda can use these as starting points
 */

export interface NotificationTemplate {
  name: string
  description: string
  category: 'reward' | 'streak' | 'engagement' | 'seasonal' | 'milestone'
  data: {
    type: string
    priority: number
    title: string
    message: string
    icon: string
    conditions: Record<string, any>
    variant: string
    dismissible: boolean
    targetAudience?: string
  }
}

export const notificationTemplates: NotificationTemplate[] = [
  // REWARD TEMPLATES
  {
    name: 'Flash Sale - 24 Hours',
    description: 'Limited time offer for double points',
    category: 'seasonal',
    data: {
      type: 'custom',
      priority: 1,
      title: '⏰ 24-Hour Flash Sale!',
      message: 'Double points on all purchases TODAY ONLY! Don\'t miss out! 🎉',
      icon: '⚡',
      conditions: {},
      variant: 'streak',
      dismissible: false,
    }
  },
  {
    name: 'Birthday Special',
    description: 'Free coffee for birthday customers',
    category: 'reward',
    data: {
      type: 'custom',
      priority: 1,
      title: '🎂 Happy Birthday!',
      message: 'Enjoy a FREE coffee on us! Valid today only! You deserve it! 🎉',
      icon: '🎂',
      conditions: {},
      variant: 'reward',
      dismissible: false,
    }
  },
  {
    name: 'Win-Back Campaign',
    description: 'Re-engage inactive users',
    category: 'engagement',
    data: {
      type: 'custom',
      priority: 2,
      title: '💕 We Miss You!',
      message: 'It\'s been a while! Come back for a special surprise waiting for you! ✨',
      icon: '💝',
      conditions: {},
      variant: 'reward',
      dismissible: true,
      targetAudience: 'returning',
    }
  },

  // MILESTONE TEMPLATES
  {
    name: '100 Points Milestone',
    description: 'Celebrate 100 lifetime points',
    category: 'milestone',
    data: {
      type: 'custom',
      priority: 1,
      title: '🎊 100 Points Milestone!',
      message: 'Amazing! You\'ve earned 100 lifetime points! You\'re a star! Keep going! 💪',
      icon: '🏆',
      conditions: {
        lifetimePoints: { equals: 100 }
      },
      variant: 'success',
      dismissible: true,
    }
  },
  {
    name: '500 Points Milestone',
    description: 'Celebrate 500 lifetime points',
    category: 'milestone',
    data: {
      type: 'custom',
      priority: 1,
      title: '🎊 500 Points Legend!',
      message: 'WOW! 500 lifetime points! You\'re a Penkey legend! Incredible! 🌟',
      icon: '🏆',
      conditions: {
        lifetimePoints: { equals: 500 }
      },
      variant: 'success',
      dismissible: true,
    }
  },
  {
    name: '1000 Points Milestone',
    description: 'Celebrate 1000 lifetime points',
    category: 'milestone',
    data: {
      type: 'custom',
      priority: 1,
      title: '🎊 1000 Points Champion!',
      message: 'INCREDIBLE! 1000 lifetime points! You\'re unstoppable! Thank you! 💫',
      icon: '🏆',
      conditions: {
        lifetimePoints: { equals: 1000 }
      },
      variant: 'success',
      dismissible: true,
    }
  },

  // SEASONAL TEMPLATES
  {
    name: 'Christmas Special',
    description: 'Holiday season promotion',
    category: 'seasonal',
    data: {
      type: 'custom',
      priority: 2,
      title: '🎄 Merry Christmas!',
      message: 'Celebrate the season with us! Special holiday rewards available! 🎅',
      icon: '🎄',
      conditions: {},
      variant: 'reward',
      dismissible: true,
    }
  },
  {
    name: 'Summer Promo',
    description: 'Summer season special',
    category: 'seasonal',
    data: {
      type: 'custom',
      priority: 2,
      title: '☀️ Summer Special!',
      message: 'Beat the heat! Iced coffee + extra stamp this week! 🌊',
      icon: '🏖️',
      conditions: {},
      variant: 'reward',
      dismissible: true,
    }
  },
  {
    name: 'New Year Motivation',
    description: 'New year engagement',
    category: 'seasonal',
    data: {
      type: 'custom',
      priority: 3,
      title: '🎆 Happy New Year!',
      message: 'New year, new rewards! Start 2025 with bonus points! 🎊',
      icon: '🎆',
      conditions: {},
      variant: 'success',
      dismissible: true,
    }
  },

  // STREAK TEMPLATES
  {
    name: '7-Day Streak Achievement',
    description: 'Celebrate weekly streak',
    category: 'streak',
    data: {
      type: 'streak',
      priority: 2,
      title: '🔥 7-Day Streak!',
      message: 'Amazing! You\'ve checked in for 7 days straight! You\'re on fire! 💪',
      icon: '🔥',
      conditions: {
        currentStreak: { equals: 7 }
      },
      variant: 'streak',
      dismissible: true,
    }
  },
  {
    name: '30-Day Streak Achievement',
    description: 'Celebrate monthly streak',
    category: 'streak',
    data: {
      type: 'streak',
      priority: 1,
      title: '🏆 30-Day Streak!',
      message: 'INCREDIBLE! 30 days in a row! You\'re a Monthly Warrior! 👑',
      icon: '🏆',
      conditions: {
        currentStreak: { equals: 30 }
      },
      variant: 'streak',
      dismissible: true,
    }
  },

  // ENGAGEMENT TEMPLATES
  {
    name: 'Morning Motivation',
    description: 'Encourage morning check-ins',
    category: 'engagement',
    data: {
      type: 'checkin',
      priority: 5,
      title: '☀️ Good Morning!',
      message: 'Start your day right! Pop in for your check-in and earn 5 points! ✨',
      icon: '🌅',
      conditions: {
        hasCheckedInToday: false
      },
      variant: 'default',
      dismissible: true,
    }
  },
  {
    name: 'Game Reminder',
    description: 'Remind users to play daily game',
    category: 'engagement',
    data: {
      type: 'game',
      priority: 6,
      title: '🎮 Daily Game Ready!',
      message: 'Play now for a chance to win points, stamps, or prizes! Free to play! 🎉',
      icon: '🎯',
      conditions: {
        hasPlayedGameToday: false
      },
      variant: 'default',
      dismissible: true,
    }
  },
  {
    name: 'Stamp Progress - Almost There',
    description: 'Encourage when close to free coffee',
    category: 'engagement',
    data: {
      type: 'stamp',
      priority: 3,
      title: '💫 Almost There!',
      message: 'Just 3 more stamps until FREE COFFEE! You\'re so close! 🎉',
      icon: '☕',
      conditions: {
        stampsUntilReward: { equals: 3 }
      },
      variant: 'default',
      dismissible: true,
    }
  },

  // VIP TEMPLATES
  {
    name: 'VIP Exclusive Offer',
    description: 'Special offer for high-point users',
    category: 'reward',
    data: {
      type: 'custom',
      priority: 2,
      title: '👑 VIP Exclusive!',
      message: 'As a valued customer, enjoy this special VIP-only reward! 💎',
      icon: '👑',
      conditions: {
        lifetimePoints: { min: 500 }
      },
      variant: 'reward',
      dismissible: true,
      targetAudience: 'vip',
    }
  },
  {
    name: 'New Customer Welcome',
    description: 'Welcome message for new users',
    category: 'engagement',
    data: {
      type: 'custom',
      priority: 4,
      title: '🎉 Welcome to Penkey!',
      message: 'Thanks for joining! Start earning points and stamps with every visit! ✨',
      icon: '👋',
      conditions: {},
      variant: 'success',
      dismissible: true,
      targetAudience: 'new',
    }
  },
]

// Helper function to get templates by category
export function getTemplatesByCategory(category: NotificationTemplate['category']) {
  return notificationTemplates.filter(t => t.category === category)
}

// Helper function to search templates
export function searchTemplates(query: string) {
  const lowerQuery = query.toLowerCase()
  return notificationTemplates.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery)
  )
}
