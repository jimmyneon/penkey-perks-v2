'use client'

import { Bell } from 'lucide-react'

interface HomeHeaderProps {
  userName: string
  beanCount: number
}

export function HomeHeader({ userName, beanCount }: HomeHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7B1234] to-[#A8224E] flex items-center justify-center">
          <span className="text-xl">☕</span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#24151A]">Hi {userName}</h1>
          <p className="text-sm text-[#5A382A]">Welcome back</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-full bg-[#7B1234]">
          <span className="text-xs font-bold text-white">{beanCount} beans</span>
        </div>
        <button className="w-10 h-10 rounded-full bg-[#F3DCD4] flex items-center justify-center">
          <Bell className="w-5 h-5 text-[#7B1234]" />
        </button>
        <img
          src="/image-assets/cupilli.png"
          alt="Cup Illy"
          className="w-16 h-16 object-contain"
        />
      </div>
    </div>
  )
}
