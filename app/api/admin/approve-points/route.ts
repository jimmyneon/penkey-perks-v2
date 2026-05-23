import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { awardId, action, adminId, rejectionReason } = await request.json()

    if (!awardId || !action || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get award details
    const { data: award, error: awardError } = await supabase
      .from('manual_points_awards')
      .select('*')
      .eq('id', awardId)
      .single()

    if (awardError || !award) {
      return NextResponse.json(
        { error: 'Award not found' },
        { status: 404 }
      )
    }

    if (award.status !== 'pending') {
      return NextResponse.json(
        { error: 'Award has already been processed' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Update award status
      const { error: updateError } = await supabase
        .from('manual_points_awards')
        .update({
          status: 'approved',
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', awardId)

      if (updateError) {
        console.error('Error updating award:', updateError)
        return NextResponse.json(
          { error: 'Failed to approve award' },
          { status: 500 }
        )
      }

      // Award points to user
      const { error: pointsError } = await supabase.rpc('add_points', {
        p_user_id: award.user_id,
        p_points: award.points,
        p_reason: `Manual award: ${award.reason}`
      })

      if (pointsError) {
        console.error('Error awarding points:', pointsError)
        // Don't fail the request, but log the error
      }

      // Log activity
      await supabase
        .from('staff_activity_log')
        .insert({
          staff_id: adminId,
          action_type: 'approve_points',
          target_user_id: award.user_id,
          metadata: {
            award_id: awardId,
            points: award.points,
            award_type: award.award_type
          }
        })

      return NextResponse.json({
        success: true,
        action: 'approved',
        points: award.points
      })

    } else {
      // Reject
      const { error: updateError } = await supabase
        .from('manual_points_awards')
        .update({
          status: 'rejected',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason || 'No reason provided'
        })
        .eq('id', awardId)

      if (updateError) {
        console.error('Error updating award:', updateError)
        return NextResponse.json(
          { error: 'Failed to reject award' },
          { status: 500 }
        )
      }

      // Log activity
      await supabase
        .from('staff_activity_log')
        .insert({
          staff_id: adminId,
          action_type: 'reject_points',
          target_user_id: award.user_id,
          metadata: {
            award_id: awardId,
            points: award.points,
            award_type: award.award_type,
            rejection_reason: rejectionReason
          }
        })

      return NextResponse.json({
        success: true,
        action: 'rejected'
      })
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
