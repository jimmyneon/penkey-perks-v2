'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { BottomNav } from '@/components/bottom-nav'
import { RewardTierCard } from '@/components/reward-tier-card'
import { HowItWorksSteps } from '@/components/how-it-works-steps'

interface RewardsNewClientProps {
  currentPoints: number
  availableRewards: any[]
  userRewards: any[]
  userId: string
  pointsConfigs: any[]
}

export function RewardsNewClient({ currentPoints, availableRewards, userRewards, userId, pointsConfigs }: RewardsNewClientProps) {
  const [activeTab, setActiveTab] = useState<'bean-rewards' | 'vouchers' | 'achievements'>('bean-rewards')

  const tabs = [
    { id: 'bean-rewards' as const, label: 'Bean Rewards' },
    { id: 'vouchers' as const, label: 'My Vouchers' },
    { id: 'achievements' as const, label: 'Achievements' },
  ]

  const howItWorksSteps = pointsConfigs.map((config, index) => ({
    number: index + 1,
    title: config.action_type,
    description: config.description || `Earn ${config.points_amount} beans`
  }))

  return (
    <AppShell>
      <div className="px-5 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#24151A]">Rewards</h1>
          <p className="text-base text-[#5A382A]">Redeem your beans for exclusive rewards</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-[#F3DCD4] p-1 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#7B1234] shadow-sm'
                  : 'text-[#5A382A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'bean-rewards' && (
          <div className="space-y-4">
            <RewardTierCard 
              beanCost={5}
              rewardName="Bean Enhancer"
              description="Double your beans for your next visit"
              isUnlocked={currentPoints >= 5}
            />
            <RewardTierCard 
              beanCost={8}
              rewardName="Free Any Coffee"
              description="Redeem for any coffee of your choice"
              isUnlocked={currentPoints >= 8}
            />
            <RewardTierCard 
              beanCost={20}
              rewardName="Golden Duck Reward"
              description="Exclusive premium reward for loyal members"
              isUnlocked={currentPoints >= 20}
              isGolden={true}
            />
          </div>
        )}

        {activeTab === 'vouchers' && (
          <div className="space-y-4">
            {userRewards.length > 0 ? (
              userRewards.map((reward) => (
                <div key={reward.id} className="bg-white rounded-3xl p-5 shadow-sm">
                  <h3 className="font-bold text-[#24151A] text-lg mb-1">{reward.rewards?.name}</h3>
                  <p className="text-sm text-[#5A382A]">{reward.rewards?.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[#5A382A]">
                <p className="font-medium">No vouchers yet</p>
                <p className="text-sm">Earn beans to unlock rewards!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-[#24151A] text-lg mb-1">First Visit</h3>
              <p className="text-sm text-[#5A382A]">Completed your first visit</p>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-[#24151A] text-lg mb-1">Coffee Lover</h3>
              <p className="text-sm text-[#5A382A]">Ordered 10 coffees</p>
            </div>
          </div>
        )}

        {/* How It Works */}
        {activeTab === 'bean-rewards' && (
          <HowItWorksSteps steps={howItWorksSteps} />
        )}
      </div>

      <BottomNav />
    </AppShell>
  )
}
