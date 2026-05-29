'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface OrderItem {
  id: string
  item: string
  itemId?: string
  modifier: string
  quantity: number
}

interface MenuItem {
  id: string
  name: string
  description?: string
  base_price: number
  categories?: { id: string; name: string; color: string }
  item_variants?: Array<{ id: string; name: string; price: number; is_default: boolean }>
}

interface Category {
  id: string
  name: string
  color: string
}

const TIME_SLOTS = ['ASAP', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
const DAY_OPTIONS = ['Today', 'Tomorrow']

export default function OrderPage() {
  const router = useRouter()
  const [orderSent, setOrderSent] = useState(false)
  const [pickupDay, setPickupDay] = useState('Today')
  const [pickupTime, setPickupTime] = useState('ASAP')
  const [notes, setNotes] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userOrgId, setUserOrgId] = useState<string | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch menu from POS API
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get org_id from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('id', user.id)
          .single()

        if (!profile?.org_id) {
          console.error('No org_id found for user')
          setLoading(false)
          return
        }

        setUserOrgId(profile.org_id)

        const POS_URL = process.env.NEXT_PUBLIC_POS_URL || 'https://pos.penkey.co.uk'
        const [itemsRes, catsRes] = await Promise.all([
          fetch(`${POS_URL}/api/public/menu?org_id=${profile.org_id}`),
          fetch(`${POS_URL}/api/public/categories?org_id=${profile.org_id}`)
        ])

        if (!itemsRes.ok || !catsRes.ok) {
          throw new Error('Failed to fetch from POS API')
        }

        const items = await itemsRes.json()
        const cats = await catsRes.json()
        setMenuItems(items)
        setCategories(cats)
        if (cats.length > 0) setSelectedCategory(cats[0].id)
      } catch (error) {
        console.error('Failed to fetch menu:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMenu()
  }, [])

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

  const addItem = (menuItem: MenuItem) => {
    const existing = orderItems.find(i => i.itemId === menuItem.id)
    if (existing) {
      updateItem(existing.id, 'quantity', existing.quantity + 1)
    } else {
      setOrderItems(prev => [...prev, {
        id: Date.now().toString(),
        item: menuItem.name,
        itemId: menuItem.id,
        modifier: '',
        quantity: 1
      }])
    }
  }
  const removeItem = (id: string) => setOrderItems(prev => prev.filter(i => i.id !== id))
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
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F2' }}>
      <div className="w-full max-w-[430px] mx-auto">

        {/* Header - cleaner, matching dashboard */}
        <div className="px-5 pt-14 pb-6">
          <h1 className="text-[32px] font-bold leading-tight" style={{ color: '#24364B' }}>Order Ahead</h1>
          <p className="text-[14px] mt-1 leading-snug" style={{ color: '#7A8A9A' }}>
            Skip the queue — order via WhatsApp
          </p>
        </div>

        <div className="px-5 space-y-4">

          {/* Category tabs */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: selectedCategory === cat.id ? cat.color : '#F4EFE7',
                    color: selectedCategory === cat.id ? '#24364B' : '#7A8A9A'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Menu items grid */}
          {loading ? (
            <div className="text-center py-8" style={{ color: '#7A8A9A' }}>Loading menu...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {menuItems
                .filter(item => !selectedCategory || item.categories?.id === selectedCategory)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="bg-white rounded-[14px] p-3 text-left active:scale-[0.98] transition-all"
                    style={{ border: '1px solid #E8E2D8' }}
                  >
                    <p className="text-[14px] font-bold leading-tight" style={{ color: '#24364B' }}>{item.name}</p>
                    {item.description && (
                      <p className="text-[11px] mt-1 leading-snug" style={{ color: '#7A8A9A' }}>{item.description}</p>
                    )}
                    <p className="text-[13px] font-bold mt-2" style={{ color: '#F28A2E' }}>£{item.base_price.toFixed(2)}</p>
                  </button>
                ))}
            </div>
          )}

          {/* Pick-up time - cleaner card */}
          <div className="rounded-[18px] p-4" style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: '#A89080' }}>Pick-up time</p>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <select
                  value={pickupDay}
                  onChange={e => setPickupDay(e.target.value)}
                  className="w-full appearance-none bg-white rounded-[12px] px-4 py-3 text-[14px] font-semibold pr-8"
                  style={{ border: '1px solid #E8E2D8', color: '#24364B' }}
                >
                  {DAY_OPTIONS.map(d => <option key={d}>{d}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A89080" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <div className="flex-1 relative">
                <select
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  className="w-full appearance-none bg-white rounded-[12px] px-4 py-3 text-[14px] font-semibold pr-8"
                  style={{ border: '1px solid #E8E2D8', color: '#24364B' }}
                >
                  {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A89080" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Order summary - shows selected items */}
          {orderItems.length > 0 && (
            <div className="rounded-[18px] overflow-hidden" style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#E8E2D8' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#A89080' }}>Your order ({orderItems.length})</p>
              </div>
              <div className="p-4 space-y-2">
                {orderItems.map((orderItem) => (
                  <div key={orderItem.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: '#F28A2E' }}>
                        {orderItem.quantity}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold" style={{ color: '#24364B' }}>{orderItem.item}</p>
                        {orderItem.modifier && (
                          <p className="text-[11px]" style={{ color: '#7A8A9A' }}>{orderItem.modifier}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateItem(orderItem.id, 'quantity', Math.max(1, orderItem.quantity - 1))} className="w-6 h-6 rounded-lg font-bold flex items-center justify-center text-[14px]" style={{ backgroundColor: '#F4EFE7', color: '#24364B' }}>−</button>
                      <button onClick={() => updateItem(orderItem.id, 'quantity', orderItem.quantity + 1)} className="w-6 h-6 rounded-lg font-bold flex items-center justify-center text-[14px]" style={{ backgroundColor: '#F4EFE7', color: '#24364B' }}>+</button>
                      <button onClick={() => removeItem(orderItem.id)} className="w-6 h-6 flex items-center justify-center" style={{ color: '#C8D4DC' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes - cleaner card */}
          <div className="rounded-[18px] p-4" style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: '#A89080' }}>Notes (optional)</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, 120))}
              placeholder="Extra napkins please."
              rows={2}
              className="w-full bg-white rounded-[12px] px-4 py-3 outline-none resize-none text-[14px] placeholder:text-[#C8D4DC]"
              style={{ border: '1px solid #E8E2D8', color: '#24364B' }}
            />
            <p className="text-right text-[11px] mt-1" style={{ color: '#A89080' }}>{notes.length}/120</p>
          </div>

          {/* Scan reminder - simpler */}
          <div className="rounded-[18px] px-4 py-4 flex items-center gap-3" style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}>
            <img src="/coffeecup.png" alt="" className="w-10 h-10 object-contain flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-bold leading-tight" style={{ color: '#24364B' }}>Scan in-store</p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#7A8A9A' }}>Earn stamps and beans when you collect</p>
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Send CTA - cleaner */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-24 pt-3" style={{ background: 'linear-gradient(to top, #F9F7F2 70%, rgba(249,247,242,0))' }}>
        <div className="max-w-[430px] mx-auto">
          <button
            onClick={sendToWhatsApp}
            disabled={!canSend}
            className="w-full rounded-[16px] flex items-center px-5 gap-3 active:scale-[0.98] transition-all disabled:opacity-40"
            style={{ backgroundColor: '#F28A2E', minHeight: '56px', boxShadow: '0 4px 16px rgba(242,138,46,0.3)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-[15px] leading-tight">Send via WhatsApp</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
