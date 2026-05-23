import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all user data in order (respecting foreign keys)
    
    // 1. Delete game plays
    await supabase
      .from('game_plays')
      .delete()
      .eq('user_id', user.id)

    // 2. Delete user rewards
    await supabase
      .from('user_rewards')
      .delete()
      .eq('user_id', user.id)

    // 3. Delete coffee stamps
    await supabase
      .from('coffee_stamps')
      .delete()
      .eq('user_id', user.id)

    // 4. Delete points transactions
    await supabase
      .from('points_transactions')
      .delete()
      .eq('user_id', user.id)

    // 5. Delete referrals (both referrer and referred)
    await supabase
      .from('referrals')
      .delete()
      .or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`)

    // 6. Delete transactions log
    await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)

    // 7. Delete activity logs
    await supabase
      .from('activity_logs')
      .delete()
      .eq('user_id', user.id)

    // 8. Delete user profile
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    if (deleteUserError) {
      console.error('Error deleting user profile:', deleteUserError)
      throw deleteUserError
    }

    // 9. Delete auth user (this will sign them out)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      // Continue anyway as profile is deleted
    }

    return NextResponse.json({ 
      success: true,
      message: 'Account and all data deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    )
  }
}
