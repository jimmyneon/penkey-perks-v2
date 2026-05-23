# 🚀 NOTIFICATION SYSTEM - 100% IMPLEMENTATION PLAN

**Goal:** Complete notification system from 60% → 100%  
**Timeline:** 4 weeks (40-60 hours)  
**Owner:** Development Team  
**Stakeholder:** Amanda

---

## 📅 WEEK 1: DATABASE INTEGRATION (16 hours)

### Day 1-2: API Routes (6 hours)

**Task 1.1: Create User Notification API**
```typescript
// File: app/api/notifications/get-for-user/route.ts
export async function POST(request: Request) {
  const { userId, userState } = await request.json()
  
  const { data, error } = await supabase
    .rpc('get_user_notifications', {
      p_user_id: userId,
      p_user_state: userState
    })
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
```

**Task 1.2: Create Dismissal API**
```typescript
// File: app/api/notifications/dismiss/route.ts
export async function POST(request: Request) {
  const { userId, notificationId } = await request.json()
  
  const { error } = await supabase
    .from('notification_dismissals')
    .insert({ user_id: userId, notification_id: notificationId })
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

**Deliverables:**
- [ ] `/api/notifications/get-for-user` route
- [ ] `/api/notifications/dismiss` route
- [ ] Error handling
- [ ] Type definitions

---

### Day 3-4: Frontend Integration (8 hours)

**Task 1.3: Update NotificationBanner Component**
```typescript
// File: components/dashboard/notification-banner.tsx

// Add at top
const [dbNotification, setDbNotification] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchNotification()
}, [hasUnredeemedRewards, currentStreak, hasCheckedInToday])

const fetchNotification = async () => {
  try {
    const response = await fetch('/api/notifications/get-for-user', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        userState: {
          hasUnredeemedRewards,
          currentStreak,
          hasCheckedInToday,
          hasCoffeeStampToday,
          hasPlayedGameToday,
          stampsUntilReward,
          rewardExpiryDate,
          points: currentPoints,
          lifetimePoints,
        }
      })
    })
    const data = await response.json()
    setDbNotification(data)
  } catch (error) {
    console.error('Failed to fetch notification:', error)
    // Fallback to hardcoded logic
  } finally {
    setLoading(false)
  }
}

// Use dbNotification if available, otherwise fallback
const notification = dbNotification || getNotification()
```

**Task 1.4: Improve Condition Matching**
```sql
-- File: supabase/migrations/20251010_improve_notification_conditions.sql

CREATE OR REPLACE FUNCTION public.match_notification_conditions(
  p_conditions JSONB,
  p_user_state JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_key TEXT;
  v_condition JSONB;
  v_user_value JSONB;
BEGIN
  -- Loop through each condition
  FOR v_key, v_condition IN SELECT * FROM jsonb_each(p_conditions)
  LOOP
    v_user_value := p_user_state->v_key;
    
    -- Boolean conditions
    IF jsonb_typeof(v_condition) = 'boolean' THEN
      IF (v_user_value::boolean) != (v_condition::boolean) THEN
        RETURN FALSE;
      END IF;
    
    -- Range conditions (min/max)
    ELSIF jsonb_typeof(v_condition) = 'object' THEN
      IF v_condition ? 'min' AND (v_user_value::int) < (v_condition->>'min')::int THEN
        RETURN FALSE;
      END IF;
      IF v_condition ? 'max' AND (v_user_value::int) > (v_condition->>'max')::int THEN
        RETURN FALSE;
      END IF;
      IF v_condition ? 'equals' AND (v_user_value::int) != (v_condition->>'equals')::int THEN
        RETURN FALSE;
      END IF;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

**Deliverables:**
- [ ] Updated notification-banner.tsx
- [ ] Condition matching function
- [ ] Fallback to hardcoded logic
- [ ] Loading states
- [ ] Error handling

---

### Day 5: Testing & Migration (2 hours)

**Task 1.5: Migrate Hardcoded Messages to Database**
```sql
-- Export current hardcoded messages
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES

-- Expiry warnings
('reward', 1, '🚨 LAST CHANCE!', 'Only {hours} hours left! Rush in NOW!', '🚨',
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"max": 3}}', 'streak', false),

('reward', 2, '⚠️ EXPIRING TODAY!', 'Expires in {hours} hours! Come redeem it today!', '⚠️',
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"min": 4, "max": 12}}', 'streak', false),

-- Add all 8 urgency levels...
```

**Deliverables:**
- [ ] Migration script
- [ ] Test with real user data
- [ ] Verify all conditions work
- [ ] Document any issues

---

## 📅 WEEK 2: ADMIN CRUD (16 hours)

### Day 1-2: Create Notification Form (8 hours)

**Task 2.1: Build Form Component**
```typescript
// File: app/admin/notifications/create/page.tsx

interface NotificationFormData {
  type: string
  priority: number
  title: string
  message: string
  icon: string
  conditions: Record<string, any>
  variant: string
  dismissible: boolean
  startDate?: Date
  endDate?: Date
  daysOfWeek?: number[]
  timeOfDayStart?: string
  timeOfDayEnd?: string
  targetAudience: string
  minPoints?: number
  maxPoints?: number
}

export default function CreateNotificationPage() {
  const [formData, setFormData] = useState<NotificationFormData>({...})
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Type */}
      <Select value={formData.type} onChange={...}>
        <option value="reward">Reward</option>
        <option value="streak">Streak</option>
        <option value="custom">Custom</option>
      </Select>
      
      {/* Content */}
      <Input name="title" placeholder="Notification Title" />
      <Textarea name="message" placeholder="Message" />
      <EmojiPicker value={formData.icon} onChange={...} />
      
      {/* Conditions Builder */}
      <ConditionsBuilder 
        conditions={formData.conditions}
        onChange={setConditions}
      />
      
      {/* Scheduling */}
      <DatePicker name="startDate" />
      <DatePicker name="endDate" />
      
      {/* Preview */}
      <NotificationPreview data={formData} />
      
      <Button type="submit">Create Notification</Button>
    </form>
  )
}
```

**Task 2.2: Conditions Builder**
```typescript
// File: components/admin/conditions-builder.tsx

export function ConditionsBuilder({ conditions, onChange }) {
  const [rules, setRules] = useState([])
  
  const addRule = () => {
    setRules([...rules, { field: '', operator: '', value: '' }])
  }
  
  return (
    <div>
      {rules.map((rule, i) => (
        <div key={i} className="flex gap-2">
          <Select value={rule.field}>
            <option value="hasUnredeemedRewards">Has Unredeemed Rewards</option>
            <option value="currentStreak">Current Streak</option>
            <option value="points">Points</option>
            <option value="hasCheckedInToday">Checked In Today</option>
          </Select>
          
          <Select value={rule.operator}>
            <option value="equals">Equals</option>
            <option value="min">Greater Than</option>
            <option value="max">Less Than</option>
          </Select>
          
          <Input type="number" value={rule.value} />
          
          <Button onClick={() => removeRule(i)}>Remove</Button>
        </div>
      ))}
      
      <Button onClick={addRule}>Add Condition</Button>
    </div>
  )
}
```

**Deliverables:**
- [ ] Create notification form
- [ ] Edit notification form
- [ ] Conditions builder UI
- [ ] Emoji picker
- [ ] Preview component

---

### Day 3-4: CRUD Operations (6 hours)

**Task 2.3: API Routes**
```typescript
// File: app/api/admin/notifications/create/route.ts
export async function POST(request: Request) {
  const data = await request.json()
  
  const { error } = await supabase
    .from('notifications')
    .insert(data)
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

// File: app/api/admin/notifications/update/route.ts
export async function PUT(request: Request) {
  const { id, ...data } = await request.json()
  
  const { error } = await supabase
    .from('notifications')
    .update(data)
    .eq('id', id)
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

// File: app/api/admin/notifications/delete/route.ts
export async function DELETE(request: Request) {
  const { id } = await request.json()
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

**Deliverables:**
- [ ] Create API route
- [ ] Update API route
- [ ] Delete API route
- [ ] Duplicate functionality
- [ ] Validation & error handling

---

### Day 5: Polish & Testing (2 hours)

**Task 2.4: Final Touches**
- [ ] Add confirmation dialogs
- [ ] Add success/error toasts
- [ ] Add loading states
- [ ] Test all CRUD operations
- [ ] Document admin workflow

---

## 📅 WEEK 3: ANALYTICS (12 hours)

### Day 1-2: Tracking Infrastructure (6 hours)

**Task 3.1: Create Metrics Tables**
```sql
-- File: supabase/migrations/20251010_notification_analytics.sql

CREATE TABLE IF NOT EXISTS public.notification_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS public.notification_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'dismiss', 'click', 'convert'
  action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_views_notification ON public.notification_views(notification_id);
CREATE INDEX idx_views_date ON public.notification_views(viewed_at);
CREATE INDEX idx_actions_notification ON public.notification_actions(notification_id);
CREATE INDEX idx_actions_type ON public.notification_actions(action_type);
```

**Task 3.2: Add Tracking to Frontend**
```typescript
// Track view
useEffect(() => {
  if (notification) {
    fetch('/api/notifications/track-view', {
      method: 'POST',
      body: JSON.stringify({
        notificationId: notification.id,
        userId: user.id
      })
    })
  }
}, [notification])

// Track dismissal
const handleDismiss = async () => {
  await fetch('/api/notifications/track-action', {
    method: 'POST',
    body: JSON.stringify({
      notificationId: notification.id,
      userId: user.id,
      actionType: 'dismiss'
    })
  })
  setIsDismissed(true)
}
```

**Deliverables:**
- [ ] Analytics tables
- [ ] View tracking API
- [ ] Action tracking API
- [ ] Frontend tracking integration

---

### Day 3-4: Analytics Dashboard (6 hours)

**Task 3.3: Build Dashboard**
```typescript
// File: app/admin/notifications/analytics/page.tsx

export default function NotificationAnalytics() {
  const [metrics, setMetrics] = useState(null)
  
  useEffect(() => {
    fetchMetrics()
  }, [])
  
  return (
    <div>
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Views" value={metrics.totalViews} />
        <MetricCard title="Dismissal Rate" value={`${metrics.dismissalRate}%`} />
        <MetricCard title="Avg Time to Dismiss" value={`${metrics.avgTime}s`} />
        <MetricCard title="Conversion Rate" value={`${metrics.conversionRate}%`} />
      </div>
      
      {/* Performance by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={metrics.byType} />
        </CardContent>
      </Card>
      
      {/* Time of Day Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Best Time to Show</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={metrics.byHour} />
        </CardContent>
      </Card>
      
      {/* Top/Bottom Performers */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationList notifications={metrics.topPerformers} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Needs Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationList notifications={metrics.bottomPerformers} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

**Deliverables:**
- [ ] Analytics dashboard page
- [ ] Metrics calculation queries
- [ ] Charts & visualizations
- [ ] Export functionality

---

## 📅 WEEK 4: CAMPAIGNS & POLISH (16 hours)

### Day 1-2: Campaign System (8 hours)

**Task 4.1: Campaign Tables**
```sql
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed', 'cancelled'
  target_audience TEXT DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.campaign_notifications (
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, notification_id)
);
```

**Task 4.2: Campaign UI**
```typescript
// File: app/admin/campaigns/page.tsx

export default function CampaignsPage() {
  return (
    <div>
      <Button onClick={() => router.push('/admin/campaigns/create')}>
        New Campaign
      </Button>
      
      <div className="grid gap-4">
        {campaigns.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  )
}
```

**Deliverables:**
- [ ] Campaign tables
- [ ] Campaign CRUD UI
- [ ] Link notifications to campaigns
- [ ] Campaign activation/deactivation
- [ ] Campaign analytics

---

### Day 3-4: Templates & Testing (6 hours)

**Task 4.3: Pre-built Templates**
```typescript
// File: lib/notification-templates.ts

export const templates = {
  flashSale: {
    type: 'custom',
    priority: 1,
    title: '⏰ 24-Hour Flash Sale!',
    message: 'Double points on all purchases TODAY ONLY! 🎉',
    variant: 'streak',
    dismissible: false
  },
  
  birthday: {
    type: 'custom',
    priority: 1,
    title: '🎂 Happy Birthday!',
    message: 'Enjoy a FREE coffee on us! Valid today only! 🎉',
    variant: 'reward',
    dismissible: false,
    conditions: { isBirthday: true }
  },
  
  winBack: {
    type: 'custom',
    priority: 2,
    title: '💕 We Miss You!',
    message: 'It\'s been a while! Come back for a special surprise! ✨',
    variant: 'reward',
    conditions: { daysSinceLastVisit: { min: 30 } }
  }
}
```

**Task 4.4: Comprehensive Testing**
- [ ] Unit tests for condition matching
- [ ] Integration tests for API routes
- [ ] E2E tests for admin workflow
- [ ] E2E tests for user experience
- [ ] Load testing for performance

**Deliverables:**
- [ ] Template library
- [ ] Template picker in UI
- [ ] Test suite
- [ ] Documentation

---

### Day 5: Launch Preparation (2 hours)

**Task 4.5: Final Checklist**
- [ ] Security audit
- [ ] Performance optimization
- [ ] Error monitoring setup
- [ ] Admin training documentation
- [ ] User-facing documentation
- [ ] Rollback plan

---

## ✅ ACCEPTANCE CRITERIA

### Functional Requirements
- [ ] Amanda can create notifications without developer
- [ ] Amanda can edit existing notifications
- [ ] Amanda can schedule notifications
- [ ] Amanda can target specific audiences
- [ ] Amanda can see analytics
- [ ] Amanda can create campaigns
- [ ] Users see database notifications (not hardcoded)
- [ ] Dismissals are tracked
- [ ] Views are tracked
- [ ] Conditions work correctly

### Performance Requirements
- [ ] Notification fetch < 100ms
- [ ] Dashboard loads < 2s
- [ ] Analytics queries < 500ms
- [ ] No impact on page load time

### Quality Requirements
- [ ] 90%+ test coverage
- [ ] Zero TypeScript errors
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Mobile responsive
- [ ] Error handling on all APIs

---

## 📊 PROGRESS TRACKING

```
Week 1: Database Integration
├── Day 1-2: API Routes          [    ] 0%
├── Day 3-4: Frontend Integration [    ] 0%
└── Day 5: Testing & Migration   [    ] 0%

Week 2: Admin CRUD
├── Day 1-2: Create Form         [    ] 0%
├── Day 3-4: CRUD Operations     [    ] 0%
└── Day 5: Polish & Testing      [    ] 0%

Week 3: Analytics
├── Day 1-2: Tracking            [    ] 0%
└── Day 3-4: Dashboard           [    ] 0%

Week 4: Campaigns & Polish
├── Day 1-2: Campaign System     [    ] 0%
├── Day 3-4: Templates & Testing [    ] 0%
└── Day 5: Launch Prep           [    ] 0%

Overall Progress: [============          ] 60% → 100%
```

---

## 🚀 QUICK START

**To begin implementation:**

1. **Create feature branch:**
   ```bash
   git checkout -b feature/notification-system-100
   ```

2. **Start with Week 1, Day 1:**
   ```bash
   # Create API route file
   touch app/api/notifications/get-for-user/route.ts
   ```

3. **Follow plan step-by-step**

4. **Test after each task**

5. **Commit frequently**

---

**Ready to start? Begin with Week 1, Day 1! 🎯**
