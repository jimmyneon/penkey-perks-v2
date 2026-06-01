// Supabase query helpers for Penkey Perks V2
import { createClient } from '@/lib/supabase/client'

export interface BeanBalance {
  user_id: string
  current_beans: number
  lifetime_beans: number
  last_visit_at: string | null
  visit_count: number
}

export interface Voucher {
  id: string
  user_id: string
  voucher_template_id: string
  status: 'active' | 'redeemed' | 'expired'
  qr_code: string
  expires_at: string
  redeemed_at: string | null
  redeemed_by: string | null
  metadata: any
  created_at: string
  template?: {
    name: string
    description: string
    category: string
    bean_threshold: number
  }
}

export interface Badge {
  id: string
  name: string
  description: string
  icon_url: string | null
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary'
  requirement_type: string
  requirement_value: number
  metadata: any
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  metadata: any
  badge?: Badge
}

export interface Campaign {
  id: string
  name: string
  description: string
  type: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  start_at: string
  end_at: string
  location_required: boolean
  location_radius_meters: number
  bean_multiplier: number
  target_audience: any
  email_template: any
  push_template: any
  metadata: any
  created_at: string
  updated_at: string
}

export interface WheelPrize {
  id: string
  name: string
  description: string
  type: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  weight: number
  metadata: any
  created_at: string
}

// Bean balance queries
export async function getBeanBalance(userId: string): Promise<BeanBalance | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bean_balances')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching bean balance:', error)
    return null
  }
  
  return data
}

export async function createBeanBalance(userId: string): Promise<BeanBalance | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bean_balances')
    .insert({
      user_id: userId,
      current_beans: 0,
      lifetime_beans: 0,
      visit_count: 0,
    })
    .select()
    .maybeSingle()
  
  if (error) {
    console.error('Error creating bean balance:', error)
    return null
  }
  
  return data
}

// Voucher queries
export async function getUserVouchers(userId: string, status?: 'active' | 'redeemed' | 'expired'): Promise<Voucher[]> {
  console.log('[getUserVouchers] === START ===')
  console.log('[getUserVouchers] userId:', userId)
  console.log('[getUserVouchers] status filter:', status)

  const supabase = createClient()
  console.log('[getUserVouchers] Supabase client created')

  let query = supabase
    .from('user_vouchers')
    .select('*')
    .eq('user_id', userId)

  console.log('[getUserVouchers] Query built with user_id filter')

  if (status) {
    query = query.eq('status', status)
    console.log('[getUserVouchers] Added status filter:', status)
  }

  console.log('[getUserVouchers] Executing query...')
  const { data: vouchers, error } = await query.order('created_at', { ascending: false })

  console.log('[getUserVouchers] Query executed')
  console.log('[getUserVouchers] Error:', error)
  console.log('[getUserVouchers] Data:', vouchers)
  console.log('[getUserVouchers] Vouchers count:', vouchers?.length || 0)

  if (error) {
    console.error('[getUserVouchers] ERROR fetching vouchers:', error)
    console.error('[getUserVouchers] Error code:', error.code)
    console.error('[getUserVouchers] Error message:', error.message)
    console.error('[getUserVouchers] Error details:', error.details)
    console.error('[getUserVouchers] Error hint:', error.hint)
    return []
  }

  if (!vouchers || vouchers.length === 0) {
    console.log('[getUserVouchers] No vouchers found or empty array')
    return []
  }

  console.log('[getUserVouchers] Vouchers found, fetching templates...')
  // Fetch template data separately to avoid RLS issues with nested selects
  const templateIds = vouchers.map(v => v.voucher_template_id)
  console.log('[getUserVouchers] Template IDs to fetch:', templateIds)

  const { data: templates, error: templateError } = await supabase
    .from('voucher_templates')
    .select('id, name, description, category, bean_threshold')
    .in('id', templateIds)

  console.log('[getUserVouchers] Templates query result:', templates)
  console.log('[getUserVouchers] Templates error:', templateError)

  if (templateError) {
    console.error('[getUserVouchers] ERROR fetching voucher templates:', templateError)
    console.log('[getUserVouchers] Returning vouchers without templates')
    return vouchers
  }

  // Map templates to vouchers
  const templateMap = new Map(templates?.map(t => [t.id, t]) || [])
  const result = vouchers.map(voucher => ({
    ...voucher,
    template: templateMap.get(voucher.voucher_template_id)
  }))

  console.log('[getUserVouchers] Final result with templates:', result)
  console.log('[getUserVouchers] === END ===')
  return result
}

export async function getActiveVouchers(userId: string): Promise<Voucher[]> {
  console.log('[getActiveVouchers] === START ===')
  console.log('[getActiveVouchers] Fetching vouchers for user:', userId)
  console.log('[getActiveVouchers] User ID type:', typeof userId)
  console.log('[getActiveVouchers] User ID length:', userId?.length)

  try {
    const supabase = createClient()
    console.log('[getActiveVouchers] Supabase client created')

    // Check auth session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('[getActiveVouchers] Auth session exists:', !!session)
    console.log('[getActiveVouchers] Session user ID:', session?.user?.id)
    console.log('[getActiveVouchers] Session user ID matches requested ID:', session?.user?.id === userId)

    const vouchers = await getUserVouchers(userId, 'active')
    console.log('[getActiveVouchers] Result:', vouchers)
    console.log('[getActiveVouchers] Vouchers count:', vouchers.length)
    console.log('[getActiveVouchers] First voucher:', vouchers[0])
    console.log('[getActiveVouchers] === END ===')
    return vouchers
  } catch (error) {
    console.error('[getActiveVouchers] ERROR:', error)
    console.error('[getActiveVouchers] Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('[getActiveVouchers] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.log('[getActiveVouchers] === END WITH ERROR ===')
    return []
  }
}

// Badge queries
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching badges:', error)
    return []
  }
  
  return data || []
}

export async function getAllBadges(): Promise<Badge[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('requirement_value', { ascending: true })
  
  if (error) {
    console.error('Error fetching badges:', error)
    return []
  }
  
  return data || []
}

// Campaign queries
export async function getActiveCampaigns(): Promise<Campaign[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .gte('start_at', new Date().toISOString())
    .lte('end_at', new Date().toISOString())
    .order('start_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching campaigns:', error)
    return []
  }
  
  return data || []
}

// Wheel prize queries
export async function getWheelPrizes(): Promise<WheelPrize[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wheel_prizes')
    .select('*')
    .order('weight', { ascending: false })
  
  if (error) {
    console.error('Error fetching wheel prizes:', error)
    return []
  }
  
  return data || []
}

// Bean transaction queries
export async function getRecentBeanTransactions(userId: string, limit = 10): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bean_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching bean transactions:', error)
    return []
  }
  
  return data || []
}

// Helper function to get next reward threshold from database
export async function getNextRewardThreshold(currentBeans: number): Promise<{ threshold: number; beansNeeded: number; reward: string; description: string }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('voucher_templates')
    .select('name, description, bean_threshold')
    .order('bean_threshold', { ascending: true })

  if (error || !data) {
    console.error('Error fetching voucher templates:', error)
    return { threshold: 0, beansNeeded: 0, reward: 'Error loading rewards', description: '' }
  }

  for (const template of data) {
    if (currentBeans < template.bean_threshold) {
      return {
        threshold: template.bean_threshold,
        beansNeeded: template.bean_threshold - currentBeans,
        reward: template.name,
        description: template.description || '',
      }
    }
  }

  // Max level reached
  return {
    threshold: 0,
    beansNeeded: 0,
    reward: 'All rewards unlocked',
    description: '',
  }
}

// Fetch all voucher templates for rewards display
export async function getAllVoucherTemplates(): Promise<Array<{ id: string; name: string; description: string; category: string; bean_threshold: number }>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('voucher_templates')
    .select('id, name, description, category, bean_threshold')
    .order('bean_threshold', { ascending: true })

  if (error || !data) {
    console.error('Error fetching voucher templates:', error)
    return []
  }

  return data
}
