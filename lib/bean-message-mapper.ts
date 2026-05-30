/**
 * Maps bean transaction descriptions to customer-friendly messages
 */

export function getFriendlyBeanMessage(description: string | null | undefined, amount: number): string {
  if (!description) {
    return amount === 1 
      ? 'You earned 1 bean from your visit!' 
      : `You earned ${amount} beans from your visit!`
  }

  const lowerDesc = description.toLowerCase()

  // POS Purchase reasons
  if (lowerDesc.includes('purchase') || lowerDesc.includes('pos')) {
    return amount === 1
      ? 'You earned 1 bean from your purchase!'
      : `You earned ${amount} beans from your purchase!`
  }

  // Daily check-in
  if (lowerDesc.includes('check-in') || lowerDesc.includes('checkin') || lowerDesc.includes('visit')) {
    if (lowerDesc.includes('streak')) {
      return `Daily check-in: ${amount} beans with streak bonus! 🔥`
    }
    return amount === 1
      ? 'Daily check-in: 1 bean earned!'
      : `Daily check-in: ${amount} beans earned!`
  }

  // Manual awards from staff
  if (lowerDesc.includes('manual') || lowerDesc.includes('staff')) {
    return amount === 1
      ? 'You earned 1 bean from our team!'
      : `You earned ${amount} beans from our team!`
  }

  // Signup bonus
  if (lowerDesc.includes('signup') || lowerDesc.includes('welcome') || lowerDesc.includes('bonus')) {
    return amount === 1
      ? 'Welcome bonus: 1 bean!'
      : `Welcome bonus: ${amount} beans! 🎉`
  }

  // Referral
  if (lowerDesc.includes('referral')) {
    return amount === 1
      ? 'Referral bonus: 1 bean!'
      : `Referral bonus: ${amount} beans!`
  }

  // Game rewards
  if (lowerDesc.includes('game') || lowerDesc.includes('prize') || lowerDesc.includes('win')) {
    return amount === 1
      ? 'Game reward: 1 bean!'
      : `Game reward: ${amount} beans! 🎮`
  }

  // Campaign/promotional
  if (lowerDesc.includes('campaign') || lowerDesc.includes('promo') || lowerDesc.includes('special')) {
    return amount === 1
      ? 'Special reward: 1 bean!'
      : `Special reward: ${amount} beans! ✨`
  }

  // Birthday
  if (lowerDesc.includes('birthday')) {
    return amount === 1
      ? 'Birthday treat: 1 bean! 🎂'
      : `Birthday treat: ${amount} beans! 🎂`
  }

  // Default - return original description if no match
  return description
}
