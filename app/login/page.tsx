'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Coffee, Gift } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Get redirect URL and referral code from query params
  const redirectUrl = searchParams.get('redirect') || '/dashboard'
  const referralCode = searchParams.get('ref')
  
  console.log('Login page - Redirect URL:', redirectUrl)
  console.log('Login page - Referral Code:', referralCode)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        })

        if (error) throw error

        if (data.user) {
          // User profile is created automatically by database trigger
          // Wait a moment for the trigger to complete
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // SAFETY CHECK: Ensure profile was created
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single()
          
          if (!profile) {
            console.log('Profile not found for new user', data.user.id, '- calling ensure_user_profile')
            const { error: ensureError } = await supabase.rpc('ensure_user_profile', {
              p_user_id: data.user.id
            })
            
            if (ensureError) {
              console.error('Failed to ensure user profile:', ensureError)
            }
          }
          
          // Check if user should be admin
          const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || []
          if (adminEmails.includes(email)) {
            const { error: staffError } = await supabase
              .from('staff')
              .insert({
                user_id: data.user.id,
                role: 'owner',
              })

            if (staffError) console.error('Staff creation error:', staffError)
          }

          // Handle referral code if present
          let referralSuccess = false
          if (referralCode) {
            console.log('Processing referral code:', referralCode)
            try {
              const response = await fetch('/api/referrals/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referralCode }),
              })
              
              const result = await response.json()
              
              if (response.ok) {
                console.log('Referral claimed successfully:', result)
                referralSuccess = true
                toast({
                  title: 'Referral Applied',
                  description: result.message || 'Thanks for using a referral link!',
                })
              } else {
                console.error('Failed to claim referral:', result)
                toast({
                  title: 'Referral Not Applied',
                  description: result.message || result.error || 'Could not apply referral code',
                  variant: 'destructive',
                })
              }
            } catch (error) {
              console.error('Error claiming referral:', error)
              toast({
                title: 'Referral Error',
                description: 'Could not process referral code',
                variant: 'destructive',
              })
            }
          }

          // Only show welcome toast if no referral or referral failed
          if (!referralCode || !referralSuccess) {
            toast({
              title: 'Welcome to Penkey Perks!',
              description: 'Let\'s complete your profile.',
            })
          }

          // Redirect to onboarding for new users
          router.push('/onboarding')
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        })

        // Check if staff or admin
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        // Redirect based on role
        console.log('Login - User ID:', data.user.id)
        console.log('Login - Profile:', profile)
        console.log('Login - Profile Error:', profileError)
        console.log('Login - User role:', profile?.role)
        console.log('Login - Redirect URL:', redirectUrl)
        
        if (profile?.role === 'admin' || profile?.role === 'staff') {
          console.log('Login - User is staff/admin, redirecting to staff dashboard')
          router.push('/staff/dashboard')
        } else {
          console.log('Login - User is customer, redirecting to:', redirectUrl)
          router.push(redirectUrl)
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    try {
      // Store referral code in localStorage before OAuth redirect
      if (referralCode) {
        localStorage.setItem('referralCode', referralCode)
        console.log('Stored referral code in localStorage:', referralCode)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign in with Google',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!email) {
        throw new Error('Please enter your email address')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast({
        title: 'Check your email!',
        description: 'We sent you a password reset link.',
      })

      setIsForgotPassword(false)
      setEmail('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="bg-white rounded-2xl border border-[#F3DCD4] shadow-lg w-full max-w-md">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F4D8CC] flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-10 h-10 text-[#8D123F]" />
            </div>
            <h2 className="text-3xl font-bold text-[#4B3028] mb-2">
              {isForgotPassword ? 'Reset Password' : isSignUp ? 'Join the Flock' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-[#4B3028]">
              {isForgotPassword
                ? 'Enter your email to receive a password reset link'
                : isSignUp
                ? 'Create your account to start earning rewards'
                : 'Sign in to access your rewards'}
            </p>
          </div>
          <div className="p-6 space-y-4">
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleEmailAuth} className="space-y-4">
              {isSignUp && !isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#4B3028]">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#4B3028]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[#4B3028]">Password</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-[#E48A3A] hover:underline"
                        disabled={isLoading}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-[#E48A3A] hover:bg-[#D47A2A] text-white" disabled={isLoading}>
                {isLoading ? 'Loading...' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
            </form>

            {!isForgotPassword && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#F0EBE5]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#FFFDFC] px-2 text-[#4B3028]/70">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#F0EBE5] text-[#4B3028] hover:bg-[#F4D8CC]"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
            </>
          )}

          <div className="text-center text-sm space-y-2">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false)
                  setEmail('')
                }}
                className="text-[#E48A3A] hover:underline"
                disabled={isLoading}
              >
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#E48A3A] hover:underline"
                disabled={isLoading}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
