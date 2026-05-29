'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { ArrowLeft, ShoppingBag, Clock, Trash2, Plus } from 'lucide-react'

interface Purchase {
  id: string
  total_amount: number
  items: any[]
  metadata: any
  created_at: string
}

export default function FavoriteOrdersPage() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/profile')
          return
        }

        const { data } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        setPurchases(data || [])
      } catch (error) {
        console.error('Error loading purchases:', error)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      loadPurchases()
    }
  }, [mounted, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const handleReorder = (purchase: Purchase) => {
    // Navigate to order page with items pre-filled
    const orderItems = purchase.items.map((item: any, index: number) => ({
      id: Date.now() + index,
      item: item.name,
      itemId: item.id,
      modifier: item.modifiers || '',
      quantity: item.quantity || 1,
      selectedModifiers: [],
      totalPrice: item.price || 0
    }))
    
    // Store in sessionStorage for the order page to pick up
    sessionStorage.setItem('reorderItems', JSON.stringify(orderItems))
    router.push('/order')
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F2' }}>
      <div className="w-full max-w-[430px] mx-auto min-h-screen relative">
        <div className="px-5 pt-10 pb-28 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
              <ArrowLeft className="w-5 h-5" style={{ color: '#24364B' }} />
            </button>
            <div>
              <h1 className="text-[28px] font-bold" style={{ color: '#24364B' }}>Favourite Orders</h1>
              <p className="text-[13px]" style={{ color: '#8A96A0' }}>Quick reorder your usuals</p>
            </div>
          </div>

          {/* Orders list */}
          {loading ? (
            <div className="text-center py-12" style={{ color: '#8A96A0' }}>Loading your orders...</div>
          ) : purchases.length === 0 ? (
            <div className="rounded-[24px] p-8 text-center" style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FEF3EA' }}>
                <ShoppingBag className="w-8 h-8" style={{ color: '#E07A3A' }} />
              </div>
              <h3 className="text-[18px] font-bold mb-2" style={{ color: '#24364B' }}>No orders yet</h3>
              <p className="text-[14px] mb-4" style={{ color: '#8A96A0' }}>Place your first order to see it here</p>
              <button
                onClick={() => router.push('/order')}
                className="px-6 py-3 rounded-[14px] text-white text-[14px] font-bold active:scale-[0.98] transition-all"
                style={{ backgroundColor: '#F28A2E' }}
              >
                Start Ordering
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="bg-white rounded-[18px] p-4"
                  style={{ border: '1px solid #EDF1F4', boxShadow: '0 2px 8px rgba(28,43,58,0.06)' }}
                >
                  {/* Order header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4" style={{ color: '#8A96A0' }} />
                        <span className="text-[12px]" style={{ color: '#8A96A0' }}>{formatDate(purchase.created_at)}</span>
                      </div>
                      <p className="text-[16px] font-bold" style={{ color: '#24364B' }}>
                        {purchase.items.length} item{purchase.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="text-[18px] font-bold" style={{ color: '#F28A2E' }}>
                      £{purchase.total_amount.toFixed(2)}
                    </p>
                  </div>

                  {/* Items preview */}
                  <div className="space-y-2 mb-3">
                    {purchase.items.slice(0, 3).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-[13px]" style={{ color: '#5A6A7A' }}>
                        <span>{item.quantity}x {item.name}</span>
                        {item.price && <span>£{item.price.toFixed(2)}</span>}
                      </div>
                    ))}
                    {purchase.items.length > 3 && (
                      <p className="text-[12px]" style={{ color: '#8A96A0' }}>
                        +{purchase.items.length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Reorder button */}
                  <button
                    onClick={() => handleReorder(purchase)}
                    className="w-full py-3 rounded-[14px] text-white text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    style={{ backgroundColor: '#2C3E50' }}
                  >
                    <Plus className="w-4 h-4" />
                    Reorder
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
