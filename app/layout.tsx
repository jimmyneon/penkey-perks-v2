import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from '@/components/providers/query-provider'
import { CacheProvider } from '@/components/providers/cache-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { ServiceWorkerManager } from '@/components/service-worker-manager'

// Penkey typography system - Manrope for premium feel
const manrope = Manrope({ 
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Penkey Perks - Earn Beans, Get Rewards',
  description: 'Join our community and enjoy exclusive rewards, special offers, and surprises at Penkey Délicaf & Gifts.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Penkey Perks',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F4D8CC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${manrope.variable}`}>
      <body className="font-manrope">
        <ErrorBoundary>
          <CacheProvider>
            <QueryProvider>
              <ServiceWorkerManager />
              {children}
              <Toaster />
            </QueryProvider>
          </CacheProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
