/**
 * Advanced Notification Condition Matching
 * Supports complex conditions with operators
 */

export interface UserState {
  hasUnredeemedRewards?: boolean
  currentStreak?: number
  hasCheckedInToday?: boolean
  hasCoffeeStampToday?: boolean
  hasPlayedGameToday?: boolean
  stampsUntilReward?: number
  rewardExpiryDate?: string | null
  currentPoints?: number
  lifetimePoints?: number
  timeOfDay?: string
  dayOfWeek?: number
  weather?: string
  temperature?: number
  hoursUntilExpiry?: number | null
  daysUntilExpiry?: number | null
  allComplete?: boolean
  isBirthdayMonth?: boolean
  isBirthdayToday?: boolean
}

export interface Condition {
  [key: string]: any
}

/**
 * Check if a value matches a condition
 */
function matchCondition(key: string, condition: any, state: UserState): boolean {
  const stateValue = state[key as keyof UserState]
  
  // Handle undefined state values
  if (stateValue === undefined || stateValue === null) {
    // If condition expects false/null, that's a match
    if (condition === false || condition === null) {
      return true
    }
    // Otherwise, no match
    return false
  }
  
  // Direct equality check (boolean, string, exact number)
  if (typeof condition !== 'object' || condition === null) {
    return stateValue === condition
  }
  
  // Numeric comparisons
  if (typeof stateValue === 'number') {
    if ('min' in condition && stateValue < condition.min) return false
    if ('max' in condition && stateValue > condition.max) return false
    if ('equals' in condition && stateValue !== condition.equals) return false
    if ('lte' in condition && stateValue > condition.lte) return false
    if ('gte' in condition && stateValue < condition.gte) return false
    if ('lt' in condition && stateValue >= condition.lt) return false
    if ('gt' in condition && stateValue <= condition.gt) return false
    return true
  }
  
  // Array membership (e.g., dayOfWeek in [1,2,3,4,5])
  if (Array.isArray(condition)) {
    return condition.includes(stateValue)
  }
  
  return false
}

/**
 * Check if user state matches all conditions (AND logic)
 */
export function matchesConditions(
  conditions: Condition,
  userState: UserState
): boolean {
  // Empty conditions = always match
  if (!conditions || Object.keys(conditions).length === 0) {
    return true
  }
  
  // All conditions must match (AND logic)
  for (const [key, value] of Object.entries(conditions)) {
    if (!matchCondition(key, value, userState)) {
      return false
    }
  }
  
  return true
}

/**
 * Calculate time of day based on hour
 */
export function getTimeOfDay(hour?: number): string {
  const currentHour = hour ?? new Date().getHours()
  
  if (currentHour >= 5 && currentHour < 10) return 'morning'
  if (currentHour >= 10 && currentHour < 14) return 'midday'
  if (currentHour >= 14 && currentHour < 17) return 'afternoon'
  if (currentHour >= 17 && currentHour < 21) return 'evening'
  return 'night'
}

/**
 * Calculate hours until expiry
 */
export function getHoursUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  
  const expiry = new Date(expiryDate)
  const now = new Date()
  const msUntilExpiry = expiry.getTime() - now.getTime()
  
  if (msUntilExpiry < 0) return 0 // Already expired
  
  return Math.floor(msUntilExpiry / (1000 * 60 * 60))
}

/**
 * Calculate days until expiry
 */
export function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  
  const expiry = new Date(expiryDate)
  const now = new Date()
  const msUntilExpiry = expiry.getTime() - now.getTime()
  
  if (msUntilExpiry < 0) return 0 // Already expired
  
  return Math.floor(msUntilExpiry / (1000 * 60 * 60 * 24))
}

/**
 * Build complete user state with calculated fields
 */
export function buildUserState(baseState: Partial<UserState>): UserState {
  const hour = new Date().getHours()
  
  return {
    ...baseState,
    timeOfDay: getTimeOfDay(hour),
    dayOfWeek: new Date().getDay(),
    hoursUntilExpiry: baseState.rewardExpiryDate 
      ? getHoursUntilExpiry(baseState.rewardExpiryDate)
      : null,
    daysUntilExpiry: baseState.rewardExpiryDate
      ? getDaysUntilExpiry(baseState.rewardExpiryDate)
      : null,
    allComplete: Boolean(
      baseState.hasCheckedInToday && 
      baseState.hasCoffeeStampToday && 
      baseState.hasPlayedGameToday
    )
  }
}

/**
 * Example usage:
 * 
 * const userState = buildUserState({
 *   hasUnredeemedRewards: true,
 *   rewardExpiryDate: '2025-10-12T18:00:00Z',
 *   currentStreak: 7,
 *   hasCheckedInToday: false
 * })
 * 
 * const notification = {
 *   conditions: {
 *     hasUnredeemedRewards: true,
 *     hoursUntilExpiry: { max: 3 },
 *     currentStreak: { min: 7 }
 *   }
 * }
 * 
 * if (matchesConditions(notification.conditions, userState)) {
 *   // Show notification
 * }
 */
