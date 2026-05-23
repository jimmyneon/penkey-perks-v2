import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getCustomerData(supabase: any, customerId: string) {
  console.log('getCustomerData called with ID:', customerId)
  
  // Get customer details
  const { data: customer, error } = await supabase
    .from('users')
    .select('id, name, email, phone, avatar_url')
    .eq('id', customerId)
    .single()

  if (error) {
    console.error('Error fetching customer:', error)
    return null
  }

  if (!customer) {
    console.log('No customer found with ID:', customerId)
    return null
  }

  console.log('Customer found:', customer.name)

  // Get points
  const { data: pointsData } = await supabase
    .rpc('get_user_points', { p_user_id: customer.id })

  // Get lifetime points
  const { data: lifetimeData } = await supabase
    .rpc('get_lifetime_points', { p_user_id: customer.id })

  // Get stamps count
  const { count: stampsCount } = await supabase
    .from('coffee_stamps')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', customer.id)

  // Split name into first_name and last_name for compatibility
  const nameParts = (customer.name || '').split(' ')
  const first_name = nameParts[0] || ''
  const last_name = nameParts.slice(1).join(' ') || ''

  return {
    id: customer.id,
    name: customer.name,
    first_name,
    last_name,
    email: customer.email,
    phone: customer.phone,
    avatar_url: customer.avatar_url,
    current_points: pointsData || 0,
    lifetime_points: lifetimeData || 0,
    stamps_count: stampsCount || 0
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/staff/get-customer called')
    const supabase = await createClient()
    
    // Check if user is staff or admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user:', user.id)

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('User role:', profile?.role)

    if (profile?.role !== 'admin' && profile?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { customerId } = body

    console.log('Requested customer ID:', customerId)

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const customer = await getCustomerData(supabase, customerId)

    if (!customer) {
      console.log('Customer not found, returning 404')
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    console.log('Returning customer data')
    return NextResponse.json({ customer })

  } catch (error) {
    console.error('Unexpected error in POST /api/staff/get-customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    if (!search) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Check if user is staff or admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Search for customer by name, email, or phone
    const searchLower = search.toLowerCase()
    
    const { data: customers, error } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or(`name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,phone.ilike.%${searchLower}%`)
      .limit(10)

    if (error) {
      console.error('Error searching customers:', error)
      return NextResponse.json(
        { error: 'Failed to search customers' },
        { status: 500 }
      )
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({ customer: null })
    }

    // Get first customer's stats using the shared function
    const customerData = await getCustomerData(supabase, customers[0].id)

    if (!customerData) {
      return NextResponse.json({ customer: null })
    }

    return NextResponse.json({
      customer: customerData
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
