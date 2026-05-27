'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Send, Check, Plus, X, Coffee } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

interface OrderItem {
  id: string
  item: string
  quantity: number
}

export default function OrderPage() {
  const [orderSent, setOrderSent] = useState(false)
  const [pickupTime, setPickupTime] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: '1', item: '', quantity: 1 }
  ])
  const [showTimePicker, setShowTimePicker] = useState(false)

  const addItem = () => {
    setOrderItems([...orderItems, { id: Date.now().toString(), item: '', quantity: 1 }])
  }

  const removeItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setOrderItems(orderItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const sendToWhatsApp = () => {
    const validItems = orderItems.filter(item => item.item.trim())
    
    if (validItems.length === 0) return

    const orderText = validItems
      .map(item => `${item.quantity}x ${item.item}`)
      .join('\n')

    const message = `Hi Penkey, I'd like to place an order for collection.

Pickup time: ${pickupTime || 'ASAP'}

Order:
${orderText}

Thanks!`
    
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/441590619472?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
    setOrderSent(true)
  }

  const canSend = orderItems.some(item => item.item.trim())

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="w-full max-w-[430px] mx-auto pb-28">
        {/* Header */}
        <header className="pt-12 pb-3 px-5">
          <p className="text-[11px] font-bold text-[#B0A090] uppercase tracking-widest mb-0.5">Collection</p>
          <h1 className="text-[26px] font-extrabold text-[#1A1208] tracking-tight">Order Ahead</h1>
        </header>

        {orderSent ? (
          <div className="px-5 pt-4">
            <div className="bg-white rounded-[20px] p-7 text-center shadow-[0_4px_24px_rgba(44,24,16,0.10)]">
              <div className="w-16 h-16 rounded-full bg-[#2A7A4A] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_16px_rgba(42,122,74,0.30)]">
                <Check className="w-8 h-8 text-white stroke-[2.5px]" />
              </div>
              <h2 className="text-[20px] font-extrabold text-[#2C1810] mb-1.5">Opening WhatsApp…</h2>
              <p className="text-[13px] text-[#9A7A6A] mb-6 leading-relaxed">Your order is ready to send. Just hit send in WhatsApp and we'll have it ready for you.</p>
              <button
                onClick={() => { setOrderSent(false); setPickupTime(''); setOrderItems([{ id: '1', item: '', quantity: 1 }]) }}
                className="w-full py-3.5 bg-[#1A1208] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all"
              >
                New Order
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-4">
            {/* Pickup Time */}
            <div>
              <p className="text-[11px] font-bold text-[#9A7A6A] uppercase tracking-widest px-1 mb-1.5">Pickup Time</p>
              <button
                className="w-full bg-white rounded-[16px] px-4 min-h-[52px] flex items-center gap-3 shadow-[0_1px_4px_rgba(44,24,16,0.07)] active:bg-[#F5EFE9] transition-colors"
                onClick={() => setShowTimePicker(true)}
              >
                <div className="w-8 h-8 rounded-[10px] bg-[#FFF5EB] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-[#C8602A]" />
                </div>
                <span className="flex-1 text-left text-[14px] font-semibold text-[#2C1810]">
                  {pickupTime || 'ASAP'}
                </span>
                <span className="text-[12px] text-[#C4AFA8] font-medium">Change</span>
              </button>
            </div>

            {/* Order Items */}
            <div>
              <p className="text-[11px] font-bold text-[#9A7A6A] uppercase tracking-widest px-1 mb-1.5">Your Order</p>
              <div className="bg-white rounded-[16px] overflow-hidden shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
                {orderItems.map((orderItem, index) => (
                  <div key={orderItem.id} className={`px-4 flex items-center gap-3 min-h-[54px] ${index < orderItems.length - 1 ? 'border-b border-[#F0E8E2]' : ''}`}>
                    {/* Qty controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => updateItem(orderItem.id, 'quantity', Math.max(1, orderItem.quantity - 1))}
                        className="w-7 h-7 rounded-lg bg-[#F0E8E2] flex items-center justify-center text-[#6B4C3B] font-bold text-[15px] active:bg-[#E8D8CC]"
                      >−</button>
                      <span className="w-6 text-center text-[14px] font-bold text-[#2C1810]">{orderItem.quantity}</span>
                      <button
                        onClick={() => updateItem(orderItem.id, 'quantity', orderItem.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-[#F0E8E2] flex items-center justify-center text-[#6B4C3B] font-bold text-[15px] active:bg-[#E8D8CC]"
                      >+</button>
                    </div>

                    {/* Item input */}
                    <input
                      value={orderItem.item}
                      onChange={(e) => updateItem(orderItem.id, 'item', e.target.value)}
                      placeholder="e.g. Flat white, oat milk"
                      className="flex-1 text-[14px] font-medium text-[#2C1810] bg-transparent outline-none placeholder:text-[#C4AFA8] py-3"
                    />

                    {orderItems.length > 1 && (
                      <button onClick={() => removeItem(orderItem.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C4AFA8] active:text-red-400 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={addItem}
                  className="w-full px-4 min-h-[48px] flex items-center gap-2.5 border-t border-[#F0E8E2] active:bg-[#F5EFE9] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#F0E8E2] flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3.5 h-3.5 text-[#6B4C3B]" />
                  </div>
                  <span className="text-[13px] font-bold text-[#6B4C3B]">Add another item</span>
                </button>
              </div>
            </div>

            {/* Note */}
            <div className="bg-[#F5EAE0] rounded-[14px] px-4 py-3 flex items-start gap-2.5">
              <Coffee className="w-4 h-4 text-[#C8602A] flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#6B4C3B] leading-relaxed">Your order opens in WhatsApp — just hit send! We'll have it ready for collection.</p>
            </div>

            {/* Send CTA */}
            <button
              onClick={sendToWhatsApp}
              disabled={!canSend}
              className="w-full py-4 rounded-[16px] flex items-center justify-center gap-2.5 font-bold text-[15px] text-white shadow-[0_4px_20px_rgba(37,211,102,0.30)] active:scale-[0.98] transition-all disabled:opacity-40"
              style={{ background: canSend ? 'linear-gradient(135deg, #25D366 0%, #1DA851 100%)' : '#D8CEC8' }}
            >
              <Send className="w-5 h-5 stroke-[2px]" />
              Send via WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Time Picker Modal */}
      <Dialog open={showTimePicker} onOpenChange={setShowTimePicker}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-[#FAF8F5] border-0 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold">Pickup Time</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 pb-2">
            {['ASAP', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'].map((time) => (
              <button
                key={time}
                onClick={() => { setPickupTime(time === 'ASAP' ? '' : time); setShowTimePicker(false) }}
                className={`py-3 rounded-[12px] text-[13px] font-bold transition-all active:scale-[0.97] ${
                  (pickupTime === time) || (time === 'ASAP' && !pickupTime)
                    ? 'bg-[#1A1208] text-white shadow-[0_2px_8px_rgba(26,18,8,0.25)]'
                    : 'bg-white text-[#1A1208] shadow-[0_1px_3px_rgba(26,18,8,0.08)]'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  )
}
