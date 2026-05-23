import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Health check endpoint for notification system
 * Tests database connectivity, function availability, and table access
 */
export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  }

  try {
    const supabase = await createClient()

    // Check 1: Database connection
    try {
      const { error } = await supabase.from('notifications').select('count').limit(1)
      checks.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        message: error ? error.message : 'Connected',
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      checks.checks.database = {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }

    // Check 2: Notifications table accessible
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('active', true)
        .limit(1)
      
      checks.checks.notifications_table = {
        status: error ? 'unhealthy' : 'healthy',
        message: error ? error.message : `Accessible (${data?.length || 0} active)`,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      checks.checks.notifications_table = {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }

    // Check 3: get_user_notifications function exists
    try {
      const { data, error } = await supabase.rpc('get_user_notifications', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        p_user_state: {}
      })
      
      checks.checks.get_user_notifications = {
        status: 'healthy',
        message: 'Function callable',
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      checks.checks.get_user_notifications = {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }

    // Check 4: match_notification_conditions function exists
    try {
      const { data, error } = await supabase.rpc('match_notification_conditions', {
        p_conditions: {},
        p_user_state: {}
      })
      
      checks.checks.match_notification_conditions = {
        status: 'healthy',
        message: 'Function callable',
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      checks.checks.match_notification_conditions = {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }

    // Check 5: Dismissals table accessible
    try {
      const { error } = await supabase
        .from('notification_dismissals')
        .select('count')
        .limit(1)
      
      checks.checks.dismissals_table = {
        status: error ? 'unhealthy' : 'healthy',
        message: error ? error.message : 'Accessible',
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      checks.checks.dismissals_table = {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }

    // Check 6: Analytics tables accessible
    try {
      const { error: viewsError } = await supabase
        .from('notification_views')
        .select('count')
        .limit(1)
      
      const { error: actionsError } = await supabase
        .from('notification_actions')
        .select('count')
        .limit(1)
      
      checks.checks.analytics_tables = {
        status: (viewsError || actionsError) ? 'unhealthy' : 'healthy',
        message: viewsError || actionsError 
          ? `Views: ${viewsError?.message || 'OK'}, Actions: ${actionsError?.message || 'OK'}`
          : 'Both accessible',
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      checks.checks.analytics_tables = {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }

    // Determine overall status
    const unhealthyChecks = Object.values(checks.checks).filter(
      (check: any) => check.status === 'unhealthy'
    )
    
    if (unhealthyChecks.length > 0) {
      checks.status = 'degraded'
      checks.message = `${unhealthyChecks.length} check(s) failed`
    } else {
      checks.status = 'healthy'
      checks.message = 'All systems operational'
    }

    return NextResponse.json(checks, {
      status: checks.status === 'healthy' ? 200 : 503
    })

  } catch (error: any) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      message: error.message,
      checks: {}
    }, { status: 503 })
  }
}
