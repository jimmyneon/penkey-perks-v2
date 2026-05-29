'use client'

import { X } from 'lucide-react'

interface PickupTimeModalProps {
  pickupDay: string
  pickupTime: string
  onClose: () => void
  onDayChange: (day: string) => void
  onTimeChange: (time: string) => void
}

const TIME_SLOTS = ['ASAP', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
const DAY_OPTIONS = ['Today', 'Tomorrow']

export function PickupTimeModal({ 
  pickupDay, 
  pickupTime, 
  onClose, 
  onDayChange, 
  onTimeChange 
}: PickupTimeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative bg-white rounded-t-[24px] w-full max-h-[85vh] overflow-y-auto animate-sheet-up"
        style={{ backgroundColor: '#F9F7F2' }}
      >
        {/* Header */}
        <div className="sticky top-0 px-5 pt-4 pb-3 flex items-center justify-between" style={{ backgroundColor: '#F9F7F2' }}>
          <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Pick-up Time</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
            <X className="w-4 h-4" style={{ color: '#24364B' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-6 space-y-4">
          {/* Day selection */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#A89080' }}>
              Day
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day}
                  onClick={() => onDayChange(day)}
                  className={`px-4 py-3 rounded-[12px] text-[14px] font-semibold transition-all ${
                    pickupDay === day ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: pickupDay === day ? '#24364B' : '#F4EFE7',
                    color: pickupDay === day ? '#F9F7F2' : '#24364B',
                    border: '1px solid #E8E2D8'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time selection */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#A89080' }}>
              Time
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  onClick={() => onTimeChange(time)}
                  className={`px-3 py-3 rounded-[12px] text-[13px] font-semibold transition-all ${
                    pickupTime === time ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: pickupTime === time ? '#24364B' : '#F4EFE7',
                    color: pickupTime === time ? '#F9F7F2' : '#24364B',
                    border: '1px solid #E8E2D8'
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={onClose}
            className="w-full py-4 rounded-[16px] text-white font-bold text-[15px] active:scale-[0.98] transition-all"
            style={{ backgroundColor: '#24364B' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
