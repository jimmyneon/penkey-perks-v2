import { Award } from 'lucide-react'

interface BadgeDisplayProps {
  name: string
  description: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary'
  iconUrl?: string | null
  earnedAt?: string
}

const tierColors = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
  legendary: '#ff6b6b',
}

export function BadgeDisplay({ name, description, tier, iconUrl, earnedAt }: BadgeDisplayProps) {
  return (
    <div className="bg-[#f5f3ed] rounded-lg p-4 border border-[#e7e5e4] flex items-start gap-3">
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: tierColors[tier] }}
      >
        {iconUrl ? (
          <img src={iconUrl} alt={name} className="w-8 h-8" />
        ) : (
          <Award className="h-6 w-6 text-white" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-[#1c1917]">{name}</p>
          <span 
            className="text-xs px-2 py-0.5 rounded-full text-white capitalize"
            style={{ backgroundColor: tierColors[tier] }}
          >
            {tier}
          </span>
        </div>
        <p className="text-sm text-[#78716c]">{description}</p>
        {earnedAt && (
          <p className="text-xs text-[#78716c] mt-1">
            Earned: {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}
