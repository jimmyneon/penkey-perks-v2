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
  const supabase = createClient()
  let query = supabase
    .from('user_vouchers')
    .select(`
      *,
      voucher_template:voucher_templates(name, description, category, bean_threshold)
    `)
    .eq('user_id', userId)
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching vouchers:', error)
    return []
  }
  
  return data || []
}

export async function getActiveVouchers(userId: string): Promise<Voucher[]> {
  return getUserVouchers(userId, 'active')
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
