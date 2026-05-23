'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users, Copy, Share2, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useToast } from '@/hooks/use-toast'

interface ReferralsClientProps {
  referralUrl: string
  referralCode: string
  stats: {
    total: number
    confirmed: number
    pending: number
  }
  referrals: any[]
}

export function ReferralsClient({ referralUrl, referralCode, stats, referrals }: ReferralsClientProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    QRCode.toDataURL(referralUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#2C3E50',
        light: '#FFFEF7',
      },
    }).then(setQrCodeUrl)
  }, [referralUrl])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl)
    toast({
      title: 'Copied! 📋',
      description: 'Referral link copied to clipboard',
    })
  }

  const shareViaWhatsApp = () => {
    const text = `Join me at Penkey Perks and earn rewards! 🦆 Use my referral link: ${referralUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const shareViaTwitter = () => {
    const text = `Join me at Penkey Perks and earn rewards! 🦆`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`, '_blank')
  }

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, '_blank')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Penkey Perks',
          text: 'Join me at Penkey Perks and earn rewards! 🦆',
          url: referralUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-penkey-orange" />
            <h1 className="text-xl font-bold">Referrals</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-penkey-orange">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-success-green">{stats.confirmed}</div>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-penkey-orange">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Referrals Work</CardTitle>
            <CardDescription>Earn rewards by inviting friends!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-penkey-orange flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Share your link</p>
                <p className="text-sm text-muted-foreground">
                  Send your unique referral link to friends
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-penkey-orange flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-medium">They sign up</p>
                <p className="text-sm text-muted-foreground">
                  Your friend creates an account and gets 1 bonus duck
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-penkey-orange flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="font-medium">You both win!</p>
                <p className="text-sm text-muted-foreground">
                  When they check in for the first time, you get 3 ducks! 🦆
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>Share this link with friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={referralUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-grey-light rounded-lg text-sm font-mono"
              />
              <Button size="icon" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={shareViaWhatsApp}>
                <Share2 className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button variant="outline" onClick={handleNativeShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Let friends scan to join instantly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-6 rounded-lg flex items-center justify-center">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="Referral QR Code" className="w-full max-w-[250px]" />
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Code: {referralCode}
            </p>
          </CardContent>
        </Card>

        {/* Referral History */}
        {referrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
              <CardDescription>Your recent referrals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 bg-grey-light rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {referral.confirmed ? (
                        <CheckCircle2 className="w-5 h-5 text-success-green" />
                      ) : (
                        <Clock className="w-5 h-5 text-penkey-orange" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {referral.referee_email || 'Pending signup'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {referral.confirmed ? (
                        <span className="text-success-green">+3 🦆</span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
