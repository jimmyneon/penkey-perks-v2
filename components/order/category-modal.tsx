'use client'

import { useState } from 'react'
import { X, Search } from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string
}

interface CategoryModalProps {
  categories: Category[]
  selectedCategory: string | null
  onClose: () => void
  onSelectCategory: (id: string) => void
}

export function CategoryModal({ 
  categories, 
  selectedCategory, 
  onClose, 
  onSelectCategory 
}: CategoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Categories</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
            <X className="w-4 h-4" style={{ color: '#24364B' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full bg-white rounded-[16px] px-4 py-3 pl-10 outline-none text-[14px] placeholder:text-[#C8D4DC]"
              style={{ border: '1px solid #E8E2D8', color: '#24364B' }}
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" style={{ color: '#A89080' }} />
          </div>

          {/* Category list */}
          <div className="space-y-2">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id)
                  onClose()
                }}
                className="w-full px-4 py-4 rounded-[16px] text-left flex items-center justify-between transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: selectedCategory === cat.id ? cat.color : '#FFFFFF',
                  border: '1px solid #E8E2D8'
                }}
              >
                <span 
                  className="text-[15px] font-semibold"
                  style={{ color: selectedCategory === cat.id ? '#FFFFFF' : '#24364B' }}
                >
                  {cat.name}
                </span>
                {selectedCategory === cat.id && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
