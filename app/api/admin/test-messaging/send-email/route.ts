import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { success: false, disabled: true, error: 'Penkey Perks email sending is disabled' },
    { status: 410 }
  )
}
