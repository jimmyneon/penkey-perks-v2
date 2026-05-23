-- =============================================
-- Auto-Sync Staff Table with Users Role
-- =============================================
-- When users.role changes to/from 'staff' or 'admin',
-- automatically update the staff table
-- =============================================

-- First, ensure staff table exists with correct structure
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Staff can view own record" ON public.staff;
DROP POLICY IF EXISTS "Admins can view all staff" ON public.staff;
DROP POLICY IF EXISTS "Owners can manage staff" ON public.staff;

-- RLS Policies
CREATE POLICY "Staff can view own record"
  ON public.staff
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all staff"
  ON public.staff
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Owners can manage staff"
  ON public.staff
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  );

-- =============================================
-- Trigger Function: Sync Staff Table
-- =============================================

CREATE OR REPLACE FUNCTION public.sync_staff_table()
RETURNS TRIGGER AS $$
BEGIN
  -- When role changes to 'staff' or 'admin'
  IF NEW.role IN ('staff', 'admin') THEN
    -- Add to staff table if not already there
    INSERT INTO public.staff (user_id, role)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.role = 'admin' THEN 'owner'
        ELSE 'employee'
      END
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = CASE 
        WHEN EXCLUDED.role = 'owner' THEN 'owner'  -- Keep owner status
        WHEN NEW.role = 'admin' THEN 'owner'
        ELSE staff.role  -- Keep existing role for staff
      END,
      updated_at = NOW();
    
    RAISE NOTICE 'User % added/updated in staff table as %', NEW.email, 
      CASE WHEN NEW.role = 'admin' THEN 'owner' ELSE 'employee' END;
  
  -- When role changes FROM 'staff'/'admin' to 'customer'
  ELSIF OLD.role IN ('staff', 'admin') AND NEW.role = 'customer' THEN
    -- Remove from staff table
    DELETE FROM public.staff WHERE user_id = NEW.id;
    
    RAISE NOTICE 'User % removed from staff table', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Attach Trigger to Users Table
-- =============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_staff_table_trigger ON public.users;

-- Create trigger on UPDATE
CREATE TRIGGER sync_staff_table_trigger
  AFTER UPDATE OF role ON public.users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.sync_staff_table();

-- =============================================
-- Backfill: Sync Existing Staff Users
-- =============================================

-- Add all existing staff/admin users to staff table
INSERT INTO public.staff (user_id, role)
SELECT 
  id,
  CASE 
    WHEN role = 'admin' THEN 'owner'
    ELSE 'employee'
  END
FROM public.users
WHERE role IN ('staff', 'admin')
ON CONFLICT (user_id) DO UPDATE SET
  role = CASE 
    WHEN EXCLUDED.role = 'owner' THEN 'owner'
    ELSE staff.role
  END,
  updated_at = NOW();

-- =============================================
-- Verification
-- =============================================

-- Show all staff members
SELECT 
  '=== STAFF TABLE AFTER SYNC ===' as info,
  u.email,
  u.name,
  u.role as user_role,
  s.role as staff_role,
  s.created_at
FROM public.staff s
JOIN public.users u ON s.user_id = u.id
ORDER BY s.created_at DESC;

-- Add helpful comment
COMMENT ON FUNCTION public.sync_staff_table() IS 
  'Automatically syncs staff table when users.role changes. admin -> owner in staff table, staff -> employee in staff table, customer -> removed from staff table';

-- Success message
SELECT '✅ Staff table auto-sync enabled! Changing users.role will now automatically update the staff table.' as result;
