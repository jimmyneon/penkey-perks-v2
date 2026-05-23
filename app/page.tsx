import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Coffee, Gift, Users } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check if user is staff or admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Root page - User ID:', user.id)
    console.log('Root page - Profile:', profile)
    console.log('Root page - Profile Error:', profileError)
    console.log('Root page - Role:', profile?.role)

    // Redirect based on role
    if (profile?.role === 'admin' || profile?.role === 'staff') {
      console.log('Root page - Redirecting to STAFF dashboard')
      redirect('/staff/dashboard')
    } else {
      console.log('Root page - Redirecting to CUSTOMER dashboard')
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-12">
        {/* Logo/Header */}
        <div className="space-y-6">
          <div className="inline-block">
            <div className="w-20 h-20 rounded-full bg-penkey-orange/10 flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-12 h-12 text-penkey-orange" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-penkey-dark">
            Penkey Perks
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-penkey-gray max-w-xl mx-auto">
            Rewards made with love, just like our coffee
          </p>
        </div>

        {/* Value Prop */}
        <p className="text-lg text-penkey-gray max-w-xl mx-auto leading-relaxed">
          Join our community of loyal customers and enjoy exclusive rewards, 
          special offers, and surprises crafted just for you.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <Link href="/login" className="block">
            <Button size="lg" className="text-lg h-14 px-12">
              Start Earning Rewards
            </Button>
          </Link>
          
          <p className="text-sm text-penkey-gray/70">
            Your neighbors at Penkey Délicaf & Gifts
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 pt-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-penkey-orange/10 flex items-center justify-center mx-auto">
              <Coffee className="w-8 h-8 text-penkey-orange" />
            </div>
            <h3 className="font-heading font-semibold text-penkey-dark">Daily Visits</h3>
            <p className="text-sm text-penkey-gray">Earn rewards with every visit to our café</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-penkey-orange/10 flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8 text-penkey-orange" />
            </div>
            <h3 className="font-heading font-semibold text-penkey-dark">Exclusive Perks</h3>
            <p className="text-sm text-penkey-gray">Special treats for our loyal customers</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-penkey-orange/10 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-penkey-orange" />
            </div>
            <h3 className="font-heading font-semibold text-penkey-dark">Share the Love</h3>
            <p className="text-sm text-penkey-gray">Refer friends and earn together</p>
          </div>
        </div>
      </div>
    </div>
  )
}
