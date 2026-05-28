'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface OrderItem {
  id: string
  item: string
  modifier: string
  quantity: number
}

const TIME_SLOTS = ['ASAP', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
const DAY_OPTIONS = ['Today', 'Tomorrow']

export default function OrderPage() {
  const router = useRouter()
  const [orderSent, setOrderSent] = useState(false)
  const [pickupDay, setPickupDay] = useState('Today')
  const [pickupTime, setPickupTime] = useState('ASAP')
  const [notes, setNotes] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: '1', item: '', modifier: '', quantity: 1 }
  ])
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('name, phone').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.name) setUserName(data.name)
          if (data?.phone) setUserPhone(data.phone)
        })
    })
  }, [])

  const addItem = () => setOrderItems(prev => [...prev, { id: Date.now().toString(), item: '', modifier: '', quantity: 1 }])
  const removeItem = (id: string) => { if (orderItems.length > 1) setOrderItems(prev => prev.filter(i => i.id !== id)) }
  const updateItem = (id: string, field: keyof OrderItem, value: string | number) =>
    setOrderItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))

  const sendToWhatsApp = () => {
    const validItems = orderItems.filter(i => i.item.trim())
    if (validItems.length === 0) return
    const orderText = validItems.map(i => `${i.quantity}x ${i.item}${i.modifier ? ` (${i.modifier})` : ''}`).join('\n')
    const message = `Hi Penkey!${userName ? ` It's ${userName}` : ''} — I'd like to place a collection order.${userPhone ? `\nMy number: ${userPhone}` : ''}\n\nPickup: ${pickupDay}, ${pickupTime}\n\nOrder:\n${orderText}${notes ? `\n\nNotes: ${notes}` : ''}\n\nThanks!`
    window.open(`https://wa.me/441590619472?text=${encodeURIComponent(message)}`, '_blank')
    setOrderSent(true)
  }

  const canSend = orderItems.some(i => i.item.trim())

  if (orderSent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 pb-28">
        <div className="w-full max-w-[360px] text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#2C3E50' }}>
            <Check className="w-8 h-8 text-white stroke-[2.5px]" />
          </div>
          <h2 className="text-[22px] font-extrabold mb-2" style={{ color: '#1C2B3A' }}>Opening WhatsApp</h2>
          <p className="text-[13px] leading-relaxed mb-7" style={{ color: '#8A96A0' }}>Your order is ready. Just hit send in WhatsApp and we'll have it ready for collection.</p>
          <button
            onClick={() => { setOrderSent(false); setPickupDay('Today'); setPickupTime('ASAP'); setNotes(''); setOrderItems([{ id: '1', item: '', modifier: '', quantity: 1 }]) }}
            className="w-full py-4 text-white text-[15px] font-bold rounded-[16px] active:scale-[0.98] transition-all"
            style={{ backgroundColor: '#2C3E50' }}
          >
            New order
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="w-full max-w-[430px] mx-auto">

        {/* Header */}
        <div className="px-5 pt-14 pb-4 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[18px] font-bold italic leading-none mb-0.5" style={{ color: '#D87A2E', fontFamily: 'Georgia, serif' }}>
              Coffee, your way.{' '}
              <img src="/heart.png" alt="" className="inline-block w-5 h-5 object-contain align-middle" style={{ marginBottom: '2px' }} />
            </p>
            <h1 className="text-[34px] font-extrabold leading-tight tracking-tight" style={{ color: '#1C2B3A' }}>Order Now</h1>
            <p className="text-[13px] font-medium mt-1 leading-snug" style={{ color: '#8A96A0' }}>
              Place your order via WhatsApp<br />and we'll get it ready for you.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 ml-3 flex-shrink-0">
            <img src="/logo.png" alt="PENKEY Perks" className="h-10 w-auto" />
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* WhatsApp info card */}
          <div className="rounded-[18px] px-4 py-4 flex items-center gap-4" style={{ backgroundColor: 'rgba(224,122,58,0.09)', border: '1px solid rgba(224,122,58,0.18)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(37,211,102,0.12)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.555 4.116 1.524 5.845L0 24l6.29-1.501A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.804 9.804 0 0 1-5.012-1.376l-.36-.214-3.733.891.932-3.617-.235-.372A9.808 9.808 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182 17.43 2.182 21.818 6.57 21.818 12c0 5.43-4.388 9.818-9.818 9.818z"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-extrabold leading-tight" style={{ color: '#1C2B3A' }}>We'll send your order to WhatsApp.</p>
              <p className="text-[12px] mt-0.5 leading-snug" style={{ color: '#8A96A0' }}>You'll be able to review and send it before it's delivered to us.</p>
            </div>
          </div>

          {/* Pick-up time */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] px-1 mb-2" style={{ color: '#9AAAB8' }}>Pick-up time</p>
            <div className="bg-white rounded-[16px] px-4 py-4 flex items-center gap-4" style={{ border: '1px solid #EDF1F4', boxShadow: '0 1px 4px rgba(28,43,58,0.06)' }}>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F4F7F9', border: '1px solid #EDF1F4' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p className="text-[12px] font-medium flex-1" style={{ color: '#8A96A0' }}>Choose when you'd like to pick up</p>
            </div>
            <div className="flex gap-2.5 mt-2">
              <div className="flex-1 relative">
                <select
                  value={pickupDay}
                  onChange={e => setPickupDay(e.target.value)}
                  className="w-full appearance-none bg-white rounded-[14px] px-4 py-3.5 text-[14px] font-semibold pr-8"
                  style={{ border: '1px solid #EDF1F4', color: '#1C2B3A', boxShadow: '0 1px 4px rgba(28,43,58,0.06)' }}
                >
                  {DAY_OPTIONS.map(d => <option key={d}>{d}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <div className="flex-1 relative">
                <select
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  className="w-full appearance-none bg-white rounded-[14px] px-4 py-3.5 text-[14px] font-semibold pr-8"
                  style={{ border: '1px solid #EDF1F4', color: '#1C2B3A', boxShadow: '0 1px 4px rgba(28,43,58,0.06)' }}
                >
                  {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Quick options */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] px-1 mb-2" style={{ color: '#9AAAB8' }}>Quick options</p>
            <div className="flex gap-2.5">
              <button className="flex-1 bg-white rounded-[14px] px-3 py-3.5 flex items-center gap-3 active:bg-[#F4F7F9] transition-colors text-left" style={{ border: '1px solid #EDF1F4', boxShadow: '0 1px 4px rgba(28,43,58,0.06)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
                <div>
                  <p className="text-[12px] font-extrabold leading-tight" style={{ color: '#1C2B3A' }}>Load last order</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#9AAAB8' }}>Flat White, Bacon Bap</p>
                </div>
              </button>
              <button className="flex-1 bg-white rounded-[14px] px-3 py-3.5 flex items-center gap-3 active:bg-[#F4F7F9] transition-colors text-left" style={{ border: '1px solid #EDF1F4', boxShadow: '0 1px 4px rgba(28,43,58,0.06)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <div className="flex-1">
                  <p className="text-[12px] font-extrabold leading-tight" style={{ color: '#1C2B3A' }}>Choose from previous orders</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8D4DC" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          {/* Order items */}
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#9AAAB8' }}>Your order</p>
              <button onClick={addItem} className="flex items-center gap-1 text-[12px] font-bold" style={{ color: '#D87A2E' }}>
                Add items
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D87A2E" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </button>
            </div>
            <div className="bg-white rounded-[16px] overflow-hidden" style={{ border: '1px solid #EDF1F4', boxShadow: '0 1px 4px rgba(28,43,58,0.06)' }}>
              {orderItems.map((orderItem, index) => (
                <div key={orderItem.id} className={`px-4 pt-3 pb-3 ${index < orderItems.length - 1 ? 'border-b' : ''}`} style={{ borderColor: '#EDF1F4' }}>
                  <div className="flex items-center gap-3">
                    {/* Qty badge */}
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold flex-shrink-0" style={{ backgroundColor: '#D87A2E' }}>
                      {orderItem.quantity}
                    </div>
                    <input
                      value={orderItem.item}
                      onChange={e => updateItem(orderItem.id, 'item', e.target.value)}
                      placeholder="Flat white, Bacon bap…"
                      className="flex-1 text-[14px] font-semibold bg-transparent outline-none placeholder:text-[#C8D4DC]"
                      style={{ color: '#1C2B3A' }}
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => updateItem(orderItem.id, 'quantity', Math.max(1, orderItem.quantity - 1))} className="w-6 h-6 rounded-lg font-bold flex items-center justify-center text-[16px]" style={{ backgroundColor: '#EDF1F4', color: '#2C3E50' }}>−</button>
                      <button onClick={() => updateItem(orderItem.id, 'quantity', orderItem.quantity + 1)} className="w-6 h-6 rounded-lg font-bold flex items-center justify-center text-[16px]" style={{ backgroundColor: '#EDF1F4', color: '#2C3E50' }}>+</button>
                      {orderItems.length > 1 && (
                        <button onClick={() => removeItem(orderItem.id)} className="w-6 h-6 flex items-center justify-center" style={{ color: '#C8D4DC' }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    value={orderItem.modifier}
                    onChange={e => updateItem(orderItem.id, 'modifier', e.target.value)}
                    placeholder="e.g. Oat milk, brown sauce…"
                    className="mt-1 ml-9 text-[12px] bg-transparent outline-none placeholder:text-[#C8D4DC] w-full"
                    style={{ color: '#8A96A0' }}
                  />
                </div>
              ))}
              <button
                onClick={addItem}
                className="w-full px-4 min-h-[46px] flex items-center justify-center gap-2 border-t active:bg-[#F4F7F9] transition-colors"
                style={{ borderColor: '#EDF1F4' }}
              >
                <Plus className="w-3.5 h-3.5" style={{ color: '#9AAAB8' }} />
                <span className="text-[13px] font-semibold" style={{ color: '#9AAAB8' }}>Add another item</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] px-1 mb-2" style={{ color: '#9AAAB8' }}>Notes (optional)</p>
            <div className="bg-white rounded-[16px] px-4 py-3.5 flex items-start gap-3" style={{ border: '1px solid #EDF1F4', boxShadow: '0 1px 4px rgba(28,43,58,0.06)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              <div className="flex-1">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value.slice(0, 120))}
                  placeholder="Extra napkins please."
                  rows={2}
                  className="w-full bg-transparent outline-none resize-none text-[14px] placeholder:text-[#C8D4DC]"
                  style={{ color: '#1C2B3A' }}
                />
                <p className="text-right text-[11px]" style={{ color: '#C8D4DC' }}>{notes.length}/120</p>
              </div>
            </div>
          </div>

          {/* Don't forget scan card */}
          <div className="rounded-[18px] px-4 py-4 flex items-center gap-4 overflow-hidden relative" style={{ backgroundColor: 'rgba(66,110,185,0.08)', border: '1px solid rgba(66,110,185,0.14)' }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(66,110,185,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#426EB9" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-extrabold leading-tight" style={{ color: '#1C2B3A' }}>Don't forget!</p>
              <p className="text-[12px] mt-0.5 leading-snug" style={{ color: '#5A6A7A' }}>Scan in-store when you collect to earn your stamps and beans.</p>
            </div>
            {/* Coffee cup SVG illustration */}
            <div className="flex-shrink-0 opacity-80">
              <svg width="52" height="62" viewBox="0 0 52 62" fill="none">
                <rect x="8" y="18" width="30" height="36" rx="4" fill="white" stroke="#EDF1F4" strokeWidth="1.5"/>
                <path d="M8 22h30" stroke="#EDF1F4" strokeWidth="1.5"/>
                <path d="M38 26h5a4 4 0 0 1 0 8h-5" stroke="#9AAAB8" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="14" y="10" width="18" height="8" rx="2" fill="#EDF1F4"/>
                <path d="M14 54h18" stroke="#EDF1F4" strokeWidth="2" strokeLinecap="round"/>
                <text x="23" y="42" textAnchor="middle" fill="#1C2B3A" fontSize="8" fontWeight="800" fontFamily="sans-serif">PEN</text>
                <text x="23" y="50" textAnchor="middle" fill="#D87A2E" fontSize="7" fontWeight="800" fontFamily="sans-serif">KEY</text>
              </svg>
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Send CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-24 pt-3" style={{ background: 'linear-gradient(to top, white 70%, rgba(255,255,255,0))' }}>
        <div className="max-w-[430px] mx-auto">
          <button
            onClick={sendToWhatsApp}
            disabled={!canSend}
            className="w-full rounded-[18px] flex items-center px-5 gap-3 active:scale-[0.98] transition-all disabled:opacity-40"
            style={{ backgroundColor: '#1C2B3A', minHeight: '60px', boxShadow: '0 4px 24px rgba(28,43,58,0.30)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" className="flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.555 4.116 1.524 5.845L0 24l6.29-1.501A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.804 9.804 0 0 1-5.012-1.376l-.36-.214-3.733.891.932-3.617-.235-.372A9.808 9.808 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182 17.43 2.182 21.818 6.57 21.818 12c0 5.43-4.388 9.818-9.818 9.818z"/>
            </svg>
            <div className="flex-1 text-left">
              <p className="text-white font-extrabold text-[16px] leading-tight">Send order via WhatsApp</p>
              <p className="text-[11px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>You'll review it in WhatsApp before sending</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
