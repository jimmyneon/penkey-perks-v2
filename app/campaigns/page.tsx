'use client'

import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'

const activeCampaigns = [
  {
    id: 1,
    tag: 'DOUBLE BEANS',
    title: 'Double Beans Week!',
    body: 'Earn double beans on every visit this week.',
    date: 'Ends Sunday 19 May',
    stat: '2×',
    statUnit: 'BEANS',
    daysLeft: '4 days left',
    icon: 'coffee',
  },
  {
    id: 2,
    tag: 'BONUS STAMP',
    title: 'Extra Stamp Friday',
    body: 'Visit on Friday and get an extra stamp!',
    date: 'Every Friday',
    stat: null,
    statUnit: null,
    daysLeft: null,
    icon: 'gift',
  },
  {
    id: 3,
    tag: 'LIMITED REWARD',
    title: 'Treat Yourself',
    body: 'Collect 15 stamps and redeem a special treat.',
    date: '1 May – 31 May',
    stat: '15',
    statUnit: 'STAMPS',
    daysLeft: '12 days left',
    icon: 'cup-star',
  },
]

function CampaignIcon({ type }: { type: string }) {
  if (type === 'coffee') return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <ellipse cx="20" cy="24" rx="12" ry="10" fill="rgba(224,122,58,0.15)" stroke="rgba(224,122,58,0.4)" strokeWidth="1.5"/>
      <path d="M28 20h4a3 3 0 0 1 0 6h-4" stroke="rgba(224,122,58,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 16c0-2 1.5-3 1.5-4.5" stroke="#E07A3A" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M20 14c0-2 1.5-3 1.5-4.5" stroke="#E07A3A" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M17 17h6" stroke="#E07A3A" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M12 34h16" stroke="rgba(224,122,58,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 22c0 5.5 2 8 6 8s6-2.5 6-8" stroke="rgba(224,122,58,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'gift') return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <rect x="8" y="18" width="24" height="16" rx="2" fill="rgba(224,122,58,0.12)" stroke="rgba(224,122,58,0.4)" strokeWidth="1.5"/>
      <rect x="6" y="13" width="28" height="5" rx="1.5" fill="rgba(224,122,58,0.10)" stroke="rgba(224,122,58,0.4)" strokeWidth="1.5"/>
      <line x1="20" y1="13" x2="20" y2="34" stroke="rgba(224,122,58,0.5)" strokeWidth="1.5"/>
      <path d="M20 13c0 0-3-6 0-6s0 6 0 6" stroke="#E07A3A" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M20 13c0 0 3-6 0-6" stroke="#E07A3A" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <ellipse cx="20" cy="26" rx="12" ry="9" fill="rgba(224,122,58,0.12)" stroke="rgba(224,122,58,0.4)" strokeWidth="1.5"/>
      <path d="M28 22h4a3 3 0 0 1 0 6h-4" stroke="rgba(224,122,58,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 36h16" stroke="rgba(224,122,58,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <polygon points="20,10 21.5,15 26.5,15 22.5,18 24,23 20,20 16,23 17.5,18 13.5,15 18.5,15" fill="#E07A3A" opacity="0.8"/>
    </svg>
  )
}

export default function CampaignsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="w-full max-w-[430px] mx-auto">

        {/* Header */}
        <div className="px-5 pt-14 pb-4 flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-[34px] font-extrabold leading-tight tracking-tight" style={{ color: '#1C2B3A' }}>Campaigns</h1>
            <p className="text-[13px] font-medium mt-1 leading-snug" style={{ color: '#8A96A0' }}>
              Special promotions, bonus beans<br />and limited time rewards.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 ml-3 flex-shrink-0">
            <img src="/logo.png" alt="PENKEY Perks" className="h-10 w-auto" />
            <button onClick={() => router.push('/profile')} className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#E07A3A', backgroundColor: '#FEF3EA' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E07A3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* Ready to earn — dark QR banner */}
          <div className="rounded-[20px] p-5 relative overflow-hidden flex items-center gap-5" style={{ backgroundColor: '#2C3E50', boxShadow: '0 4px 20px rgba(28,43,58,0.22)', minHeight: '120px' }}>
            <div className="flex-1 min-w-0">
              <p className="text-white font-extrabold text-[20px] leading-tight mb-1">Ready to earn?</p>
              <p className="text-[13px] leading-snug mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Scan your QR code at the till<br />to collect stamps and beans.
              </p>
              <button
                onClick={() => router.push('/scan')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-white text-[13px] font-bold active:opacity-80 transition-opacity"
                style={{ backgroundColor: '#E07A3A' }}
              >
                Show my QR code
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  <path d="M14 14h2v2h-2zM18 14h3v3h-2M16 20v2M20 18v2M14 20h2"/>
                </svg>
              </button>
            </div>
            {/* Coffee cup illustration */}
            <div className="flex-shrink-0 opacity-90">
              <svg width="80" height="96" viewBox="0 0 80 96" fill="none">
                <ellipse cx="40" cy="88" rx="28" ry="6" fill="rgba(255,255,255,0.06)"/>
                <rect x="14" y="28" width="46" height="52" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                <path d="M60 38h8a6 6 0 0 1 0 12h-8" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="22" y="14" width="30" height="14" rx="3" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
                <path d="M22 76h30" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round"/>
                <text x="37" y="59" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11" fontWeight="800" fontFamily="sans-serif">PEN</text>
                <text x="37" y="71" textAnchor="middle" fill="#E07A3A" fontSize="10" fontWeight="800" fontFamily="sans-serif">KEY</text>
                <circle cx="28" cy="8" rx="3" ry="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
                <circle cx="40" cy="6" rx="2.5" ry="3.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2"/>
              </svg>
            </div>
          </div>

          {/* Active campaigns */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] px-1 mb-3" style={{ color: '#9AAAB8' }}>Active campaigns</p>
            <div className="space-y-3">
              {activeCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-[18px] p-4 flex items-start gap-4 active:bg-[#F8FAFB] transition-colors"
                  style={{ border: '1px solid #EDF1F4', boxShadow: '0 2px 12px rgba(28,43,58,0.06)' }}
                >
                  {/* Icon circle */}
                  <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEF3EA', border: '1.5px solid rgba(224,122,58,0.2)' }}>
                    <CampaignIcon type={campaign.icon} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Tag pill */}
                    <div className="inline-block px-2 py-0.5 rounded-full mb-1.5" style={{ backgroundColor: 'rgba(224,122,58,0.12)' }}>
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.1em]" style={{ color: '#E07A3A' }}>{campaign.tag}</span>
                    </div>
                    <p className="text-[16px] font-extrabold leading-tight" style={{ color: '#1C2B3A' }}>{campaign.title}</p>
                    <p className="text-[12px] mt-0.5 leading-snug" style={{ color: '#8A96A0' }}>{campaign.body}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span className="text-[11px]" style={{ color: '#9AAAB8' }}>{campaign.date}</span>
                    </div>
                  </div>

                  {/* Right stat */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                    {campaign.stat ? (
                      <>
                        <p className="text-[28px] font-extrabold leading-none" style={{ color: '#E07A3A' }}>{campaign.stat}</p>
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.1em]" style={{ color: '#1C2B3A' }}>{campaign.statUnit}</p>
                        {campaign.daysLeft && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#1C2B3A' }}>
                            {campaign.daysLeft}
                          </span>
                        )}
                      </>
                    ) : (
                      /* Dashed stamp circle for bonus stamp */
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ border: '2px dashed rgba(224,122,58,0.4)' }}>
                        <svg width="18" height="18" viewBox="0 0 20 24" fill="none">
                          <ellipse cx="10" cy="12" rx="7" ry="10" fill="rgba(224,122,58,0.2)"/>
                          <ellipse cx="10" cy="9" rx="3.5" ry="4.5" fill="rgba(224,122,58,0.25)"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* More coming soon */}
          <div className="rounded-[18px] px-4 py-4 flex items-center gap-4 overflow-hidden" style={{ backgroundColor: '#2C3E50', boxShadow: '0 4px 16px rgba(28,43,58,0.18)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-extrabold text-[15px] leading-tight">More coming soon!</p>
              <p className="text-[12px] mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Keep an eye out for new campaigns, exclusive offers and exciting perks.
              </p>
            </div>
            {/* Store sketch illustration */}
            <div className="flex-shrink-0 opacity-50">
              <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
                <rect x="10" y="36" width="60" height="36" rx="2" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                <path d="M5 36 Q40 18 75 36" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="18" y="44" width="14" height="20" rx="1" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
                <rect x="36" y="48" width="10" height="10" rx="1" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
                <rect x="50" y="48" width="10" height="8" rx="1" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
                <rect x="28" y="20" width="24" height="6" rx="1" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/>
                <line x1="40" y1="64" x2="40" y2="72" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
                <line x1="28" y1="44" x2="28" y2="64" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                <rect x="10" y="68" width="60" height="4" rx="1" fill="rgba(255,255,255,0.08)"/>
                <text x="40" y="31" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="6" fontWeight="700" fontFamily="sans-serif">PENKEY</text>
              </svg>
            </div>
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  )
}
