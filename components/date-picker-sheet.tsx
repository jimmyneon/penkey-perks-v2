'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerSheetProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
}

export function DatePickerSheet({ isOpen, onClose, value, onChange }: DatePickerSheetProps) {
  const [day, setDay] = useState<number>(1)
  const [month, setMonth] = useState<number>(1)
  const [year, setYear] = useState<number>(2000)

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setDay(date.getDate())
      setMonth(date.getMonth() + 1)
      setYear(date.getFullYear())
    }
  }, [value])

  const handleSave = () => {
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(formattedDate)
    onClose()
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  const days = Array.from({ length: getDaysInMonth(month, year) }, (_, i) => i + 1)

  return (
    <div className="px-5 pt-4 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="text-[14px] font-semibold" style={{ color: '#8A96A0' }}>Cancel</button>
        <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Date of Birth</h2>
        <button onClick={handleSave} className="text-[14px] font-semibold" style={{ color: '#E07A3A' }}>Save</button>
      </div>

      {/* Date Picker */}
      <div className="flex gap-2">
        {/* Day Selector */}
        <div className="flex-1 bg-white rounded-[16px] overflow-hidden" style={{ border: '1px solid #EDF1F4' }}>
          <div className="px-3 py-2 border-b text-center" style={{ borderColor: '#EDF1F4', backgroundColor: '#F9F7F2' }}>
            <span className="text-[11px] font-semibold uppercase" style={{ color: '#AE9888' }}>Day</span>
          </div>
          <div className="h-48 overflow-y-auto">
            <div className="py-2" />
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`w-full py-3 text-center text-[16px] font-medium transition-colors ${
                  d === day ? 'bg-[#FEF3EA] text-[#E07A3A]' : 'text-[#1C2B3A]'
                }`}
              >
                {d}
              </button>
            ))}
            <div className="py-2" />
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex-1 bg-white rounded-[16px] overflow-hidden" style={{ border: '1px solid #EDF1F4' }}>
          <div className="px-3 py-2 border-b text-center" style={{ borderColor: '#EDF1F4', backgroundColor: '#F9F7F2' }}>
            <span className="text-[11px] font-semibold uppercase" style={{ color: '#AE9888' }}>Month</span>
          </div>
          <div className="h-48 overflow-y-auto">
            <div className="py-2" />
            {months.map((m, index) => (
              <button
                key={m}
                onClick={() => setMonth(index + 1)}
                className={`w-full py-3 text-center text-[16px] font-medium transition-colors ${
                  index + 1 === month ? 'bg-[#FEF3EA] text-[#E07A3A]' : 'text-[#1C2B3A]'
                }`}
              >
                {m}
              </button>
            ))}
            <div className="py-2" />
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex-1 bg-white rounded-[16px] overflow-hidden" style={{ border: '1px solid #EDF1F4' }}>
          <div className="px-3 py-2 border-b text-center" style={{ borderColor: '#EDF1F4', backgroundColor: '#F9F7F2' }}>
            <span className="text-[11px] font-semibold uppercase" style={{ color: '#AE9888' }}>Year</span>
          </div>
          <div className="h-48 overflow-y-auto">
            <div className="py-2" />
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`w-full py-3 text-center text-[16px] font-medium transition-colors ${
                  y === year ? 'bg-[#FEF3EA] text-[#E07A3A]' : 'text-[#1C2B3A]'
                }`}
              >
                {y}
              </button>
            ))}
            <div className="py-2" />
          </div>
        </div>
      </div>

      {/* Selected Date Display */}
      <div className="text-center py-4 rounded-[16px]" style={{ backgroundColor: '#F4EFE7' }}>
        <p className="text-[24px] font-bold" style={{ color: '#24364B' }}>
          {months[month - 1]} {day}, {year}
        </p>
      </div>
    </div>
  )
}
