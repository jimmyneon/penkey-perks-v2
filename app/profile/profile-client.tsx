'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, User, Mail, Phone, Calendar, Lock, Trash2, PauseCircle, MapPin, Gift, AlertTriangle, QrCode, ChevronRight, Bell, Shield, X } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import QRCodeLib from 'qrcode'
import { BottomNav } from '@/components/bottom-nav'

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

  const handleSaveProfile = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          preferences: {
            gps_consent: gpsConsent,
            marketing_consent: marketingConsent,
          },
        })
        .eq('id', initialUser.id)

      if (error) throw error

      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved',
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
        .from('profiles')
        .update({ preferences: { status: 'paused' } })
        .eq('id', initialUser.id)

      if (error) throw error

      toast({
        title: 'Account Paused',
        description: 'Your account is paused. We\'ll keep your data safe! Come back anytime!',
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-4">
          <h1 className="text-xl font-bold text-[#4B3028]">Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-6">
        {/* Profile Section */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Personal Info</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Name */}
            <button
              onClick={() => document.getElementById('name')?.focus()}
              className="w-full px-4 py-3.5 flex items-center justify-between border-b border-gray-100 active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-[#4B3028]">{name || 'Not set'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
            
            {/* Name Input (hidden by default, shown when clicked) */}
            <div className="px-4 py-3 border-b border-gray-100">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="Your name"
                className="border-0 px-0 focus-visible:ring-0 pl-8"
              />
            </div>

            {/* Email */}
            <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-[#4B3028]">{initialUser.email}</p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-[#4B3028]">{phone || 'Not set'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>

            {/* Phone Input */}
            <div className="px-4 py-3 border-b border-gray-100">
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                placeholder="+44 7700 900000"
                className="border-0 px-0 focus-visible:ring-0 pl-8"
              />
            </div>

            {/* Birthday */}
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Birthday</p>
                  <p className="text-sm font-medium text-[#4B3028]">
                    {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not set'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>

            {/* Birthday Input */}
            <div className="px-4 py-3">
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={isLoading}
                className="border-0 px-0 focus-visible:ring-0 pl-8"
              />
            </div>
          </div>

          <Button 
            onClick={handleSaveProfile} 
            disabled={isLoading}
            className="w-full mt-4 bg-[#7B1234] hover:bg-[#660E2B] text-white"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Preferences Section */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Preferences</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Location */}
            <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[#4B3028]">Location Services</p>
                  <p className="text-xs text-gray-500">For check-ins and stamps</p>
                </div>
              </div>
              <button
                onClick={() => setGpsConsent(!gpsConsent)}
                disabled={isLoading}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  gpsConsent ? 'bg-[#7B1234]' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  gpsConsent ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Marketing */}
            <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[#4B3028]">Marketing</p>
                  <p className="text-xs text-gray-500">Offers and updates</p>
                </div>
              </div>
              <button
                onClick={() => setMarketingConsent(!marketingConsent)}
                disabled={isLoading}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  marketingConsent ? 'bg-[#7B1234]' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  marketingConsent ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Notifications */}
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[#4B3028]">Notifications</p>
                  <p className="text-xs text-gray-500">Push notifications</p>
                </div>
              </div>
              <button
                disabled={isLoading}
                className={`w-12 h-7 rounded-full p-1 transition-colors bg-gray-300`}
              >
                <div className="w-5 h-5 rounded-full bg-white" />
              </button>
            </div>
          </div>

          <Button 
            onClick={handleSaveProfile} 
            disabled={isLoading}
            className="w-full mt-4 bg-gradient-to-br from-[#E48A3A] to-[#D47A2A] hover:from-[#D47A2A] hover:to-[#C46A1A] text-white font-semibold h-12"
          >
            Update Preferences
          </Button>
        </div>

        {/* QR Code Section */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Your QR Code</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowQRDialog(true)}
              className="w-full px-4 py-3.5 flex items-center justify-between active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-[#8D123F]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[#4B3028]">Show QR Code</p>
                  <p className="text-xs text-gray-500">For staff to scan</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Security</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="w-full px-4 py-3.5 flex items-center justify-between active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[#4B3028]">Change Password</p>
                  <p className="text-xs text-gray-500">Update your password</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Account Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Account</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowPauseDialog(true)}
              className="w-full px-4 py-3.5 flex items-center justify-between border-b border-gray-100 active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <PauseCircle className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[#4B3028]">Pause Account</p>
                  <p className="text-xs text-gray-500">Keep your data safe</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>

            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full px-4 py-3.5 flex items-center justify-between active:bg-red-50"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-600">Delete Account</p>
                  <p className="text-xs text-gray-500">Permanently delete all data</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#4B3028]">Change Password</DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter your new password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-[#4B3028]">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-[#4B3028]">Confirm Password</Label>
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
            <Button onClick={handleChangePassword} disabled={isLoading} className="bg-[#8D123F] hover:bg-[#A8224E]">
              {isLoading ? 'Changing...' : 'Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause Account Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#4B3028]">Pause Account?</DialogTitle>
            <DialogDescription className="text-gray-500">
              Your data will be kept safe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Your account will be paused
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  All your data stays safe
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  You can reactivate anytime
                </li>
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
              {isLoading ? 'Pausing...' : 'Pause'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Account?
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              This cannot be undone
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <ul className="text-sm text-red-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  All your data will be deleted
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  Points and rewards will be lost
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  This cannot be undone
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete" className="text-[#4B3028]">
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
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-[#4B3028] flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-[#8D123F]" />
              Your QR Code
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500">
              Show this to staff
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* QR Code */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 flex items-center justify-center">
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
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">QR Code</p>
              <p className="text-sm font-mono bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg text-[#4B3028] font-semibold">
                PROFILE-{initialUser.id}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-[#4B3028] font-medium mb-2">Staff can use this to:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Process check-ins</li>
                <li>• Add stamps</li>
                <li>• Award points</li>
              </ul>
            </div>

            {/* Close Button */}
            <Button 
              onClick={() => setShowQRDialog(false)}
              className="w-full bg-[#8D123F] hover:bg-[#A8224E]"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  )
}
