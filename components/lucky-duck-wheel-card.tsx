interface LuckyDuckWheelCardProps {
  isSpinning?: boolean
  onSpin?: () => void
}

export function LuckyDuckWheelCard({ isSpinning = false, onSpin }: LuckyDuckWheelCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#7B1234] to-[#A8224E] rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4 relative">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-[#C9952E] to-[#E48A3A] flex items-center justify-center ${isSpinning ? 'animate-spin' : ''}`}>
            <span className="text-4xl">🦆</span>
          </div>
          <div className="absolute -top-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-white" />
        </div>
        <h2 className="text-xl font-extrabold text-white mb-2">Lucky Duck Wheel</h2>
        <p className="text-sm text-white/80 mb-4">Spin to win exclusive rewards!</p>
        <button 
          onClick={onSpin}
          disabled={isSpinning}
          className="px-6 py-3 rounded-2xl bg-white text-[#7B1234] font-bold text-sm disabled:opacity-50"
        >
          {isSpinning ? 'Spinning...' : 'Spin Now'}
        </button>
      </div>
    </div>
  )
}
