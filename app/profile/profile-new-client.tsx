'use client'

import { AppShell } from '@/components/app-shell'
import { BottomNav } from '@/components/bottom-nav'
import { LogOut } from 'lucide-react'

interface ProfileNewClientProps {
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

export function ProfileNewClient({ user }: ProfileNewClientProps) {
  return (
    <AppShell>
      <div className="px-5 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#24151A]">Profile</h1>
          <p className="text-base text-[#5A382A]">Manage your account settings</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-[#F3DCD4] flex items-center justify-center">
              <span className="text-3xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#24151A]">{user.name || 'John Doe'}</h2>
              <p className="text-sm text-[#5A382A]">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#5A382A] mb-1">Phone</p>
              <p className="text-base text-[#24151A]">{user.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#5A382A] mb-1">Birthday</p>
              <p className="text-base text-[#24151A]">{user.date_of_birth || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-[#24151A] text-lg mb-4">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#24151A]">Location Services</p>
                <p className="text-sm text-[#5A382A]">Allow location for nearby offers</p>
              </div>
              <div className={`w-12 h-7 rounded-full ${user.gps_consent ? 'bg-[#7B1234]' : 'bg-[#F3DCD4]'} relative`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${user.gps_consent ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#24151A]">Marketing</p>
                <p className="text-sm text-[#5A382A]">Receive promotional emails</p>
              </div>
              <div className={`w-12 h-7 rounded-full ${user.marketing_consent ? 'bg-[#7B1234]' : 'bg-[#F3DCD4]'} relative`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${user.marketing_consent ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button className="w-full py-4 rounded-2xl bg-[#F3DCD4] text-[#7B1234] font-bold flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>

      <BottomNav />
    </AppShell>
  )
}
