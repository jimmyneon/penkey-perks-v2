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

  // Sync state if server re-renders with fresh data (after router.refresh)
  useEffect(() => {
    setName(initialUser.name)
    setPhone(initialUser.phone)
    setDateOfBirth(initialUser.date_of_birth || '')
    setGpsConsent(initialUser.gps_consent)
    setMarketingConsent(initialUser.marketing_consent)
  }, [initialUser.name, initialUser.phone, initialUser.date_of_birth, initialUser.gps_consent, initialUser.marketing_consent])
  
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
        title: 'Saved',
        description: 'Your profile has been updated',
      })

      // Immediately reflect the saved values in state (don't wait for server)
      setName(name)
      setPhone(phone || '')
      setDateOfBirth(dateOfBirth || '')

      router.refresh()
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
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
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
        title: 'Account deleted',
        description: 'All your data has been removed.',
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
        on ? 'bg-[#261408]' : 'bg-[#D4C4BA]'
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
      className={`w-full px-4 flex items-center gap-3 min-h-[52px] active:bg-[#FAF0E8] transition-colors ${
        !last ? 'border-b border-[#F2EAE2]' : ''
      }`}
    >
      <Icon className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={1.8} style={{ color: iconColor }} />
      <span className={`flex-1 text-[14px] font-medium text-left ${
        danger ? 'text-red-500' : 'text-[#261408]'
      }`}>{label}</span>
      {value && <span className="text-[13px] text-[#AE9888] max-w-[140px] truncate text-right">{value}</span>}
      <ChevronRight className="w-[15px] h-[15px] text-[#CCBDB4] flex-shrink-0" strokeWidth={1.8} />
    </button>
  )

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-semibold text-[#AE9888] uppercase tracking-[0.08em] px-1 mb-2">{children}</p>
  )

  const menuRows = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      ),
      label: 'My activity', sub: 'See your visits, stamps and beans', onPress: () => setShowQRDialog(true),
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      label: 'My achievements', sub: 'See your badges and milestones', onPress: () => {},
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      ),
      label: 'My rewards', sub: 'View past rewards and vouchers', onPress: () => router.push('/rewards'),
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      label: 'Favourite orders', sub: 'Your usuals, saved for quick ordering', onPress: () => router.push('/order'),
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
      label: 'Settings', sub: 'Notifications, privacy and more', onPress: () => setShowPasswordDialog(true),
    },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* Header — matches dashboard greeting style */}
      <div className="px-5 pt-14 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[18px] font-bold italic leading-tight" style={{ color: '#E07A3A', fontFamily: 'Georgia, serif' }}>
              {name ? `Hi, ` : 'Your profile'}
              {name && <span style={{ fontStyle: 'normal', fontFamily: 'inherit', fontWeight: 800, color: '#E07A3A' }}>{name.split(' ')[0]}</span>}
              {name && <img src="/heart.png" alt="" className="inline-block w-5 h-5 object-contain align-middle ml-1" style={{ marginBottom: '2px' }} />}
            </p>
            <p className="text-[13px] font-medium mt-1" style={{ color: '#8A96A0' }}>
              Here&apos;s your Penkey Perks profile
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 ml-3">
            <img src="/logo.png" alt="PENKEY Perks" className="h-10 w-auto" />
            <button
              onClick={() => router.push('/profile')}
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: '#E07A3A', backgroundColor: '#FEF3EA' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E07A3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-28 space-y-4">

        {/* Level card — matches reference */}
        <div className="bg-white rounded-[18px] flex items-center gap-4 px-4 py-4" style={{ border: '1px solid #EDF1F4', boxShadow: '0 2px 14px rgba(28,43,58,0.07)' }}>
          {/* Badge icon */}
          <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#FEF3EA', border: '2px solid #E07A3A' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#E07A3A" stroke="#E07A3A" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: '#9AAAB8' }}>YOUR LEVEL</p>
            <p className="text-[18px] font-extrabold leading-tight" style={{ color: '#1C2B3A' }}>Local Legend</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#8A96A0' }}>72 beans until next level</p>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#EDF1F4' }}>
              <div className="h-full rounded-full" style={{ width: '35%', backgroundColor: '#E07A3A' }} />
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: '#9AAAB8' }}>LIFETIME BEANS</p>
            <p className="text-[32px] font-extrabold leading-none" style={{ color: '#1C2B3A' }}>128</p>
            <p className="text-[12px] italic mt-0.5" style={{ color: '#E07A3A', fontFamily: 'Georgia, serif' }}>beans</p>
            <p className="text-[11px] mt-1" style={{ color: '#8A96A0' }}>Keep it up!</p>
          </div>
        </div>

        {/* Voucher card — dark slate, matches reference */}
        <div
          className="rounded-[18px] flex items-center gap-4 px-4 py-4 cursor-pointer active:scale-[0.985] transition-all"
          style={{ backgroundColor: '#2C3E50', boxShadow: '0 4px 20px rgba(28,43,58,0.22)' }}
          onClick={() => router.push('/rewards')}
        >
          {/* ticket icon with badge */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-[14px] flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white" style={{ backgroundColor: '#E07A3A' }}>1</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>YOU HAVE A VOUCHER</p>
            <p className="text-[18px] font-extrabold text-white leading-tight">Free coffee</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Collect 8 stamps to earn</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); router.push('/rewards') }}
            className="flex-shrink-0 px-4 py-2.5 rounded-[12px] text-white text-[13px] font-bold flex items-center gap-1.5 active:opacity-80 transition-opacity"
            style={{ backgroundColor: '#E07A3A' }}
          >
            View voucher
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {/* Menu rows — clean list, matches reference */}
        <div className="bg-white rounded-[18px] overflow-hidden" style={{ border: '1px solid #EDF1F4', boxShadow: '0 2px 14px rgba(28,43,58,0.07)' }}>
          {menuRows.map((row, i) => (
            <button
              key={row.label}
              onClick={row.onPress}
              className={`w-full px-4 flex items-center gap-4 min-h-[62px] active:bg-[#F8FAFB] transition-colors text-left ${i < menuRows.length - 1 ? 'border-b' : ''}`}
              style={{ borderColor: '#EDF1F4' }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F4F7F9', border: '1.5px solid #E8EDF2' }}>
                {row.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold leading-tight" style={{ color: '#1C2B3A' }}>{row.label}</p>
                <p className="text-[12px] mt-0.5" style={{ color: '#8A96A0' }}>{row.sub}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8D4DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>

        {/* Community card */}
        <div className="rounded-[18px] overflow-hidden" style={{ backgroundColor: '#E0F2FE', boxShadow: '0 2px 12px rgba(36,54,75,0.08)', border: '1px solid #BAE6FD' }}>
          <div className="flex items-center p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                <img src="/heart.png" alt="" className="w-5 h-5 object-contain" />
              </div>
              <div className="text-left">
                <p className="text-base font-bold" style={{ color: '#24364B' }}>Thanks for supporting local</p>
                <p className="text-xs" style={{ color: '#5A6A7A' }}>Every visit to Penkey helps our community thrive</p>
              </div>
            </div>
            <div className="w-24 h-24 flex-shrink-0">
              <img src="/local.png" alt="" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        {/* Danger zone — subtle at bottom */}
        <div className="bg-white rounded-[18px] overflow-hidden" style={{ border: '1px solid #EDF1F4' }}>
          <button
            onClick={() => setShowPauseDialog(true)}
            className="w-full px-4 flex items-center gap-4 min-h-[52px] border-b active:bg-[#F8FAFB] transition-colors text-left"
            style={{ borderColor: '#EDF1F4' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            <span className="flex-1 text-[14px] font-medium" style={{ color: '#1C2B3A' }}>Pause account</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8D4DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full px-4 flex items-center gap-4 min-h-[52px] active:bg-red-50 transition-colors text-left"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            <span className="flex-1 text-[14px] font-medium text-red-500">Delete account</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8D4DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-white border-0 shadow-[0_24px_64px_rgba(28,43,58,0.18)]">
          <DialogHeader>
            <DialogTitle className="text-[#1C2B3A] text-lg font-extrabold">Change password</DialogTitle>
            <DialogDescription className="text-[#8A96A0] text-[13px]">Enter a new password below</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pb-1">
            <div className="bg-white rounded-[14px] overflow-hidden" style={{ border: '1px solid #EDF1F4' }}>
              <div className="px-4 flex items-center gap-3 min-h-[50px] border-b" style={{ borderColor: '#EDF1F4' }}>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="flex-1 text-[14px] font-medium bg-transparent outline-none placeholder:text-[#C8D4DC] py-3" style={{ color: '#1C2B3A' }} />
              </div>
              <div className="px-4 flex items-center gap-3 min-h-[50px]">
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="flex-1 text-[14px] font-medium bg-transparent outline-none placeholder:text-[#C8D4DC] py-3" style={{ color: '#1C2B3A' }} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPasswordDialog(false)} className="flex-1 py-3 text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all" style={{ backgroundColor: '#EDF1F4', color: '#5A6A7A' }}>Cancel</button>
              <button onClick={handleChangePassword} disabled={isLoading} className="flex-1 py-3 text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-60" style={{ backgroundColor: '#2C3E50' }}>{isLoading ? 'Saving...' : 'Change'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pause Account Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-white border-0 shadow-[0_24px_64px_rgba(28,43,58,0.18)]">
          <DialogHeader>
            <DialogTitle className="text-[#1C2B3A] text-lg font-extrabold">Pause account?</DialogTitle>
            <DialogDescription className="text-[#8A96A0] text-[13px]">Your data stays safe while paused</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pb-1">
            <div className="rounded-[14px] p-4 space-y-2" style={{ backgroundColor: 'rgba(224,122,58,0.08)' }}>
              {['Your account will be paused', 'All your data stays safe', 'You can reactivate anytime'].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#E07A3A' }} />
                  <span className="text-[13px]" style={{ color: '#5A6A7A' }}>{t}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPauseDialog(false)} className="flex-1 py-3 text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all" style={{ backgroundColor: '#EDF1F4', color: '#5A6A7A' }}>Cancel</button>
              <button onClick={handlePauseAccount} disabled={isLoading} className="flex-1 py-3 text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-60" style={{ backgroundColor: '#E07A3A' }}>{isLoading ? 'Pausing...' : 'Pause'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-white border-0 shadow-[0_24px_64px_rgba(28,43,58,0.18)]">
          <DialogHeader>
            <DialogTitle className="text-[#1C2B3A] text-lg font-extrabold">Delete account?</DialogTitle>
            <DialogDescription className="text-[#8A96A0] text-[13px]">This action is permanent and cannot be undone</DialogDescription>
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
            <div className="bg-white rounded-[14px] px-4 min-h-[50px] flex items-center" style={{ border: '1px solid #EDF1F4' }}>
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder='Type DELETE to confirm' className="flex-1 text-[14px] font-medium bg-transparent outline-none placeholder:text-[#C8D4DC] py-3" style={{ color: '#1C2B3A' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowDeleteDialog(false); setConfirmText('') }} className="flex-1 py-3 text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all" style={{ backgroundColor: '#EDF1F4', color: '#5A6A7A' }}>Cancel</button>
              <button onClick={handleDeleteAccount} disabled={isLoading || confirmText !== 'DELETE'} className="flex-1 py-3 bg-red-500 text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-40">{isLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-white border-0 shadow-[0_24px_64px_rgba(28,43,58,0.18)]">
          <DialogHeader>
            <DialogTitle className="text-[#1C2B3A] text-lg font-extrabold text-center">Your QR Code</DialogTitle>
            <DialogDescription className="text-[#8A96A0] text-[13px] text-center">Show to staff to earn stamps and beans</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pb-1">
            <div className="rounded-[16px] p-5 flex items-center justify-center" style={{ backgroundColor: '#F4F7F9', border: '1px solid #EDF1F4' }}>
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-52 h-52" />
              ) : (
                <div className="w-52 h-52 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: '#EDF1F4' }}>
                  <QrCode className="w-12 h-12" style={{ color: '#9AAAB8' }} />
                </div>
              )}
            </div>
            <div className="rounded-[14px] px-4 py-3" style={{ backgroundColor: '#F4F7F9', border: '1px solid #EDF1F4' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: '#9AAAB8' }}>Staff can use this to</p>
              <div className="flex gap-2 flex-wrap">
                {['Check-ins', 'Add stamps', 'Award beans'].map((t) => (
                  <span key={t} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(224,122,58,0.12)', color: '#E07A3A' }}>{t}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setShowQRDialog(false)} className="w-full py-3.5 text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all" style={{ backgroundColor: '#2C3E50' }}>Done</button>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  )
}
