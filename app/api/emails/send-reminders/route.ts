import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Use admin client to bypass RLS for email operations
    const supabase = await createAdminClient()
    
    // Verify this is called from a cron job or authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      expiring_rewards: 0,
      inactive_users: 0,
      game_reminders: 0,
      anniversaries: 0,
      weekly_summaries: 0,
      weekend_specials: 0,
      monthly_reports: 0,
      win_back_30: 0,
      win_back_60: 0,
      pending_rewards_reminders: 0,
      expired_rewards: 0,
      second_chance_offers: 0,
      birthdays: 0,
      total: 0
    }

    // Get current day and time to determine which emails to send
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = now.getDate()
    const hour = now.getHours()

    // Send expiring reward reminders (daily at 9am)
    const { data: expiringData, error: expiringError } = await supabase
      .rpc('send_expiring_reward_reminders')

    if (expiringError) {
      console.error('Error sending expiring reward reminders:', expiringError)
    } else if (expiringData && expiringData.length > 0) {
      results.expiring_rewards = expiringData[0].emails_queued || 0
    }

    // Send inactive user emails (daily at 9am)
    const { data: inactiveData, error: inactiveError } = await supabase
      .rpc('send_inactive_user_emails')

    if (inactiveError) {
      console.error('Error sending inactive user emails:', inactiveError)
    } else if (inactiveData && inactiveData.length > 0) {
      results.inactive_users = inactiveData[0].emails_queued || 0
    }

    // Send game available reminders (daily at 6pm - hour 18)
    if (hour === 18) {
      const { data: gameData, error: gameError } = await supabase
        .rpc('send_game_available_reminders')

      if (gameError) {
        console.error('Error sending game reminders:', gameError)
      } else if (gameData && gameData.length > 0) {
        results.game_reminders = gameData[0].emails_queued || 0
      }
    }

    // Send anniversary emails (daily at 9am)
    const { data: anniversaryData, error: anniversaryError } = await supabase
      .rpc('send_anniversary_emails')

    if (anniversaryError) {
      console.error('Error sending anniversary emails:', anniversaryError)
    } else if (anniversaryData && anniversaryData.length > 0) {
      results.anniversaries = anniversaryData[0].emails_queued || 0
    }

    // Send weekly summaries (Mondays at 9am - dayOfWeek 1)
    if (dayOfWeek === 1) {
      const { data: weeklyData, error: weeklyError } = await supabase
        .rpc('send_weekly_summary_emails')

      if (weeklyError) {
        console.error('Error sending weekly summaries:', weeklyError)
      } else if (weeklyData && weeklyData.length > 0) {
        results.weekly_summaries = weeklyData[0].emails_queued || 0
      }
    }

    // Send weekend specials (Fridays at 5pm - dayOfWeek 5, hour 17)
    if (dayOfWeek === 5 && hour === 17) {
      const { data: weekendData, error: weekendError } = await supabase
        .rpc('send_weekend_special_emails')

      if (weekendError) {
        console.error('Error sending weekend specials:', weekendError)
      } else if (weekendData && weekendData.length > 0) {
        results.weekend_specials = weekendData[0].emails_queued || 0
      }
    }

    // Send monthly reports (1st of month at 9am)
    if (dayOfMonth === 1) {
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('send_monthly_report_emails')

      if (monthlyError) {
        console.error('Error sending monthly reports:', monthlyError)
      } else if (monthlyData && monthlyData.length > 0) {
        results.monthly_reports = monthlyData[0].emails_queued || 0
      }
    }

    // Send win-back emails (daily at 9am)
    const { data: winBack30Data, error: winBack30Error } = await supabase
      .rpc('send_win_back_30_emails')

    if (winBack30Error) {
      console.error('Error sending win-back 30 emails:', winBack30Error)
    } else if (winBack30Data && winBack30Data.length > 0) {
      results.win_back_30 = winBack30Data[0].emails_queued || 0
    }

    const { data: winBack60Data, error: winBack60Error } = await supabase
      .rpc('send_winback_60_emails')

    if (winBack60Error) {
      console.error('Error sending win-back 60 emails:', winBack60Error)
    } else if (winBack60Data && winBack60Data.length > 0) {
      results.win_back_60 = winBack60Data[0].emails_queued || 0
    }

    // Expire pending rewards and create second chance offers (daily at 9am)
    const { data: expireData, error: expireError } = await supabase
      .rpc('expire_pending_rewards')

    if (expireError) {
      console.error('Error expiring pending rewards:', expireError)
    } else if (expireData && expireData.length > 0) {
      results.expired_rewards = expireData[0].expired_count || 0
      results.second_chance_offers = expireData[0].second_chance_count || 0
    }

    // Send pending rewards reminders (every 3 days)
    const { data: pendingData, error: pendingError } = await supabase
      .rpc('send_pending_rewards_reminders')

    if (pendingError) {
      console.error('Error sending pending rewards reminders:', pendingError)
    } else if (pendingData && pendingData.length > 0) {
      results.pending_rewards_reminders = pendingData[0].emails_queued || 0
    }

    // Send birthday emails (daily at 9am)
    const { data: birthdayData, error: birthdayError } = await supabase
      .rpc('send_birthday_emails')

    if (birthdayError) {
      console.error('Error sending birthday emails:', birthdayError)
    } else if (birthdayData && birthdayData.length > 0) {
      results.birthdays = birthdayData[0].emails_queued || 0
    }

    results.total = results.expiring_rewards + results.inactive_users + 
                    results.game_reminders + results.anniversaries + 
                    results.weekly_summaries + results.weekend_specials + 
                    results.monthly_reports + results.win_back_30 + results.win_back_60 +
                    results.pending_rewards_reminders + results.second_chance_offers + 
                    results.birthdays

    return NextResponse.json({
      success: true,
      message: `Queued ${results.total} reminder emails`,
      details: results
    })
  } catch (error: any) {
    console.error('Send reminders error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send reminders' },
      { status: 500 }
    )
  }
}

// Also allow GET for manual testing
export async function GET(request: Request) {
  return POST(request)
}
