'use client'

import { useState } from 'react'
import { MenuItem } from '@/app/order/page'
import { X, Plus, Minus } from 'lucide-react'

interface ItemModalProps {
  item: MenuItem
  onClose: () => void
  onAdd: (item: MenuItem, quantity: number) => void
}

export function ItemModal({ item, onClose, onAdd }: ItemModalProps) {
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative bg-white rounded-t-[24px] sm:rounded-[24px] w-full max-w-[400px] max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: '#F9F7F2' }}
      >
        {/* Header */}
        <div className="sticky top-0 px-5 pt-4 pb-3 flex items-center justify-between" style={{ backgroundColor: '#F9F7F2' }}>
          <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>{item.name}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
            <X className="w-4 h-4" style={{ color: '#24364B' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-6 space-y-4">
          {item.description && (
            <p className="text-[14px] leading-relaxed" style={{ color: '#8A96A0' }}>
              {item.description}
            </p>
          )}

          {/* Variants */}
          {item.item_variants && item.item_variants.length > 0 && (
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#A89080' }}>
                Size
              </p>
              <div className="space-y-2">
                {item.item_variants.map((variant) => (
                  <button
                    key={variant.id}
                    className="w-full px-4 py-3 rounded-[12px] text-left flex items-center justify-between"
                    style={{ 
                      backgroundColor: variant.is_default ? '#24364B' : '#F4EFE7',
                      border: '1px solid #E8E2D8'
                    }}
                  >
                    <span className="text-[14px] font-semibold" style={{ color: variant.is_default ? '#F9F7F2' : '#24364B' }}>
                      {variant.name}
                    </span>
                    <span className="text-[14px] font-bold" style={{ color: variant.is_default ? '#F9F7F2' : '#F28A2E' }}>
                      £{variant.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#A89080' }}>
              Quantity
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}
              >
                <Minus className="w-4 h-4" style={{ color: '#24364B' }} />
              </button>
              <span className="text-[20px] font-bold w-12 text-center" style={{ color: '#24364B' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}
              >
                <Plus className="w-4 h-4" style={{ color: '#24364B' }} />
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #E8E2D8' }}>
            <span className="text-[14px]" style={{ color: '#8A96A0' }}>Total</span>
            <span className="text-[24px] font-bold" style={{ color: '#F28A2E' }}>
              £{(item.base_price * quantity).toFixed(2)}
            </span>
          </div>

          {/* Add button */}
          <button
            onClick={() => onAdd(item, quantity)}
            className="w-full py-4 rounded-[16px] text-white font-bold text-[15px] active:scale-[0.98] transition-all"
            style={{ backgroundColor: '#24364B' }}
          >
            Add to order
          </button>
        </div>
      </div>
    </div>
  )
}
