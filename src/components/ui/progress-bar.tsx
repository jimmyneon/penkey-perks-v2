
interface ProgressBarProps {
  current: number
  max: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({ current, max, label, showValue = true, size = 'md' }: ProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100)
  
  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showValue && (
            <span className="text-sm text-gray-600">
              {current} / {max}
            </span>
          )}
        </div>
      )}
      <div 
        className={`w-full ${heights[size]} rounded-full overflow-hidden`}
        style={{ backgroundColor: '#e7e5e4' }}
      >
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full`}
          style={{
            width: `${percentage}%`,
            backgroundColor: '#4a8c66',
          }}
        />
      </div>
    </div>
  )
}
