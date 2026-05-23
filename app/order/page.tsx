'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Send, Check, Plus, X, Coffee } from 'lucide-react'

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
    const whatsappUrl = `https://wa.me/447700900000?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
    setOrderSent(true)
  }

  const canSend = orderItems.some(item => item.item.trim())

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-[#4B3028]">Order</h1>
        <p className="text-sm text-[#4B3028]/70">Add items and send via WhatsApp</p>
      </div>

      {orderSent ? (
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8D123F] to-[#A8224E] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#4B3028] mb-2">Order Sent!</h2>
            <p className="text-sm text-[#4B3028]/70 mb-6">Your order has been sent to WhatsApp. We'll prepare it for you!</p>
            <Button onClick={() => { setOrderSent(false); setPickupTime(''); setOrderItems([{ id: '1', item: '', quantity: 1 }]) }} className="bg-[#E48A3A] hover:bg-[#D47A2A] w-full">
              New Order
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {/* Pickup Time */}
          <div>
            <div 
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between cursor-pointer active:bg-gray-50 shadow-sm"
              onClick={() => setShowTimePicker(true)}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#8D123F]" />
                <div>
                  <p className="text-sm font-medium text-[#4B3028]">Pickup Time</p>
                  <p className="text-xs text-gray-500">{pickupTime || 'ASAP'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#4B3028]">Your Order</p>
              </div>
              
              <div className="divide-y divide-gray-100">
                {orderItems.map((orderItem, index) => (
                  <div key={orderItem.id} className="px-4 py-3 flex items-center gap-3">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItem(orderItem.id, 'quantity', Math.max(1, orderItem.quantity - 1))}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#4B3028] font-medium active:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium text-[#4B3028]">{orderItem.quantity}</span>
                      <button
                        onClick={() => updateItem(orderItem.id, 'quantity', orderItem.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#4B3028] font-medium active:bg-gray-200"
                      >
                        +
                      </button>
                    </div>

                    {/* Item Input */}
                    <Input
                      value={orderItem.item}
                      onChange={(e) => updateItem(orderItem.id, 'item', e.target.value)}
                      placeholder="Item name"
                      className="flex-1 border-0 focus-visible:ring-0 px-0"
                    />

                    {/* Remove Button */}
                    {orderItems.length > 1 && (
                      <button
                        onClick={() => removeItem(orderItem.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 active:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Item Button */}
              <button
                onClick={addItem}
                className="w-full px-4 py-3 flex items-center justify-center gap-2 text-[#8D123F] font-medium border-t border-gray-100 active:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>

          {/* Send Button */}
          <div className="pb-4">
            <Button 
              onClick={sendToWhatsApp}
              disabled={!canSend}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold h-12 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 mr-2" />
              Send via WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* Time Picker Modal */}
      <Dialog open={showTimePicker} onOpenChange={setShowTimePicker}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#4B3028]">Select Pickup Time</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="grid grid-cols-3 gap-2">
              {['ASAP', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'].map((time) => (
                <button
                  key={time}
                  onClick={() => {
                    setPickupTime(time)
                    setShowTimePicker(false)
                  }}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    pickupTime === time
                      ? 'bg-[#8D123F] text-white shadow-md'
                      : 'bg-gray-100 text-[#4B3028] hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
