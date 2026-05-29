'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { X, ChevronLeft } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { DatePickerSheet } from '@/components/date-picker-sheet'

interface PersonalDetailsSheetProps {
  isOpen: boolean
  onClose: () => void
  onBack?: () => void
  name: string
  phone: string
  dateOfBirth: string
  onNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onDateOfBirthChange: (value: string) => void
  onSave: () => void
  isLoading: boolean
}

export function PersonalDetailsSheet({
  isOpen,
  onClose,
  onBack,
  name,
  phone,
  dateOfBirth,
  onNameChange,
  onPhoneChange,
  onDateOfBirthChange,
  onSave,
  isLoading
}: PersonalDetailsSheetProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Select date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <>
      <div className="px-5 pt-4 pb-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack || onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
            <ChevronLeft className="w-4 h-4" style={{ color: '#24364B' }} />
          </button>
          <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Personal Details</h2>
          <div className="w-8" />
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <Label className="text-[12px] font-semibold mb-1.5 block" style={{ color: '#5A6A7A' }}>Name</Label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Your name"
              className="text-[14px] rounded-[10px] border-[#EDF1F4] focus:border-[#E07A3A]"
              style={{ backgroundColor: '#F9F7F2' }}
            />
          </div>
          <div>
            <Label className="text-[12px] font-semibold mb-1.5 block" style={{ color: '#5A6A7A' }}>Phone</Label>
            <Input
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="Your phone number"
              className="text-[14px] rounded-[10px] border-[#EDF1F4] focus:border-[#E07A3A]"
              style={{ backgroundColor: '#F9F7F2' }}
            />
          </div>
          <div>
            <Label className="text-[12px] font-semibold mb-1.5 block" style={{ color: '#5A6A7A' }}>Date of Birth</Label>
            <button
              onClick={() => setShowDatePicker(true)}
              className="w-full text-[14px] rounded-[10px] border-[#EDF1F4] focus:border-[#E07A3A] py-3 px-4 text-left transition-all"
              style={{ backgroundColor: '#F9F7F2', color: dateOfBirth ? '#1C2B3A' : '#8A96A0' }}
            >
              {formatDateDisplay(dateOfBirth)}
            </button>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={isLoading}
          className="w-full h-[48px] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-60"
          style={{ backgroundColor: '#2C3E50' }}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Date Picker Sheet */}
      <Sheet isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} maxHeight="auto">
        <DatePickerSheet
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          value={dateOfBirth}
          onChange={onDateOfBirthChange}
        />
      </Sheet>
    </>
  )
}
