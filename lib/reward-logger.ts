// Reward and QR Code Activity Logger
// Logs all reward-related actions for audit trail

export interface RewardLogEntry {
  timestamp: string
  action: 'created' | 'viewed' | 'redeemed' | 'expired'
  rewardId: string
  rewardName: string
  userId: string
  qrCode?: string
  metadata?: Record<string, any>
}

class RewardLogger {
  private logs: RewardLogEntry[] = []
  private readonly MAX_LOGS = 1000

  log(entry: Omit<RewardLogEntry, 'timestamp'>) {
    const logEntry: RewardLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    }

    this.logs.push(logEntry)

    // Keep only last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS)
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[REWARD LOG]', logEntry)
    }

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        const existingLogs = JSON.parse(localStorage.getItem('reward_logs') || '[]')
        existingLogs.push(logEntry)
        // Keep last 100 in localStorage
        const trimmedLogs = existingLogs.slice(-100)
        localStorage.setItem('reward_logs', JSON.stringify(trimmedLogs))
      } catch (e) {
        console.error('Failed to store reward log:', e)
      }
    }

    return logEntry
  }

  getLogs(filter?: Partial<RewardLogEntry>): RewardLogEntry[] {
    if (!filter) return this.logs

    return this.logs.filter(log => {
      return Object.entries(filter).every(([key, value]) => {
        return log[key as keyof RewardLogEntry] === value
      })
    })
  }

  getRecentLogs(count: number = 10): RewardLogEntry[] {
    return this.logs.slice(-count)
  }

  clearLogs() {
    this.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('reward_logs')
    }
  }

  // Get logs from localStorage
  getStoredLogs(): RewardLogEntry[] {
    if (typeof window === 'undefined') return []
    
    try {
      return JSON.parse(localStorage.getItem('reward_logs') || '[]')
    } catch (e) {
      return []
    }
  }
}

// Singleton instance
export const rewardLogger = new RewardLogger()

// Helper functions for common logging scenarios
export const logRewardCreated = (rewardId: string, rewardName: string, userId: string, qrCode: string, metadata?: Record<string, any>) => {
  return rewardLogger.log({
    action: 'created',
    rewardId,
    rewardName,
    userId,
    qrCode,
    metadata: {
      ...metadata,
      source: metadata?.source || 'unknown',
    },
  })
}

export const logRewardViewed = (rewardId: string, rewardName: string, userId: string, qrCode?: string) => {
  return rewardLogger.log({
    action: 'viewed',
    rewardId,
    rewardName,
    userId,
    qrCode,
  })
}

export const logRewardRedeemed = (rewardId: string, rewardName: string, userId: string, qrCode: string, metadata?: Record<string, any>) => {
  return rewardLogger.log({
    action: 'redeemed',
    rewardId,
    rewardName,
    userId,
    qrCode,
    metadata,
  })
}

export const logRewardExpired = (rewardId: string, rewardName: string, userId: string, qrCode?: string) => {
  return rewardLogger.log({
    action: 'expired',
    rewardId,
    rewardName,
    userId,
    qrCode,
  })
}
