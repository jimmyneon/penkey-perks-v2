'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet } from '@/components/ui/sheet'
import { FavoriteOrdersSheet } from '@/components/favorite-orders-sheet'
import { PersonalDetailsSheet } from '@/components/settings/personal-details-sheet'
import { PreferencesSheet } from '@/components/settings/preferences-sheet'
import { ArrowLeft, User, Mail, Phone, Calendar, Lock, Trash2, PauseCircle, MapPin, Gift, AlertTriangle, QrCode, ChevronRight, Bell, Shield, X } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import QRCodeLib from 'qrcode'
import { BottomNav } from '@/components/bottom-nav'
import { PushNotificationToggle } from '@/components/push-notification-toggle'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

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
  beanBalance?: any
  userBadges?: any[]
  userVouchers?: any[]
  purchases?: any[]
}

export function ProfileClient({ user: initialUser, beanBalance, userBadges, userVouchers, purchases }: ProfileClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(initialUser.name)
  const [phone, setPhone] = useState(initialUser.phone)
  const [dateOfBirth, setDateOfBirth] = useState(initialUser.date_of_birth || '')

  const [gpsConsent, setGpsConsent] = useState(initialUser.gps_consent)
  const [marketingConsent, setMarketingConsent] = useState(initialUser.marketing_consent)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only setting mounted after client render
  useEffect(() => {
    setMounted(true)
  }, [])

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
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showPersonalDetailsSheet, setShowPersonalDetailsSheet] = useState(false)
  const [showPreferencesSheet, setShowPreferencesSheet] = useState(false)
  const [showAchievementsDialog, setShowAchievementsDialog] = useState(false)
  const [showFavoriteOrdersSheet, setShowFavoriteOrdersSheet] = useState(false)
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
      console.log('Attempting to save profile for user:', initialUser.id)
      console.log('Data to save:', { name, phone, dateOfBirth, gpsConsent, marketingConsent })

      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', initialUser.id)
        .maybeSingle()

      console.log('Profile check result:', { existingProfile, checkError })

      const existingPreferences = existingProfile?.preferences || {}

      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile')
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

        console.log('Update result:', error)
        if (error) throw error
      } else {
        // Create new profile
        console.log('Creating new profile')
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: initialUser.id,
            email: initialUser.email,
            name,
            phone: phone || null,
            date_of_birth: dateOfBirth || null,
            preferences: {
              gps_consent: gpsConsent,
              marketing_consent: marketingConsent,
            },
          })

        console.log('Insert result:', error)
        if (error) throw error
      }

      toast({
        title: 'Saved',
        description: 'Your profile has been updated',
      })

      router.refresh()
    } catch (error: any) {
      console.error('Profile save error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile',
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
      label: 'My activity', sub: beanBalance?.visit_count > 0 ? `${beanBalance.visit_count} visits, ${beanBalance.lifetime_beans || 0} beans` : 'Start earning beans on your first visit!', onPress: () => setShowQRDialog(true),
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      label: 'My achievements', sub: userBadges && userBadges.length > 0 ? `${userBadges.length} badges earned` : 'Earn badges as you visit!', onPress: () => setShowAchievementsDialog(true),
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      ),
      label: 'My rewards', sub: userVouchers && userVouchers.length > 0 ? `${userVouchers.length} active voucher${userVouchers.length > 1 ? 's' : ''}` : 'Redeem beans for rewards', onPress: () => router.push('/rewards'),
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      label: 'Favourite orders', sub: purchases && purchases.length > 0 ? `${purchases.length} recent order${purchases.length > 1 ? 's' : ''}` : 'Your orders will appear here', onPress: () => setShowFavoriteOrdersSheet(true),
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
      label: 'Settings', sub: 'Notifications, privacy and more', onPress: () => setShowSettingsDialog(true),
    },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F2' }}>

      {/* Header — matches dashboard greeting style */}
      <div className="px-5 pt-10 pb-5 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[24px] font-bold leading-tight" style={{ color: '#E07A3A', fontFamily: 'cursive, Georgia, serif' }}>
            {name ? `${mounted ? getGreeting() : 'Hello'}, ` : 'Your profile'}
            {name && <img src="/heart.png" alt="" className="inline-block w-5 h-5 object-contain align-middle" style={{ marginBottom: '2px', animation: 'heartPulse 1.2s ease-in-out 3' }} />}
          </p>
          <h1 className="text-[72px] font-bold leading-none tracking-tight mt-0.5" style={{ color: '#24364B' }}>
            {name ? name.split(' ')[0] : 'Profile'}
          </h1>
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
            <p className="text-[18px] font-extrabold leading-tight" style={{ color: '#1C2B3A' }}>
              {(() => {
                const lifetimeBeans = beanBalance?.lifetime_beans || 0
                if (lifetimeBeans >= 500) return 'Legendary'
                if (lifetimeBeans >= 200) return 'Local Legend'
                if (lifetimeBeans >= 100) return 'Regular'
                if (lifetimeBeans >= 50) return 'Newcomer'
                return 'Visitor'
              })()}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: '#8A96A0' }}>
              {(() => {
                const lifetimeBeans = beanBalance?.lifetime_beans || 0
                const nextLevel = lifetimeBeans < 50 ? 50 : lifetimeBeans < 100 ? 100 : lifetimeBeans < 200 ? 200 : 500
                const beansUntil = nextLevel - lifetimeBeans
                if (lifetimeBeans >= 500) return 'Max level reached!'
                return `${beansUntil} beans until next level`
              })()}
            </p>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#EDF1F4' }}>
              <div 
                className="h-full rounded-full" 
                style={{ 
                  width: `${(() => {
                    const lifetimeBeans = beanBalance?.lifetime_beans || 0
                    const nextLevel = lifetimeBeans < 50 ? 50 : lifetimeBeans < 100 ? 100 : lifetimeBeans < 200 ? 200 : 500
                    const prevLevel = lifetimeBeans < 50 ? 0 : lifetimeBeans < 100 ? 50 : lifetimeBeans < 200 ? 100 : 200
                    if (lifetimeBeans >= 500) return '100'
                    return `${((lifetimeBeans - prevLevel) / (nextLevel - prevLevel)) * 100}`
                  })()}%`, 
                  backgroundColor: '#E07A3A' 
                }} 
              />
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: '#9AAAB8' }}>LIFETIME BEANS</p>
            <p className="text-[32px] font-extrabold leading-none" style={{ color: '#1C2B3A' }}>{beanBalance?.lifetime_beans || 0}</p>
            <p className="text-[12px] italic mt-0.5" style={{ color: '#E07A3A', fontFamily: 'Georgia, serif' }}>beans</p>
            <p className="text-[11px] mt-1" style={{ color: '#8A96A0' }}>Keep it up!</p>
          </div>
        </div>

        {/* Voucher card — dark slate, matches reference */}
        {userVouchers && userVouchers.length > 0 ? (
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
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white" style={{ backgroundColor: '#E07A3A' }}>{userVouchers.length}</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>YOU HAVE {userVouchers.length} VOUCHER{userVouchers.length > 1 ? 'S' : ''}</p>
              <p className="text-[18px] font-extrabold text-white leading-tight">{userVouchers[0]?.voucher_templates?.name || 'Reward'}</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {userVouchers.length > 1 ? `${userVouchers.length - 1} more available` : 'Ready to use'}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); router.push('/rewards') }}
              className="flex-shrink-0 px-4 py-2.5 rounded-[12px] text-white text-[13px] font-bold flex items-center gap-1.5 active:opacity-80 transition-opacity"
              style={{ backgroundColor: '#E07A3A' }}
            >
              View voucher{userVouchers.length > 1 ? 's' : ''}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        ) : null}

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
        <div className="rounded-[18px] overflow-hidden" style={{ backgroundColor: '#F0F9FF', boxShadow: '0 2px 12px rgba(36,54,75,0.08)', border: '1px solid #E0F2FE' }}>
          <div className="flex items-center p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <img src="/heart.png" alt="" className="w-5 h-5 object-contain" />
              </div>
              <div className="text-left">
                <p className="text-base font-bold" style={{ color: '#24364B' }}>Thanks for supporting local</p>
                <p className="text-xs" style={{ color: '#5A6A7A' }}>Every visit to Penkey helps our community thrive</p>
              </div>
            </div>
            <div className="w-32 h-32 flex-shrink-0">
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

      {/* Change Password Sheet */}
      <Sheet isOpen={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxHeight="auto">
        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Change password</h2>
            <button onClick={() => setShowPasswordDialog(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
              <X className="w-4 h-4" style={{ color: '#24364B' }} />
            </button>
          </div>
          <div className="space-y-3">
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
        </div>
      </Sheet>

      {/* Pause Account Sheet */}
      <Sheet isOpen={showPauseDialog} onClose={() => setShowPauseDialog(false)} maxHeight="auto">
        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Pause account?</h2>
            <button onClick={() => setShowPauseDialog(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
              <X className="w-4 h-4" style={{ color: '#24364B' }} />
            </button>
          </div>
          <div className="space-y-3">
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
        </div>
      </Sheet>

      {/* Delete Account Sheet */}
      <Sheet isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxHeight="auto">
        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Delete account?</h2>
            <button onClick={() => setShowDeleteDialog(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
              <X className="w-4 h-4" style={{ color: '#24364B' }} />
            </button>
          </div>
          <div className="space-y-3">
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
        </div>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet isOpen={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxHeight="auto">
        <div className="px-5 pt-4 pb-6 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Settings</h2>
            <button onClick={() => setShowSettingsDialog(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
              <X className="w-4 h-4" style={{ color: '#24364B' }} />
            </button>
          </div>

          {/* Settings menu */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowSettingsDialog(false)
                setShowPersonalDetailsSheet(true)
              }}
              className="w-full px-4 py-3 rounded-[14px] flex items-center justify-between active:scale-[0.98] transition-all"
              style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5" style={{ color: '#E07A3A' }} />
                <span className="text-[14px] font-medium" style={{ color: '#24364B' }}>Personal Details</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: '#CCBDB4' }} />
            </button>

            <button
              onClick={() => {
                setShowSettingsDialog(false)
                setShowPreferencesSheet(true)
              }}
              className="w-full px-4 py-3 rounded-[14px] flex items-center justify-between active:scale-[0.98] transition-all"
              style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" style={{ color: '#E07A3A' }} />
                <span className="text-[14px] font-medium" style={{ color: '#24364B' }}>Preferences</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: '#CCBDB4' }} />
            </button>

            <button
              onClick={() => {
                setShowSettingsDialog(false)
                setShowPasswordDialog(true)
              }}
              className="w-full px-4 py-3 rounded-[14px] flex items-center justify-between active:scale-[0.98] transition-all"
              style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5" style={{ color: '#E07A3A' }} />
                <span className="text-[14px] font-medium" style={{ color: '#24364B' }}>Change Password</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: '#CCBDB4' }} />
            </button>
          </div>
        </div>
      </Sheet>

      {/* Personal Details Sheet */}
      <Sheet isOpen={showPersonalDetailsSheet} onClose={() => setShowPersonalDetailsSheet(false)} maxHeight="auto">
        <PersonalDetailsSheet
          isOpen={showPersonalDetailsSheet}
          onClose={() => setShowPersonalDetailsSheet(false)}
          onBack={() => {
            setShowPersonalDetailsSheet(false)
            setShowSettingsDialog(true)
          }}
          name={name}
          phone={phone}
          dateOfBirth={dateOfBirth}
          onNameChange={setName}
          onPhoneChange={setPhone}
          onDateOfBirthChange={setDateOfBirth}
          onSave={handleSaveProfile}
          isLoading={isLoading}
        />
      </Sheet>

      {/* Preferences Sheet */}
      <Sheet isOpen={showPreferencesSheet} onClose={() => setShowPreferencesSheet(false)} maxHeight="auto">
        <PreferencesSheet
          isOpen={showPreferencesSheet}
          onClose={() => setShowPreferencesSheet(false)}
          onBack={() => {
            setShowPreferencesSheet(false)
            setShowSettingsDialog(true)
          }}
          gpsConsent={gpsConsent}
          marketingConsent={marketingConsent}
          onGpsConsentChange={setGpsConsent}
          onMarketingConsentChange={setMarketingConsent}
        />
      </Sheet>

      {/* Activity Sheet */}
      <Sheet isOpen={showQRDialog} onClose={() => setShowQRDialog(false)} maxHeight="90vh">
        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>My Activity</h2>
            <button onClick={() => setShowQRDialog(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
              <X className="w-4 h-4" style={{ color: '#24364B' }} />
            </button>
          </div>
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[16px] p-4 text-center" style={{ backgroundColor: '#FEF3EA', border: '1px solid #E07A3A' }}>
                <p className="text-[32px] font-extrabold" style={{ color: '#E07A3A' }}>{beanBalance?.visit_count || 0}</p>
                <p className="text-[12px] font-semibold mt-1" style={{ color: '#1C2B3A' }}>Visits</p>
              </div>
              <div className="rounded-[16px] p-4 text-center" style={{ backgroundColor: '#F4F7F9', border: '1px solid #EDF1F4' }}>
                <p className="text-[32px] font-extrabold" style={{ color: '#1C2B3A' }}>{beanBalance?.lifetime_beans || 0}</p>
                <p className="text-[12px] font-semibold mt-1" style={{ color: '#8A96A0' }}>Lifetime Beans</p>
              </div>
            </div>

            {/* Recent activity */}
            <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid #EDF1F4' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#EDF1F4', backgroundColor: '#F9F7F2' }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#AE9888' }}>Recent Activity</p>
              </div>
              {beanBalance?.visit_count > 0 ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3EA' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E07A3A" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: '#1C2B3A' }}>Total visits</p>
                        <p className="text-[11px]" style={{ color: '#8A96A0' }}>{beanBalance.visit_count} visits</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F4F7F9' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C2B3A" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: '#1C2B3A' }}>Lifetime beans</p>
                        <p className="text-[11px]" style={{ color: '#8A96A0' }}>{beanBalance.lifetime_beans} beans earned</p>
                      </div>
                    </div>
                  </div>
                  {beanBalance.last_visit_at && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F4F7F9' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C2B3A" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-[13px] font-medium" style={{ color: '#1C2B3A' }}>Last visit</p>
                          <p className="text-[11px]" style={{ color: '#8A96A0' }}>
                            {new Date(beanBalance.last_visit_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-[13px]" style={{ color: '#8A96A0' }}>No visits yet. Start earning beans on your first visit!</p>
                </div>
              )}
            </div>

            {/* QR Code section */}
            <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid #EDF1F4' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#EDF1F4', backgroundColor: '#F9F7F2' }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#AE9888' }}>Your QR Code</p>
              </div>
              <div className="p-5 flex flex-col items-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mb-3" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center" style={{ backgroundColor: '#F4F7F9' }}>
                    <p className="text-[13px]" style={{ color: '#8A96A0' }}>Loading...</p>
                  </div>
                )}
                <p className="text-[12px] text-center" style={{ color: '#8A96A0' }}>Show this to staff to earn stamps and beans</p>
              </div>
            </div>
        </div>
      </Sheet>

      {/* Achievements Sheet */}
      <Sheet isOpen={showAchievementsDialog} onClose={() => setShowAchievementsDialog(false)} maxHeight="90vh">
        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>My Achievements</h2>
            <button onClick={() => setShowAchievementsDialog(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
              <X className="w-4 h-4" style={{ color: '#24364B' }} />
            </button>
          </div>

          {userBadges && userBadges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {userBadges.map((badge: any) => (
                <div key={badge.id} className="rounded-[16px] p-4 text-center" style={{ backgroundColor: '#FEF3EA', border: '1px solid #E07A3A' }}>
                  <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: '#FFF' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#E07A3A" stroke="#E07A3A" strokeWidth="1" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[14px] font-bold" style={{ color: '#1C2B3A' }}>{badge.badges?.name || 'Badge'}</p>
                  <p className="text-[11px] mt-1" style={{ color: '#8A96A0' }}>{badge.badges?.description || ''}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] p-8 text-center" style={{ backgroundColor: '#F4F7F9', border: '1px solid #EDF1F4' }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FEF3EA' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E07A3A" strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <p className="text-[15px] font-semibold mb-2" style={{ color: '#1C2B3A' }}>No badges yet</p>
              <p className="text-[13px]" style={{ color: '#8A96A0' }}>Keep visiting to earn badges and unlock rewards!</p>
            </div>
          )}

          {/* Badge tiers info */}
          <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid #EDF1F4' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#EDF1F4', backgroundColor: '#F9F7F2' }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#AE9888' }}>Badge Tiers</p>
            </div>
            <div className="p-4 space-y-2">
              {[
                { name: 'Visitor', beans: 0, color: '#A89080' },
                { name: 'Newcomer', beans: 50, color: '#8A96A0' },
                { name: 'Regular', beans: 100, color: '#E07A3A' },
                { name: 'Local Legend', beans: 200, color: '#2C3E50' },
                { name: 'Legendary', beans: 500, color: '#F28A2E' },
              ].map((tier) => (
                <div key={tier.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span className="text-[13px]" style={{ color: '#1C2B3A' }}>{tier.name}</span>
                  </div>
                  <span className="text-[12px]" style={{ color: '#8A96A0' }}>{tier.beans}+ beans</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Sheet>

      {/* Favorite Orders Sheet */}
      <Sheet isOpen={showFavoriteOrdersSheet} onClose={() => setShowFavoriteOrdersSheet(false)} maxHeight="90vh">
        <FavoriteOrdersSheet isOpen={showFavoriteOrdersSheet} onClose={() => setShowFavoriteOrdersSheet(false)} />
      </Sheet>

      <BottomNav />
    </div>
  )
}
