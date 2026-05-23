/**
 * Business hours configuration for Penkey
 */

export interface BusinessHours {
  open: string  // HH:MM format (24-hour)
  close: string // HH:MM format (24-hour)
  closed?: boolean
}

export const BUSINESS_HOURS: Record<string, BusinessHours> = {
  monday: { open: '07:00', close: '21:00' },    // Extended for testing
  tuesday: { open: '07:00', close: '21:00' },   // Extended for testing
  wednesday: { open: '07:00', close: '21:00' }, // Extended for testing
  thursday: { open: '07:00', close: '21:00' },  // Extended for testing
  friday: { open: '07:00', close: '21:00' },    // Extended for testing
  saturday: { open: '08:00', close: '21:00' },  // Extended for testing
  sunday: { open: '09:00', close: '21:00' },    // Extended for testing
}

/**
 * Check if Penkey is currently open
 */
export function isWithinBusinessHours(): boolean {
  const now = new Date()
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' }).toLowerCase()
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
  
  const hours = BUSINESS_HOURS[dayName]
  
  if (!hours || hours.closed) {
    return false
  }
  
  return currentTime >= hours.open && currentTime <= hours.close
}

/**
 * Get opening hours for today
 */
export function getTodayHours(): BusinessHours | null {
  const now = new Date()
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' }).toLowerCase()
  return BUSINESS_HOURS[dayName] || null
}

/**
 * Get a friendly message about business hours
 */
export function getBusinessHoursMessage(): string {
  const hours = getTodayHours()
  
  if (!hours) {
    return 'Penkey is currently closed.'
  }
  
  if (hours.closed) {
    return 'Penkey is closed today.'
  }
  
  const isOpen = isWithinBusinessHours()
  
  if (isOpen) {
    return `Open today until ${formatTime(hours.close)}`
  }
  
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5)
  
  if (currentTime < hours.open) {
    return `Opens today at ${formatTime(hours.open)}`
  }
  
  return `Closed. Opens tomorrow at ${getNextOpeningTime()}`
}

/**
 * Get next opening time
 */
function getNextOpeningTime(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayName = tomorrow.toLocaleDateString('en-GB', { weekday: 'long' }).toLowerCase()
  const hours = BUSINESS_HOURS[dayName]
  
  if (hours && !hours.closed) {
    return formatTime(hours.open)
  }
  
  return '07:00'
}

/**
 * Format time from 24-hour to 12-hour
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}
