import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'

export default async function StaffTodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is staff or admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/staff/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#4B3028]">
            Today's Activity
          </h1>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-[#F0EBE5] shadow-[0_4px_20px_rgba(36,21,26,0.15)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#4B3028]">
              <TrendingUp className="w-6 h-6 text-[#8D123F]" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <TrendingUp className="w-24 h-24 mx-auto mb-4 text-[#F4D8CC]" />
            <h3 className="text-xl font-semibold mb-2 text-[#4B3028]">Coming Soon!</h3>
            <p className="text-[#4B3028] mb-6">
              Detailed activity timeline will be added in a future update.
            </p>
            <p className="text-sm text-[#4B3028]/70">
              For now, you can see today's stats on the staff dashboard.
            </p>
            <div className="mt-6">
              <Link href="/staff/dashboard">
                <Button className="bg-[#E48A3A] hover:bg-[#D47A2A]">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
