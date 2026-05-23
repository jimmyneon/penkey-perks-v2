# 👥 USER ROLES & PERMISSIONS GUIDE

**Database:** `public.users` table  
**Column:** `role` (TEXT)

---

## 🎯 AVAILABLE ROLES

### **1. Customer** (Default)
```sql
role = 'customer'
```

**Access:**
- ✅ `/dashboard` - Main customer dashboard
- ✅ `/games/*` - All games
- ✅ `/rewards` - View their rewards
- ✅ `/profile` - Edit profile
- ❌ `/admin/*` - No access
- ❌ `/staff/*` - No access

**Permissions:**
- View their own data
- Play games
- Redeem rewards
- Check in daily
- Earn points and stamps

---

### **2. Staff**
```sql
role = 'staff'
```

**Access:**
- ✅ `/dashboard` - Customer dashboard (if they want)
- ✅ `/staff/dashboard` - Staff dashboard
- ✅ `/staff/award-points` - Award points to customers
- ✅ `/staff/messages` - Send quick messages (future)
- ✅ `/staff/customers` - Customer lookup (future)
- ✅ `/admin/notifications` - View/create/edit notifications
- ❌ `/admin/approve-points` - Cannot approve points
- ❌ Other admin functions

**Permissions:**
- Award points to customers (with limits)
- Search customer information
- Create/edit notifications
- View today's stats
- Upload proof photos
- **Cannot:** Approve point awards
- **Cannot:** Delete notifications
- **Cannot:** Access full admin panel

**Limits:**
- Max 200 points per day
- Max 50 points per customer per day
- Max 20 transactions per day

---

### **3. Admin**
```sql
role = 'admin'
```

**Access:**
- ✅ `/dashboard` - Customer dashboard (if they want)
- ✅ `/staff/*` - All staff functions
- ✅ `/admin/*` - Full admin panel
- ✅ `/admin/notifications` - Full notification management
- ✅ `/admin/approve-points` - Approve/reject point awards
- ✅ All other admin functions

**Permissions:**
- Everything staff can do
- Approve/reject point awards
- Delete notifications
- View all analytics
- Manage users
- Full system access

**Limits:**
- Max 1000 points per day
- Max 500 points per customer per day
- Max 100 transactions per day

---

## 🔐 HOW ROLES ARE CHECKED

### **In Pages (Server Components):**
```typescript
// Example: /app/staff/dashboard/page.tsx
const { data: profile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'admin' && profile?.role !== 'staff') {
  redirect('/dashboard') // Redirect to customer dashboard
}
```

### **In API Routes:**
```typescript
// Example: /app/api/staff/award-points/route.ts
const { data: profile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'admin' && profile?.role !== 'staff') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### **Admin-Only Check:**
```typescript
// Example: /app/admin/approve-points/page.tsx
if (profile?.role !== 'admin') {
  redirect('/dashboard')
}
```

---

## 📊 ROLE PERMISSIONS MATRIX

| Feature | Customer | Staff | Admin |
|---------|----------|-------|-------|
| **Dashboard** | ✅ Own | ✅ Own + Staff | ✅ All |
| **Play Games** | ✅ | ✅ | ✅ |
| **Redeem Rewards** | ✅ Own | ❌ | ✅ |
| **View Notifications** | ✅ | ✅ | ✅ |
| **Create Notifications** | ❌ | ✅ | ✅ |
| **Delete Notifications** | ❌ | ❌ | ✅ |
| **Award Points** | ❌ | ✅ (limited) | ✅ (unlimited) |
| **Approve Points** | ❌ | ❌ | ✅ |
| **View Customer Data** | ❌ | ✅ (search) | ✅ (all) |
| **Upload Proof Photos** | ❌ | ✅ | ✅ |
| **Send Messages** | ❌ | ✅ | ✅ |
| **View Analytics** | ❌ | ✅ (own) | ✅ (all) |

---

## 🛠️ HOW TO SET ROLES

### **Method 1: Direct Database Update**
```sql
-- Make user a staff member
UPDATE public.users 
SET role = 'staff' 
WHERE email = 'staff@penkey.com';

-- Make user an admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'amanda@penkey.com';

-- Revert to customer
UPDATE public.users 
SET role = 'customer' 
WHERE email = 'user@example.com';
```

### **Method 2: Supabase Dashboard**
1. Go to Supabase Dashboard
2. Table Editor → `users` table
3. Find the user
4. Edit the `role` column
5. Set to: `customer`, `staff`, or `admin`
6. Save

### **Method 3: SQL Editor (Supabase)**
```sql
-- View all staff and admins
SELECT id, email, role, first_name, last_name 
FROM public.users 
WHERE role IN ('staff', 'admin');

-- Promote user to staff
UPDATE public.users 
SET role = 'staff' 
WHERE id = 'USER_UUID_HERE';
```

---

## 🔍 CHECKING CURRENT ROLES

### **View All Users by Role:**
```sql
-- Count by role
SELECT role, COUNT(*) as count 
FROM public.users 
GROUP BY role;

-- List all staff
SELECT email, first_name, last_name, role, created_at 
FROM public.users 
WHERE role = 'staff' 
ORDER BY created_at DESC;

-- List all admins
SELECT email, first_name, last_name, role, created_at 
FROM public.users 
WHERE role = 'admin' 
ORDER BY created_at DESC;
```

---

## 🚨 SECURITY NOTES

### **Database Level (RLS):**
```sql
-- Example from notifications table
CREATE POLICY "Admins can manage notifications"
  ON public.notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );
```

### **Application Level:**
- All pages check role before rendering
- All API routes check role before processing
- Redirects happen server-side (secure)
- No client-side role checks (can be bypassed)

---

## 📝 ROLE WORKFLOW

### **New User Signs Up:**
```
1. User creates account
2. Role automatically set to 'customer'
3. User sees customer dashboard
4. User can play games, earn points
```

### **Promote to Staff:**
```
1. Admin updates role to 'staff' in database
2. User logs out and back in (or refresh)
3. User now sees staff dashboard option
4. User can award points, create notifications
```

### **Promote to Admin:**
```
1. Admin updates role to 'admin' in database
2. User logs out and back in (or refresh)
3. User now has full admin access
4. User can approve points, delete notifications
```

---

## 🎯 RECOMMENDED SETUP

### **For Penkey Deli:**

**Amanda (Owner):**
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'amanda@penkey.com';
```

**Staff Members:**
```sql
UPDATE public.users 
SET role = 'staff' 
WHERE email IN (
  'staff1@penkey.com',
  'staff2@penkey.com',
  'staff3@penkey.com'
);
```

**All Customers:**
```sql
-- Already default to 'customer'
-- No action needed
```

---

## 🐛 TROUBLESHOOTING

### **Issue: User can't access staff dashboard**

**Check:**
```sql
SELECT email, role FROM public.users WHERE email = 'user@example.com';
```

**Fix:**
```sql
UPDATE public.users SET role = 'staff' WHERE email = 'user@example.com';
```

### **Issue: Staff can access admin functions**

**This shouldn't happen!** Check the code:
```typescript
// Should be admin-only
if (profile?.role !== 'admin') {
  redirect('/dashboard')
}
```

### **Issue: Role not updating**

**Solution:**
1. Update role in database
2. User must log out and log back in
3. Or clear browser cache
4. Or restart dev server

---

## 📊 CURRENT IMPLEMENTATION

### **Files Checking Roles:**

**Pages:**
- `/app/admin/notifications/page.tsx` - Staff or Admin
- `/app/admin/approve-points/page.tsx` - Admin only
- `/app/staff/dashboard/page.tsx` - Staff or Admin
- `/app/staff/award-points/page.tsx` - Staff or Admin

**APIs:**
- `/app/api/staff/award-points/route.ts` - Staff or Admin
- `/app/api/staff/get-customer/route.ts` - Staff or Admin
- `/app/api/staff/upload-proof/route.ts` - Staff or Admin
- `/app/api/admin/approve-points/route.ts` - Admin only
- `/app/api/admin/notifications/toggle/route.ts` - Staff or Admin

---

## ✅ SUMMARY

**3 Roles:**
1. **Customer** - Default, basic access
2. **Staff** - Can award points, create notifications
3. **Admin** - Full access, can approve points

**Security:**
- ✅ Database constraints enforce valid roles
- ✅ RLS policies check roles
- ✅ Server-side checks in all pages/APIs
- ✅ Redirects prevent unauthorized access

**To Set Roles:**
```sql
UPDATE public.users SET role = 'staff' WHERE email = 'user@example.com';
UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

**Ready to use!** 🚀
