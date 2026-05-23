-- =============================================
-- Add role and consent columns to users table
-- =============================================

-- Add role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'customer';
  END IF;
END $$;

-- Add status column if it doesn't exist (for pause account)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- Add GPS consent column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'gps_consent'
  ) THEN
    ALTER TABLE public.users ADD COLUMN gps_consent BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add marketing consent column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'marketing_consent'
  ) THEN
    ALTER TABLE public.users ADD COLUMN marketing_consent BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add check constraint for role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('customer', 'staff', 'admin'));
  END IF;
END $$;

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_status_check'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_status_check 
    CHECK (status IN ('active', 'paused', 'deleted'));
  END IF;
END $$;

-- Create index on role for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Create index on status for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Add comments
COMMENT ON COLUMN public.users.role IS 'User role: customer, staff, or admin';
COMMENT ON COLUMN public.users.status IS 'Account status: active, paused, or deleted';
COMMENT ON COLUMN public.users.gps_consent IS 'User consented to GPS tracking';
COMMENT ON COLUMN public.users.marketing_consent IS 'User consented to marketing communications';

-- Success message
SELECT 'User roles and consent columns added successfully!' as message;
