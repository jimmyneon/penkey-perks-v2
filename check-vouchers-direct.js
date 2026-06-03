// Direct database check for vouchers
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jimmyneon.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppbW15bmVvbiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MTY3MzQ0MDAsImV4cCI6MjAzMjMxMDQwMH0.9a3F3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVouchers() {
  console.log('Checking vouchers...')
  
  // Check total vouchers
  const { count, error: countError } = await supabase
    .from('user_vouchers')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('Error counting vouchers:', countError)
  } else {
    console.log('Total vouchers:', count)
  }
  
  // Check active vouchers
  const { count: activeCount, error: activeError } = await supabase
    .from('user_vouchers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
  
  if (activeError) {
    console.error('Error counting active vouchers:', activeError)
  } else {
    console.log('Active vouchers:', activeCount)
  }
  
  // Get sample vouchers
  const { data: vouchers, error: vouchersError } = await supabase
    .from('user_vouchers')
    .select('*, voucher_templates(name, description, category, bean_threshold)')
    .limit(5)
  
  if (vouchersError) {
    console.error('Error fetching vouchers:', vouchersError)
  } else {
    console.log('Sample vouchers:', JSON.stringify(vouchers, null, 2))
  }
}

checkVouchers()
