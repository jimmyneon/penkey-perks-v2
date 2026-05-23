'use client'

import { AppShell } from '@/components/app-shell'
import { BottomNav } from '@/components/bottom-nav'
import { LuckyDuckWheelCard } from '@/components/lucky-duck-wheel-card'
import { CampaignCard } from '@/components/campaign-card'

export default function CampaignsPage() {
  return (
    <AppShell>
      <div className="px-5 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-brown">Today</h1>
          <p className="text-base text-brown-light">What's happening at Penkey</p>
        </div>

        {/* Lucky Duck Hero Card */}
        <LuckyDuckWheelCard />

        {/* Active Campaigns */}
        <div>
          <h2 className="text-xl font-bold text-brown mb-4">Active Perks</h2>
          <div className="space-y-4">
            <CampaignCard
              name="Rainy Day Double Beans"
              description="Earn double beans on all purchases when it rains"
              type="special"
              beanMultiplier={2}
              startAt="2026-01-01"
              endAt="2026-12-31"
              locationRequired={false}
              isActive={true}
            />
            <CampaignCard
              name="Lunch Club Bonus"
              description="Extra beans between 12pm-2pm weekdays"
              type="special"
              beanMultiplier={1.5}
              startAt="2026-01-01"
              endAt="2027-01-15"
              locationRequired={false}
              isActive={true}
            />
            <CampaignCard
              name="Toastie Double Beans"
              description="Double beans on all toasties this weekend"
              type="special"
              beanMultiplier={2}
              startAt="2026-12-20"
              endAt="2026-12-25"
              locationRequired={false}
              isActive={true}
            />
          </div>
        </div>

        {/* Upcoming Campaigns */}
        <div>
          <h2 className="text-xl font-bold text-brown mb-4">Coming Soon</h2>
          <div className="space-y-4">
            <CampaignCard
              name="Affogato Weekend"
              description="Special affogato menu with bonus rewards"
              type="special"
              beanMultiplier={2}
              startAt="2027-02-05"
              endAt="2027-02-10"
              locationRequired={false}
              isActive={false}
            />
            <CampaignCard
              name="Valentine's Special"
              description="Share the love with double beans for couples"
              type="special"
              beanMultiplier={2}
              startAt="2027-02-10"
              endAt="2027-02-14"
              locationRequired={false}
              isActive={false}
            />
          </div>
        </div>
      </div>

      <BottomNav />
    </AppShell>
  )
}
