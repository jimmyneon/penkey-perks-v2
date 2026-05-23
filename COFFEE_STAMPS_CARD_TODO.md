# Coffee Stamps Card - Future Enhancement

## Current State
The coffee stamps are currently displayed as part of the profile/dashboard but don't have a dedicated card with click-for-more-info functionality.

## Proposed Enhancement

### Create a Dedicated Coffee Stamps Card Component

**File:** `/components/dashboard/coffee-stamps-card.tsx`

**Features:**
1. **Visual Display:**
   - Show 10 coffee cup icons (filled/empty based on stamps)
   - Progress indicator (e.g., "7/10 stamps")
   - Visual animation when adding stamps
   - "Free Coffee Ready!" message when at 10 stamps

2. **Clickable Modal:**
   - How the coffee stamp system works
   - Benefits of collecting stamps
   - Current progress visualization
   - History of stamps earned
   - Link to rewards page

3. **Interactive Elements:**
   - Hover effects on stamp icons
   - Click to open detailed modal
   - Pending stamps indicator
   - Next stamp countdown (if applicable)

## Implementation Steps

1. Create the component file
2. Design the stamp visualization (10 coffee cups)
3. Add click handler and modal
4. Integrate into dashboard layout
5. Add animations for stamp collection
6. Test on mobile and desktop

## Design Inspiration

```
┌─────────────────────────────────┐
│  ☕ Coffee Stamp Card            │
├─────────────────────────────────┤
│                                 │
│  ☕ ☕ ☕ ☕ ☕                    │
│  ☕ ☕ ☕ ⚪ ⚪                    │
│                                 │
│  8 / 10 stamps                  │
│  2 more for free coffee! 🎉     │
│                                 │
│  [ℹ️ Click for more info]       │
└─────────────────────────────────┘
```

## Modal Content

- **What are Coffee Stamps?**
  - Earn 1 stamp per visit to Penkey
  - Collect 10 stamps to get a free coffee
  - Stamps reset after claiming free coffee

- **Your Progress:**
  - Visual progress bar
  - Stamps earned this cycle
  - Date of last stamp
  - Estimated completion date

- **How to Earn:**
  - Check in at Penkey
  - Show your QR code to staff
  - Get your stamp automatically

- **Actions:**
  - View stamp history
  - See available rewards
  - Learn about other perks

## Notes

This enhancement was not implemented in the current update but is documented here for future development. The existing points card and bean jar already provide similar functionality for the points/beans system.
