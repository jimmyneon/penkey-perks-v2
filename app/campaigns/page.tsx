'use client'

import { BottomNav } from '@/components/bottom-nav'
import { TrendingUp, Clock } from 'lucide-react'

const activeDeals = [
  {
    id: 1,
    title: 'Rainy Day Double Beans',
    body: 'Any hot drink until 2pm — double the beans, same great coffee.',
    pill: '2× beans',
    pillColor: '#C8472A',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&h=400&fit=crop',
    timeHint: 'Until 2pm today',
  },
  {
    id: 2,
    title: 'Lunch Club',
    body: 'Pop in between 12 and 2 on weekdays and earn 1.5× beans on everything.',
    pill: '1.5× weekdays',
    pillColor: '#7B4F2E',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
    timeHint: 'Mon – Fri, 12–2pm',
  },
  {
    id: 3,
    title: 'Toastie Weekend',
    body: 'Order any toastie this weekend and get double beans — simple as that.',
    pill: '2× on toasties',
    pillColor: '#1A3828',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=400&fit=crop',
    timeHint: 'Sat & Sun only',
  },
]

const comingUp = [
  {
    id: 4,
    title: 'Affogato Weekend',
    body: 'A special affogato menu lands soon. Expect bonus beans on every order.',
    date: '5 – 10 Feb',
  },
  {
    id: 5,
    title: "Valentine's Special",
    body: 'Bring someone lovely and earn double beans — love deserves rewarding.',
    date: '10 – 14 Feb',
  },
]

export default function TodayPage() {
  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#F2E8DF' }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-0.5" style={{ color: '#B08070' }}>Penkey Perks</p>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight" style={{ color: '#3D1A0E' }}>What's on</h1>
        <p className="text-[14px] font-medium mt-0.5" style={{ color: '#9A7060' }}>Deals, bonus beans and good things happening now.</p>
      </div>

      <div className="px-4 space-y-4">

        {/* Active deals */}
        <p className="text-[13px] font-bold px-1" style={{ color: '#3D1A0E' }}>On right now</p>
        <div className="space-y-3">
          {activeDeals.map((deal) => (
            <div
              key={deal.id}
              className="relative rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(61,26,14,0.18)] active:scale-[0.985] transition-all duration-200 cursor-pointer"
              style={{ backgroundColor: '#1A3828', minHeight: '148px' }}
            >
              {deal.image && (
                <img
                  src={deal.image}
                  alt=""
                  className="absolute right-0 top-0 bottom-0 w-[55%] h-full object-cover"
                  style={{
                    WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    maskImage: 'linear-gradient(to left, rgba(0,0,0,0.85) 0%, transparent 100%)',
                  }}
                />
              )}
              <div className="relative z-10 p-5" style={{ minHeight: '148px' }}>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
                  style={{ backgroundColor: deal.pillColor }}
                >
                  <TrendingUp className="w-3 h-3 text-white" strokeWidth={2} />
                  <span className="text-[10px] font-bold text-white">{deal.pill}</span>
                </div>
                <h3 className="font-extrabold text-white text-[18px] leading-tight mb-1">{deal.title}</h3>
                <p className="text-[12px] font-medium mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>{deal.body}</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2} />
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{deal.timeHint}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming up */}
        <p className="text-[13px] font-bold px-1 pt-2" style={{ color: '#3D1A0E' }}>Coming up</p>
        <div className="space-y-2">
          {comingUp.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[16px] px-4 py-4 shadow-[0_2px_10px_rgba(61,26,14,0.07)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-[15px] font-extrabold leading-tight mb-1" style={{ color: '#3D1A0E' }}>{item.title}</h3>
                  <p className="text-[12px] leading-snug" style={{ color: '#9A7060' }}>{item.body}</p>
                </div>
                <span
                  className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full mt-0.5"
                  style={{ backgroundColor: '#F5EAE2', color: '#7B4F2E' }}
                >
                  {item.date}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
