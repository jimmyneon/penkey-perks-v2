'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Bell } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  priority: number
  title: string
  message: string
  icon: string | null
  variant: string
  dismissible: boolean
  active: boolean
  conditions: any
  start_date: string | null
  end_date: string | null
}

interface NotificationsAdminProps {
  notifications: Notification[]
}

export function NotificationsAdmin({ notifications: initialNotifications }: NotificationsAdminProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const router = useRouter()

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/admin/notifications/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive }),
      })

      if (!response.ok) throw new Error('Failed to toggle notification')

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, active: !currentActive } : n
      ))
    } catch (error) {
      console.error('Error toggling notification:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/notifications/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) throw new Error('Failed to delete notification')

      setNotifications(notifications.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getVariantColor = (variant: string) => {
    switch (variant) {
      case 'reward': return 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d]'
      case 'campaign': return 'bg-[#d1fae5] text-[#065f46] border-[#6ee7b7]'
      case 'info': return 'bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]'
      default: return 'bg-[#f3f4f6] text-[#374151] border-[#d1d5db]'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reward': return 'bg-[#f5f3ed] text-[#8f7f6a]'
      case 'campaign': return 'bg-[#dcfce7] text-[#4a8c66]'
      case 'voucher': return 'bg-[#ffedd5] text-[#f97316]'
      case 'visit': return 'bg-[#e0e7ff] text-[#4f46e5]'
      default: return 'bg-[#f5f3ed] text-[#78716c]'
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Header */}
      <header className="bg-white border-b border-[#e7e5e4] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-[#f97316]" />
              <h1 className="text-xl font-bold text-[#1c1917]">Notification Management</h1>
            </div>
          </div>
          <Link href="/admin/notifications/create">
            <Button className="bg-[#4a8c66] hover:bg-[#3d7356] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Notification
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Card className="mb-6 border-[#e7e5e4]">
          <CardHeader>
            <CardTitle className="text-[#1c1917]">Notification System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-[#f5f3ed] rounded-lg">
                <p className="text-2xl font-bold text-[#4a8c66]">{notifications.length}</p>
                <p className="text-sm text-[#78716c]">Total</p>
              </div>
              <div className="p-4 bg-[#dcfce7] rounded-lg">
                <p className="text-2xl font-bold text-[#4a8c66]">
                  {notifications.filter(n => n.active).length}
                </p>
                <p className="text-sm text-[#78716c]">Active</p>
              </div>
              <div className="p-4 bg-[#f5f3ed] rounded-lg">
                <p className="text-2xl font-bold text-[#78716c]">
                  {notifications.filter(n => !n.active).length}
                </p>
                <p className="text-sm text-[#78716c]">Inactive</p>
              </div>
              <div className="p-4 bg-[#ffedd5] rounded-lg">
                <p className="text-2xl font-bold text-[#f97316]">
                  {notifications.filter(n => !n.dismissible).length}
                </p>
                <p className="text-sm text-[#78716c]">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={!notification.active ? 'opacity-60 border-[#e7e5e4]' : 'border-[#e7e5e4]'}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs border border-[#e7e5e4] text-[#78716c]">
                        Priority: {notification.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVariantColor(notification.variant)}`}>
                        {notification.variant}
                      </span>
                      {!notification.dismissible && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Critical
                        </span>
                      )}
                      {!notification.active && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
                        {notification.icon && <span>{notification.icon}</span>}
                        {notification.title}
                      </h3>
                      <p className="text-[#78716c] mt-1">{notification.message}</p>
                    </div>

                    {notification.conditions && Object.keys(notification.conditions).length > 0 && (
                      <div className="text-xs text-[#78716c] bg-[#f5f3ed] p-2 rounded">
                        <strong>Conditions:</strong> {JSON.stringify(notification.conditions)}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleActive(notification.id, notification.active)}
                      title={notification.active ? 'Deactivate' : 'Activate'}
                    >
                      {notification.active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Link href={`/admin/notifications/edit/${notification.id}`}>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Delete"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="mt-6 border-[#4a8c66] bg-[#f5f3ed]">
          <CardContent className="p-6">
            <h3 className="font-bold text-[#1c1917] mb-2">How It Works</h3>
            <ul className="text-sm text-[#78716c] space-y-1 list-disc list-inside">
              <li>Notifications are shown in priority order (1 = highest)</li>
              <li>Only one notification is shown at a time</li>
              <li>Conditions determine when a notification appears</li>
              <li>Critical notifications (not dismissible) can't be closed by users</li>
              <li>Dismissed notifications reset after 24 hours</li>
              <li>Inactive notifications are hidden from customers</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
