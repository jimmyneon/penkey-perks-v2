import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      return NextResponse.json({ error: 'Only owners can update staff members' }, { status: 403 })
    }

    const { role } = await request.json()

    const { data, error } = await supabase
      .from('staff')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Update staff error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      return NextResponse.json({ error: 'Only owners can remove staff members' }, { status: 403 })
    }

    // Prevent removing yourself
    const { data: staffToRemove } = await supabase
      .from('staff')
      .select('user_id')
      .eq('id', id)
      .single()

    if (staffToRemove?.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 })
    }

    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete staff error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove staff member' },
      { status: 500 }
    )
  }
}
