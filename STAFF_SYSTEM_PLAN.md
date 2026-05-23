# 🎯 STAFF DASHBOARD & MANUAL POINTS SYSTEM - IMPLEMENTATION PLAN

**Project:** Staff Interface + Manual Points Awards  
**Estimated Time:** 12-16 hours  
**Status:** Ready to Build

---

## 📋 OVERVIEW

### **What We're Building:**
1. Staff Dashboard (mobile-first)
2. QR Code Scanner
3. Manual Points Award System
4. Admin Approval Workflow
5. Quick Message Templates
6. Customer Lookup

### **Design Philosophy:**
- Match existing app design (Penkey vibe)
- Mobile-first (staff use phones/tablets)
- Fast & simple (no training needed)
- Safe (limits & approvals)

---

## 🎨 DESIGN SYSTEM (Match Existing App)

### **Colors (from existing app):**
```css
--primary: #FF6B9D (pink)
--secondary: #FFD93D (yellow)
--success: #6BCF7F (green)
--warning: #FF8C42 (orange)
--danger: #FF4757 (red)
--background: #FAFAFA
--card: #FFFFFF
--text: #2C3E50
--text-muted: #7F8C8D
```

### **Typography:**
```css
font-family: 'Inter', sans-serif
Headings: font-weight: 700
Body: font-weight: 400
```

### **Components:**
- Use existing shadcn/ui components
- Card-based layout
- Big touch-friendly buttons
- Smooth animations

---

## 📅 IMPLEMENTATION PHASES

### **PHASE 1: Database & Backend** (3-4 hours)
- [ ] Create manual_points_awards table
- [ ] Create staff_activity_log table
- [ ] Create award_type_limits table
- [ ] Create API routes
- [ ] Add RLS policies

### **PHASE 2: Staff Dashboard** (3-4 hours)
- [ ] Staff dashboard page
- [ ] Today's stats component
- [ ] Quick actions grid
- [ ] Recent activity feed

### **PHASE 3: Award Points System** (3-4 hours)
- [ ] Award points page
- [ ] Customer search
- [ ] Award type selector
- [ ] Photo upload
- [ ] Limits validation

### **PHASE 4: Admin Approval** (2-3 hours)
- [ ] Admin approval dashboard
- [ ] Approve/reject workflow
- [ ] Notifications
- [ ] Analytics

### **PHASE 5: Quick Messages** (1-2 hours)
- [ ] Message templates
- [ ] Send to filtered users
- [ ] Preview

---

## 🗂️ FILE STRUCTURE

```
/app
├── /staff
│   ├── /dashboard
│   │   └── page.tsx                    # Main staff hub
│   ├── /award-points
│   │   └── page.tsx                    # Award points interface
│   ├── /messages
│   │   └── page.tsx                    # Quick messages
│   ├── /customers
│   │   └── page.tsx                    # Customer lookup
│   └── /today
│       └── page.tsx                    # Today's activity

/app/api/staff
├── /award-points
│   └── route.ts                        # Award points API
├── /get-customer
│   └── route.ts                        # Customer lookup
├── /check-limits
│   └── route.ts                        # Validate limits
└── /activity
    └── route.ts                        # Activity feed

/app/api/admin
└── /approve-points
    └── route.ts                        # Approve/reject awards

/components/staff
├── stats-card.tsx                      # Stats display
├── quick-action-button.tsx             # Action buttons
├── customer-search.tsx                 # Search component
├── award-type-selector.tsx             # Award selection
├── photo-upload.tsx                    # Photo proof
└── activity-feed.tsx                   # Activity list

/supabase/migrations
├── 20251010_manual_points_system.sql   # Main migration
└── 20251010_award_type_limits.sql      # Limits & rules
```

---

## 🗄️ DATABASE SCHEMA

### **1. manual_points_awards**
```sql
CREATE TABLE public.manual_points_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who & What
  user_id UUID NOT NULL REFERENCES auth.users(id),
  staff_id UUID NOT NULL REFERENCES auth.users(id),
  points INTEGER NOT NULL CHECK (points > 0),
  
  -- Reason
  award_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  
  -- Proof
  proof_image_url TEXT,
  proof_metadata JSONB,
  
  -- Approval
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved'))
);
```

### **2. award_type_limits**
```sql
CREATE TABLE public.award_type_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_type TEXT UNIQUE NOT NULL,
  points INTEGER NOT NULL,
  requires_approval BOOLEAN DEFAULT false,
  requires_proof BOOLEAN DEFAULT false,
  limit_type TEXT, -- 'per_day', 'per_week', 'per_month', 'per_year'
  limit_count INTEGER,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. staff_activity_log**
```sql
CREATE TABLE public.staff_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 AWARD TYPES (Pre-configured)

```javascript
const AWARD_TYPES = [
  {
    type: 'social_media_share',
    name: '📱 Social Media Share',
    points: 10,
    requiresApproval: false,
    requiresProof: true,
    limit: { type: 'per_day', count: 1 },
    description: 'Customer showed Instagram/Facebook post'
  },
  {
    type: 'referral_bonus',
    name: '👥 Referral Bonus',
    points: 25,
    requiresApproval: false,
    requiresProof: false,
    limit: { type: 'unlimited', count: null },
    description: 'Brought a friend who signed up'
  },
  {
    type: 'birthday_bonus',
    name: '🎂 Birthday Bonus',
    points: 50,
    requiresApproval: false,
    requiresProof: false,
    limit: { type: 'per_year', count: 1 },
    description: 'Happy birthday reward'
  },
  {
    type: 'event_participation',
    name: '🎉 Event Participation',
    points: 15,
    requiresApproval: false,
    requiresProof: false,
    limit: { type: 'per_event', count: 1 },
    description: 'Attended special event'
  },
  {
    type: 'survey_completion',
    name: '📝 Survey Completion',
    points: 5,
    requiresApproval: false,
    requiresProof: false,
    limit: { type: 'per_month', count: 1 },
    description: 'Completed feedback survey'
  },
  {
    type: 'complaint_resolution',
    name: '💬 Complaint Resolution',
    points: 20,
    requiresApproval: true,
    requiresProof: false,
    limit: { type: 'unlimited', count: null },
    description: 'Apology for service issue'
  },
  {
    type: 'custom_amount',
    name: '✏️ Custom Amount',
    points: 0, // Variable
    requiresApproval: true,
    requiresProof: true,
    limit: { type: 'unlimited', count: null },
    description: 'Custom points award'
  }
]
```

---

## 🔐 PERMISSIONS & LIMITS

### **Staff Permissions:**
```javascript
{
  canAwardPoints: true,
  maxPointsPerDay: 200,
  maxPerCustomer: 50,
  maxTransactions: 20,
  canApprovePoints: false,
  canViewAllActivity: false
}
```

### **Admin Permissions:**
```javascript
{
  canAwardPoints: true,
  maxPointsPerDay: 1000,
  maxPerCustomer: 500,
  maxTransactions: 100,
  canApprovePoints: true,
  canViewAllActivity: true,
  canEditLimits: true
}
```

---

## 🎨 UI COMPONENTS DESIGN

### **Quick Action Button:**
```tsx
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  <CardContent className="p-6 text-center">
    <div className="text-4xl mb-2">📷</div>
    <h3 className="font-bold text-lg">Scan QR Code</h3>
    <p className="text-sm text-muted-foreground">
      Scan customer reward
    </p>
  </CardContent>
</Card>
```

### **Stats Card:**
```tsx
<Card>
  <CardContent className="p-4">
    <div className="text-2xl font-bold text-primary">47</div>
    <div className="text-sm text-muted-foreground">Check-ins</div>
  </CardContent>
</Card>
```

### **Award Type Card:**
```tsx
<Card className="hover:border-primary transition-colors cursor-pointer">
  <CardContent className="p-4">
    <div className="flex items-center gap-3">
      <div className="text-2xl">📱</div>
      <div className="flex-1">
        <h4 className="font-semibold">Social Media Share</h4>
        <p className="text-sm text-muted-foreground">
          Customer showed Instagram post
        </p>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-primary">10 pts</div>
        <div className="text-xs text-muted-foreground">1/day</div>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 🚀 API ENDPOINTS

### **Staff APIs:**
```
POST /api/staff/award-points
  - Award points to customer
  - Validate limits
  - Auto-approve or create pending

GET /api/staff/get-customer?search=...
  - Search customer by name/email/phone
  - Return customer info + stats

POST /api/staff/check-limits
  - Check if award is allowed
  - Return limit info

GET /api/staff/activity
  - Get today's activity
  - Filter by staff member
```

### **Admin APIs:**
```
GET /api/admin/approve-points
  - Get pending approvals
  - Get approval history

POST /api/admin/approve-points
  - Approve or reject award
  - Award points if approved

GET /api/admin/points-analytics
  - Get points statistics
  - Staff performance
  - Fraud alerts
```

---

## 📱 MOBILE-FIRST DESIGN

### **Breakpoints:**
```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
```

### **Touch Targets:**
- Minimum 44x44px
- Generous padding
- Clear visual feedback

### **Navigation:**
- Bottom tab bar on mobile
- Sidebar on desktop
- Swipe gestures

---

## ✅ SUCCESS CRITERIA

### **Performance:**
- [ ] Page load < 2s
- [ ] Award points < 1s
- [ ] Search results < 500ms

### **UX:**
- [ ] No training needed
- [ ] 3 taps to award points
- [ ] Clear error messages
- [ ] Instant feedback

### **Security:**
- [ ] All limits enforced
- [ ] RLS policies active
- [ ] Audit trail complete
- [ ] Photo proof stored securely

---

## 🎯 NEXT STEPS

1. Create database migrations
2. Build staff dashboard
3. Implement award points flow
4. Add admin approval
5. Test with real staff
6. Deploy & monitor

**Ready to start building?** 🚀
