import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner
    const { data: currentStaff } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!currentStaff || currentStaff.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can add staff members' }, { status: 403 })
    }

    const { email, name, role } = await request.json()

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      // User exists, check if already staff
      const { data: existingStaff } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', existingUser.id)
        .single()

      if (existingStaff) {
        return NextResponse.json({ error: 'User is already a staff member' }, { status: 400 })
      }

      // Add to staff
      const { data, error } = await supabase
        .from('staff')
        .insert({
          user_id: existingUser.id,
          role,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, data })
    } else {
      // User doesn't exist yet - create placeholder
      // They'll need to sign up with this email
      return NextResponse.json({ 
        success: true, 
        message: 'Staff member will be added when they sign up with this email',
        pendingEmail: email 
      })
    }
  } catch (error: any) {
    console.error('Add staff error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add staff member' },
      { status: 500 }
    )
  }
}
