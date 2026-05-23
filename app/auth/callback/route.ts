import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      console.log('[Auth Callback] User authenticated:', data.user.id)
      
      // Wait a moment for the database trigger to create the user profile
      // The handle_new_user trigger automatically creates the profile
      await new Promise(resolve => setTimeout(resolve, 1000)) // Increased to 1 second

      // Get user profile with all fields
      let { data: profile } = await supabase
        .from('users')
        .select('role, phone, date_of_birth, created_at')
        .eq('id', data.user.id)
        .single()

      // SAFETY CHECK: If profile doesn't exist, create it manually
      // This handles cases where the trigger might have failed
      if (!profile) {
        console.log('[Auth Callback] Profile not found, creating manually for user:', data.user.id)
        
        // Create profile directly
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url
          })
        
        if (insertError) {
          console.error('[Auth Callback] Failed to create profile:', insertError)
          // Continue anyway - let onboarding handle it
        } else {
          console.log('[Auth Callback] Profile created successfully')
          
          // Award signup bonus
          try {
            await supabase.rpc('add_points', {
              p_user_id: data.user.id,
              p_amount: 250,
              p_source: 'signup',
              p_description: 'Welcome bonus'
            })
            console.log('[Auth Callback] Signup bonus awarded')
          } catch (pointsError) {
            console.error('[Auth Callback] Failed to award signup bonus:', pointsError)
          }
        }
        
        // Retry fetching the profile
        const { data: retryProfile } = await supabase
          .from('users')
          .select('role, phone, date_of_birth, created_at')
          .eq('id', data.user.id)
          .single()
        profile = retryProfile
      }

      // If user doesn't have a role and is in admin list, add them to staff
      if (!profile?.role || profile.role === 'customer') {
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
        if (adminEmails.includes(data.user.email!)) {
          await supabase.from('staff').insert({
            user_id: data.user.id,
            role: 'owner',
          })
          
          // Redirect to staff dashboard
          return NextResponse.redirect(new URL('/staff/dashboard', requestUrl.origin))
        }
      }

      // Check if staff or admin
      if (profile?.role === 'admin' || profile?.role === 'staff') {
        return NextResponse.redirect(new URL('/staff/dashboard', requestUrl.origin))
      }

      // Check if this is a new user (created within last 2 minutes) or missing profile info
      const isNewUser = profile?.created_at && 
        (new Date().getTime() - new Date(profile.created_at).getTime()) < 120000 // 2 minutes
      
      const needsOnboarding = !profile?.phone && !profile?.date_of_birth

      console.log('[Auth Callback] Redirect decision:', {
        isNewUser,
        needsOnboarding,
        role: profile?.role,
        destination: isNewUser || needsOnboarding ? 'onboarding' : next
      })

      // Redirect new users or users without profile info to onboarding
      if (isNewUser || needsOnboarding) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  console.log('[Auth Callback] No code or auth failed, redirecting to login')
  // Return to login if something went wrong
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
