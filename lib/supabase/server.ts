import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local')
  }

  const cookieStore = await cookies()

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key) => {
          const cookie = cookieStore.get(key)
          return cookie?.value ?? null
        },
        setItem: (key, value) => {
          cookieStore.set({ name: key, value, path: '/' })
        },
        removeItem: (key) => {
          cookieStore.delete({ name: key })
        },
      },
    },
  })
}

export function createAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
