'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, X, ShoppingBag, Clock, Search } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ItemModal } from '@/components/order/item-modal'
import { OrderSummaryModal } from '@/components/order/order-summary-modal'
import { PickupTimeModal } from '@/components/order/pickup-time-modal'

interface OrderItem {
  id: string
  item: string
  itemId?: string
  modifier: string
  quantity: number
  selectedModifiers?: any[]
  totalPrice?: number
}

export interface MenuItem {
  id: string
  name: string
  description?: string
  base_price: number
  categories?: { id: string; name: string; color: string }
  item_variants?: Array<{ id: string; name: string; price: number; is_default: boolean }>
  modifier_groups?: Array<{
    id: string
    name: string
    selection_type: 'optional' | 'required' | 'multiple'
    min_selections: number
    max_selections: number | null
    modifier_options: Array<{
      id: string
      name: string
      price_adjustment: number
      is_default: boolean
    }>
  }>
}

interface Category {
  id: string
  name: string
  color: string
}

const TIME_SLOTS = ['ASAP', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
const DAY_OPTIONS = ['Today', 'Tomorrow']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function OrderPage() {
  const router = useRouter()
  const [orderSent, setOrderSent] = useState(false)
  const [pickupDay, setPickupDay] = useState('Today')
  const [pickupTime, setPickupTime] = useState('ASAP')
  const [notes, setNotes] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [showPickupTime, setShowPickupTime] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  // Customer-visible categories (hardcoded filter)
  const CUSTOMER_VISIBLE_CATEGORIES = ['Hot Drinks - Coffee', 'Retail food', 'Snacks', 'Drinks fridge', 'Bakes and Sweets', 'Hot Baps', 'Sandwiches', 'Hot Drinks - Tea', 'Penkey Meals', 'Toasties', 'Penkey Affogatos', 'Penkey Salads', 'Iced Drinks - Coffee', 'Fresh Lemonades', 'Penkey Milkshakes', 'Gifts', 'Penkey Indulgence', 'Specials']

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        setUser(authUser)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()
        setProfile(profileData)
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }
    loadProfile()
  }, [])

  // Fetch menu from POS API
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const POS_URL = process.env.NEXT_PUBLIC_POS_URL || 'https://penkey-pos.vercel.app'
        console.log('[Order Page] POS URL:', POS_URL)
        console.log('[Order Page] Fetching from:', `${POS_URL}/api/public/menu`)

        const [itemsRes, catsRes] = await Promise.all([
          fetch(`${POS_URL}/api/public/menu`),
          fetch(`${POS_URL}/api/public/categories`)
        ])

        console.log('[Order Page] Items response status:', itemsRes.status)
        console.log('[Order Page] Categories response status:', catsRes.status)

        if (!itemsRes.ok || !catsRes.ok) {
          const errorText = await (itemsRes.ok ? catsRes.text() : itemsRes.text())
          console.error('[Order Page] API error response:', errorText)
          throw new Error('Failed to fetch from POS API')
        }

        const items = await itemsRes.json()
        const cats = await catsRes.json()
        console.log('[Order Page] Items:', items)
        console.log('[Order Page] Categories:', cats)

        // Filter to only customer-visible categories
        const filteredCategories = cats.filter((cat: Category) =>
          CUSTOMER_VISIBLE_CATEGORIES.includes(cat.name)
        )
        setMenuItems(items)
        setCategories(filteredCategories)
        if (filteredCategories.length > 0) setSelectedCategory(filteredCategories[0].id)
      } catch (error) {
        console.error('[Order Page] Failed to fetch menu:', error)
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
    setSelectedItem(menuItem)
  }

  const handleAddToOrder = (menuItem: MenuItem, quantity: number, selectedModifiers: any[]) => {
    // Calculate total price including modifiers
    let basePrice = menuItem.base_price
    selectedModifiers.forEach(mod => {
      basePrice += mod.price_adjustment
    })
    const totalPrice = basePrice * quantity

    // Format modifier string for display
    const modifierString = selectedModifiers.length > 0
      ? selectedModifiers.map(m => m.option_name).join(', ')
      : ''

    const existing = orderItems.find(i => i.itemId === menuItem.id)
    if (existing) {
      updateItem(existing.id, 'quantity', existing.quantity + quantity)
    } else {
      setOrderItems(prev => [...prev, {
        id: Date.now().toString(),
        item: menuItem.name,
        itemId: menuItem.id,
        modifier: modifierString,
        quantity,
        selectedModifiers,
        totalPrice
      }])
    }
    setSelectedItem(null)
  }
  const removeItem = (id: string) => setOrderItems(prev => prev.filter(i => i.id !== id))
  const updateItem = (id: string, field: keyof OrderItem, value: string | number) =>
    setOrderItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))

  const sendToWhatsApp = () => {
    const validItems = orderItems.filter(i => i.item.trim())
    if (validItems.length === 0) return
    
    const orderText = validItems.map(i => {
      let itemLine = `${i.quantity}x ${i.item}`
      if (i.modifier) {
        itemLine += ` (${i.modifier})`
      }
      if (i.totalPrice) {
        itemLine += ` - £${i.totalPrice.toFixed(2)}`
      }
      return itemLine
    }).join('\n')
    
    const total = validItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0)
    
    const message = `Hi Penkey!${userName ? ` It's ${userName}` : ''} — I'd like to place a collection order.${userPhone ? `\nMy number: ${userPhone}` : ''}\n\nPickup: ${pickupDay}, ${pickupTime}\n\nOrder:\n${orderText}\n\nTotal: £${total.toFixed(2)}${notes ? `\n\nNotes: ${notes}` : ''}\n\nThanks!`
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

  const fullName = profile?.name || user?.user_metadata?.first_name || user?.user_metadata?.name || 'there'
  const firstName = fullName.split(' ')[0].charAt(0).toUpperCase() + fullName.split(' ')[0].slice(1).toLowerCase()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F2' }}>
      <div className="w-full max-w-[430px] mx-auto min-h-screen relative">
        <div className="px-5 pt-10 pb-28 space-y-5">

          {/* ── HEADER ── */}
          <div className="flex items-start justify-between">
            {/* Left: greeting */}
            <div className="flex-1">
              <p className="text-[24px] font-bold leading-tight" style={{ color: '#E07A3A', fontFamily: 'cursive, Georgia, serif' }}>
                {mounted ? getGreeting() : 'Hello'},{' '}
                <img
                  src="/heart.png"
                  alt=""
                  className="inline-block w-5 h-5 object-contain align-middle"
                  style={{ marginBottom: '2px', animation: 'heartPulse 1.2s ease-in-out 3' }}
                />
              </p>
              <h1 className="text-[72px] font-bold leading-none tracking-tight mt-0.5" style={{ color: '#24364B' }}>
                {firstName}
              </h1>
              <p className="text-[13px] font-medium mt-2 leading-snug" style={{ color: '#8A96A0' }}>
                Order ahead — skip the queue
              </p>
            </div>
          </div>

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

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search menu..."
              className="w-full bg-white rounded-[16px] px-4 py-3 pl-10 outline-none text-[14px] placeholder:text-[#C8D4DC]"
              style={{ border: '1px solid #E8E2D8', color: '#24364B' }}
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A89080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>

          {/* Menu items grid */}
          {loading ? (
            <div className="text-center py-8" style={{ color: '#7A8A9A' }}>Loading menu...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {menuItems
                .filter(item => {
                  const matchesCategory = !selectedCategory || item.categories?.id === selectedCategory
                  const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
                  return matchesCategory && matchesSearch
                })
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="bg-white rounded-[18px] p-4 text-left active:scale-[0.98] transition-all"
                    style={{ border: '1px solid #E8E2D8', boxShadow: '0 2px 8px rgba(36,54,75,0.06)' }}
                  >
                    <p className="text-[15px] font-bold leading-tight" style={{ color: '#24364B' }}>{item.name}</p>
                    {item.description && (
                      <p className="text-[12px] mt-1.5 leading-snug" style={{ color: '#8A96A0' }}>{item.description}</p>
                    )}
                    <p className="text-[14px] font-bold mt-3" style={{ color: '#F28A2E' }}>£{item.base_price.toFixed(2)}</p>
                  </button>
                ))}
            </div>
          )}

        </div>
      </div>

      {/* Floating action buttons */}
      <div className="fixed bottom-20 left-4 right-4 z-40 flex gap-3">
        <button
          onClick={() => setShowPickupTime(true)}
          className="flex-1 rounded-[16px] flex items-center justify-center gap-2 py-3 active:scale-[0.98] transition-all"
          style={{ backgroundColor: '#24364B' }}
        >
          <Clock className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-[14px]">{pickupDay}, {pickupTime}</span>
        </button>
        <button
          onClick={() => setShowOrderSummary(true)}
          className="flex-1 rounded-[16px] flex items-center justify-center gap-2 py-3 active:scale-[0.98] transition-all relative"
          style={{ backgroundColor: '#F28A2E' }}
        >
          <ShoppingBag className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-[14px]">Order</span>
          {orderItems.length > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ backgroundColor: '#24364B' }}>
              {orderItems.length}
            </span>
          )}
        </button>
      </div>

      <BottomNav />

      {/* Item Modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={handleAddToOrder}
        />
      )}

      {/* Order Summary Modal */}
      {showOrderSummary && (
        <OrderSummaryModal
          orderItems={orderItems}
          onClose={() => setShowOrderSummary(false)}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
          onSend={sendToWhatsApp}
          notes={notes}
          onNotesChange={setNotes}
        />
      )}

      {/* Pickup Time Modal */}
      {showPickupTime && (
        <PickupTimeModal
          pickupDay={pickupDay}
          pickupTime={pickupTime}
          onClose={() => setShowPickupTime(false)}
          onDayChange={setPickupDay}
          onTimeChange={setPickupTime}
        />
      )}
    </div>
  )
}
