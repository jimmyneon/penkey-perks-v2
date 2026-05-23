interface PromoHeroCardProps {
  title: string
  subtitle: string
  description: string
  ctaText: string
  isLuckyDuck?: boolean
}

export function PromoHeroCard({ title, subtitle, description, ctaText, isLuckyDuck = false }: PromoHeroCardProps) {
  return (
    <div className={`rounded-3xl p-6 shadow-sm ${isLuckyDuck ? 'bg-gradient-to-br from-[#7B1234] to-[#A8224E]' : 'bg-gradient-to-br from-[#E48A3A] to-[#F6C3A6]'}`}>
      <div className="flex flex-col items-center text-center">
        {isLuckyDuck && (
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <span className="text-4xl">🦆</span>
          </div>
        )}
        <h2 className="text-2xl font-extrabold text-white mb-1">{title}</h2>
        <p className="text-lg font-semibold text-white/90 mb-2">{subtitle}</p>
        <p className="text-sm text-white/80 mb-4">{description}</p>
        <button className="px-6 py-3 rounded-2xl bg-white text-[#7B1234] font-bold text-sm">
          {ctaText}
        </button>
      </div>
    </div>
  )
}
