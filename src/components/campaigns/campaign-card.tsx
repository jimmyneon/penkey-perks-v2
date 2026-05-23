import { Calendar, MapPin, Sparkles } from 'lucide-react'

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

export function CampaignCard({
  name,
  description,
  type,
  beanMultiplier,
  startAt,
  endAt,
  locationRequired,
  isActive,
}: CampaignCardProps) {
  const startDate = new Date(startAt)
  const endDate = new Date(endAt)
  const now = new Date()
  
  const isExpired = now > endDate
  const isUpcoming = now < startDate

  return (
    <div className="bg-[#f5f3ed] rounded-lg p-4 border border-[#e7e5e4]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#f97316]" />
          <span className="text-xs font-medium text-[#78716c] uppercase">{type}</span>
        </div>
        {isActive && (
          <span className="text-xs px-2 py-1 bg-[#4a8c66] text-white rounded-full">Active</span>
        )}
        {isUpcoming && (
          <span className="text-xs px-2 py-1 bg-[#78716c] text-white rounded-full">Upcoming</span>
        )}
        {isExpired && (
          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Ended</span>
        )}
      </div>
      
      <h3 className="font-semibold text-[#1c1917] mb-1">{name}</h3>
      <p className="text-sm text-[#78716c] mb-3">{description}</p>
      
      {beanMultiplier > 1 && (
        <div className="inline-flex items-center gap-1 text-sm font-medium text-[#4a8c66] mb-3">
          <Sparkles className="h-4 w-4" />
          {beanMultiplier}x beans
        </div>
      )}
      
      <div className="flex items-center gap-4 text-xs text-[#78716c]">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </span>
        </div>
        {locationRequired && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>In-store only</span>
          </div>
        )}
      </div>
    </div>
  )
}
