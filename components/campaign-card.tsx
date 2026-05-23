interface CampaignCardProps {
  name: string
  description: string
  type: string
  beanMultiplier: number
  startAt: string
  endAt: string
  locationRequired: boolean
  isActive: boolean
}

export function CampaignCard({ name, description, type, beanMultiplier, startAt, endAt, locationRequired, isActive }: CampaignCardProps) {
  const gradient = isActive ? 'from-[#214A36] to-[#2F4F3E]' : 'from-[#78716c] to-[#a8a29e]'
  const icon = type === 'wheel' ? '🦆' : '☕'

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-[28px] p-6 shadow-lg`}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-xl mb-2">{name}</h3>
          <p className="text-sm text-white/80 mb-3">{description}</p>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
            <span>{beanMultiplier}x beans</span>
            <span>•</span>
            <span>Ends: {new Date(endAt).toLocaleDateString()}</span>
          </div>
          {locationRequired && (
            <p className="text-xs text-white/70 mt-1">📍 In-store only</p>
          )}
        </div>
      </div>
    </div>
  )
}
