'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Send, Check } from 'lucide-react'

export default function OrderPage() {
  const [orderSent, setOrderSent] = useState(false)
  const [pickupTime, setPickupTime] = useState('')
  const [orderText, setOrderText] = useState('')
  const [showTimePicker, setShowTimePicker] = useState(false)

  const sendToWhatsApp = () => {
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-[#4B3028]">Order</h1>
        <p className="text-sm text-[#4B3028]/70">Type your order and send via WhatsApp</p>
      </div>

      {orderSent ? (
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-[#F0EBE5] p-8 text-center shadow-lg">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8D123F] to-[#A8224E] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#4B3028] mb-2">Order Sent!</h2>
            <p className="text-sm text-[#4B3028]/70 mb-6">Your order has been sent to WhatsApp. We'll prepare it for you!</p>
            <Button onClick={() => { setOrderSent(false); setPickupTime(''); setOrderText('') }} className="bg-[#E48A3A] hover:bg-[#D47A2A] w-full">
              New Order
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {/* Pickup Time */}
          <div>
            <div 
              className="bg-white rounded-2xl border border-[#F0EBE5] p-4 flex items-center justify-between cursor-pointer active:bg-[#F4D8CC]/30 shadow-sm"
              onClick={() => setShowTimePicker(true)}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#8D123F]" />
                <div>
                  <p className="text-sm font-medium text-[#4B3028]">Pickup Time</p>
                  <p className="text-xs text-[#4B3028]/60">{pickupTime || 'ASAP'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Input */}
          <div>
            <div className="bg-white rounded-2xl border border-[#F0EBE5] p-4 shadow-sm">
              <p className="text-sm font-semibold text-[#4B3028] mb-3">Your Order</p>
              <textarea
                value={orderText}
                onChange={(e) => setOrderText(e.target.value)}
                placeholder="Type your order here...

Example:
1 Flat White
1 Toastie with cheese
1 Muffin"
                className="w-full h-48 p-3 border border-[#F0EBE5] rounded-xl text-sm text-[#4B3028] placeholder-[#4B3028]/40 resize-none focus:outline-none focus:ring-2 focus:ring-[#8D123F]/20"
              />
            </div>
          </div>

          {/* Send Button */}
          <div className="pb-4">
            <Button 
              onClick={sendToWhatsApp}
              disabled={!orderText.trim()}
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
        <DialogContent className="rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
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
                      : 'bg-[#F4D8CC] text-[#4B3028] hover:bg-[#8D123F] hover:text-white'
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
