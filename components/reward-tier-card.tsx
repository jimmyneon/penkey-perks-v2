interface RewardTierCardProps {
  beanCost: number
  rewardName: string
  description: string
  isUnlocked: boolean
  isGolden?: boolean
}

export function RewardTierCard({ beanCost, rewardName, description, isUnlocked, isGolden = false }: RewardTierCardProps) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ${isUnlocked ? 'bg-white' : 'bg-[#F3DCD4] opacity-60'}`}>
      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${isGolden ? 'bg-gradient-to-br from-[#C9952E] to-[#E48A3A]' : 'bg-[#F3DCD4]'}`}>
          <span className="text-2xl">{isGolden ? '👑' : '☕'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg font-bold ${isUnlocked ? 'text-[#24151A]' : 'text-[#5A382A]'}`}>{rewardName}</span>
            {isGolden && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#C9952E] text-white">GOLDEN</span>
            )}
          </div>
          <p className={`text-sm mb-2 ${isUnlocked ? 'text-[#5A382A]' : 'text-[#5A382A]'}`}>{description}</p>
          <div className={`inline-flex items-center px-3 py-1 rounded-full ${isUnlocked ? 'bg-[#7B1234]' : 'bg-[#5A382A]'}`}>
            <span className="text-xs font-semibold text-white">{beanCost} beans</span>
          </div>
        </div>
      </div>
    </div>
  )
}
