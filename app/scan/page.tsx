'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import QRCodeLib from 'qrcode'
import { BottomNav } from '@/components/bottom-nav'

const recentScans = [
  { location: 'Penkey Cafe', time: 'Today · 9:34am', stamp: '+1 stamp' },
  { location: 'Penkey Cafe', time: 'Yesterday · 2:17pm', stamp: '+1 stamp' },
  { location: 'Penkey Cafe', time: '2 days ago · 10:08am', stamp: '+1 stamp' },
]

export default function ScanPage() {
  const router = useRouter()
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const qrData = JSON.stringify({ type: 'customer', id: user.id, email: user.email })
      QRCodeLib.toDataURL(qrData, {
        width: 280,
        margin: 1,
        color: { dark: '#1C2B3A', light: '#FFFFFF' },
      }).then(setQrCodeUrl)
    })
  }, [router])

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="w-full max-w-[430px] mx-auto">

        {/* Header */}
        <div className="px-5 pt-14 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[32px] font-extrabold leading-tight tracking-tight" style={{ color: '#1C2B3A' }}>
              Scan to collect
            </h1>
            <p className="text-[14px] font-medium mt-1" style={{ color: '#8A96A0' }}>
              Show this code to earn your stamp.
            </p>
          </div>
          <img src="/logo.png" alt="PENKEY Perks" className="h-10 w-auto mt-1 flex-shrink-0 ml-4" />
        </div>

        <div className="px-4 space-y-4">

          {/* QR card — white card with orange corner brackets */}
          <div
            className="rounded-[22px] p-5 relative overflow-hidden"
            style={{ backgroundColor: '#F4F7F9', border: '1px solid #EDF1F4', boxShadow: '0 4px 24px rgba(28,43,58,0.10)' }}
          >
            <div className="flex gap-4 items-start">
              {/* Left text */}
              <div className="flex-1">
                <p className="text-[15px] font-extrabold leading-tight mb-1" style={{ color: '#1C2B3A' }}>Your QR Code</p>
                <p className="text-[12px] leading-snug mb-4" style={{ color: '#8A96A0' }}>
                  Scan at the till every time<br />you visit Penkey.
                </p>
                <div className="flex items-start gap-2 mt-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(224,122,58,0.12)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E07A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <p className="text-[11px] leading-snug" style={{ color: '#8A96A0' }}>
                    Your code is unique<br />and refreshes regularly<br />for security.
                  </p>
                </div>
              </div>

              {/* QR code with orange corner brackets */}
              <div className="relative flex-shrink-0">
                <div className="relative w-[140px] h-[140px]">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] rounded-tl-[6px]" style={{ borderColor: '#E07A3A' }} />
                  <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] rounded-tr-[6px]" style={{ borderColor: '#E07A3A' }} />
                  <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] rounded-bl-[6px]" style={{ borderColor: '#E07A3A' }} />
                  <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] rounded-br-[6px]" style={{ borderColor: '#E07A3A' }} />
                  {/* QR */}
                  <div className="absolute inset-2.5 bg-white rounded-[6px] flex items-center justify-center overflow-hidden shadow-sm">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="Your QR code" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-2 border-[#E07A3A] border-t-transparent animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Every scan = 1 stamp */}
          <div
            className="rounded-[18px] px-4 py-4 flex items-center gap-4"
            style={{ backgroundColor: 'rgba(224,122,58,0.08)', border: '1px solid rgba(224,122,58,0.15)' }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(224,122,58,0.15)' }}>
              <img src="/bean.png" alt="" className="w-7 h-7 object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-[16px] font-extrabold leading-tight" style={{ color: '#1C2B3A' }}>Every scan = 1 stamp</p>
              <p className="text-[12px] mt-0.5" style={{ color: '#8A96A0' }}>Keep coming back and unlock amazing rewards!</p>
              <div className="mt-1.5 w-10 h-[2.5px] rounded-full" style={{ backgroundColor: '#E07A3A' }} />
            </div>
          </div>

          {/* Recent scans */}
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-[14px] font-extrabold" style={{ color: '#1C2B3A' }}>Recent scans</p>
              <button className="text-[13px] font-semibold flex items-center gap-1" style={{ color: '#E07A3A' }}>
                View all
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E07A3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
            <div className="bg-white rounded-[18px] overflow-hidden" style={{ border: '1px solid #EDF1F4', boxShadow: '0 2px 12px rgba(28,43,58,0.06)' }}>
              {recentScans.map((scan, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 min-h-[62px] ${i < recentScans.length - 1 ? 'border-b' : ''}`}
                  style={{ borderColor: '#EDF1F4' }}
                >
                  {/* Check circle */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(224,122,58,0.10)', border: '1.5px solid rgba(224,122,58,0.25)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E07A3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold leading-tight" style={{ color: '#1C2B3A' }}>{scan.location}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: '#8A96A0' }}>{scan.time}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[13px] font-bold" style={{ color: '#E07A3A' }}>{scan.stamp}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8D4DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  )
}
