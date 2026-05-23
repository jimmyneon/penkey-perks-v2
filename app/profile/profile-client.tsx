'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, User, Mail, Phone, Calendar, Lock, Trash2, PauseCircle, MapPin, Gift, AlertTriangle, QrCode } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import QRCodeLib from 'qrcode'
import { PushNotificationToggle } from '@/components/push-notification-toggle'

interface ProfileClientProps {
  user: {
    id: string
    email: string
    name: string
    phone: string
    date_of_birth: string
    avatar_url: string
    gps_consent: boolean
    marketing_consent: boolean
  }
}

export function ProfileClient({ user: initialUser }: ProfileClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(initialUser.name)
  const [phone, setPhone] = useState(initialUser.phone)
  const [dateOfBirth, setDateOfBirth] = useState(initialUser.date_of_birth || '')
  const [gpsConsent, setGpsConsent] = useState(initialUser.gps_consent)
  const [marketingConsent, setMarketingConsent] = useState(initialUser.marketing_consent)
  
  // Password change
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Account actions
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  
  // QR Code
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Generate QR code for staff scanning
  useEffect(() => {
    if (showQRDialog) {
      const qrData = `PROFILE-${initialUser.id}`
      QRCodeLib.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#78350F',
          light: '#FFFEF7',
        },
      }).then(setQrCodeUrl)
    }
  }, [showQRDialog, initialUser.id])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          gps_consent: gpsConsent,
          marketing_consent: marketingConsent,
        })
        .eq('id', initialUser.id)

      if (error) throw error

      toast({
        title: '✅ Profile Updated!',
        description: 'Your changes have been saved! 💕',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords don\'t match',
        description: 'Please make sure both passwords are the same',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast({
        title: '🔒 Password Changed!',
        description: 'Your password has been updated successfully! 💕',
      })
      
      setShowPasswordDialog(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePauseAccount = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'paused' })
        .eq('id', initialUser.id)

      if (error) throw error

      toast({
        title: '⏸️ Account Paused',
        description: 'Your account is paused. We\'ll keep your data safe! Come back anytime! 💕',
      })

      // Sign out
      await supabase.auth.signOut()
      router.push('/')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast({
        title: 'Confirmation required',
        description: 'Please type DELETE to confirm',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Call API to delete account and all data
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      toast({
        title: '👋 Account Deleted',
        description: 'Sorry to see you go! All your data has been removed.',
      })

      // Sign out
      await supabase.auth.signOut()
      router.push('/')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-penkey-cream">
      {/* Header */}
      <header className="bg-white border-b border-penkey-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4 max-w-2xl">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-penkey-orange" />
            <h1 className="text-xl font-bold text-penkey-dark">Profile & Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your profile details here 💕
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={initialUser.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  placeholder="+44 7700 900000"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-penkey-gray flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  We'll send you a birthday surprise! 🎉
                </p>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Privacy & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Permissions</CardTitle>
            <CardDescription>
              Manage your data and communication preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="gps"
                checked={gpsConsent}
                onCheckedChange={(checked: boolean) => setGpsConsent(checked)}
                disabled={isLoading}
              />
              <div className="flex-1">
                <Label htmlFor="gps" className="flex items-center gap-2 cursor-pointer font-medium">
                  <MapPin className="w-4 h-4 text-penkey-orange" />
                  Location Services
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Allow GPS to verify you're at Penkey for stamps and check-ins
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="marketing"
                checked={marketingConsent}
                onCheckedChange={(checked: boolean) => setMarketingConsent(checked)}
                disabled={isLoading}
              />
              <div className="flex-1">
                <Label htmlFor="marketing" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Gift className="w-4 h-4 text-penkey-orange" />
                  Marketing Communications
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Receive special offers, birthday treats, and exclusive deals
                </p>
              </div>
            </div>

            <PushNotificationToggle disabled={isLoading} />

            <Button onClick={handleSaveProfile} disabled={isLoading} variant="outline" className="w-full">
              Update Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Staff QR Code */}
        <Card className="border-penkey-border bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-penkey-dark">
              <QrCode className="w-5 h-5 text-penkey-orange" />
              Staff QR Code
            </CardTitle>
            <CardDescription>
              Show this to staff for check-ins, stamps, and rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowQRDialog(true)}
              className="w-full bg-penkey-orange hover:bg-penkey-dark"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Show My QR Code
            </Button>
            <p className="text-xs text-penkey-gray mt-2 text-center">
              Staff can scan this for quick check-ins and stamps
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your password and account security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowPasswordDialog(true)}
              variant="outline"
              className="w-full"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-600">Account Actions</CardTitle>
            <CardDescription>
              Take a break or permanently delete your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setShowPauseDialog(true)}
              variant="outline"
              className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <PauseCircle className="w-4 h-4 mr-2" />
              Pause Account (Keep Data)
            </Button>

            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account Permanently
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isLoading}>
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause Account Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⏸️ Pause Your Account?</DialogTitle>
            <DialogDescription>
              Taking a break? No worries! 💕
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>What happens:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>Your account will be paused</li>
                <li>All your data stays safe (points, stamps, rewards)</li>
                <li>You can reactivate anytime by logging back in</li>
                <li>We'll keep everything ready for your return! 🎉</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePauseAccount} 
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? 'Pausing...' : 'Pause Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Account Permanently?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>⚠️ Warning:</strong>
              </p>
              <ul className="text-sm text-red-600 mt-2 space-y-1 list-disc list-inside">
                <li>All your data will be permanently deleted</li>
                <li>Points, stamps, and rewards will be lost</li>
                <li>This cannot be undone</li>
                <li>You'll need to create a new account to return</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <strong>DELETE</strong> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false)
              setConfirmText('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteAccount} 
              disabled={isLoading || confirmText !== 'DELETE'}
              variant="destructive"
            >
              {isLoading ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-penkey-dark flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-penkey-orange" />
              Your Staff QR Code
            </DialogTitle>
            <DialogDescription className="text-center text-penkey-gray">
              Show this to staff for check-ins, stamps, and rewards
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* QR Code */}
            <div className="bg-white p-6 rounded-xl border-2 border-penkey-border flex items-center justify-center">
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="Staff QR Code" 
                  className="w-full max-w-[250px]" 
                />
              )}
            </div>

            {/* Code Text */}
            <div className="text-center space-y-2">
              <p className="text-xs text-penkey-gray uppercase tracking-wide font-medium">QR Code</p>
              <p className="text-sm font-mono bg-orange-50 border border-penkey-border px-4 py-3 rounded-lg text-penkey-dark font-semibold">
                PROFILE-{initialUser.id}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-orange-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-penkey-dark font-medium mb-2">Staff can use this to:</p>
              <ul className="text-xs text-penkey-gray space-y-1">
                <li>✓ Process your daily check-in</li>
                <li>✓ Add coffee stamps</li>
                <li>✓ Award bonus points</li>
              </ul>
            </div>

            {/* Close Button */}
            <Button 
              onClick={() => setShowQRDialog(false)}
              className="w-full bg-penkey-orange hover:bg-penkey-dark"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
