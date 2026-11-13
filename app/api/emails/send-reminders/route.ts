import { NextResponse } from 'next/server'

function disabledResponse() {
  return NextResponse.json({
    success: true,
    disabled: true,
    total: 0,
    message: 'Penkey Perks email sending is disabled',
  })
}

export const GET = disabledResponse
export const POST = disabledResponse
