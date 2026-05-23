import { NotificationForm } from '@/components/admin/notification-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EditNotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch notification
  const { data: notification, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !notification) {
    redirect('/admin/notifications')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4 max-w-4xl">
          <Link href="/admin/notifications">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Notification</h1>
            <p className="text-sm text-gray-600">Update notification settings</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <NotificationForm mode="edit" initialData={notification} />
      </main>
    </div>
  )
}
