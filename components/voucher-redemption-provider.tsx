'use client'

import { VoucherRedemptionAnimation } from './voucher-redemption-animation'
import { useVoucherRedemptionAnimation } from '@/hooks/use-voucher-redemption-animation'

export function VoucherRedemptionProvider() {
  const { show, voucherName, close } = useVoucherRedemptionAnimation()

  return <VoucherRedemptionAnimation show={show} onClose={close} voucherName={voucherName} />
}
