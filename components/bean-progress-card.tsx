interface BeanProgressCardProps {
  currentBeans: number
  targetBeans: number
  nextReward: string
}

export function BeanProgressCard({ currentBeans, targetBeans, nextReward }: BeanProgressCardProps) {
  const progress = (currentBeans / targetBeans) * 100
  const beansNeeded = targetBeans - currentBeans
  const circumference = 2 * Math.PI * 58 // radius 58
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="bg-gradient-to-br from-[#7B1234] to-[#A8224E] rounded-[28px] p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white/80 mb-1">Your Beans</p>
          <p className="text-5xl font-extrabold text-white mb-2">{currentBeans}</p>
          <p className="text-sm font-medium text-white/90">
            {beansNeeded > 0 ? `${beansNeeded} beans to ${nextReward}` : 'Reward unlocked!'}
          </p>
        </div>
        <div className="relative">
          <svg width="130" height="130" className="transform -rotate-90">
            <circle
              cx="65"
              cy="65"
              r="58"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="65"
              cy="65"
              r="58"
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">☕</span>
          </div>
        </div>
      </div>
    </div>
  )
}
