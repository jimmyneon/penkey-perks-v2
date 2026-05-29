import { Gift, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import QRCodeLib from 'qrcode'

interface VoucherCardProps {
  id: string
  name: string
  description: string
  category: string
  qrCode: string
  expiresAt: string
  status: 'active' | 'redeemed' | 'expired'
}

export function VoucherCard({ id, name, description, category, qrCode, expiresAt, status }: VoucherCardProps) {
  const [showQR, setShowQR] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleShowQR = async () => {
    try {
      const url = await QRCodeLib.toDataURL(qrCode)
      setQrUrl(url)
      setShowQR(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const isExpired = mounted ? new Date(expiresAt) < new Date() : false
  const isRedeemed = status === 'redeemed'

  return (
    <>
      <div className="bg-[#f5f3ed] rounded-lg p-4 border border-[#e7e5e4]">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#f97316]" />
            <span className="text-xs font-medium text-[#78716c] uppercase">{category}</span>
          </div>
          {isExpired && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Expired</span>
          )}
          {isRedeemed && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">Redeemed</span>
          )}
        </div>
        
        <h3 className="font-semibold text-[#1c1917] mb-1">{name}</h3>
        <p className="text-sm text-[#78716c] mb-3">{description}</p>
        
        <div className="flex items-center gap-2 text-xs text-[#78716c] mb-4">
          <Clock className="h-3 w-3" />
          <span>Expires: {mounted ? new Date(expiresAt).toLocaleDateString() : 'TBD'}</span>
        </div>
        
        {status === 'active' && !isExpired && (
          <Button
            onClick={handleShowQR}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Show QR Code
          </Button>
        )}
      </div>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {qrUrl && (
              <img
                src={qrUrl}
                alt="Voucher QR Code"
                className="w-64 h-64 border-4 border-white rounded-lg shadow-lg"
              />
            )}
            <p className="mt-4 text-sm text-[#78716c] text-center">
              Show this QR code to staff to redeem your reward
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
