'use client'

import { useState, useEffect } from 'react'

interface VoucherRedemptionEvent {
  voucherId: string
  voucherName: string
}

export function useVoucherRedemptionAnimation() {
  const [show, setShow] = useState(false)
  const [voucherName, setVoucherName] = useState<string>('')

  useEffect(() => {
    const handleVoucherRedeemed = (event: Event) => {
      const customEvent = event as CustomEvent<VoucherRedemptionEvent>
      console.log('[VoucherAnimation] Voucher redeemed:', customEvent.detail)
      
      setVoucherName(customEvent.detail.voucherName)
      setShow(true)
    }

    window.addEventListener('voucher-redeemed', handleVoucherRedeemed)

    return () => {
      window.removeEventListener('voucher-redeemed', handleVoucherRedeemed)
    }
  }, [])

  const close = () => setShow(false)

  return { show, voucherName, close }
}
