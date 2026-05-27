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
      // Get current profile to preserve existing preferences
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', initialUser.id)
        .single()

      const existingPreferences = currentProfile?.preferences || {}

      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          preferences: {
            ...existingPreferences,
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

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      disabled={isLoading}
      className={`w-[46px] h-[26px] rounded-full p-[3px] transition-colors duration-200 flex-shrink-0 ${
        on ? 'bg-[#2C1810]' : 'bg-[#D8CEC8]'
      }`}
    >
      <div className={`w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
        on ? 'translate-x-[20px]' : 'translate-x-0'
      }`} />
    </button>
  )

  const Row = ({ icon: Icon, iconColor = '#9A7A6A', label, value, onPress, last = false, danger = false }: any) => (
    <button
      onClick={onPress}
      className={`w-full px-4 flex items-center gap-3 min-h-[50px] active:bg-[#F5EFE9] transition-colors ${
        !last ? 'border-b border-[#F0E8E2]' : ''
      }`}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" style={{ color: iconColor }} />
      <span className={`flex-1 text-[14px] font-medium text-left ${
        danger ? 'text-red-500' : 'text-[#2C1810]'
      }`}>{label}</span>
      {value && <span className="text-[13px] text-[#9A7A6A] max-w-[140px] truncate text-right">{value}</span>}
      <ChevronRight className="w-4 h-4 text-[#D8CEC8] flex-shrink-0" />
    </button>
  )

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-bold text-[#9A7A6A] uppercase tracking-widest px-1 mb-1.5">{children}</p>
  )

  return (
    <div className="min-h-screen bg-[#F5EFE9]">
      {/* Header */}
      <header className="bg-[#F5EFE9] pt-12 pb-2 px-5">
        <h1 className="text-[26px] font-extrabold text-[#2C1810] tracking-tight">Profile</h1>
      </header>

      <main className="px-4 pb-28 space-y-5">
        {/* Personal Info */}
        <div>
          <SectionLabel>Personal Info</SectionLabel>
          <div className="bg-white rounded-[16px] overflow-hidden shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
            <div className="px-4 flex items-center gap-3 min-h-[50px] border-b border-[#F0E8E2]">
              <User className="w-[18px] h-[18px] text-[#9A7A6A] flex-shrink-0" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="Your name"
                className="flex-1 text-[14px] font-medium text-[#2C1810] bg-transparent outline-none placeholder:text-[#C4AFA8] py-3"
              />
            </div>
            <div className="px-4 flex items-center gap-3 min-h-[50px] border-b border-[#F0E8E2]">
              <Mail className="w-[18px] h-[18px] text-[#9A7A6A] flex-shrink-0" />
              <span className="flex-1 text-[14px] text-[#9A7A6A] py-3 select-all">{initialUser.email}</span>
            </div>
            <div className="px-4 flex items-center gap-3 min-h-[50px] border-b border-[#F0E8E2]">
              <Phone className="w-[18px] h-[18px] text-[#9A7A6A] flex-shrink-0" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                placeholder="Phone number"
                className="flex-1 text-[14px] font-medium text-[#2C1810] bg-transparent outline-none placeholder:text-[#C4AFA8] py-3"
              />
            </div>
            <div className="px-4 flex items-center gap-3 min-h-[50px]">
              <Calendar className="w-[18px] h-[18px] text-[#9A7A6A] flex-shrink-0" />
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={isLoading}
                className="flex-1 text-[14px] font-medium text-[#2C1810] bg-transparent outline-none py-3"
              />
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={isLoading}
            className="w-full mt-2.5 py-3.5 bg-[#2C1810] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {isLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Preferences */}
        <div>
          <SectionLabel>Preferences</SectionLabel>
          <div className="bg-white rounded-[16px] overflow-hidden shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
            <div className="px-4 flex items-center gap-3 min-h-[52px] border-b border-[#F0E8E2]">
              <MapPin className="w-[18px] h-[18px] text-[#9A7A6A] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[14px] font-medium text-[#2C1810]">Location Services</p>
                <p className="text-[11px] text-[#9A7A6A]">For check-ins and stamps</p>
              </div>
              <Toggle on={gpsConsent} onToggle={() => setGpsConsent(!gpsConsent)} />
            </div>
            <div className="px-4 flex items-center gap-3 min-h-[52px] border-b border-[#F0E8E2]">
              <Gift className="w-[18px] h-[18px] text-[#9A7A6A] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[14px] font-medium text-[#2C1810]">Marketing</p>
                <p className="text-[11px] text-[#9A7A6A]">Offers and updates</p>
              </div>
              <Toggle on={marketingConsent} onToggle={() => setMarketingConsent(!marketingConsent)} />
            </div>
            <div className="px-4 flex items-center gap-3 min-h-[52px]">
              <Bell className="w-[18px] h-[18px] text-[#9A7A6A] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[14px] font-medium text-[#2C1810]">Push Notifications</p>
                <p className="text-[11px] text-[#9A7A6A]">Alerts and reminders</p>
              </div>
              <Toggle on={false} onToggle={() => {}} />
            </div>
          </div>
        </div>

        {/* QR + Security */}
        <div>
          <SectionLabel>Quick Actions</SectionLabel>
          <div className="bg-white rounded-[16px] overflow-hidden shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
            <Row icon={QrCode} iconColor="#7B1234" label="Show My QR Code" value="For staff" onPress={() => setShowQRDialog(true)} />
            <Row icon={Lock} label="Change Password" last onPress={() => setShowPasswordDialog(true)} />
          </div>
        </div>

        {/* Account */}
        <div>
          <SectionLabel>Account</SectionLabel>
          <div className="bg-white rounded-[16px] overflow-hidden shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
            <Row icon={PauseCircle} iconColor="#E48A3A" label="Pause Account" value="Keep data safe" onPress={() => setShowPauseDialog(true)} />
            <Row icon={Trash2} iconColor="#EF4444" label="Delete Account" danger last onPress={() => setShowDeleteDialog(true)} />
          </div>
        </div>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-[#FAF8F5] border-0 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold">Change Password</DialogTitle>
            <DialogDescription className="text-[#9A7A6A] text-[13px]">Enter a new password below</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pb-1">
            <div className="bg-white rounded-[14px] overflow-hidden shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
              <div className="px-4 flex items-center gap-3 min-h-[50px] border-b border-[#F0E8E2]">
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="flex-1 text-[14px] font-medium text-[#2C1810] bg-transparent outline-none placeholder:text-[#C4AFA8] py-3" />
              </div>
              <div className="px-4 flex items-center gap-3 min-h-[50px]">
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="flex-1 text-[14px] font-medium text-[#2C1810] bg-transparent outline-none placeholder:text-[#C4AFA8] py-3" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPasswordDialog(false)} className="flex-1 py-3 bg-[#F0E8E2] text-[#6B4C3B] text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all">Cancel</button>
              <button onClick={handleChangePassword} disabled={isLoading} className="flex-1 py-3 bg-[#2C1810] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-60">{isLoading ? 'Saving…' : 'Change'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pause Account Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-[#FAF8F5] border-0 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold">Pause Account?</DialogTitle>
            <DialogDescription className="text-[#9A7A6A] text-[13px]">Your data stays safe while paused</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pb-1">
            <div className="bg-[#FFF5EB] rounded-[14px] p-4 space-y-2">
              {['Your account will be paused', 'All your data stays safe', 'You can reactivate anytime'].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E48A3A] flex-shrink-0" />
                  <span className="text-[13px] text-[#6B4C3B]">{t}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPauseDialog(false)} className="flex-1 py-3 bg-[#F0E8E2] text-[#6B4C3B] text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all">Cancel</button>
              <button onClick={handlePauseAccount} disabled={isLoading} className="flex-1 py-3 bg-[#E48A3A] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-60">{isLoading ? 'Pausing…' : 'Pause'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-[#FAF8F5] border-0 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Account?
            </DialogTitle>
            <DialogDescription className="text-[#9A7A6A] text-[13px]">This action is permanent and cannot be undone</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pb-1">
            <div className="bg-red-50 rounded-[14px] p-4 space-y-2">
              {['All your data will be permanently deleted', 'Points and rewards will be lost', 'This cannot be undone'].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-[13px] text-red-600">{t}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[14px] px-4 min-h-[50px] flex items-center shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder='Type DELETE to confirm' className="flex-1 text-[14px] font-medium text-[#2C1810] bg-transparent outline-none placeholder:text-[#C4AFA8] py-3" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowDeleteDialog(false); setConfirmText('') }} className="flex-1 py-3 bg-[#F0E8E2] text-[#6B4C3B] text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={isLoading || confirmText !== 'DELETE'} className="flex-1 py-3 bg-red-500 text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-40">{isLoading ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-[#FAF8F5] border-0 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold text-center">Your QR Code</DialogTitle>
            <DialogDescription className="text-[#9A7A6A] text-[13px] text-center">Show to staff to earn beans & stamps</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pb-1">
            <div className="bg-white rounded-[16px] p-5 flex items-center justify-center shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-52 h-52 animate-qr-pop" />
              ) : (
                <div className="w-52 h-52 bg-[#F5EFE9] rounded-[12px] flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-[#C4AFA8]" />
                </div>
              )}
            </div>
            <div className="bg-white rounded-[14px] px-4 py-3 shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
              <p className="text-[10px] font-bold text-[#9A7A6A] uppercase tracking-widest mb-1">Staff can use this to</p>
              <div className="flex gap-3">
                {['Check-ins', 'Add stamps', 'Award beans'].map((t) => (
                  <span key={t} className="text-[11px] font-semibold text-[#6B4C3B] bg-[#F5EFE9] px-2 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setShowQRDialog(false)} className="w-full py-3.5 bg-[#2C1810] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all">Done</button>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  )
}
