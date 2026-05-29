'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface PersonalDetailsSheetProps {
  isOpen: boolean
  onClose: () => void
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
  name,
  phone,
  dateOfBirth,
  onNameChange,
  onPhoneChange,
  onDateOfBirthChange,
  onSave,
  isLoading
}: PersonalDetailsSheetProps) {
  return (
    <div className="px-5 pt-4 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Personal Details</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
          <X className="w-4 h-4" style={{ color: '#24364B' }} />
        </button>
      </div>

      {/* Form */}
      <div className="space-y-3">
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
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(e) => onDateOfBirthChange(e.target.value)}
            className="text-[14px] rounded-[10px] border-[#EDF1F4] focus:border-[#E07A3A]"
            style={{ backgroundColor: '#F9F7F2' }}
          />
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
  )
}
