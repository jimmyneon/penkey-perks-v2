'use client'

import { ChevronLeft } from 'lucide-react'
import { PushNotificationToggle } from '@/components/push-notification-toggle'

interface PreferencesSheetProps {
  isOpen: boolean
  onClose: () => void
  onBack?: () => void
  gpsConsent: boolean
  marketingConsent: boolean
  onGpsConsentChange: (value: boolean) => void
  onMarketingConsentChange: (value: boolean) => void
}

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`w-12 h-7 rounded-full p-1 transition-all ${on ? 'bg-[#E07A3A]' : 'bg-[#E8E2D8]'}`}
  >
    <div
      className={`w-5 h-5 rounded-full bg-white transition-all ${on ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
)

export function PreferencesSheet({
  isOpen,
  onClose,
  onBack,
  gpsConsent,
  marketingConsent,
  onGpsConsentChange,
  onMarketingConsentChange
}: PreferencesSheetProps) {
  return (
    <div className="px-5 pt-4 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack || onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
          <ChevronLeft className="w-4 h-4" style={{ color: '#24364B' }} />
        </button>
        <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Preferences</h2>
        <div className="w-8" />
      </div>

      {/* Preferences */}
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-[14px] font-medium" style={{ color: '#1C2B3A' }}>GPS Location</p>
            <p className="text-[12px]" style={{ color: '#8A96A0' }}>Allow location-based offers</p>
          </div>
          <Toggle on={gpsConsent} onToggle={() => onGpsConsentChange(!gpsConsent)} />
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-[14px] font-medium" style={{ color: '#1C2B3A' }}>Marketing</p>
            <p className="text-[12px]" style={{ color: '#8A96A0' }}>Receive promotional emails</p>
          </div>
          <Toggle on={marketingConsent} onToggle={() => onMarketingConsentChange(!marketingConsent)} />
        </div>
        <div className="pt-2">
          <PushNotificationToggle />
        </div>
      </div>
    </div>
  )
}
