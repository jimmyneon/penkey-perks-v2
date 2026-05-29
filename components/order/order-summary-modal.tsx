'use client'

import { useState } from 'react'
import { X, Plus, Minus, Trash2 } from 'lucide-react'

interface OrderItem {
  id: string
  item: string
  itemId?: string
  modifier: string
  quantity: number
}

interface OrderSummaryModalProps {
  orderItems: OrderItem[]
  onClose: () => void
  onUpdateItem: (id: string, field: keyof OrderItem, value: string | number) => void
  onRemoveItem: (id: string) => void
  onSend: () => void
  notes: string
  onNotesChange: (notes: string) => void
}

export function OrderSummaryModal({ 
  orderItems, 
  onClose, 
  onUpdateItem, 
  onRemoveItem, 
  onSend,
  notes,
  onNotesChange
}: OrderSummaryModalProps) {
  const total = orderItems.reduce((sum, item) => sum + (parseFloat(item.item.match(/£(\d+\.?\d*)/)?.[1] || '0') * item.quantity), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative bg-white rounded-t-[24px] sm:rounded-[24px] w-full max-w-[400px] max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: '#F9F7F2' }}
      >
        {/* Header */}
        <div className="sticky top-0 px-5 pt-4 pb-3 flex items-center justify-between" style={{ backgroundColor: '#F9F7F2' }}>
          <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>Your Order</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
            <X className="w-4 h-4" style={{ color: '#24364B' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-6 space-y-4">
          {/* Order items */}
          {orderItems.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#8A96A0' }}>
              Your order is empty
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((orderItem) => (
                <div key={orderItem.id} className="rounded-[16px] p-4" style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold" style={{ color: '#24364B' }}>{orderItem.item}</p>
                      {orderItem.modifier && (
                        <p className="text-[12px] mt-1" style={{ color: '#8A96A0' }}>{orderItem.modifier}</p>
                      )}
                    </div>
                    <button onClick={() => onRemoveItem(orderItem.id)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFE5E5' }}>
                      <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => onUpdateItem(orderItem.id, 'quantity', Math.max(1, orderItem.quantity - 1))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
                      <Minus className="w-4 h-4" style={{ color: '#24364B' }} />
                    </button>
                    <span className="text-[18px] font-bold w-8 text-center" style={{ color: '#24364B' }}>
                      {orderItem.quantity}
                    </span>
                    <button onClick={() => onUpdateItem(orderItem.id, 'quantity', orderItem.quantity + 1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
                      <Plus className="w-4 h-4" style={{ color: '#24364B' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#A89080' }}>
              Notes (optional)
            </p>
            <textarea
              value={notes}
              onChange={e => onNotesChange(e.target.value.slice(0, 120))}
              placeholder="Extra napkins please."
              rows={2}
              className="w-full bg-white rounded-[12px] px-4 py-3 outline-none resize-none text-[14px] placeholder:text-[#C8D4DC]"
              style={{ border: '1px solid #E8E2D8', color: '#24364B' }}
            />
            <p className="text-right text-[11px] mt-1" style={{ color: '#A89080' }}>{notes.length}/120</p>
          </div>

          {/* Send button */}
          <button
            onClick={onSend}
            disabled={orderItems.length === 0}
            className="w-full py-4 rounded-[16px] text-white font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-40"
            style={{ backgroundColor: '#F28A2E' }}
          >
            Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
