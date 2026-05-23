# Promotional Offers - Integration Example

## How to Enable Automatic Modal Popups

To show promotional offers as modal popups when users open the app, you need to wrap your dashboard or main app layout with the `PromotionalOffersProvider`.

### Option 1: Dashboard Layout (Recommended)

Wrap just the dashboard pages to show offers only to logged-in users:

**File**: `app/dashboard/layout.tsx` (create if doesn't exist)

```tsx
import { PromotionalOffersProvider } from '@/components/providers/promotional-offers-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PromotionalOffersProvider>
      {children}
    </PromotionalOffersProvider>
  )
}
```

### Option 2: Main App Layout

Wrap the entire app (all authenticated pages):

**File**: `app/(authenticated)/layout.tsx` or similar

```tsx
import { PromotionalOffersProvider } from '@/components/providers/promotional-offers-provider'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PromotionalOffersProvider>
      {children}
    </PromotionalOffersProvider>
  )
}
```

### Option 3: Specific Pages Only

Add to individual pages where you want offers to appear:

**File**: `app/dashboard/page.tsx`

```tsx
import { PromotionalOffersProvider } from '@/components/providers/promotional-offers-provider'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  // ... your existing code ...

  return (
    <PromotionalOffersProvider>
      <DashboardClient {...props} />
    </PromotionalOffersProvider>
  )
}
```

## How It Works

1. **Provider loads** when user opens the app
2. **Fetches active offers** for the current user via API
3. **Checks for unredeemed offers** that should show as modals
4. **Shows highest priority offer** automatically
5. **User redeems** by clicking "Redeem Now"
6. **Voucher created** and shown to user
7. **Modal closes** and user can continue using app

## Manual Integration (Without Provider)

If you want more control, you can use the hook directly:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { usePromotionalOffers } from '@/hooks/use-promotional-offers'
import { PromotionalOfferModal } from '@/components/promotional-offer-modal'

export function MyComponent() {
  const { getTopPriorityModalOffer, refetch } = usePromotionalOffers()
  const [currentOffer, setCurrentOffer] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const offer = getTopPriorityModalOffer()
    if (offer) {
      setCurrentOffer(offer)
      setIsOpen(true)
    }
  }, [])

  return (
    <>
      {/* Your component content */}
      
      {currentOffer && (
        <PromotionalOfferModal
          offer={currentOffer}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onRedeemed={() => refetch()}
        />
      )}
    </>
  )
}
```

## Showing Offers as Notification Banners

To show offers as notification banners instead of (or in addition to) modals:

```tsx
'use client'

import { usePromotionalOffers } from '@/hooks/use-promotional-offers'
import { Badge } from '@/components/ui/badge'
import { Gift } from 'lucide-react'

export function PromotionalOfferBanner() {
  const { getNotificationOffers } = usePromotionalOffers()
  const offers = getNotificationOffers()

  if (offers.length === 0) return null

  const offer = offers[0] // Show first notification offer

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{offer.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-amber-950">{offer.title}</h3>
            <Badge className="bg-amber-600 text-white">
              <Gift className="w-3 h-3 mr-1" />
              Special Offer
            </Badge>
          </div>
          <p className="text-sm text-amber-800">{offer.description}</p>
        </div>
        <button
          onClick={() => {/* Handle click to show modal */}}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          {offer.button_text}
        </button>
      </div>
    </div>
  )
}
```

## Testing the Integration

### 1. Create a Test Offer
```
Title: 🧪 Test Offer
Description: This is a test offer to verify the system works
Reward Type: Free Item
Reward Value: Test Reward
Priority: 1 (highest)
Show as Modal: ✅ Enabled
Active: ✅ Enabled
```

### 2. Test as User
1. Log out of staff account
2. Log in as regular user
3. Navigate to dashboard
4. Modal should appear automatically
5. Click "Redeem Now"
6. Verify voucher is created
7. Check "My Rewards" for voucher

### 3. Verify Behavior
- ✅ Modal appears on page load
- ✅ Only shows once per offer
- ✅ Redemption creates voucher
- ✅ Success message displays
- ✅ Voucher appears in rewards
- ✅ Modal doesn't show again after redemption

## Customization Options

### Change Modal Appearance
Edit `components/promotional-offer-modal.tsx`:
- Modify colors/gradients
- Adjust spacing/sizing
- Change button styles
- Add animations

### Change Provider Behavior
Edit `components/providers/promotional-offers-provider.tsx`:
- Add delay before showing modal
- Add animation on appear
- Show multiple offers in sequence
- Add sound/notification

### Add Analytics
Track offer views and redemptions:

```tsx
// In PromotionalOfferModal
const handleRedeem = async () => {
  // Track redemption
  analytics.track('Promotional Offer Redeemed', {
    offerId: offer.id,
    offerTitle: offer.title,
    rewardValue: offer.reward_value
  })
  
  // ... existing redemption code
}
```

## Common Integration Patterns

### Pattern 1: Dashboard Only
Best for: Most apps
```
app/dashboard/layout.tsx
  └─ PromotionalOffersProvider
      └─ Dashboard pages
```

### Pattern 2: All Authenticated Pages
Best for: Maximum reach
```
app/(authenticated)/layout.tsx
  └─ PromotionalOffersProvider
      └─ All authenticated pages
```

### Pattern 3: Specific Pages
Best for: Targeted offers
```
app/specific-page/page.tsx
  └─ PromotionalOffersProvider
      └─ Page content
```

## Troubleshooting Integration

### Modal Not Appearing
1. Check provider is wrapping the page
2. Verify offer is active in staff interface
3. Check browser console for errors
4. Ensure user hasn't already redeemed
5. Verify API endpoints are working

### Multiple Modals Showing
- Only one modal should show at a time
- Check priority settings
- Verify provider is not duplicated

### Styling Issues
- Check Tailwind classes are compiling
- Verify Dialog component is imported correctly
- Check for CSS conflicts

## Performance Tips

1. **Lazy Load Provider**: Only load on authenticated pages
2. **Cache Offers**: Hook already implements caching
3. **Debounce Refetch**: Avoid excessive API calls
4. **Optimize Images**: Compress offer images

## Security Checklist

- ✅ Provider only loads for authenticated users
- ✅ API endpoints check authentication
- ✅ RLS policies enforce access control
- ✅ Redemption limits are server-side enforced
- ✅ Voucher codes are unique and secure

## Example: Complete Integration

**File**: `app/dashboard/layout.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PromotionalOffersProvider } from '@/components/providers/promotional-offers-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <PromotionalOffersProvider>
      <div className="min-h-screen bg-penkey-cream">
        {children}
      </div>
    </PromotionalOffersProvider>
  )
}
```

---

**That's it!** The promotional offers system is now integrated and will automatically show offers to users when they open the app. 🎉
