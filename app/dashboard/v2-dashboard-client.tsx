'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Gift, Coffee, QrCode, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import QRCodeLib from 'qrcode'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface V2DashboardClientProps {
  user: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
  }
  userRole?: string
  stats: {
    stamps: number
    lastVisit: string | null
    memberSince: string
  }
  userRewards: any[]
}

export function V2DashboardClient({
  user,
  userRole = 'customer',
  stats,
  userRewards,
}: V2DashboardClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showProfileQR, setShowProfileQR] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const generateQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        type: 'customer',
        id: user.id,
        email: user.email,
        timestamp: Date.now(),
      })
      const url = await QRCodeLib.toDataURL(qrData)
      setQrCodeUrl(url)
      setShowProfileQR(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      })
    }
  }

  const activeRewards = userRewards.filter(r => r.status === 'active')

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coffee className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Penkey Perks
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {userRole === 'staff' || userRole === 'owner' ? (
                <Link href="/staff">
                  <Button variant="outline" size="sm">
                    Staff Portal
                  </Button>
                </Link>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome, {user.name}!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <User className="h-8 w-8 text-orange-600" />
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Member since {new Date(stats.memberSince).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.lastVisit 
                    ? `Last visit: ${new Date(stats.lastVisit).toLocaleDateString()}`
                    : 'No visits yet'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stamp Card Section */}
        <Card className="mb-6 border-orange-200 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-orange-600" />
              Coffee Stamp Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-orange-600 mb-2">
                {stats.stamps} / 5
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Collect 5 stamps for a free coffee!
              </p>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      i <= stats.stamps
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {i <= stats.stamps ? <Coffee className="w-5 h-5" /> : i}
                  </div>
                ))}
              </div>
              <Button
                onClick={generateQRCode}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Show My QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-orange-600" />
              My Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeRewards.length > 0 ? (
              <div className="space-y-3">
                {activeRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                  >
                    <p className="font-medium">{reward.rewards?.name || 'Reward'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {reward.rewards?.description || 'Show QR to redeem'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active rewards yet</p>
                <p className="text-sm">Collect more stamps to unlock rewards!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/rewards">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Gift className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="font-medium">View Rewards</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/profile">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="font-medium">My Profile</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showProfileQR} onOpenChange={setShowProfileQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-64 h-64 border-4 border-white rounded-lg shadow-lg"
              />
            )}
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              Show this QR code to staff to add stamps or redeem rewards
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
