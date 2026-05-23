interface VoucherCardProps {
  name: string
  description: string
  expiryDate: string
  icon?: string
  gradient?: string
}

export function VoucherCard({ name, description, expiryDate, icon = '☕', gradient = 'from-[#7B1234] to-[#A8224E]' }: VoucherCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-[28px] p-5 shadow-lg min-w-[200px] flex-shrink-0`}>
      <div className="flex flex-col h-full">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className="font-bold text-white text-lg mb-1">{name}</h3>
        <p className="text-sm text-white/80 mb-3 flex-1">{description}</p>
        <p className="text-xs font-semibold text-white/90">Expires: {expiryDate}</p>
      </div>
    </div>
  )
}
